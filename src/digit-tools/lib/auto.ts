import { buildEOSignal, buildSignal, eoStats, ouStats, type Condition } from "./signals";
import type { Bot } from "./bots";

/** ticks since a digit last printed (-1 when absent from the window) */
function gapSinceLast(digits: number[], digit: number) {
  for (let i = digits.length - 1, k = 0; i >= 0; i--, k++) if (digits[i] === digit) return k;
  return -1;
}

export type Cond = { label: string; detail: string; ok: boolean; required: boolean };
export type Eval = {
  armed: boolean;
  side: string;
  conf: number;
  conds: Cond[];
  reason: string;
};

const mapFromEngine = (conds: Condition[]): Cond[] =>
  conds.map((c) => ({ label: c.label, detail: c.detail, ok: c.ok, required: c.required }));

/** Runs a strategy's condition set against the live buffers. Pure — safe to call every tick. */
export function evaluateStrategy(bot: Bot, digits: number[], quotes: number[]): Eval {
  const warm = Math.max(60, bot.duration * 4);

  if (digits.length < warm) {
    return {
      armed: false,
      side: "—",
      conf: 0,
      reason: `warming up · ${digits.length}/${warm} ticks`,
      conds: [{ label: "Minimum history", detail: `${digits.length} of ${warm} ticks collected`, ok: false, required: true }],
    };
  }

  /* ---------------- Over / Under ---------------- */
  if (bot.contract === "Over/Under") {
    const s = ouStats(digits, bot.barrier, 500);
    const sig = buildSignal(s, { mode: "fade", hold: bot.duration, stake: bot.stake });
    return {
      armed: sig.armed && sig.confidence >= 62,
      side: sig.side,
      conf: sig.confidence,
      reason: sig.armed ? `engine armed · ${sig.side}` : "conditions not met",
      conds: [
        ...mapFromEngine(sig.conditions),
        {
          label: "Confidence threshold",
          detail: `${sig.confidence}% · needs 62%`,
          ok: sig.confidence >= 62,
          required: true,
        },
      ],
    };
  }

  /* ---------------- Even / Odd ---------------- */
  if (bot.contract === "Even/Odd") {
    const s = eoStats(digits, 500);
    const sig = buildEOSignal(s, { mode: "fade", hold: bot.duration, stake: bot.stake });
    return {
      armed: sig.armed && sig.confidence >= 62,
      side: sig.side,
      conf: sig.confidence,
      reason: sig.armed ? `engine armed · ${sig.side}` : "conditions not met",
      conds: [
        ...mapFromEngine(sig.conditions),
        {
          label: "Confidence threshold",
          detail: `${sig.confidence}% · needs 62%`,
          ok: sig.confidence >= 62,
          required: true,
        },
      ],
    };
  }

  /* ---------------- Matches / Differs ---------------- */
  if (bot.contract === "Matches/Differs") {
    const gap = gapSinceLast(digits, bot.barrier);
    const last = digits.slice(-20);
    const hits = last.filter((d) => d === bot.barrier).length;
    const repeat = (() => {
      let m = 0;
      let cur = 0;
      for (let i = 1; i < digits.length; i++) {
        if (digits[i] === digits[i - 1] && digits[i] === bot.barrier) {
          cur++;
          m = Math.max(m, cur);
        } else cur = 0;
      }
      return m;
    })();
    const overdue = gap >= 25;
    const quiet = hits <= 1;
    const conds: Cond[] = [
      { label: `Digit ${bot.barrier} is overdue`, detail: `last seen ${gap} ticks ago · needs ≥ 25`, ok: overdue, required: true },
      { label: `Digit ${bot.barrier} is quiet`, detail: `${hits} appearance${hits === 1 ? "" : "s"} in the last 20 ticks · needs ≤ 1`, ok: quiet, required: true },
      { label: "No repeat cluster", detail: `longest repeat run ${repeat} · needs 0`, ok: repeat === 0, required: false },
      { label: "Sample depth", detail: `${digits.length} ticks collected`, ok: digits.length >= 200, required: false },
    ];
    const okCount = conds.filter((c) => c.ok).length;
    const conf = Math.min(96, 55 + okCount * 10 + Math.min(12, Math.max(0, gap - 25)));
    return {
      armed: conds.filter((c) => c.required).every((c) => c.ok) && conf >= 62,
      side: "DIFFERS",
      conf,
      reason: overdue && quiet ? `digit ${bot.barrier} overdue ${gap}t — backing DIFFERS` : "waiting for the digit to go quiet",
      conds,
    };
  }

  /* ---------------- Rise / Fall ---------------- */
  const recent = quotes.slice(-6);
  let up = 0;
  let down = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] > recent[i - 1]) up++;
    else if (recent[i] < recent[i - 1]) down++;
  }
  let sum = 0;
  for (let i = 1; i < quotes.length; i++) sum += Math.abs(quotes[i] - quotes[i - 1]);
  const avg = quotes.length > 1 ? sum / (quotes.length - 1) : 0;

  const stretch = (() => {
    if (!quotes.length) return 0;
    const first = quotes[Math.max(0, quotes.length - 8)];
    const lastQ = quotes[quotes.length - 1];
    return ((lastQ - first) / (first || 1)) * 100;
  })();

  const bearish = down >= 4 && stretch < -0.02;
  const bullish = up >= 4 && stretch > 0.02;

  const conds: Cond[] = [
    {
      label: "Directional stretch detected",
      detail: `${up} up / ${down} down in the last 6 ticks · ${stretch >= 0 ? "+" : ""}${stretch.toFixed(3)}% over 8 ticks`,
      ok: bearish || bullish,
      required: true,
    },
    {
      label: "Volatility inside the safe band",
      detail: `avg tick move ${avg.toFixed(2)} · needs 0.05 – 3.00`,
      ok: avg >= 0.05 && avg <= 3,
      required: true,
    },
    { label: "Sample depth", detail: `${quotes.length} quotes collected`, ok: quotes.length >= 200, required: false },
    { label: "Quote buffer healthy", detail: `${recent.length} of 6 recent quotes usable`, ok: recent.length >= 6, required: false },
  ];
  const okCount = conds.filter((c) => c.ok).length;
  const conf = Math.min(94, 56 + okCount * 10 + Math.min(10, Math.abs(stretch) * 40));

  return {
    armed: conds.filter((c) => c.required).every((c) => c.ok) && conf >= 62,
    side: bearish ? "RISE" : bullish ? "FALL" : "—",
    conf,
    reason: bearish ? "sharp fall — fading with RISE" : bullish ? "sharp rise — fading with FALL" : "no stretch yet",
    conds,
  };
}

export type Entry = { digit: number; quote: number };

/** Did the paper contract win? */
export function settleWin(bot: Bot, side: string, entry: Entry, exitDigit: number, exitQuote: number): boolean {
  switch (bot.contract) {
    case "Over/Under":
      return side === "OVER" ? exitDigit > bot.barrier : exitDigit < bot.barrier;
    case "Even/Odd":
      return side === "EVEN" ? exitDigit % 2 === 0 : exitDigit % 2 === 1;
    case "Matches/Differs":
      return side === "DIFFERS" ? exitDigit !== bot.barrier : exitDigit === bot.barrier;
    default:
      return side === "RISE" ? exitQuote > entry.quote : exitQuote < entry.quote;
  }
}

export const PAYOUT = 0.94;
