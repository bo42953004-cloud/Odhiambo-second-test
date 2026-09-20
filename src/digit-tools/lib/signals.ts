/** Over/Under signal engine — pure functions so the maths is testable and honest. */

export type Side = "over" | "under" | "exact";
export type Run = { type: Side; len: number; start: number; end: number };

export const sideOf = (d: number, b: number): Side => (d > b ? "over" : d < b ? "under" : "exact");
export const opposite = (s: Side): Side => (s === "over" ? "under" : "over");

export function labels(digits: number[], barrier: number): Side[] {
  return digits.map((d) => sideOf(d, barrier));
}

export function runsOf(lab: Side[]): Run[] {
  const out: Run[] = [];
  let i = 0;
  while (i < lab.length) {
    let j = i;
    while (j + 1 < lab.length && lab[j + 1] === lab[i]) j++;
    out.push({ type: lab[i], len: j - i + 1, start: i, end: j });
    i = j + 1;
  }
  return out;
}

/** Probability that a run of `len` continues (instead of flipping) — measured on the window. */
export function continuationAfter(lab: Side[], len: number, side: Side) {
  let seen = 0;
  let continued = 0;
  for (let i = 0; i + len < lab.length; i++) {
    let same = true;
    for (let k = 0; k < len; k++) if (lab[i + k] !== side) same = false;
    if (!same) continue;
    // run must end here for it to be a completed run of exactly `len`
    if (i + len < lab.length && lab[i + len] !== side) {
      seen++;
      if (i + len + 1 <= lab.length && lab[i + len + 1] === side) continued++;
    }
  }
  return { seen, continued, contRate: seen ? (continued / seen) * 100 : 0 };
}

export type OUStats = {
  n: number;
  barrier: number;
  digits: number[];
  lab: Side[];
  counts: number[];
  over: { c: number; p: number };
  under: { c: number; p: number };
  exact: { c: number; p: number };
  overBase: number;
  underBase: number;
  overEdge: number;
  underEdge: number;
  spread: number;
  currentRun: Run | null;
  recentRuns: Run[];
  gaps: number[];
  avgDelta: number;
  lastDigits: number[];
  hot: { d: number; c: number; p: number };
  cold: { d: number; c: number; p: number };
  exactRunMax: number;
};

export function ouStats(digits: number[], barrier: number, sample: number | "all"): OUStats {
  const used = sample === "all" || sample >= digits.length ? digits : digits.slice(-sample);
  const lab = labels(used, barrier);
  const n = used.length;
  const counts = Array.from({ length: 10 }, () => 0);
  for (const d of used) counts[d]++;

  const c = (s: Side) => lab.filter((x) => x === s).length;
  const p = (s: Side) => (n ? (c(s) / n) * 100 : 0);

  // baselines: digit 0–9 uniform → over B covers digits B+1..9, under B covers 0..B-1
  const overBase = ((9 - barrier) / 10) * 100;
  const underBase = (barrier / 10) * 100;

  const allRuns = runsOf(lab);
  const recentRuns = allRuns.slice(-9).reverse();
  const currentRun = allRuns.length ? allRuns[allRuns.length - 1] : null;
  const exactRunMax = allRuns.filter((r) => r.type === "exact").reduce((m, r) => Math.max(m, r.len), 0);

  // average tick-to-tick move (volatility proxy)
  let sum = 0;
  let cnt = 0;
  for (let i = 1; i < used.length; i++) {
    sum += Math.abs(used[i] - used[i - 1]);
    cnt++;
  }
  const avgDelta = cnt ? sum / cnt : 0;

  const gaps = Array.from({ length: 10 }, () => 0);
  const lastSeen = Array.from({ length: 10 }, () => -1);
  for (let i = 0; i < used.length; i++) if (used[i] >= 0) lastSeen[used[i]] = i;
  for (let d = 0; d < 10; d++) gaps[d] = lastSeen[d] === -1 ? -1 : used.length - 1 - lastSeen[d];

  const per = counts.map((cc, d) => ({ d, c: cc, p: n ? (cc / n) * 100 : 0 }));
  let hot = per[0];
  let cold = per[0];
  for (const x of per) {
    if (x.c > hot.c) hot = x;
    if (x.c < cold.c) cold = x;
  }

  return {
    n,
    barrier,
    digits: used,
    lab,
    counts,
    over: { c: c("over"), p: p("over") },
    under: { c: c("under"), p: p("under") },
    exact: { c: c("exact"), p: p("exact") },
    overBase,
    underBase,
    overEdge: p("over") - overBase,
    underEdge: p("under") - underBase,
    spread: Math.abs(p("over") - p("under")),
    currentRun,
    recentRuns,
    gaps,
    avgDelta,
    lastDigits: used.slice(-60),
    hot,
    cold,
    exactRunMax,
  };
}

