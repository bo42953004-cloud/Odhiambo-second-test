import { useEffect, useMemo, useRef, useState } from "react";
import {
  GROUPS,
  MARKETS,
  MAX_TICKS,
  byId,
  useDerivFeed,
  pct,
  gapSinceLast,
  parityStreak,
  type Group,
} from "../lib/deriv";

/* ---------- two-sided split bar ---------- */
function Split({
  a,
  b,
  ap,
  bp,
  aBg,
  bBg,
}: {
  a: string;
  b: string;
  ap: number;
  bp: number;
  aBg: string;
  bBg: string;
}) {
  const sum = ap + bp || 1;
  const left = Math.max(12, Math.min(88, (ap / sum) * 100));
  return (
    <div className="flex h-6 overflow-hidden rounded-lg text-[10px] font-extrabold">
      <div className="flex min-w-0 items-center px-2 transition-all duration-500" style={{ width: `${left}%`, background: aBg, color: "#04170f" }}>
        <span className="truncate">{a}</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end px-2 transition-all duration-500" style={{ background: bBg, color: "#fff" }}>
        <span className="truncate">{b}</span>
      </div>
    </div>
  );
}

/* ---------- percentage display ----------
   Deliberately NOT animated: count-up rAF loops on every incoming tick
   were congesting the main thread and delaying the live pointer paint. */
