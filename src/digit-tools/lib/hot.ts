/**
 * Hot-market scanner.
 *
 * For each digit contract we look at the digits that would LOSE the trade and
 * ask how cold they are across a 1000-tick window:
 *
 *   OVER 2  → losers 0, 1, 2
 *   OVER 3  → losers 0, 1, 2, 3
 *   UNDER 7 → losers 7, 8, 9
 *   UNDER 6 → losers 6, 7, 8, 9
 *
 * Two tiers so real signals actually surface:
 *   HOT  — every loser strictly below 9.9%, none climbing, block at/below fair share
 *   WARM — every loser at/under 10.4%, no sharp climb, block within 1.6pp of fair share
 */

export type Direction = "OVER 2" | "OVER 3" | "UNDER 7" | "UNDER 6";
export type Tier = "hot" | "warm";

export type HotSignal = {
  side: Direction;
  tier: Tier;
  losers: number[];
  per: number[];
  recentPer: number[];
  worst: number;
  block: number;
  blockBase: number;
  /** highest recent-minus-full climb among the losers, in pp */
  climb: number;
  margin: number;
  /** the single gate that stopped it being HOT (for warm tier) */
  reason: string;
};

export type HotMarket = {
  id: string;
  label: string;
  price: number | null;
  n: number;
  counts: number[];
  full: number[];
  signals: HotSignal[];
  best: HotSignal;
  score: number;
  trend: number;
};

export const CEIL = 9.9; // strict ceiling for HOT
export const WARM_CEIL = 10.4; // relaxed ceiling for WARM
const RECENT = 100;
const MIN_TICKS = 250;

const LOSERS: Record<Direction, number[]> = {
  "OVER 2": [0, 1, 2],
  "OVER 3": [0, 1, 2, 3],
  "UNDER 7": [7, 8, 9],
  "UNDER 6": [6, 7, 8, 9],
};

export const DIRECTION_NOTE: Record<Direction, string> = {
  "OVER 2": "Buy Over 2 — wins on any digit above 2",
  "OVER 3": "Buy Over 3 — wins on any digit above 3",
  "UNDER 7": "Buy Under 7 — wins on any digit below 7",
  "UNDER 6": "Buy Under 6 — wins on any digit below 6",
};

export function scanHot(
  id: string,
  label: string,
  digits: number[],
  price: number | null,
  minTicks = MIN_TICKS,
): HotMarket | null {
  const n = Math.min(digits.length, 1000);
  if (n < minTicks) return null;

  const win = digits.slice(-n);
  const counts = Array.from({ length: 10 }, () => 0);
  for (const d of win) counts[d]++;

  const recent = win.slice(-Math.min(RECENT, n));
  const rCounts = Array.from({ length: 10 }, () => 0);
  for (const d of recent) rCounts[d]++;

  const full = counts.map((c) => (c / n) * 100);
  const recentPer = rCounts.map((c) => (c / recent.length) * 100);

  let trend = 0;
  for (let d = 0; d < 10; d++) trend += recentPer[d] - full[d];
  trend = trend / 10;

  const signals: HotSignal[] = [];

  (Object.keys(LOSERS) as Direction[]).forEach((side) => {
    const losers = LOSERS[side];
    const per = losers.map((d) => full[d]);
    const rPer = losers.map((d) => recentPer[d]);
    const worst = Math.max(...per);
    if (worst > WARM_CEIL) return; // hopeless for both tiers

    const block = per.reduce((a, b) => a + b, 0);
    const blockBase = losers.length * 10;
    const climb = Math.max(...losers.map((_, k) => rPer[k] - per[k]));

    // gates
    const underCeil = worst <= CEIL;
    const recentOk = rPer.every((p) => p <= 10.35);
    const noClimb = climb <= 0.8;
    const blockOk = block <= blockBase;
    const blockLoose = block <= blockBase + 1.6;

    let tier: Tier | null = null;
    let reason = "";

    if (underCeil && recentOk && noClimb && blockOk) {
      tier = "hot";
      reason = "every losing digit under 9.9% with no climb";
    } else if (recentOk && blockLoose && climb <= 1.4) {
      tier = "warm";
      reason = !underCeil
        ? `worst loser at ${worst.toFixed(2)}% — just above the 9.9% line`
        : !blockOk
          ? `losing block at ${block.toFixed(1)}% vs ${blockBase}% fair share`
          : `one loser climbing ${climb.toFixed(2)}pp into its last 100 ticks`;
    }
    if (!tier) return;

    signals.push({
      side,
      tier,
      losers,
      per,
      recentPer: rPer,
      worst,
      block,
      blockBase,
      climb,
      margin: CEIL - worst,
      reason,
    });
  });

  if (!signals.length) return null;

  // HOT beats WARM, then margin, then block leanness
  signals.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === "hot" ? -1 : 1;
    const sa = a.margin + (a.blockBase - a.block);
    const sb = b.margin + (b.blockBase - b.block);
    return sb - sa;
  });
  const best = signals[0];

  const fullness = Math.min(1, n / 1000);
  const lean = (best.blockBase - best.block) / best.blockBase;
  const base = best.tier === "hot" ? 52 : 34;
  const score = Math.round(
    Math.min(99, base + best.margin * 5.2 + lean * 80 + fullness * 14 + (best.losers.length >= 4 ? 4 : 0)),
  );

  return { id, label, price, n, counts, full, signals, best, score, trend };
}

export function scanAll(
  markets: { id: string; label: string }[],
  digits: Record<string, number[]>,
  price: Record<string, number>,
  strict = false,
): HotMarket[] {
  const out: HotMarket[] = [];
  for (const m of markets) {
    const h = scanHot(m.id, m.label, digits[m.id] ?? [], price[m.id] ?? null);
    if (!h) continue;
    if (strict && h.best.tier !== "hot") continue;
    out.push(h);
  }
  return out.sort((a, b) => {
    if (a.best.tier !== b.best.tier) return a.best.tier === "hot" ? -1 : 1;
    return b.score - a.score;
  });
}