/* ------------------------------------------------------------------ signals */

export type Condition = { id: string; label: string; detail: string; ok: boolean; weight: number; required: boolean };
export type SignalResult = {
  side: "OVER" | "UNDER";
  sideKey: Side;
  confidence: number;
  met: number;
  total: number;
  armed: boolean;
  quality: "PRIME" | "GOOD" | "WEAK";
  entry: string;
  entryNow: boolean;
  duration: number;
  stake: number;
  conditions: Condition[];
  notes: string[];
};

export type SignalOpts = {
  mode: "auto" | "fade" | "follow";
  hold: number;
  stake: number;
};

export function buildSignal(s: OUStats, opts: SignalOpts): SignalResult {
  const fadeRun =
    s.currentRun && s.currentRun.type !== "exact" ? s.currentRun : null;

  // choose the side we bet
  let sideKey: Side;
  if (opts.mode === "fade" && fadeRun) sideKey = opposite(fadeRun.type);
  else if (opts.mode === "follow" && fadeRun) sideKey = fadeRun.type;
  else {
    const fadeCandidate = fadeRun && fadeRun.len >= 2 && fadeRun.type !== "exact" ? opposite(fadeRun.type) : null;
    sideKey = fadeCandidate ?? (s.overEdge >= s.underEdge ? "over" : "under");
  }
  const side: "OVER" | "UNDER" = sideKey === "over" ? "OVER" : "UNDER";
  const myPct = sideKey === "over" ? s.over.p : s.under.p;
  const myBase = sideKey === "over" ? s.overBase : s.underBase;
  const myEdge = myPct - myBase;

  const ourDigits = Array.from({ length: 10 }, (_, d) => d).filter((d) =>
    sideKey === "over" ? d > s.barrier : d < s.barrier,
  );
  const coldSupport = ourDigits.some((d) => s.gaps[d] >= 12);
  const cont = fadeRun ? continuationAfter(s.lab, fadeRun.len, fadeRun.type) : { seen: 0, continued: 0, contRate: 0 };

  const cond: Condition[] = [
    {
      id: "edge",
      label: `Distribution edge on ${side}`,
      detail: `${myPct.toFixed(1)}% vs ${myBase.toFixed(1)}% baseline → ${myEdge >= 0 ? "+" : ""}${myEdge.toFixed(1)}pp`,
      ok: myEdge >= 2,
      weight: 2,
      required: true,
    },
    {
      id: "fade",
      label: "Opposite streak is over-extended",
      detail: fadeRun && fadeRun.type !== sideKey
        ? `${fadeRun.len} × ${fadeRun.type.toUpperCase()} running — fading it`
        : "No opposite streak to fade right now",
      ok: !!(fadeRun && fadeRun.type !== sideKey && fadeRun.len >= 3),
      weight: 2,
      required: true,
    },
    {
      id: "continuation",
      label: "Streak rarely continues further",
      detail: fadeRun
        ? `${cont.continued}/${cont.seen} similar ${fadeRun.len}-runs continued (${cont.contRate.toFixed(0)}%) — flip rate ${(100 - cont.contRate).toFixed(0)}%`
        : "Not enough completed runs yet",
      ok: cont.seen >= 4 && cont.contRate <= 45,
      weight: 2,
      required: false,
    },
    {
      id: "spread",
      label: "Clear over/under separation",
      detail: `${s.spread.toFixed(1)}pp gap between over and under share`,
      ok: s.spread >= 4,
      weight: 1,
      required: true,
    },
    {
      id: "exact",
      label: "Exact-digit risk is low",
      detail:
        s.exact.p <= 11
          ? `Digit ${s.barrier} prints ${s.exact.p.toFixed(1)}% (longest exact run ${s.exactRunMax})`
          : `Digit ${s.barrier} is printing too often at ${s.exact.p.toFixed(1)}%`,
      ok: s.exact.p <= 11,
      weight: 1,
      required: false,
    },
    {
      id: "cold",
      label: "A cold digit supports our side",
      detail: coldSupport
        ? ourDigits
            .map((d) => ({ d, g: s.gaps[d] }))
            .filter((x) => x.g >= 12)
            .map((x) => `${x.d} (${x.g} ticks)`)
            .join(", ") + " overdue"
        : "No digit on our side is overdue yet",
      ok: coldSupport,
      weight: 1,
      required: false,
    },
    {
      id: "vol",
      label: "Volatility is inside the safe band",
      detail: `avg tick move ${s.avgDelta.toFixed(2)} — ${
        s.avgDelta < 0.4 ? "too flat" : s.avgDelta > 2.2 ? "too wild" : "stable range"
      }`,
      ok: s.avgDelta >= 0.4 && s.avgDelta <= 2.2,
      weight: 1,
      required: false,
    },
  ];

  const totalW = cond.reduce((a, c) => a + c.weight, 0);
  const okW = cond.filter((c) => c.ok).reduce((a, c) => a + c.weight, 0);
  const requiredOk = cond.filter((c) => c.required).every((c) => c.ok);

  const base = (okW / totalW) * 70;
  const edgeBonus = Math.min(18, Math.abs(myEdge) * 4.5);
  const fadeBonus = fadeRun && fadeRun.type !== sideKey ? Math.min(9, fadeRun.len * 2.2) : 0;
  const confidence = Math.round(Math.min(99, base + edgeBonus + fadeBonus));

  const armed = requiredOk;
  const quality: SignalResult["quality"] = confidence >= 80 ? "PRIME" : confidence >= 65 ? "GOOD" : "WEAK";

  const entryNow = !fadeRun || fadeRun.len >= 2 || opts.mode !== "fade";
  const entry = entryNow
    ? `Enter on the next tick — buy ${side}${sideKey === "over" ? ` ${s.barrier}` : ` ${s.barrier}`}`
    : `Wait 1 confirmation tick, then buy ${side}`;

  const notes: string[] = [];
  if (fadeRun && fadeRun.type !== sideKey) {
    notes.push(
      `Current run: ${fadeRun.len} × ${fadeRun.type.toUpperCase()}. Historically ${(100 - cont.contRate).toFixed(0)}% of runs this long flip, so ${side} is the value side.`,
    );
  }
  notes.push(
    `${side} has appeared ${(sideKey === "over" ? s.over.c : s.under.c).toLocaleString()} of ${s.n.toLocaleString()} ticks (${myPct.toFixed(1)}%).`,
  );
  if (s.exactRunMax >= 2) notes.push(`Digit ${s.barrier} has repeated up to ${s.exactRunMax}× — exact bets stay off the table.`);

  return {
    side,
    sideKey,
    confidence,
    met: cond.filter((c) => c.ok).length,
    total: cond.length,
    armed,
    quality,
    entry,
    entryNow,
    duration: opts.hold,
    stake: opts.stake,
    conditions: cond,
    notes,
  };
}