function Num({
  value,
  decimals = 1,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <span className="mono">
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ---------- market dropdown ---------- */
function MarketPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);
  const m = byId(value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const groupColor: Record<Group, string> = { "1HZ": "#29d3f5", R: "#3b82f6", JD: "#8b5cf6" };

  return (
    <div className="relative" ref={wrap}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5"
        style={{
          borderColor: open ? "var(--cyan)" : "var(--line-2)",
          background: "rgba(10,19,56,.9)",
          boxShadow: open ? "0 0 0 3px rgba(41,211,245,.14)" : "none",
        }}
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: groupColor[m.group], boxShadow: `0 0 10px ${groupColor[m.group]}` }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-extrabold">{m.label}</span>
          <span className="mono block text-[10px]" style={{ color: "var(--faint)" }}>
            {m.id} · pip {m.pip}dp
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="A-drop absolute right-0 z-50 mt-2 max-h-[320px] w-[290px] overflow-y-auto rounded-2xl border p-1.5"
          style={{
            borderColor: "var(--line-2)",
            background: "rgba(8,16,44,.98)",
            boxShadow: "0 40px 80px -30px #000",
            backdropFilter: "blur(14px)",
          }}
        >
          {GROUPS.map((g, gi) => (
            <div key={g.key}>
              <div
                className="flex items-center gap-2 px-2.5 py-2"
                style={{ animation: `dt-up .4s ease ${gi * 60}ms both` }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: g.color }}>
                  {g.title}
                </span>
                <span className="truncate text-[9.5px]" style={{ color: "var(--faint)" }}>
                  {g.note}
                </span>
              </div>
              {MARKETS.filter((x) => x.group === g.key).map((x, i) => {
                const on = x.id === value;
                return (
                  <button
                    key={x.id}
                    onClick={() => {
                      onChange(x.id);
                      setOpen(false);
                    }}
                    className="group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all duration-300 hover:translate-x-1"
                    style={{
                      background: on ? "rgba(41,211,245,.13)" : "transparent",
                      animation: `dt-up .35s ease ${(gi * 60) + i * 22}ms both`,
                    }}
                  >
                    <span className="mono w-[62px] shrink-0 text-[10px] font-bold" style={{ color: g.color }}>
                      {x.id}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{x.label}</span>
                    {on && (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="var(--cyan)" strokeWidth="3" strokeLinecap="round">
                        <path d="m5 13 4.5 4.5L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- main panel ---------- */
export function AnalysisPanel({ onClose }: { onClose: () => void }) {
  const [symbol, setSymbol] = useState("R_100");
  const [mode, setMode] = useState<"EO" | "OU">("EO");
  const [barrier, setBarrier] = useState(5);
  const [sample, setSample] = useState<number | "all">(1000);
  const market = useMemo(() => byId(symbol), [symbol]);
  const feed = useDerivFeed(market);

  const all = feed.digits;
  const used = useMemo(
    () => (sample === "all" ? all : all.slice(-sample)),
    [all, sample],
  );
  const n = used.length;
  const counts = useMemo(() => {
    const c = Array.from({ length: 10 }, () => 0);
    for (const d of used) c[d] += 1;
    return c;
  }, [used]);

  const digitsOnly = counts.map((c, d) => ({ d, c, p: pct(c, n) }));
  const hot = digitsOnly.reduce((a, b) => (b.c > a.c ? b : a), digitsOnly[0]);
  const cold = digitsOnly.reduce((a, b) => (b.c < a.c ? b : a), digitsOnly[0]);

  const evenC = counts.filter((_, d) => d % 2 === 0).reduce((a, b) => a + b, 0);
  const oddC = n - evenC;
  const overC = used.filter((d) => d > barrier).length;
  const underC = used.filter((d) => d < barrier).length;
  const matchC = counts[barrier] ?? 0;

  const streak = parityStreak(all);
  const hotGap = gapSinceLast(all, hot.d);
  const coldGap = gapSinceLast(all, cold.d);

  // single source of truth: the newest collected tick, so the pointer can never
  // drift out of sync with the digit stream (even by one tick)
  const live = all.length ? all[all.length - 1] : null;
  const tickSeq = all.length;
  const liveIsOver = live != null && live > barrier;
  const liveIsUnder = live != null && live < barrier;
  const modeColor = mode === "EO" ? "#29d3f5" : "#8b5cf6";

  const maxPct = Math.max(...digitsOnly.map((x) => x.p), 1);

  const insights = useMemo(() => {
    const diff = Math.abs(pct(evenC, n) - pct(oddC, n));
    const lead = evenC >= oddC ? "EVEN" : "ODD";
    const skew =
      diff >= 3
        ? `${lead} dominates the sample at ${Math.max(pct(evenC, n), pct(oddC, n)).toFixed(1)}% — a ${diff.toFixed(1)}pp edge over the other side.`
        : `Even/Odd is balanced within ${diff.toFixed(1)}pp — no parity edge in this window.`;
    const base = 10;
    return [
      skew,
      `Digit ${hot.d} is running hot at ${hot.p.toFixed(1)}% (${(hot.p - base >= 0 ? "+" : "")}${(hot.p - base).toFixed(1)}pp vs baseline) with ${hotGap} ticks since it last printed.`,
      `Digit ${cold.d} is the coldest at ${cold.p.toFixed(1)}% — last seen ${coldGap} ticks ago.`,
      mode === "EO"
        ? `Live streak: ${streak.even ? `${streak.even} × EVEN` : `${streak.odd} × ODD`} in a row.`
        : `Over ${barrier} covers ${pct(overC, n).toFixed(1)}% of ticks, under ${barrier} covers ${pct(underC, n).toFixed(1)}%, exact ${barrier} prints ${pct(matchC, n).toFixed(1)}%.`,
    ];
  }, [evenC, n, oddC, hot, cold, hotGap, coldGap, mode, streak, barrier, overC, underC, matchC]);

  const statusColor =
    feed.source === "live" ? "var(--green)" : feed.source === "sim" ? "var(--gold)" : "var(--cyan)";
  const statusText =
    feed.source === "live"
      ? "LIVE · Deriv feed"
      : feed.source === "sim"
        ? "OFFLINE · not connected to Deriv"
        : "Connecting to Deriv…";

  return (
    <div
      className="dt-dark-scope A-fade fixed inset-0 z-[85] overflow-y-auto bg-black/70 p-3 backdrop-blur-md sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dt-dark-scope A-drop relative mx-auto w-full max-w-[1080px] overflow-hidden rounded-[22px] border"
        style={{
          borderColor: "rgba(120,165,255,.34)",
          background: "linear-gradient(180deg,#0a1338 0%,#050b22 100%)",
          boxShadow: "0 60px 120px -40px #000, inset 0 1px 0 rgba(255,255,255,.07)",
        }}
      >
        {/* sweep */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30"
          style={{ background: "linear-gradient(180deg, rgba(41,211,245,.35), transparent)", animation: "dt-scanline 5s ease-in-out infinite alternate" }}
        />

        {/* header */}
        <div className="relative flex flex-wrap items-center gap-3 border-b p-4 sm:p-5" style={{ borderColor: "var(--line)" }}>
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
            <span className="absolute inset-0 rounded-2xl A-glow" style={{ background: "conic-gradient(from 0deg,#8b5cf6,#29d3f5,#f472b6,#8b5cf6)", filter: "blur(8px)" }} />
            <span className="absolute inset-[2px] grid place-items-center rounded-2xl" style={{ background: "linear-gradient(150deg,#2b1a5e,#101a44)" }}>
              <span className="text-[13px] font-black text-white">AI</span>
            </span>
          </span>

          <div className="min-w-0">
            <h2 className="text-[17px] font-extrabold tracking-tight sm:text-[19px]">Deriv Digit Analysis</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-black" style={{ background: `color-mix(in srgb, ${statusColor} 16%, transparent)`, color: statusColor }}>
                <span className="h-1.5 w-1.5 rounded-full A-blink" style={{ background: statusColor }} />
                {statusText}
              </span>
              <span className="mono text-[10.5px]" style={{ color: "var(--faint)" }}>
                {market.id} · {feed.ticks} ticks · {feed.speed}s interval · vs {feed.endpoint}
              </span>
            </div>
          </div>

          {feed.source === "live" && (
            <div
              className="order-last w-full rounded-xl border px-3 py-2 text-[11px] font-semibold sm:order-none sm:w-auto"
              style={{ borderColor: "rgba(18,201,160,.4)", background: "rgba(18,201,160,.08)", color: "var(--green)" }}
            >
              ✓ {feed.detail}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="w-[230px] max-w-[60vw]">
              <MarketPicker value={symbol} onChange={setSymbol} />
            </div>
            <button
              onClick={onClose}
              title="Close"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all duration-300 hover:rotate-90 hover:border-[var(--red)]"
              style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>

        {/* toolbar */}
        <div className="relative flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-5" style={{ borderColor: "var(--line)", background: "rgba(8,16,44,.6)" }}>
          {/* mode switch */}
          <div className="relative flex rounded-xl p-1" style={{ background: "rgba(255,255,255,.05)" }}>
            <span
              className="absolute inset-y-1 rounded-lg transition-all duration-500"
              style={{
                width: "calc(50% - 4px)",
                left: mode === "EO" ? 4 : "calc(50% + 0px)",
                background: `linear-gradient(135deg, ${modeColor}, color-mix(in srgb, ${modeColor} 45%, #0b1230))`,
                boxShadow: `0 8px 22px -10px ${modeColor}`,
              }}
            />
            {([
              ["EO", "Even / Odd"],
              ["OU", "Over / Under"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className="relative z-10 px-4 py-2 text-[12px] font-extrabold transition-colors duration-300"
                style={{ color: mode === k ? "#04091f" : "var(--muted)", minWidth: 116 }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* sample */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
              Sample
            </span>
              {[100, 250, 500, 1000, "all"].map((s) => {
              const on = sample === s;
              return (
                <button
                  key={String(s)}
                  onClick={() => setSample(s as number | "all")}
                  className="rounded-lg border px-2.5 py-1.5 text-[11px] font-extrabold transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    borderColor: on ? "var(--cyan)" : "var(--line)",
                    color: on ? "var(--cyan)" : "var(--muted)",
                    background: on ? "rgba(41,211,245,.12)" : "transparent",
                  }}
                >
                  {s === "all" ? "All" : s}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3 text-[10.5px]" style={{ color: "var(--faint)" }}>
            <span className="mono">
              n = {n} ticks{all.length < (sample === "all" ? 0 : (sample as number)) ? ` (of ${all.length})` : ""}
            </span>
            <span className="mono">baseline 10.0% / digit</span>
            <div className="flex items-center gap-2">
              <span className="mono">
                buffer {tickSeq}/{MAX_TICKS}
              </span>
              <span className="relative block h-1.5 w-24 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.09)" }}>
                <span
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (tickSeq / MAX_TICKS) * 100)}%`,
                    background: "linear-gradient(90deg,#29d3f5,#12c9a0)",
                    boxShadow: "0 0 10px rgba(41,211,245,.8)",
                  }}
                />
              </span>
              {tickSeq >= MAX_TICKS && (
                <span className="rounded px-1.5 py-0.5 text-[9px] font-black" style={{ background: "rgba(18,201,160,.16)", color: "var(--green)" }}>
                  FULL
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative grid gap-4 p-4 sm:p-5 xl:grid-cols-[1.62fr_1fr]">
          {/* ======== left column ======== */}
          <div className="space-y-4">
            {/* distribution */}
            <section className="dt-panel relative overflow-hidden p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[14px] font-extrabold tracking-tight">Digit Distribution (0 – 9)</h3>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1.5" style={{ color: "var(--green)" }}>
                    <span className="h-2 w-2 rounded-sm" style={{ background: "var(--green)" }} /> most appearing
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: "var(--red)" }}>
                    <span className="h-2 w-2 rounded-sm" style={{ background: "var(--red)" }} /> least appearing
                  </span>
                </div>
              </div>

              {/* digits — 0-4 on the top row, 5-9 on the bottom row, one circle each */}
              <div className="mx-auto mt-4 grid w-full max-w-[330px] grid-cols-5 gap-x-2 gap-y-4">
                {digitsOnly.map((x) => {
                  const isHot = x.d === hot.d;
                  const isCold = x.d === cold.d;
                  const isLive = live === x.d;
                  const col = isHot ? "var(--green)" : isCold ? "var(--red)" : "#2f6bff";
                  return (
                    <div key={x.d} className="relative flex justify-center pt-1.5" style={{ gridColumn: (x.d % 5) + 1, gridRow: x.d < 5 ? 1 : 2 }}>
                      {/* live tick pointer — pops directly above its circle */}
                      {isLive && (
                        <span
                          key={`ptr-${tickSeq}-${x.d}`}
                          className="pointer-events-none absolute -top-[13px] left-1/2 z-20 -translate-x-1/2"
                        >
                          <span
                            className="A-tickpop block text-[11px] leading-none"
                            style={{ color: "var(--yellow)", filter: "drop-shadow(0 0 8px var(--yellow))" }}
                          >
                            ▼
                          </span>
                        </span>
                      )}

                      <span
                        key={isLive ? `circ-${tickSeq}` : `c-${x.d}`}
                        className={`relative grid h-[46px] w-[46px] place-items-center rounded-full transition-all duration-300 ${isLive ? "A-tickpop" : ""}`}
                        style={{
                          background: isLive
                            ? "linear-gradient(160deg, rgba(255,212,0,.28), rgba(255,212,0,.06))"
                            : `color-mix(in srgb, ${col} ${isHot || isCold ? 22 : 12}%, transparent)`,
                          border: `1.5px solid ${isLive ? "var(--yellow)" : col}`,
                          boxShadow: isLive
                            ? "0 0 0 3px rgba(255,212,0,.2), 0 0 18px var(--yellow)"
                            : isHot || isCold
                              ? `0 0 14px color-mix(in srgb, ${col} 50%, transparent)`
                              : "none",
                        }}
                      >
                        <span className="mono text-[15px] font-extrabold leading-none" style={{ color: isLive ? "var(--yellow)" : col }}>
                          {x.d}
                        </span>
                        <span
                          className="mono absolute -bottom-[9px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1 text-[8px] font-bold"
                          style={{ background: "var(--s1)", color: isHot ? "var(--green)" : isCold ? "var(--red)" : "var(--muted)", border: "1px solid var(--line)" }}
                        >
                          <Num value={x.p} suffix="%" />
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ---- compact analysis that fills the card under the digits ---- */}
              <div className="mt-4 space-y-2">
                <Split
                  a={`Even ${pct(evenC, n).toFixed(1)}%`}
                  b={`Odd ${pct(oddC, n).toFixed(1)}%`}
                  ap={pct(evenC, n)}
                  bp={pct(oddC, n)}
                  aBg="linear-gradient(90deg,#0f9d7a,#12c9a0)"
                  bBg="linear-gradient(90deg,#f59e0b,#ef6c2b)"
                />
                <Split
                  a={`Over ${barrier} ${pct(overC, n).toFixed(1)}%`}
                  b={`Under ${barrier} ${pct(underC, n).toFixed(1)}%`}
                  ap={pct(overC, n)}
                  bp={pct(underC, n)}
                  aBg="linear-gradient(90deg,#7c3aed,#a855f7)"
                  bBg="linear-gradient(90deg,#db2777,#ec4899)"
                />
              </div>

              {/* ---- key figures ---- */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {([
                  ["Hottest", `${hot.d}`, `${hot.p.toFixed(1)}%`, "var(--green)"],
                  ["Coldest", `${cold.d}`, `${cold.p.toFixed(1)}%`, "var(--red)"],
                  [`Exact ${barrier}`, mode === "OU" ? `${pct(counts[barrier] ?? 0, n).toFixed(1)}%` : "—", "#2f6bff"],
                  [
                    "Streak",
                    mode === "EO" ? (streak.even ? `${streak.even} × EVEN` : `${streak.odd} × ODD`) : `${hotGap} t`,
                    mode === "EO" ? "parity run" : `since digit ${hot.d}`,
                    "var(--muted)",
                  ],
                ] as const).map(([k, v, sub, c], i) => (
                  <div
                    key={k}
                    className="rounded-xl border p-2 text-center"
                    style={{ borderColor: "var(--line)", background: "var(--soft)", animation: `dt-up .4s ease ${i * 60}ms both` }}
                  >
                    <div className="text-[8.5px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      {k}
                    </div>
                    <div className="mono mt-0.5 text-[13px] font-extrabold leading-none" style={{ color: c }}>
                      {v}
                    </div>
                    <div className="mono mt-0.5 text-[8.5px]" style={{ color: "var(--faint)" }}>
                      {sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* ---- live tape, 0-9 coloured by rank ---- */}
              <div className="mono mt-3 flex flex-wrap items-center gap-1 rounded-xl border px-2.5 py-2" style={{ borderColor: "var(--line)", background: "var(--soft)" }}>
                <span className="mr-1 text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  last 20 ticks
                </span>
                {all.slice(-20).map((d, i, arr) => {
                  const newest = i === arr.length - 1;
                  return (
                    <span
                      key={`${arr.length}-${i}`}
                      className="grid h-5 w-5 place-items-center rounded text-[9.5px] font-bold"
                      style={{
                        background: newest
                          ? "var(--yellow)"
                          : d === hot.d
                            ? "color-mix(in srgb, var(--green) 22%, transparent)"
                            : d === cold.d
                              ? "color-mix(in srgb, var(--red) 20%, transparent)"
                              : "var(--chip)",
                        color: newest ? "#1a1400" : d === hot.d ? "var(--green)" : d === cold.d ? "var(--red)" : "var(--muted)",
                        transform: newest ? "scale(1.14)" : "none",
                      }}
                    >
                      {d}
                    </span>
                  );
                })}
                {!all.length && (
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                    waiting for the first tick…
                  </span>
                )}
              </div>

              {/* legacy bar chart — retired, no longer rendered
                  (kept in the tree as display:none so no logic is lost) */}
              <div className="hidden">
                {digitsOnly.map((x, i) => {
                  const isHot = x.d === hot.d;
                  const isCold = x.d === cold.d;
                  const isLive = live === x.d;
                  const bar = Math.max(4, (x.p / maxPct) * 100);
                  const col = isHot ? "var(--green)" : isCold ? "var(--red)" : "#2f6bff";
                  return (
                    <div key={x.d} className="relative flex flex-1 flex-col items-center gap-2" style={{ animation: `dt-up .6s cubic-bezier(.22,1,.36,1) ${i * 45}ms both` }}>
                      <span className="mono text-[10.5px] font-extrabold" style={{ color: isHot ? "var(--green)" : isCold ? "var(--red)" : "var(--muted)" }}>
                        <Num value={x.p} suffix="%" />
                      </span>

                      <div className="relative flex h-[170px] w-full items-end overflow-hidden rounded-lg" style={{ background: "rgba(255,255,255,.045)" }}>
                        <div
                          className={`w-full rounded-lg transition-all duration-300 ease-out ${isLive ? "A-tickbar" : ""}`}
                          style={{
                            height: `${bar}%`,
                            background: `linear-gradient(180deg, ${col}, color-mix(in srgb, ${col} 20%, transparent))`,
                            boxShadow: isLive
                              ? "0 0 24px var(--yellow), 0 0 40px color-mix(in srgb, var(--yellow) 55%, transparent)"
                              : isHot || isCold
                                ? `0 0 22px ${col}`
                                : "none",
                            outline: isLive ? "1px solid var(--yellow)" : "none",
                            outlineOffset: isLive ? "1px" : "0",
                          }}
                        />
                        {isLive && (
                          <span
                            key={`cap-${tickSeq}`}
                            className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-full A-tickpop"
                            style={{ background: "var(--yellow)", boxShadow: "0 0 14px var(--yellow)" }}
                          />
                        )}
                        {(isHot || isCold) && (
                          <span
                            className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-40"
                            style={{
                              background: "linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)",
                              backgroundSize: "60% 100%",
                              backgroundRepeat: "no-repeat",
                              animation: "dt-sweep 2.6s ease-in-out infinite",
                            }}
                          />
                        )}
                      </div>

                      <span
                        key={isLive ? `chip-${tickSeq}` : `chip-idle-${x.d}`}
                        className={`mono grid h-8 w-8 place-items-center rounded-lg text-[13px] font-extrabold ${isLive ? "A-tickpop" : ""}`}
                        style={{
                          background: isLive
                            ? "var(--yellow)"
                            : isHot
                              ? "color-mix(in srgb, var(--green) 22%, transparent)"
                              : isCold
                                ? "color-mix(in srgb, var(--red) 22%, transparent)"
                                : "rgba(255,255,255,.06)",
                          color: isLive ? "#1a1400" : isHot ? "var(--green)" : isCold ? "var(--red)" : "#cfdcff",
                          boxShadow: isLive ? "0 0 0 3px rgba(255,212,0,.25)" : "none",
                        }}
                      >
                        {x.d}
                      </span>

                      <span
                        className="rounded px-1.5 py-0.5 text-[8.5px] font-black uppercase"
                        style={
                          mode === "EO"
                            ? {
                                background: x.d % 2 === 0 ? "rgba(41,211,245,.16)" : "rgba(245,183,49,.16)",
                                color: x.d % 2 === 0 ? "var(--cyan)" : "var(--gold)",
                              }
                            : {
                                background:
                                  x.d > barrier ? "rgba(139,92,246,.18)" : x.d < barrier ? "rgba(236,72,153,.18)" : "rgba(18,201,160,.18)",
                                color: x.d > barrier ? "#b79bfb" : x.d < barrier ? "#f9a8d4" : "var(--green)",
                              }
                        }
                      >
                        {mode === "EO" ? (x.d % 2 === 0 ? "even" : "odd") : x.d > barrier ? "over" : x.d < barrier ? "under" : "exact"}
                      </span>

                      <span className="mono text-[9.5px]" style={{ color: "var(--faint)" }}>
                        {x.c}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* live tape */}
            <section className="dt-panel p-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-[14px] font-extrabold tracking-tight">Live Tick Pointer</h3>
                <span className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[9.5px] font-black" style={{ background: "rgba(255,212,0,.14)", color: "var(--yellow)" }}>
                  <span className="h-1.5 w-1.5 rounded-full A-blink" style={{ background: "var(--yellow)" }} />
                  POINTER ACTIVE
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: "var(--faint)" }}>latest price</span>
                  <span className="mono text-[13px] font-extrabold" style={{ color: "#dbe7ff" }}>
                    {feed.price != null ? feed.price.toFixed(market.pip) : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div
                  key={`big-${tickSeq}-${live ?? "x"}`}
                  className="A-tickpop relative grid h-[74px] w-[74px] shrink-0 place-items-center rounded-2xl"
                  style={{
                    background: "linear-gradient(150deg, rgba(255,212,0,.2), rgba(255,212,0,.05))",
                    border: "1px solid rgba(255,212,0,.45)",
                    boxShadow: "0 0 30px -8px var(--yellow)",
                  }}
                >
                  <span className="mono text-[34px] font-extrabold leading-none" style={{ color: "var(--yellow)" }}>
                    {live ?? "–"}
                  </span>
                  <span className="absolute -bottom-2.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-black" style={{ background: "#0a1338", color: mode === "EO" ? (live != null && live % 2 === 0 ? "var(--cyan)" : "var(--gold)") : liveIsOver ? "#b79bfb" : liveIsUnder ? "#f9a8d4" : "var(--green)" }}>
                    {live == null
                      ? "waiting"
                      : mode === "EO"
                        ? live % 2 === 0
                          ? "EVEN"
                          : "ODD"
                        : liveIsOver
                          ? `OVER ${barrier}`
                          : liveIsUnder
                            ? `UNDER ${barrier}`
                            : "EXACT"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {all.slice(-46).map((d, i, arr) => {
                      const newest = i === arr.length - 1;
                      return (
                        <span
                          key={`${all.length}-${i}`}
                          className="mono grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold transition-all duration-300"
                          style={{
                            background: newest
                              ? "var(--yellow)"
                              : mode === "EO"
                                ? d % 2 === 0
                                  ? "rgba(41,211,245,.16)"
                                  : "rgba(245,183,49,.16)"
                                : d > barrier
                                  ? "rgba(139,92,246,.18)"
                                  : d < barrier
                                    ? "rgba(236,72,153,.18)"
                                    : "rgba(18,201,160,.18)",
                            color: newest
                              ? "#1a1400"
                              : mode === "EO"
                                ? d % 2 === 0
                                  ? "var(--cyan)"
                                  : "var(--gold)"
                                : d > barrier
                                  ? "#b79bfb"
                                  : d < barrier
                                    ? "#f9a8d4"
                                    : "var(--green)",
                            transform: newest ? "scale(1.18)" : "none",
                            boxShadow: newest ? "0 0 16px var(--yellow)" : "none",
                          }}
                        >
                          {d}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]" style={{ color: "var(--faint)" }}>
                    <span>← oldest</span>
                    <span>newest on the right →</span>
                    <span className="mono">
                      tick #{tickSeq} · {new Date(feed.updated || Date.now()).toLocaleTimeString("en-GB", { hour12: false })}
                    </span>
                    <span className="mono" style={{ color: tickSeq >= MAX_TICKS ? "var(--green)" : "var(--gold)" }}>
                      {tickSeq >= MAX_TICKS
                        ? `full 1000-tick window`
                        : `collecting ${tickSeq}/1000…`}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ======== right column ======== */}
          <div className="space-y-4">
            {/* summary cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "Most appearing", d: hot.d, v: hot.p, c: "var(--green)", gap: hotGap, badge: "HOT" },
                { k: "Least appearing", d: cold.d, v: cold.p, c: "var(--red)", gap: coldGap, badge: "COLD" },
              ].map((x, i) => (
                <div
                  key={x.k}
                  className="relative overflow-hidden rounded-2xl border p-3.5"
                  style={{
                    borderColor: `color-mix(in srgb, ${x.c} 45%, transparent)`,
                    background: `color-mix(in srgb, ${x.c} 8%, rgba(8,16,44,.9))`,
                    animation: `dt-up .6s cubic-bezier(.22,1,.36,1) ${i * 120}ms both`,
                  }}
                >
                  <span className="absolute -right-8 -top-10 h-24 w-24 rounded-full A-glow" style={{ background: `radial-gradient(circle, ${x.c}, transparent 70%)`, opacity: 0.35 }} />
                  <div className="relative flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: x.c }}>
                      {x.k}
                    </span>
                  </div>
                  <div className="relative mt-2 flex items-baseline gap-2">
                    <span className="mono text-[30px] font-extrabold leading-none" style={{ color: x.c }}>
                      {x.d}
                    </span>
                    <span className="mono text-[14px] font-extrabold" style={{ color: x.c }}>
                      <Num value={x.v} suffix="%" />
                    </span>
                  </div>
                  <div className="relative mt-2 flex items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[8.5px] font-black" style={{ background: x.c, color: "#04091f" }}>
                      {x.badge}
                    </span>
                    <span className="mono text-[9.5px]" style={{ color: "var(--faint)" }}>
                      {x.gap >= 0 ? `${x.gap} ticks ago` : "not in sample"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* mode panel */}
            <section className="dt-panel p-4">
              {mode === "EO" ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-extrabold tracking-tight">Even / Odd Data</h3>
                    <span className="rounded-md px-2 py-0.5 text-[9.5px] font-black" style={{ background: "rgba(41,211,245,.14)", color: "var(--cyan)" }}>
                      {evenC >= oddC ? "EVEN LEADS" : "ODD LEADS"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-3.5">
                    {[
                      { k: "Even", c: evenC, col: "var(--cyan)" },
                      { k: "Odd", c: oddC, col: "var(--gold)" },
                    ].map((r, i) => {
                      const p = pct(r.c, n);
                      const lead = (r.k === "Even" ? evenC >= oddC : oddC > evenC);
                      return (
                        <div key={r.k} style={{ animation: `dt-up .5s ease ${i * 90}ms both` }}>
                          <div className="flex items-end justify-between">
                            <span className="flex items-center gap-2 text-[12.5px] font-extrabold" style={{ color: r.col }}>
                              {r.k}
                              {lead && (
                                <span className="rounded px-1.5 py-0.5 text-[8.5px] font-black" style={{ background: "var(--green)", color: "#04091f" }}>
                                  LEADING
                                </span>
                              )}
                            </span>
                            <span className="mono text-[16px] font-extrabold" style={{ color: r.col }}>
                              <Num value={p} suffix="%" />
                              <span className="ml-2 text-[10.5px]" style={{ color: "var(--faint)" }}>
                                {r.c} ticks
                              </span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.07)" }}>
                            <div className="h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${p}%`, background: `linear-gradient(90deg, ${r.col}, color-mix(in srgb, ${r.col} 40%, transparent))`, boxShadow: `0 0 14px ${r.col}` }} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(r.k === "Even" ? [0, 2, 4, 6, 8] : [1, 3, 5, 7, 9]).map((d) => (
                              <span key={d} className="mono rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold" style={{ borderColor: "var(--line)", color: d === hot.d ? "var(--green)" : d === cold.d ? "var(--red)" : "var(--muted)" }}>
                                {d} · {counts[d]}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
                    <span className="text-[10.5px]" style={{ color: "var(--muted)" }}>Current parity streak</span>
                    <span className="mono text-[13px] font-extrabold" style={{ color: streak.even ? "var(--cyan)" : "var(--gold)" }}>
                      {streak.even} × {streak.even ? "EVEN" : "ODD"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-extrabold tracking-tight">Over / Under Data</h3>
                    <span className="mono text-[10.5px]" style={{ color: "var(--faint)" }}>
                      tap your barrier digit
                    </span>
                  </div>

                  <div className="mt-3 flex gap-1.5">
                    {Array.from({ length: 10 }, (_, d) => (
                      <button
                        key={d}
                        onClick={() => setBarrier(d)}
                        className="mono flex-1 rounded-lg py-2 text-[12px] font-extrabold transition-all duration-300 hover:-translate-y-1"
                        style={{
                          background: barrier === d ? "linear-gradient(135deg,#8b5cf6,#4c1d95)" : "rgba(255,255,255,.05)",
                          color: barrier === d ? "#fff" : "var(--muted)",
                          boxShadow: barrier === d ? "0 12px 26px -12px #8b5cf6, 0 0 0 3px rgba(139,92,246,.22)" : "none",
                          transform: barrier === d ? "scale(1.08)" : "none",
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3.5">
                    {[
                      { k: `Over ${barrier}`, c: overC, col: "#8b5cf6", hint: `digits ${barrier + 1}–9` },
                      { k: `Under ${barrier}`, c: underC, col: "#ec4899", hint: `digits 0–${Math.max(0, barrier - 1)}` },
                      { k: `Exact ${barrier}`, c: matchC, col: "var(--green)", hint: "matches / differs" },
                    ]
                      .filter((r) => r.c > 0 || !r.k.startsWith("Under") || barrier > 0)
                      .map((r, i) => {
                        const p = pct(r.c, n);
                        return (
                          <div key={r.k} style={{ animation: `dt-up .5s ease ${i * 90}ms both` }}>
                            <div className="flex items-end justify-between">
                              <span className="text-[12.5px] font-extrabold" style={{ color: r.col }}>
                                {r.k}
                                <span className="ml-2 text-[9.5px] font-semibold" style={{ color: "var(--faint)" }}>
                                  {r.hint}
                                </span>
                              </span>
                              <span className="mono text-[16px] font-extrabold" style={{ color: r.col }}>
                                <Num value={p} suffix="%" />
                                <span className="ml-2 text-[10.5px]" style={{ color: "var(--faint)" }}>
                                  {r.c} ticks
                                </span>
                              </span>
                            </div>
                            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.07)" }}>
                              <div className="h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${p}%`, background: `linear-gradient(90deg, ${r.col}, color-mix(in srgb, ${r.col} 40%, transparent))`, boxShadow: `0 0 14px ${r.col}` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </section>

            {/* AI insights */}
            <section className="dt-panel relative overflow-hidden p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "rgba(139,92,246,.18)", color: "#c4b5fd" }}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3 1.9 5.7L19.6 10.6l-5.7 1.9L12 18.2l-1.9-5.7L4.4 10.6l5.7-1.9L12 3Zm6.4 12.2.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z" />
                  </svg>
                </span>
                <h3 className="text-[14px] font-extrabold tracking-tight">AI Read-out</h3>
                <span className="ml-auto text-[9.5px] font-black" style={{ color: "var(--cyan)" }}>
                  DATA-DRIVEN
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {insights.map((t, i) => (
                  <div
                    key={t}
                    className="flex items-start gap-2.5 rounded-xl border p-2.5"
                    style={{ borderColor: "var(--line)", animation: `dt-up .5s cubic-bezier(.22,1,.36,1) ${200 + i * 110}ms both` }}
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--cyan)", boxShadow: "0 0 8px var(--cyan)" }} />
                    <span className="text-[11.5px] leading-relaxed" style={{ color: "#cfdcff" }}>
                      {t}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ["Sample", `${n}`],
                  ["Hot gap", `${hotGap} t`],
                  ["Cold gap", `${coldGap} t`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border p-2.5" style={{ borderColor: "var(--line)" }}>
                    <div className="text-[9.5px]" style={{ color: "var(--faint)" }}>{k}</div>
                    <div className="mono mt-0.5 text-[13px] font-extrabold" style={{ color: "var(--cyan)" }}>{v}</div>
                  </div>
                ))}
              </div>
            </section>

            {feed.source !== "live" && (
              <div
                className="rounded-xl border p-3.5"
                style={{
                  borderColor: feed.source === "sim" ? "rgba(245,183,49,.4)" : "rgba(41,211,245,.4)",
                  background: feed.source === "sim" ? "rgba(245,183,49,.07)" : "rgba(41,211,245,.07)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full A-blink"
                    style={{ background: feed.source === "sim" ? "var(--gold)" : "var(--cyan)" }}
                  />
                  <span
                    className="text-[11px] font-extrabold uppercase tracking-wider"
                    style={{ color: feed.source === "sim" ? "var(--gold)" : "var(--cyan)" }}
                  >
                    {feed.source === "sim" ? "Deriv feed offline" : "Connecting to Deriv"}
                  </span>
                  <span className="mono ml-auto text-[9.5px]" style={{ color: "var(--faint)" }}>
                    attempt {feed.attempts}
                  </span>
                </div>

                <p className="mt-2 text-[10.5px] leading-relaxed" style={{ color: "#cfdcff" }}>
                  {feed.detail}
                </p>
                <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: "var(--faint)" }}>
                  Tried: {feed.endpoint} · fallbacks: derivws → binaryws → api.derivws.
                  {feed.source === "sim" &&
                    " Percentages below use a simulated stream with the real pip scale so the tool stays usable, but they are NOT market digits."}
                </p>

                <button
                  onClick={feed.retry}
                  className="group mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-extrabold text-[#001a17] transition-transform hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(90deg,#29d3f5,#12c9a0)" }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
                  </svg>
                  {feed.source === "sim" ? "Retry live connection" : "Reconnecting… tap to force retry"}
                </button>
              </div>
            )}

            <p className="text-[10px] leading-relaxed" style={{ color: "var(--faint)" }}>
              Digits are derived from each closed tick using the instrument's pip size ({market.pip} decimals).
              Percentages cover the selected sample of the most recent {n} ticks. Tap outside this
              panel to hide the analysis — tap the AI button again to reopen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
