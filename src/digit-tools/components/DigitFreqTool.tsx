import { useMemo, useState } from "react";
import { MARKETS, GROUPS, byId, useDerivFeed } from "../lib/deriv";
import { freqStats } from "../lib/signals";

function Spark({ per, c }: { per: number[]; c: string }) {
  const max = Math.max(...per, 12);
  const min = Math.min(...per, 4);
  const pts = per.map((v, i) => `${(i / Math.max(1, per.length - 1)) * 100},${18 - ((v - min) / (max - min || 1)) * 16}`).join(" ");
  return (
    <svg viewBox="0 0 100 20" className="h-5 w-[64px]" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function DigitFreqTool() {
  const [symbol, setSymbol] = useState("R_100");
  const [sample, setSample] = useState<number | "all">(500);
  const [blocks, setBlocks] = useState(8);

  const market = useMemo(() => byId(symbol), [symbol]);
  const feed = useDerivFeed(market);
  const f = useMemo(() => freqStats(feed.digits, sample, blocks), [feed.digits, sample, blocks]);

  const maxC = Math.max(...f.counts, 1);
  const droughtRank = [...f.per].sort((a, b) => f.droughts[b.d] - f.droughts[a.d]);
  const runRank = [...f.per].sort((a, b) => f.longestRun[b.d] - f.longestRun[a.d]);
  const maxRun = Math.max(...f.longestRun, 1);

  const readout: { t: string; c: string }[] = [
    {
      t: `χ² = ${f.chi.toFixed(1)} (df 9, 5% critical 16.9) → distribution is ${
        f.chiVerdict === "uniform" ? "consistent with uniform" : f.chiVerdict === "mild" ? "mildly skewed" : "significantly skewed"
      }.`,
      c: f.chiVerdict === "uniform" ? "var(--green)" : f.chiVerdict === "mild" ? "var(--gold)" : "var(--red)",
    },
    {
      t: `Digit ${f.hot.d} is hottest at ${f.hot.p.toFixed(1)}% (z = ${f.hot.z >= 0 ? "+" : ""}${f.hot.z.toFixed(2)}, ${f.hot.delta >= 0 ? "+" : ""}${f.hot.delta.toFixed(1)}pp).`,
      c: "var(--green)",
    },
    {
      t: `Digit ${f.cold.d} is coldest at ${f.cold.p.toFixed(1)}% (z = ${f.cold.z.toFixed(2)}, ${f.cold.delta.toFixed(1)}pp).`,
      c: "var(--red)",
    },
    {
      t: `Repeats are running at ${f.repeatRate.toFixed(1)}% versus a 10.0% coin baseline — ${
        f.repeatRate > 12 ? "digits are clustering" : f.repeatRate < 8 ? "digits are spreading" : "close to random"
      }.`,
      c: "var(--cyan)",
    },
    f.nextBias
      ? {
          t: `Transition bias: after digit ${f.nextBias.from}, digit ${f.nextBias.to} followed ${f.nextBias.p.toFixed(1)}% of the time (${f.nextBias.rowTotal} samples).`,
          c: "var(--purple)",
        }
      : { t: "Not enough transitions yet to establish a follow-on bias.", c: "var(--faint)" },
  ];

  return (
    <div className="space-y-4">
      {/* controls */}
      <div className="dt-panel A-up flex flex-wrap items-center gap-3 p-4">
        <div>
          <label className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Market
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="mono mt-1 block rounded-xl border px-2.5 py-2 text-[12px] font-bold outline-none"
            style={{ borderColor: "var(--line-2)", background: "rgba(10,19,56,.9)", color: "#fff" }}
          >
            {GROUPS.map((g) => (
              <optgroup key={g.key} label={g.title}>
                {MARKETS.filter((m) => m.group === g.key).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Heatmap blocks
          </label>
          <div className="mt-1 flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,.05)" }}>
            {[4, 6, 8, 10].map((b) => (
              <button
                key={b}
                onClick={() => setBlocks(b)}
                className="mono rounded-lg px-2.5 py-1.5 text-[10.5px] font-extrabold transition-all duration-300"
                style={{
                  background: blocks === b ? "linear-gradient(135deg,var(--cyan),#134b96)" : "transparent",
                  color: blocks === b ? "#04091f" : "var(--muted)",
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Sample
          </span>
          {[100, 250, 500, 1000, "all"].map((v) => (
            <button
              key={String(v)}
              onClick={() => setSample(v as number | "all")}
              className="rounded-lg border px-2 py-1.5 text-[10.5px] font-extrabold transition-transform hover:-translate-y-0.5"
              style={{
                borderColor: sample === v ? "var(--cyan)" : "var(--line)",
                color: sample === v ? "var(--cyan)" : "var(--muted)",
                background: sample === v ? "rgba(41,211,245,.12)" : "transparent",
              }}
            >
              {v === "all" ? "All" : v}
            </button>
          ))}
        </div>
      </div>

      {/* feed */}
      <div className="dt-panel flex flex-wrap items-center gap-3 px-4 py-2.5 text-[10.5px]">
        <span className="flex items-center gap-1.5 font-extrabold" style={{ color: feed.source === "live" ? "var(--green)" : "var(--gold)" }}>
          <span className="A-blink h-2 w-2 rounded-full" style={{ background: feed.source === "live" ? "var(--green)" : "var(--gold)" }} />
          {feed.source === "live" ? "LIVE" : feed.source === "sim" ? "SIMULATED" : "CONNECTING"}
        </span>
        <span className="mono" style={{ color: "var(--faint)" }}>
          {market.id} · frequency + streaks · {feed.ticks} ticks · n = {f.n} · blocks {f.blocks.length} × {f.blocks[0]?.n ?? 0} ticks
        </span>
        {feed.source !== "live" && (
          <button onClick={feed.retry} className="ml-auto rounded-lg border px-2.5 py-1 font-extrabold" style={{ borderColor: "var(--gold)", color: "var(--gold)" }}>
            ↔ Retry live
          </button>
        )}
      </div>

      {/* read-out */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {readout.map((r, i) => (
          <div
            key={r.t}
            className="dt-panel flex items-start gap-2.5 p-3.5"
            style={{ borderColor: `color-mix(in srgb, ${r.c} 32%, transparent)`, animation: `dt-up .55s cubic-bezier(.22,1,.36,1) ${i * 80}ms both` }}
          >
            <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r.c, boxShadow: `0 0 8px ${r.c}` }} />
            <span className="text-[11.5px] leading-relaxed" style={{ color: "#cfdcff" }}>
              {r.t}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        {/* ===== frequency leaderboard ===== */}
        <section className="dt-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[14px] font-extrabold tracking-tight">Digit frequency leaderboard</h3>
            <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
              sorted by count · baseline 10.0%
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {f.ranked.map((r, i) => {
              const col = i === 0 ? "var(--green)" : i === f.ranked.length - 1 ? "var(--red)" : "var(--cyan)";
              const up = f.trend[r.d] >= 0;
              return (
                <div
                  key={r.d}
                  className="rounded-xl border p-2.5"
                  style={{
                    borderColor: i === 0 ? "rgba(18,201,160,.4)" : i === f.ranked.length - 1 ? "rgba(239,59,74,.4)" : "var(--line)",
                    background: i === 0 ? "rgba(18,201,160,.06)" : i === f.ranked.length - 1 ? "rgba(239,59,74,.06)" : "transparent",
                    animation: `dt-up .5s cubic-bezier(.22,1,.36,1) ${i * 55}ms both`,
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="mono text-[10px] font-black" style={{ color: "var(--faint)" }}>
                      #{i + 1}
                    </span>
                    <span
                      className="mono grid h-8 w-8 place-items-center rounded-lg text-[13px] font-extrabold"
                      style={{ background: `color-mix(in srgb, ${col} 18%, transparent)`, color: col }}
                    >
                      {r.d}
                    </span>
                    <div className="min-w-[90px]">
                      <div className="text-[12.5px] font-extrabold" style={{ color: col }}>
                        {r.p.toFixed(2)}%
                      </div>
                      <div className="mono text-[9.5px]" style={{ color: "var(--faint)" }}>
                        {r.c} ticks
                      </div>
                    </div>
                    <div className="min-w-[120px] flex-1">
                      <div className="relative h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.07)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(r.p / maxC) * 100 * 2.4}%`, background: `linear-gradient(90deg, ${col}, color-mix(in srgb, ${col} 35%, transparent))`, boxShadow: `0 0 12px ${col}` }}
                        />
                      </div>
                      <div className="mono mt-1 flex gap-2 text-[9px]" style={{ color: "var(--faint)" }}>
                        <span style={{ color: r.delta >= 0 ? "var(--green)" : "var(--red)" }}>
                          {r.delta >= 0 ? "+" : ""}
                          {r.delta.toFixed(1)}pp
                        </span>
                        <span>z {r.z >= 0 ? "+" : ""}{r.z.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <Spark per={f.blocks.map((b) => b.per[r.d])} c={col} />
                      <div className="mono text-[9px]" style={{ color: up ? "var(--green)" : "var(--red)" }}>
                        {up ? "▲" : "▼"} {f.trend[r.d].toFixed(1)}pp trend
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          {/* ===== uniformity ===== */}
          <section className="dt-panel p-4">
            <h3 className="text-[14px] font-extrabold tracking-tight">Distribution health</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([
                ["Chi-square χ²", f.chi.toFixed(2), f.chiVerdict === "uniform" ? "var(--green)" : f.chiVerdict === "mild" ? "var(--gold)" : "var(--red)"],
                ["Verdict", f.chiVerdict === "uniform" ? "uniform" : f.chiVerdict === "mild" ? "mild skew" : "skewed", f.chiVerdict === "uniform" ? "var(--green)" : f.chiVerdict === "mild" ? "var(--gold)" : "var(--red)"],
                ["Repeat rate (AA)", `${f.repeatRate.toFixed(1)}%`, f.repeatRate > 12 || f.repeatRate < 8 ? "var(--gold)" : "var(--green)"],
                ["Spread hot→cold", `${(f.hot.p - f.cold.p).toFixed(1)}pp`, "var(--muted)"],
              ] as const).map(([k, v, c], i) => (
                <div key={k} className="rounded-xl border p-2.5" style={{ borderColor: "var(--line)", animation: `dt-up .45s ease ${i * 60}ms both` }}>
                  <div className="text-[9px]" style={{ color: "var(--faint)" }}>
                    {k}
                  </div>
                  <div className="mono mt-0.5 text-[14px] font-extrabold" style={{ color: c }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed" style={{ color: "var(--faint)" }}>
              χ² compares observed digit counts against the uniform expectation (n/10). Below 16.92 the sample is
              statistically indistinguishable from random; above 21.67 a digit is genuinely deviating.
            </p>
          </section>

          {/* ===== next-digit bias ===== */}
          <section className="dt-panel p-4">
            <h3 className="text-[14px] font-extrabold tracking-tight">Transition bias</h3>
            {f.nextBias ? (
              <>
                <div className="mt-3 flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
                  <span className="mono grid h-10 w-10 place-items-center rounded-xl text-[16px] font-black" style={{ background: "rgba(43,179,255,.16)", color: "var(--cyan)" }}>
                    {f.nextBias.from}
                  </span>
                  <span className="text-[15px] font-black" style={{ color: "var(--faint)" }}>
                    →
                  </span>
                  <span className="mono grid h-10 w-10 place-items-center rounded-xl text-[16px] font-black" style={{ background: "rgba(139,92,246,.18)", color: "#b79bfb" }}>
                    {f.nextBias.to}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mono text-[13px] font-extrabold" style={{ color: "#dbe7ff" }}>
                      {f.nextBias.p.toFixed(1)}% follow-on rate
                    </div>
                    <div className="mono text-[9.5px]" style={{ color: "var(--faint)" }}>
                      from {f.nextBias.rowTotal} samples after digit {f.nextBias.from}
                    </div>
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <div className="grid min-w-[330px] gap-1" style={{ gridTemplateColumns: "26px repeat(10, 1fr)" }}>
                    <span />
                    {Array.from({ length: 10 }, (_, d) => (
                      <span key={`h${d}`} className="mono text-center text-[9px] font-black" style={{ color: "var(--faint)" }}>
                        {d}
                      </span>
                    ))}
                    {f.transitionPct.map((row, i) => {
                      const best = row.reduce((m, v, idx) => (v > row[m] ? idx : m), 0);
                      return [
                        <span key={`r${i}`} className="mono grid h-7 place-items-center rounded text-[10px] font-black" style={{ background: "rgba(255,255,255,.06)", color: "#cfdcff" }}>
                          {i}
                        </span>,
                        ...row.map((v, j) => (
                          <span
                            key={`c${i}-${j}`}
                            title={`${i} → ${j}: ${v.toFixed(1)}% of ${f.transitions[i].reduce((a, b) => a + b, 0)} samples`}
                            className="mono grid h-7 place-items-center rounded text-[8.5px] font-bold transition-all duration-300 hover:scale-110"
                            style={{
                              background: `color-mix(in srgb, ${j === best ? "#ffb020" : "#2f6bff"} ${Math.min(70, 8 + v * 2.2)}%, transparent)`,
                              color: v > 16 ? "#fff" : "var(--muted)",
                              outline: j === best ? "1px solid rgba(255,176,32,.6)" : "none",
                            }}
                          >
                            {v.toFixed(0)}
                          </span>
                        )),
                      ];
                    })}
                  </div>
                </div>
                <p className="mt-2 text-[10px]" style={{ color: "var(--faint)" }}>
                  Row = previous digit, column = next digit, values are row percentages. Gold ring marks each row's strongest follow-on.
                </p>
              </>
            ) : (
              <p className="mt-3 text-[11px]" style={{ color: "var(--faint)" }}>
                Waiting for enough ticks to build the transition matrix.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* ===== heatmap ===== */}
      <section className="dt-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-extrabold tracking-tight">Frequency heatmap over time</h3>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--faint)" }}>
            <span>cold</span>
            <span className="h-2.5 w-24 rounded-full" style={{ background: "linear-gradient(90deg, rgba(239,59,74,.55), rgba(139,152,189,.25), rgba(41,211,245,.35), rgba(18,201,160,.75))" }} />
            <span>hot</span>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid gap-1" style={{ gridTemplateColumns: `34px repeat(${f.blocks.length}, 1fr) 74px` }}>
              <span />
              {f.blocks.map((b) => (
                <span key={b.i} className="mono text-center text-[9px]" style={{ color: "var(--faint)" }}>
                  t{b.i * b.n + 1}–{(b.i + 1) * b.n}
                </span>
              ))}
              <span className="text-right text-[9px]" style={{ color: "var(--faint)" }}>
                trend
              </span>

              {f.per.map((row) => {
                const d = row.d;
                const vals = f.blocks.map((b) => b.per[d]);
                const mx = Math.max(...vals);
                return [
                  <span key={`l${d}`} className="mono grid h-7 place-items-center rounded text-[11px] font-black" style={{ background: "rgba(255,255,255,.06)", color: "#cfdcff" }}>
                    {d}
                  </span>,
                  ...vals.map((v, k) => {
                    const delta = v - 10;
                    const col = delta >= 6 ? "#12c9a0" : delta >= 0 ? "#29d3f5" : delta >= -4 ? "#8b9cbd" : "#ef3b4a";
                    const a = Math.min(0.72, 0.08 + Math.abs(delta) / 15);
                    const isPeak = v === mx && mx > 10;
                    return (
                      <span
                        key={`h${d}-${k}`}
                        title={`digit ${d} · block ${k + 1}: ${v.toFixed(1)}% (${f.blocks[k].counts[d]} ticks)`}
                        className="mono grid h-7 place-items-center rounded text-[9.5px] font-bold transition-all duration-300 hover:scale-110"
                        style={{
                          background: `color-mix(in srgb, ${col} ${Math.round(a * 100)}%, transparent)`,
                          color: Math.abs(delta) > 3 ? "#fff" : "var(--muted)",
                          outline: isPeak ? `1px solid ${col}` : "none",
                        }}
                      >
                        {v.toFixed(0)}
                      </span>
                    );
                  }),
                  <span key={`t${d}`} className="mono grid h-7 place-items-center text-[10px] font-extrabold" style={{ color: f.trend[d] >= 1 ? "var(--green)" : f.trend[d] <= -1 ? "var(--red)" : "var(--faint)" }}>
                    {f.trend[d] >= 0 ? "▲" : "▼"} {f.trend[d].toFixed(1)}
                  </span>,
                ];
              })}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px]" style={{ color: "var(--faint)" }}>
          Each cell shows a digit's share inside that block (uniform expectation is 10%). Ringed cells are block peaks; trend is the pp change from the first to the last block.
        </p>
      </section>

      {/* ===== streaks ===== */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="dt-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[14px] font-extrabold tracking-tight">Streak & repeat analysis</h3>
            <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
              longest {Math.max(...f.longestRun)} in a row
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {runRank.map((r, i) => {
              const col = i === 0 ? "var(--green)" : f.longestRun[r.d] === 1 ? "var(--red)" : "var(--cyan)";
              return (
                <div
                  key={r.d}
                  className="rounded-xl border p-2.5"
                  style={{ borderColor: "var(--line)", animation: `dt-up .45s ease ${i * 45}ms both` }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="mono grid h-7 w-7 place-items-center rounded-lg text-[12px] font-extrabold" style={{ background: `color-mix(in srgb, ${col} 16%, transparent)`, color: col }}>
                      {r.d}
                    </span>
                    <div className="w-[76px]">
                      <div className="mono text-[12px] font-extrabold" style={{ color: col }}>
                        {f.longestRun[r.d]} max
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(f.longestRun[r.d], 10) }, (_, k) => (
                          <span key={k} className="h-2.5 flex-1 rounded-sm" style={{ background: col, opacity: 0.9 - k * 0.06 }} />
                        ))}
                        <span className="flex-1" />
                      </div>
                      <div className="mono mt-1 flex flex-wrap gap-2.5 text-[9px]" style={{ color: "var(--faint)" }}>
                        <span>
                          AA pairs: <span style={{ color: "#dbe7ff" }}>{f.repeatPairs[r.d]}</span>
                        </span>
                        <span>
                          AAA triples: <span style={{ color: f.triples[r.d] ? "var(--gold)" : "var(--faint)" }}>{f.triples[r.d]}</span>
                        </span>
                        <span>
                          longest drought: <span style={{ color: f.maxGap[r.d] >= 25 ? "var(--gold)" : "#dbe7ff" }}>{f.maxGap[r.d]}</span>
                        </span>
                      </div>
                    </div>
                    <span className="mono w-[54px] text-right text-[10px]" style={{ color: "var(--faint)" }}>
                      {(f.longestRun[r.d] / maxRun).toFixed(0)}/10
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          <section className="dt-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[14px] font-extrabold tracking-tight">Drought board</h3>
              <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
                ticks since each digit last printed
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {droughtRank.map((r, i) => {
                const g = f.droughts[r.d];
                const col = g >= 25 ? "var(--red)" : g >= 12 ? "var(--gold)" : "var(--cyan)";
                return (
                  <div key={r.d} className="flex items-center gap-2.5" style={{ animation: `dt-up .45s ease ${i * 45}ms both` }}>
                    <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-extrabold" style={{ background: `color-mix(in srgb, ${col} 16%, transparent)`, color: col }}>
                      {r.d}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.07)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (g / Math.max(1, Math.max(...f.droughts))) * 100)}%`, background: `linear-gradient(90deg, ${col}, color-mix(in srgb, ${col} 35%, transparent))`, boxShadow: `0 0 10px ${col}` }}
                        />
                      </div>
                    </div>
                    <span className="mono w-[52px] text-right text-[11px] font-extrabold" style={{ color: col }}>
                      {g < 0 ? "n/a" : `${g} t`}
                    </span>
                    {g >= 12 && (
                      <span className="rounded px-1 py-0.5 text-[8px] font-black" style={{ background: "rgba(245,183,49,.18)", color: "var(--gold)" }}>
                        OVERDUE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="dt-panel p-4">
            <h3 className="text-[14px] font-extrabold tracking-tight">Longest runs in the session</h3>
            <div className="mt-3 space-y-2">
              {f.topRuns.slice(0, 6).map((r, i) => (
                <div
                  key={`${r.d}-${r.at}`}
                  className="flex items-center gap-2.5 rounded-xl border p-2.5"
                  style={{ borderColor: "var(--line)", animation: `dt-up .45s ease ${i * 60}ms both` }}
                >
                  <span className="mono grid h-7 w-7 place-items-center rounded-lg text-[12px] font-extrabold" style={{ background: "rgba(18,201,160,.16)", color: "var(--green)" }}>
                    {r.d}
                  </span>
                  <span className="text-[12px] font-extrabold">
                    ran <span style={{ color: "var(--green)" }}>×{r.len}</span> in a row
                  </span>
                  <div className="ml-auto flex gap-1">
                    {Array.from({ length: r.len }, (_, k) => (
                      <span key={k} className="h-3 w-3 rounded-sm" style={{ background: "var(--green)", opacity: 0.95 - k * 0.14 }} />
                    ))}
                  </div>
                  <span className="mono text-[9.5px]" style={{ color: "var(--faint)" }}>
                    @tick {r.at + 1}
                  </span>
                </div>
              ))}
              {!f.topRuns.length && (
                <p className="text-[11px]" style={{ color: "var(--faint)" }}>
                  No repeats yet in this window — every digit has been isolated so far.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