/* ================================ EVEN / ODD ================================ */

export type PRun = { parity: "even" | "odd"; len: number; start: number; end: number };

export type EOStats = {
  n: number;
  digits: number[];
  counts: number[];
  gaps: number[];
  even: { c: number; p: number };
  odd: { c: number; p: number };
  evenEdge: number;
  oddEdge: number;
  spread: number;
  currentRun: PRun | null;
  recentRuns: PRun[];
  longestRun: number;
  flipAfter: { len: number; cases: number; flipRate: number }[];
  /** % of adjacent pairs whose parity differs — 50% is perfectly random */
  alternation: number;
  momentum: { span: number; evenP: number }[];
  hot: { d: number; c: number; p: number };
  cold: { d: number; c: number; p: number };
  lastDigits: number[];
  evenGaps: number[];
  oddGaps: number[];
  avgDelta: number;
};

const isEven = (d: number) => d % 2 === 0;

export function eoStats(digits: number[], sample: number | "all"): EOStats {
  const used = sample === "all" || sample >= digits.length ? digits : digits.slice(-sample);
  const n = used.length;
  const counts = Array.from({ length: 10 }, () => 0);
  for (const d of used) counts[d]++;

  const evenC = used.filter(isEven).length;
  const oddC = n - evenC;
  const evenP = n ? (evenC / n) * 100 : 0;
  const oddP = n ? (oddC / n) * 100 : 0;

  // parity runs
  const lab = used.map(isEven);
  const runs: PRun[] = [];
  let i = 0;
  while (i < lab.length) {
    let j = i;
    while (j + 1 < lab.length && lab[j + 1] === lab[i]) j++;
    runs.push({ parity: lab[i] ? "even" : "odd", len: j - i + 1, start: i, end: j });
    i = j + 1;
  }

  const flipAfter = [2, 3, 4, 5, 6]
    .map((L) => {
      let cases = 0;
      let flips = 0;
      for (let a = 0; a + L < lab.length; a++) {
        let same = true;
        for (let k = 0; k < L; k++) if (lab[a + k] !== lab[a]) same = false;
        if (!same) continue;
        if (lab[a + L] !== lab[a]) {
          cases++;
          if (a + L + 1 < lab.length && lab[a + L + 1] === lab[a]) flips++;
        }
      }
      return { len: L, cases, flipRate: cases ? (flips / cases) * 100 : 0 };
    })
    .filter((x) => x.cases > 0);

  let alt = 0;
  for (let a = 1; a < n; a++) if (isEven(used[a]) !== isEven(used[a - 1])) alt++;
  const alternation = n > 1 ? (alt / (n - 1)) * 100 : 0;

  const momentum = [10, 25, 50, 100]
    .filter((sp) => sp <= n)
    .map((sp) => {
      const sl = used.slice(-sp);
      return { span: sp, evenP: (sl.filter(isEven).length / sp) * 100 };
    });

  const lastSeen = Array.from({ length: 10 }, () => -1);
  for (let a = 0; a < used.length; a++) if (used[a] >= 0) lastSeen[used[a]] = a;
  const gaps = lastSeen.map((lx) => (lx === -1 ? -1 : used.length - 1 - lx));

  const per = counts.map((c, d) => ({ d, c, p: n ? (c / n) * 100 : 0 }));
  let hot = per[0];
  let cold = per[0];
  for (const x of per) {
    if (x.c > hot.c) hot = x;
    if (x.c < cold.c) cold = x;
  }

  let sumDelta = 0;
  for (let a = 1; a < used.length; a++) sumDelta += Math.abs(used[a] - used[a - 1]);

  return {
    n,
    digits: used,
    counts,
    gaps,
    even: { c: evenC, p: evenP },
    odd: { c: oddC, p: oddP },
    evenEdge: evenP - 50,
    oddEdge: oddP - 50,
    spread: Math.abs(evenP - oddP),
    currentRun: runs.length ? runs[runs.length - 1] : null,
    recentRuns: runs.slice(-9).reverse(),
    longestRun: runs.reduce((m, r) => Math.max(m, r.len), 0),
    flipAfter,
    alternation,
    momentum,
    hot,
    cold,
    lastDigits: used.slice(-60),
    evenGaps: [0, 2, 4, 6, 8].map((d) => gaps[d]),
    oddGaps: [1, 3, 5, 7, 9].map((d) => gaps[d]),
    avgDelta: used.length > 1 ? sumDelta / (used.length - 1) : 0,
  };
}

export type EOSignal = {
  side: "EVEN" | "ODD";
  parity: "even" | "odd";
  confidence: number;
  met: number;
  total: number;
  armed: boolean;
  quality: "PRIME" | "GOOD" | "WEAK";
  entry: string;
  duration: number;
  stake: number;
  conditions: Condition[];
  notes: string[];
};

export function buildEOSignal(s: EOStats, opts: SignalOpts): EOSignal {
  const run = s.currentRun;
  let parity: "even" | "odd";
  if (opts.mode === "fade" && run) parity = run.parity === "even" ? "odd" : "even";
  else if (opts.mode === "follow" && run) parity = run.parity;
  else if (run && run.len >= 2) parity = run.parity === "even" ? "odd" : "even";
  else parity = s.evenEdge >= s.oddEdge ? "even" : "odd";

  const side: "EVEN" | "ODD" = parity === "even" ? "EVEN" : "ODD";
  const myP = parity === "even" ? s.even.p : s.odd.p;
  const myEdge = myP - 50;

  const ourDigits = parity === "even" ? [0, 2, 4, 6, 8] : [1, 3, 5, 7, 9];
  const pool = ourDigits.reduce((a, d) => a + s.counts[d], 0);
  const poolShare = s.n ? (pool / s.n) * 100 : 0;
  const overdue = ourDigits.filter((d) => s.gaps[d] >= 12);

  const fa = run ? s.flipAfter.find((f) => f.len === run.len) : undefined;
  const flipRate = fa ? fa.flipRate : 0;

  const cond: Condition[] = [
    {
      id: "edge",
      label: `${side} holds the parity edge`,
      detail: `${myP.toFixed(1)}% vs 50.0% baseline → ${myEdge >= 0 ? "+" : ""}${myEdge.toFixed(1)}pp`,
      ok: myEdge >= 2,
      weight: 2,
      required: true,
    },
    {
      id: "fade",
      label: "Opposite parity streak is over-extended",
      detail:
        run && run.parity !== parity
          ? `${run.len} × ${run.parity.toUpperCase()} running — fading it`
          : "No opposite parity streak to fade",
      ok: !!(run && run.parity !== parity && run.len >= 3),
      weight: 2,
      required: true,
    },
    {
      id: "flip",
      label: "That streak length flips regularly",
      detail: fa
        ? `after ${fa.len}-runs: ${fa.cases} cases, ${flipRate.toFixed(0)}% flipped back`
        : "Not enough completed runs of this length yet",
      ok: !!fa && fa.cases >= 4 && flipRate >= 52,
      weight: 2,
      required: false,
    },
    {
      id: "alt",
      label: "Alternation rate suits a fade",
      detail: `${s.alternation.toFixed(1)}% of ticks switch parity — ${
        s.alternation < 25 ? "parity is sticky" : s.alternation > 78 ? "parity is erratic" : "healthy balance"
      }`,
      ok: s.alternation >= 25 && s.alternation <= 78,
      weight: 1,
      required: false,
    },
    {
      id: "pool",
      label: "Our 5 digits carry the share",
      detail: `digits ${ourDigits.join(", ")} = ${poolShare.toFixed(1)}% of ticks (fair share 50%)`,
      ok: poolShare >= 52,
      weight: 1,
      required: true,
    },
    {
      id: "cold",
      label: "An overdue digit backs our side",
      detail: overdue.length
        ? overdue.map((d) => `${d} (${s.gaps[d]} ticks)`).join(", ") + " overdue"
        : "No digit on our side is overdue yet",
      ok: overdue.length > 0,
      weight: 1,
      required: false,
    },
    {
      id: "vol",
      label: "Volatility inside the safe band",
      detail: `avg tick move ${s.avgDelta.toFixed(2)} — ${
        s.avgDelta < 0.4 ? "too flat" : s.avgDelta > 2.2 ? "too wild" : "stable range"
      }`,
      ok: s.avgDelta >= 0.4 && s.avgDelta <= 2.2,
      weight: 1,
      required: false,
    },
  ];

  const totalW = cond.reduce((a, c) => a + c.weight, 0);
  const okW = cond.filter((c) => c.ok).reduce((a, c) => a + c.weight, 0);
  const requiredOk = cond.filter((c) => c.required).every((c) => c.ok);

  const base = (okW / totalW) * 70;
  const edgeBonus = Math.min(18, Math.abs(myEdge) * 4);
  const fadeBonus = run && run.parity !== parity ? Math.min(9, run.len * 2.2) : 0;
  const confidence = Math.round(Math.min(99, base + edgeBonus + fadeBonus));

  const last10 = s.momentum.find((m) => m.span === 10);
  const drift = last10 ? last10.evenP - s.even.p : 0;

  const notes: string[] = [];
  if (run) {
    notes.push(
      `Current run: ${run.len} × ${run.parity.toUpperCase()}. Parity switches on ${s.alternation.toFixed(1)}% of ticks in this window; ${
        fa ? `${flipRate.toFixed(0)}% of ${run.len}-runs flip back` : "not enough history for this length"
      }.`,
    );
  }
  notes.push(
    `${side} has printed ${(parity === "even" ? s.even.c : s.odd.c).toLocaleString()} of ${s.n.toLocaleString()} ticks (${myP.toFixed(1)}%) — ${myEdge >= 0 ? "+" : ""}${myEdge.toFixed(1)}pp against a fair coin.`,
  );
  if (last10) {
    notes.push(
      `Short-term drift: even share over the last 10 ticks is ${last10.evenP.toFixed(0)}% versus ${s.even.p.toFixed(1)}% over the full sample (${drift >= 0 ? "+" : ""}${drift.toFixed(1)}pp).`,
    );
  }

  return {
    side,
    parity,
    confidence,
    met: cond.filter((c) => c.ok).length,
    total: cond.length,
    armed: requiredOk,
    quality: confidence >= 80 ? "PRIME" : confidence >= 65 ? "GOOD" : "WEAK",
    entry: run && run.len < 2 && opts.mode === "fade" ? `Wait 1 confirmation tick, then buy ${side}` : `Enter on the next tick — buy ${side}`,
    duration: opts.hold,
    stake: opts.stake,
    conditions: cond,
    notes,
  };
}

export function backtestParity(
  digits: number[],
  cfg: { streak: number; hold: number; mode: "fade" | "follow" },
): Backtest {
  const lab = digits.map(isEven);
  const runs: PRun[] = [];
  let i = 0;
  while (i < lab.length) {
    let j = i;
    while (j + 1 < lab.length && lab[j + 1] === lab[i]) j++;
    runs.push({ parity: lab[i] ? "even" : "odd", len: j - i + 1, start: i, end: j });
    i = j + 1;
  }

  const results: boolean[] = [];
  let loseRun = 0;
  let maxLose = 0;

  for (const r of runs) {
    if (r.len !== cfg.streak) continue;
    const entry = r.end + 1;
    const settle = entry + cfg.hold - 1;
    if (settle >= lab.length) continue;
    const want = cfg.mode === "fade" ? !(r.parity === "even") : r.parity === "even";
    const got = lab[settle];
    if (got === want) {
      results.push(true);
      loseRun = 0;
    } else {
      results.push(false);
      loseRun++;
    }
    maxLose = Math.max(maxLose, loseRun);
  }

  const wins = results.filter(Boolean).length;
  let cum = 0;
  const equity = results.map((w) => (cum += w ? 0.94 : -1));

  return {
    signals: results.length,
    wins,
    losses: results.length - wins,
    winRate: results.length ? (wins / results.length) * 100 : 0,
    maxLoseStreak: maxLose,
    results,
    equity,
    net: cum,
  };
}

/* ========================= DIGIT FREQUENCY & STREAKS ========================= */

export type FreqRow = { d: number; c: number; p: number; z: number; delta: number };
export type Block = { i: number; n: number; counts: number[]; per: number[] };

export type FreqStats = {
  n: number;
  digits: number[];
  counts: number[];
  per: FreqRow[];
  ranked: FreqRow[];
  hot: FreqRow;
  cold: FreqRow;
  /** chi-square goodness of fit against a uniform distribution */
  chi: number;
  chiVerdict: "uniform" | "mild" | "skewed";
  blocks: Block[];
  /** pp change per digit between the first and last block */
  trend: number[];
  longestRun: number[];
  topRuns: { d: number; len: number; at: number }[];
  repeatPairs: number[];
  triples: number[];
  repeatRate: number;
  droughts: number[];
  maxGap: number[];
  transitions: number[][];
  transitionPct: number[][];
  nextBias: { from: number; to: number; p: number; rowTotal: number } | null;
};

export function freqStats(digits: number[], sample: number | "all", blocksWanted = 8): FreqStats {
  const used = sample === "all" || sample >= digits.length ? digits : digits.slice(-sample);
  const n = used.length;
  const counts = Array.from({ length: 10 }, () => 0);
  for (const d of used) counts[d]++;

  const sd = 0.3 * Math.sqrt(n || 1);
  const per: FreqRow[] = counts.map((c, d) => ({
    d,
    c,
    p: n ? (c / n) * 100 : 0,
    z: sd ? (c - n * 0.1) / sd : 0,
    delta: n ? (c / n) * 100 - 10 : 0,
  }));
  const ranked = [...per].sort((a, b) => b.c - a.c);
  const hot = ranked[0];
  const cold = ranked[ranked.length - 1];

  // chi-square vs uniform
  const exp = n / 10;
  const chi = exp ? per.reduce((a, x) => a + Math.pow(x.c - exp, 2) / exp, 0) : 0;
  const chiVerdict: FreqStats["chiVerdict"] = chi < 16.92 ? "uniform" : chi < 21.67 ? "mild" : "skewed";

  // time blocks
  const B = Math.max(2, Math.min(blocksWanted, Math.max(2, Math.floor(n / 25))));
  const size = Math.max(1, Math.floor(n / B));
  const blocks: Block[] = [];
  for (let i = 0; i < B; i++) {
    const slice = used.slice(i * size, i === B - 1 ? n : (i + 1) * size);
    const bc = Array.from({ length: 10 }, () => 0);
    for (const d of slice) bc[d]++;
    blocks.push({
      i,
      n: slice.length,
      counts: bc,
      per: bc.map((c) => (slice.length ? (c / slice.length) * 100 : 0)),
    });
  }
  const trend = Array.from({ length: 10 }, (_, d) => {
    const first = blocks[0].per[d];
    const last = blocks[blocks.length - 1].per[d];
    return last - first;
  });

  // runs / streaks
  const longestRun = Array.from({ length: 10 }, () => 0);
  const topRuns: { d: number; len: number; at: number }[] = [];
  let i = 0;
  while (i < used.length) {
    let j = i;
    while (j + 1 < used.length && used[j + 1] === used[i]) j++;
    const len = j - i + 1;
    const d = used[i];
    if (len > longestRun[d]) longestRun[d] = len;
    if (len >= 2) topRuns.push({ d, len, at: i });
    i = j + 1;
  }
  topRuns.sort((a, b) => b.len - a.len || a.at - b.at);

  const repeatPairs = Array.from({ length: 10 }, () => 0);
  const triples = Array.from({ length: 10 }, () => 0);
  let pairTotal = 0;
  for (let a = 1; a < n; a++) {
    if (used[a] === used[a - 1]) {
      repeatPairs[used[a]]++;
      pairTotal++;
      if (a >= 2 && used[a - 1] === used[a - 2]) triples[used[a]]++;
    }
  }
  const repeatRate = n > 1 ? (pairTotal / (n - 1)) * 100 : 0;

  const droughts = Array.from({ length: 10 }, () => -1);
  const maxGap = Array.from({ length: 10 }, () => 0);
  const positions: number[][] = Array.from({ length: 10 }, () => []);
  for (let a = 0; a < n; a++) positions[used[a]].push(a);
  for (let d = 0; d < 10; d++) {
    const pos = positions[d];
    if (!pos.length) {
      droughts[d] = -1;
      maxGap[d] = n;
      continue;
    }
    droughts[d] = n - 1 - pos[pos.length - 1];
    let gap = pos[0];
    for (let k = 1; k < pos.length; k++) gap = Math.max(gap, pos[k] - pos[k - 1] - 1);
    gap = Math.max(gap, n - 1 - pos[pos.length - 1]);
    maxGap[d] = gap;
  }

  // transitions
  const transitions = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0));
  for (let a = 1; a < n; a++) transitions[used[a - 1]][used[a]]++;
  const transitionPct = transitions.map((row) => {
    const t = row.reduce((x, y) => x + y, 0);
    return row.map((v) => (t ? (v / t) * 100 : 0));
  });

  let nextBias: FreqStats["nextBias"] = null;
  if (n) {
    const last = used[n - 1];
    const row = transitions[last];
    const total = row.reduce((x, y) => x + y, 0);
    if (total > 0) {
      let best = 0;
      for (let d = 1; d < 10; d++) if (row[d] > row[best]) best = d;
      nextBias = { from: last, to: best, p: (row[best] / total) * 100, rowTotal: total };
    }
  }

  return {
    n,
    digits: used,
    counts,
    per,
    ranked,
    hot,
    cold,
    chi,
    chiVerdict,
    blocks,
    trend,
    longestRun,
    topRuns,
    repeatPairs,
    triples,
    repeatRate,
    droughts,
    maxGap,
    transitions,
    transitionPct,
    nextBias,
  };
}

/* ------------------------------------------------------------------ backtest */

export type Backtest = {
  signals: number;
  wins: number;
  losses: number;
  winRate: number;
  maxLoseStreak: number;
  results: boolean[];
  equity: number[];
  net: number;
};

export function backtest(
  digits: number[],
  barrier: number,
  cfg: { streak: number; hold: number; mode: "fade" | "follow" },
): Backtest {
  const lab = labels(digits, barrier);
  const all = runsOf(lab);
  const results: boolean[] = [];
  let maxLose = 0;
  let loseRun = 0;

  for (const r of all) {
    if (r.type === "exact" || r.len !== cfg.streak) continue;
    const entry = r.end + 1;
    const settle = entry + cfg.hold - 1;
    if (settle >= lab.length) continue;
    const bet = cfg.mode === "fade" ? opposite(r.type) : r.type;
    const outcome = lab[settle];
    if (outcome === "exact") {
      results.push(false);
      loseRun++;
    } else if (outcome === bet) {
      results.push(true);
      loseRun = 0;
    } else {
      results.push(false);
      loseRun++;
    }
    maxLose = Math.max(maxLose, loseRun);
  }

  const wins = results.filter(Boolean).length;
  const losses = results.length - wins;
  let cum = 0;
  const equity = results.map((w) => (cum += w ? 0.94 : -1));

  return {
    signals: results.length,
    wins,
    losses,
    winRate: results.length ? (wins / results.length) * 100 : 0,
    maxLoseStreak: maxLose,
    results,
    equity,
    net: cum,
  };
}
