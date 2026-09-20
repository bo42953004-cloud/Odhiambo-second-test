import { useEffect, useMemo, useRef, useState } from "react";
import { MARKETS, GROUPS, byId, useDerivFeed } from "../lib/deriv";
import { backtest, buildSignal, ouStats, type Backtest, type Condition } from "../lib/signals";
import { ComingSoonView } from "./ComingSoon";
import { EvenOddTool } from "./EvenOddTool";
import { DigitFreqTool } from "./DigitFreqTool";
import { AnalysisTool } from "./AnalysisTool";
import type { MultiFeedState } from "../lib/multifeed";

/* ---------------- shared bits ---------------- */
type SubTab = { id: string; label: string; ready: boolean };

const SUBTABS: SubTab[] = [
  { id: "ou", label: "Over / Under Analysis", ready: true },
  { id: "eo", label: "Even / Odd Analysis", ready: true },
  { id: "freq", label: "Digit Frequency & Streaks", ready: true },
  { id: "scan", label: "Analysis Tool", ready: true },
  { id: "md", label: "Matches / Differs", ready: false },
  { id: "gap", label: "Digit Gap Radar", ready: false },
  { id: "vol", label: "Volatility Scanner", ready: false },
];

function Gauge({ value, c }: { value: number; c: string }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative h-[128px] w-[128px] shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="11" />
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke={c}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (value / 100) * C}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.22,1,.36,1), stroke .4s" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="mono text-[27px] font-black leading-none" style={{ color: c }}>{value}</div>
          <div className="text-[8.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            confidence
          </div>
        </div>
      </div>
      <span className="A-spin absolute inset-0 rounded-full border border-dashed" style={{ borderColor: `color-mix(in srgb, ${c} 30%, transparent)`, animationDuration: "22s" }} />
    </div>
  );
}

function CondRow({ c, i }: { c: Condition; i: number }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border p-2.5"
      style={{
        borderColor: c.ok ? "rgba(18,201,160,.32)" : "var(--line)",
        background: c.ok ? "rgba(18,201,160,.06)" : "transparent",
        animation: `dt-up .45s cubic-bezier(.22,1,.36,1) ${i * 55}ms both`,
      }}
    >
      <span
        className="mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-black"
        style={{ background: c.ok ? "var(--green)" : "rgba(255,255,255,.07)", color: c.ok ? "#04091f" : "var(--faint)" }}
      >
        {c.ok ? "✓" : "—"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] font-extrabold">{c.label}</span>
          {c.required && (
            <span className="rounded px-1 py-0.5 text-[8px] font-black" style={{ background: "rgba(245,183,49,.18)", color: "var(--gold)" }}>
              REQUIRED
            </span>
          )}
          <span className="mono ml-auto text-[9px]" style={{ color: "var(--faint)" }}>
            w{c.weight}
          </span>
        </div>
        <div className="mono mt-0.5 text-[10px] leading-relaxed" style={{ color: "var(--muted)" }}>
          {c.detail}
        </div>
      </div>
    </div>
  );
}

function Bar({ p, base, c, label, count }: { p: number; base: number; c: string; label: string; count: number }) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <span className="text-[11.5px] font-extrabold uppercase tracking-wide" style={{ color: c }}>
          {label}
        </span>
        <span className="mono text-[14px] font-extrabold" style={{ color: c }}>
          {p.toFixed(1)}%
          <span className="ml-1.5 text-[10px]" style={{ color: "var(--faint)" }}>
            {count} ticks
          </span>
        </span>
      </div>
      <div className="relative mt-1.5 h-3 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.07)" }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${p}%`, background: `linear-gradient(90deg, ${c}, color-mix(in srgb, ${c} 40%, transparent))`, boxShadow: `0 0 12px ${c}` }}
        />
        <span className="absolute top-0 h-full w-[2px] bg-white/60" style={{ left: `${base}%` }} />
      </div>
      <div className="mono mt-1 text-[9.5px]" style={{ color: "var(--faint)" }}>
        baseline {base.toFixed(1)}% · edge {(p - base >= 0 ? "+" : "") + (p - base).toFixed(1)}pp
      </div>
    </div>
  );
}

function MiniCurve({ eq, c }: { eq: number[]; c: string }) {
  if (eq.length < 2) return <div className="h-9" />;
  const max = Math.max(...eq, 1);
  const min = Math.min(...eq, -1);
  const pts = eq.map((v, i) => `${(i / (eq.length - 1)) * 100},${34 - ((v - min) / (max - min || 1)) * 30}`).join(" ");
  return (
    <svg viewBox="0 0 100 36" className="h-9 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- Over/Under analyst ---------------- */
function OverUnderTool() {
  const [symbol, setSymbol] = useState("R_100");
  const [barrier, setBarrier] = useState(5);
  const [sample, setSample] = useState<number | "all">(500);
  const [mode, setMode] = useState<"auto" | "fade" | "follow">("auto");
  const [hold, setHold] = useState(1);
  const [stake, setStake] = useState(5);

  const market = useMemo(() => byId(symbol), [symbol]);
  const feed = useDerivFeed(market);

  const s = useMemo(() => ouStats(feed.digits, barrier, sample), [feed.digits, barrier, sample]);
  const sig = useMemo(() => buildSignal(s, { mode, hold, stake }), [s, mode, hold, stake]);

  /* ---- signal history: fires when armed, settles after `hold` ticks ---- */
  type Rec = { id: number; side: "OVER" | "UNDER"; conf: number; entry: number; remaining: number; result: boolean | null };
  const [recs, setRecs] = useState<Rec[]>([]);
  const idRef = useRef(0);
  const lastArmed = useRef(false);
  const lastTick = useRef(feed.updated);

  useEffect(() => {
    if (!sig.armed) {
      lastArmed.current = false;
      return;
    }
    if (!lastArmed.current) {
      lastArmed.current = true;
      setRecs((r) =>
        [
          {
            id: idRef.current++,
            side: sig.side,
            conf: sig.confidence,
            entry: feed.digits.length,
            remaining: hold,
            result: null,
          },
          ...r,
        ].slice(0, 12),
      );
    }
  }, [sig.armed, sig.side, sig.confidence, feed.digits.length, hold]);

  useEffect(() => {
    if (feed.updated === lastTick.current) return;
    lastTick.current = feed.updated;
    const newest = feed.digits[feed.digits.length - 1];
    if (newest == null) return;
    const lab = newest > barrier ? "over" : newest < barrier ? "under" : "exact";
    setRecs((r) =>
      r.map((x) => {
        if (x.result !== null) return x;
        const rem = x.remaining - 1;
        if (rem > 0) return { ...x, remaining: rem };
        const want = x.side === "OVER" ? "over" : "under";
        return { ...x, remaining: 0, result: lab === want };
      }),
    );
  }, [feed.updated, feed.digits, barrier]);

  const settled = recs.filter((r) => r.result !== null);
  const wins = settled.filter((r) => r.result).length;
  const winRate = settled.length ? (wins / settled.length) * 100 : 0;

  let curWin = 0;
  for (const r of recs) {
    if (r.result === true) curWin++;
    else break;
  }
  let curLose = 0;
  for (const r of recs) {
    if (r.result === false) curLose++;
    else break;
  }

  const tone = sig.armed ? (sig.side === "OVER" ? "var(--cyan)" : "var(--purple)") : "var(--faint)";

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
            Barrier digit
          </label>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: 10 }, (_, d) => (
              <button
                key={d}
                onClick={() => setBarrier(d)}
                className="mono h-8 w-7 rounded-lg text-[11.5px] font-extrabold transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: barrier === d ? "linear-gradient(135deg,#8b5cf6,#4c1d95)" : "rgba(255,255,255,.05)",
                  color: barrier === d ? "#fff" : "var(--muted)",
                  boxShadow: barrier === d ? "0 10px 22px -12px #8b5cf6, 0 0 0 2px rgba(139,92,246,.25)" : "none",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Signal mode
          </label>
          <div className="mt-1 flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,.05)" }}>
            {([["auto", "Auto"], ["fade", "Fade streak"], ["follow", "Follow streak"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className="rounded-lg px-2.5 py-1.5 text-[10.5px] font-extrabold transition-all duration-300"
                style={{
                  background: mode === k ? "linear-gradient(135deg,var(--cyan),#134b96)" : "transparent",
                  color: mode === k ? "#04091f" : "var(--muted)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Duration
          </label>
          <div className="mt-1 flex items-center rounded-xl border" style={{ borderColor: "var(--line-2)" }}>
            <button onClick={() => setHold((h) => Math.max(1, h - 1))} className="px-2.5 py-1.5 text-[14px] font-bold">
              −
            </button>
            <span className="mono w-9 text-center text-[12px] font-extrabold">{hold}t</span>
            <button onClick={() => setHold((h) => Math.min(10, h + 1))} className="px-2.5 py-1.5 text-[14px] font-bold">
              +
            </button>
          </div>
        </div>

        <div>
          <label className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Stake
          </label>
          <div className="mt-1 flex items-center rounded-xl border" style={{ borderColor: "var(--line-2)" }}>
            <button onClick={() => setStake((v) => Math.max(1, v - 1))} className="px-2.5 py-1.5 text-[14px] font-bold">
              −
            </button>
            <span className="mono w-12 text-center text-[12px] font-extrabold">${stake}</span>
            <button onClick={() => setStake((v) => v + 1)} className="px-2.5 py-1.5 text-[14px] font-bold">
              +
            </button>
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

      {/* feed status */}
      <div className="dt-panel flex flex-wrap items-center gap-3 px-4 py-2.5 text-[10.5px]">
        <span className="flex items-center gap-1.5 font-extrabold" style={{ color: feed.source === "live" ? "var(--green)" : "var(--gold)" }}>
          <span className="A-blink h-2 w-2 rounded-full" style={{ background: feed.source === "live" ? "var(--green)" : "var(--gold)" }} />
          {feed.source === "live" ? "LIVE" : feed.source === "sim" ? "SIMULATED" : "CONNECTING"}
        </span>
        <span className="mono" style={{ color: "var(--faint)" }}>
          {market.id} · pip {market.pip}dp · {feed.ticks} ticks · n = {s.n}
        </span>
        {feed.source !== "live" && (
          <button onClick={feed.retry} className="ml-auto rounded-lg border px-2.5 py-1 font-extrabold" style={{ borderColor: "var(--gold)", color: "var(--gold)" }}>
            ↔ Retry live
          </button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
        {/* ============ SIGNAL CARD ============ */}
        <section
          className="dt-panel relative overflow-hidden p-4 sm:p-5"
          style={{ borderColor: sig.armed ? `color-mix(in srgb, ${tone} 55%, transparent)` : "var(--line)" }}
        >
          <span className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-25" style={{ background: `linear-gradient(180deg, ${tone}, transparent)` }} />
          <div className="relative flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-extrabold tracking-tight">Live Signal</h3>
            <span
              className="rounded-md px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider"
              style={
                sig.armed
                  ? { background: `color-mix(in srgb, ${tone} 20%, transparent)`, color: tone }
                  : { background: "rgba(255,255,255,.07)", color: "var(--muted)" }
              }
            >
              {sig.armed ? `● ${sig.quality} · armed` : "○ no trade — conditions unmet"}
            </span>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-5">
            <Gauge value={sig.confidence} c={tone} />
            <div className="min-w-[190px] flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
                Prediction
              </div>
              <div key={sig.side} className="A-pop mt-0.5 text-[32px] font-black leading-none" style={{ color: sig.armed ? tone : "var(--muted)" }}>
                {sig.armed ? `BUY ${sig.side} ${barrier}` : "NO SIGNAL"}
              </div>
              <div className="mono mt-2 space-y-1 text-[10.5px]" style={{ color: "var(--muted)" }}>
                <div>
                  <span style={{ color: "var(--faint)" }}>Entry </span>
                  {sig.entry}
                </div>
                <div>
                  <span style={{ color: "var(--faint)" }}>Duration </span>
                  {sig.duration} tick{sig.duration > 1 ? "s" : ""} ·{" "}
                  <span style={{ color: "var(--faint)" }}>Stake </span>${sig.stake.toFixed(2)} ·{" "}
                  <span style={{ color: "var(--faint)" }}>Payout </span>
                  <span style={{ color: "var(--green)" }}>${(sig.stake * 1.94).toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ color: "var(--faint)" }}>Conditions </span>
                  {sig.met}/{sig.total} met
                </div>
              </div>
            </div>
          </div>

          {/* notes */}
          <div className="relative mt-4 space-y-1.5">
            {sig.notes.map((n, i) => (
              <div
                key={n}
                className="flex items-start gap-2 rounded-xl border p-2.5"
                style={{ borderColor: "var(--line)", animation: `dt-up .5s ease ${i * 90}ms both` }}
              >
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tone, boxShadow: `0 0 8px ${tone}` }} />
                <span className="text-[11px] leading-relaxed" style={{ color: "#cfdcff" }}>
                  {n}
                </span>
              </div>
            ))}
          </div>

          <div className="relative mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
              Condition engine
            </div>
            <div className="mt-2 space-y-2">
              {sig.conditions.map((c, i) => (
                <CondRow key={c.id} c={c} i={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ============ RIGHT COLUMN ============ */}
        <div className="space-y-4">
          {/* distribution */}
          <section className="dt-panel p-4">
            <h3 className="text-[14px] font-extrabold tracking-tight">
              Distribution vs digit {barrier}
            </h3>
            <div className="mt-3.5 space-y-4">
              <Bar p={s.over.p} base={s.overBase} c="var(--cyan)" label="Over" count={s.over.c} />
              <Bar p={s.under.p} base={s.underBase} c="var(--purple)" label="Under" count={s.under.c} />
              <div className="flex items-center justify-between rounded-xl border px-3 py-2.5" style={{ borderColor: s.exact.p > 11 ? "rgba(239,59,74,.4)" : "var(--line)", background: s.exact.p > 11 ? "rgba(239,59,74,.07)" : "transparent" }}>
                <span className="text-[11.5px] font-extrabold" style={{ color: s.exact.p > 11 ? "var(--red)" : "var(--muted)" }}>
                  Exact {barrier} (loses both sides)
                </span>
                <span className="mono text-[12px] font-extrabold" style={{ color: s.exact.p > 11 ? "var(--red)" : "var(--muted)" }}>
                  {s.exact.p.toFixed(1)}% · {s.exact.c} · max repeat {s.exactRunMax}
                </span>
              </div>
            </div>
          </section>

          {/* streaks */}
          <section className="dt-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[14px] font-extrabold tracking-tight">Streak analysis</h3>
              <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
                longest exact run {s.exactRunMax}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
              <div className="text-center">
                <div className="mono text-[26px] font-black leading-none" style={{ color: "var(--cyan)" }}>
                  {s.currentRun && s.currentRun.type !== "exact" ? s.currentRun.len : 0}
                </div>
                <div className="text-[9px]" style={{ color: "var(--faint)" }}>
                  current run
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-extrabold">
                  {s.currentRun ? `${s.currentRun.type.toUpperCase()} × ${s.currentRun.len}` : "—"}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Array.from({ length: Math.min(s.currentRun?.len ?? 0, 14) }, (_, i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{
                        background: `linear-gradient(180deg, ${tone}, color-mix(in srgb, ${tone} 35%, transparent))`,
                        animation: `dt-up .3s ease ${i * 40}ms both`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
                Recent runs (newest first)
              </div>
              {s.recentRuns.map((r, i) => (
                <div
                  key={`${r.start}-${r.len}`}
                  className="flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5"
                  style={{ borderColor: "var(--line)", animation: `dt-up .4s ease ${i * 45}ms both` }}
                >
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase"
                    style={{
                      background: r.type === "over" ? "rgba(41,211,245,.16)" : r.type === "under" ? "rgba(139,92,246,.18)" : "rgba(239,59,74,.16)",
                      color: r.type === "over" ? "var(--cyan)" : r.type === "under" ? "#b79bfb" : "var(--red)",
                    }}
                  >
                    {r.type}
                  </span>
                  <span className="mono text-[11px] font-extrabold">×{r.len}</span>
                  <div className="ml-auto flex gap-1">
                    {Array.from({ length: Math.min(r.len, 12) }, (_, k) => (
                      <span
                        key={k}
                        className="h-1.5 w-4 rounded-full"
                        style={{ background: r.type === "over" ? "var(--cyan)" : r.type === "under" ? "#8b5cf6" : "var(--red)", opacity: 0.85 - k * 0.03 }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {([3, 4, 5] as const).map((L) => {
                const seen = s.lab.length;
                let run = 0;
                let cont = 0;
                for (let i = 0; i + L < seen; i++) {
                  let ok = true;
                  for (let k = 0; k < L; k++) if (s.lab[i + k] !== s.lab[i]) ok = false;
                  if (!ok || s.lab[i] === "exact") continue;
                  if (s.lab[i + L] !== s.lab[i]) {
                    run++;
                    if (s.lab[i + L + 1] === s.lab[i]) cont++;
                  }
                }
                const flip = run ? 100 - (cont / run) * 100 : 0;
                return (
                  <div key={L} className="rounded-xl border p-2.5" style={{ borderColor: "var(--line)" }}>
                    <div className="text-[9px]" style={{ color: "var(--faint)" }}>
                      after {L}-runs
                    </div>
                    <div className="mono mt-0.5 text-[13px] font-extrabold" style={{ color: run && flip >= 55 ? "var(--green)" : "var(--muted)" }}>
                      {run ? `${flip.toFixed(0)}% flip` : "n/a"}
                    </div>
                    <div className="mono text-[9px]" style={{ color: "var(--faint)" }}>
                      {run} cases
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* ============ DIGIT COMPARE ============ */}
      <section className="dt-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-extrabold tracking-tight">Digit comparison vs barrier {barrier}</h3>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1.5" style={{ color: "var(--cyan)" }}>
              <span className="h-2 w-2 rounded-sm" style={{ background: "var(--cyan)" }} /> over
            </span>
            <span className="flex items-center gap-1.5" style={{ color: "#b79bfb" }}>
              <span className="h-2 w-2 rounded-sm" style={{ background: "#8b5cf6" }} /> under
            </span>
            <span className="flex items-center gap-1.5" style={{ color: "var(--red)" }}>
              <span className="h-2 w-2 rounded-sm" style={{ background: "var(--red)" }} /> exact
            </span>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider" style={{ color: "var(--faint)" }}>
                {["Digit", "Side", "Count", "Share", "Gap since seen", "Weight"].map((hx) => (
                  <th key={hx} className="pb-2 text-left font-bold">
                    {hx}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, d) => {
                const c = s.counts[d];
                const p = s.n ? (c / s.n) * 100 : 0;
                const side = d > barrier ? "over" : d < barrier ? "under" : "exact";
                const col = side === "over" ? "var(--cyan)" : side === "under" ? "#b79bfb" : "var(--red)";
                const isHot = d === s.hot.d;
                const isCold = d === s.cold.d;
                return (
                  <tr key={d} className="border-t text-[12px]" style={{ borderColor: "var(--line)", animation: `dt-up .4s ease ${d * 35}ms both` }}>
                    <td className="py-2">
                      <span
                        className="mono grid h-7 w-7 place-items-center rounded-lg text-[12px] font-extrabold"
                        style={{
                          background: isHot ? "rgba(18,201,160,.2)" : isCold ? "rgba(239,59,74,.2)" : "rgba(255,255,255,.06)",
                          color: isHot ? "var(--green)" : isCold ? "var(--red)" : "#cfdcff",
                        }}
                      >
                        {d}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase" style={{ background: `color-mix(in srgb, ${col} 16%, transparent)`, color: col }}>
                        {side}
                      </span>
                    </td>
                    <td className="mono py-2">{c}</td>
                    <td className="mono py-2" style={{ color: col }}>
                      {p.toFixed(1)}%
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="mono text-[11px]" style={{ color: s.gaps[d] >= 12 ? "var(--gold)" : "var(--muted)" }}>
                          {s.gaps[d] < 0 ? "—" : `${s.gaps[d]} ticks`}
                        </span>
                        {s.gaps[d] >= 12 && (
                          <span className="rounded px-1 py-0.5 text-[8px] font-black" style={{ background: "rgba(245,183,49,.18)", color: "var(--gold)" }}>
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="h-2 w-[140px] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.07)" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, p * 5)}%`, background: col }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ LAST DIGITS + RULE LAB ============ */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="dt-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[14px] font-extrabold tracking-tight">Last digits</h3>
            <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
              newest right · barrier {barrier}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {s.lastDigits.map((d, i, arr) => {
              const side = d > barrier ? "over" : d < barrier ? "under" : "exact";
              const col = side === "over" ? "var(--cyan)" : side === "under" ? "#8b5cf6" : "var(--red)";
              const newest = i === arr.length - 1;
              return (
                <span
                  key={`${i}-${d}`}
                  className="mono grid h-7 w-7 place-items-center rounded-lg text-[11px] font-extrabold transition-all duration-300"
                  style={{
                    background: newest ? "var(--yellow)" : `color-mix(in srgb, ${col} 18%, transparent)`,
                    color: newest ? "#1a1400" : col,
                    transform: newest ? "scale(1.16)" : "none",
                    boxShadow: newest ? "0 0 14px var(--yellow)" : "none",
                  }}
                >
                  {d}
                </span>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px]" style={{ color: "var(--faint)" }}>
            <span>over {s.over.c}</span>
            <span>·</span>
            <span>under {s.under.c}</span>
            <span>·</span>
            <span>exact {s.exact.c}</span>
            <span>·</span>
            <span>avg tick move {s.avgDelta.toFixed(2)}</span>
          </div>
        </section>

        <RuleLab digits={feed.digits} barrier={barrier} />
      </div>

      {/* ============ SIGNAL HISTORY ============ */}
      <section className="dt-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-extrabold tracking-tight">Session signal history</h3>
          <div className="flex flex-wrap items-center gap-3 text-[10.5px]">
            <span className="mono" style={{ color: "var(--faint)" }}>
              fired {recs.length} · settled {settled.length}
            </span>
            <span className="mono font-extrabold" style={{ color: winRate >= 50 ? "var(--green)" : "var(--red)" }}>
              hit rate {winRate.toFixed(0)}%
            </span>
            <span className="mono" style={{ color: curWin ? "var(--green)" : "var(--faint)" }}>
              streak {curWin ? `${curWin}W` : curLose ? `${curLose}L` : "—"}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {recs.length === 0 && (
            <p className="py-4 text-[11.5px]" style={{ color: "var(--faint)" }}>
              No signal has been armed yet. The tool only fires when every REQUIRED condition is met.
            </p>
          )}
          {recs.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
              style={{
                borderColor: r.result === null ? "var(--line-2)" : r.result ? "rgba(18,201,160,.4)" : "rgba(239,59,74,.4)",
                background: r.result === null ? "transparent" : r.result ? "rgba(18,201,160,.07)" : "rgba(239,59,74,.07)",
                animation: "dt-pop .4s cubic-bezier(.22,1,.36,1) both",
              }}
            >
              <span className="mono text-[11px] font-extrabold" style={{ color: r.side === "OVER" ? "var(--cyan)" : "#b79bfb" }}>
                {r.side}
              </span>
              <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
                {r.conf}%
              </span>
              <span
                className="mono rounded px-1.5 py-0.5 text-[9.5px] font-black"
                style={
                  r.result === null
                    ? { background: "rgba(255,255,255,.08)", color: "var(--muted)" }
                    : r.result
                      ? { background: "var(--green)", color: "#04091f" }
                      : { background: "var(--red)", color: "#fff" }
                }
              >
                {r.result === null ? `settling ${r.remaining}t` : r.result ? "WIN" : "LOSS"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- rule lab (backtest) ---------------- */
function RuleLab({ digits, barrier }: { digits: number[]; barrier: number }) {
  const [streak, setStreak] = useState(3);
  const [hold, setHold] = useState(1);
  const [mode, setMode] = useState<"fade" | "follow">("fade");
  const bt = useMemo(() => backtestSafe(digits, barrier, { streak, hold, mode }), [digits, barrier, streak, hold, mode]);

  const w = bt.winRate;
  const col = w >= 58 ? "var(--green)" : w >= 50 ? "var(--gold)" : "var(--red)";

  return (
    <section className="dt-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[14px] font-extrabold tracking-tight">Rule lab (backtest)</h3>
        <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
          tested on {digits.length} ticks
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Run length
          </span>
          {[2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setStreak(v)}
              className="mono rounded-lg border px-2 py-1.5 text-[11px] font-extrabold transition-transform hover:-translate-y-0.5"
              style={{
                borderColor: streak === v ? "var(--cyan)" : "var(--line)",
                color: streak === v ? "var(--cyan)" : "var(--muted)",
                background: streak === v ? "rgba(41,211,245,.12)" : "transparent",
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Hold
          </span>
          {[1, 2, 3].map((v) => (
            <button
              key={v}
              onClick={() => setHold(v)}
              className="mono rounded-lg border px-2 py-1.5 text-[11px] font-extrabold transition-transform hover:-translate-y-0.5"
              style={{
                borderColor: hold === v ? "var(--cyan)" : "var(--line)",
                color: hold === v ? "var(--cyan)" : "var(--muted)",
                background: hold === v ? "rgba(41,211,245,.12)" : "transparent",
              }}
            >
              {v}t
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,.05)" }}>
          {([["fade", "Fade run"], ["follow", "Follow run"]] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className="rounded-lg px-2.5 py-1.5 text-[10.5px] font-extrabold transition-all duration-300"
              style={{
                background: mode === k ? "linear-gradient(135deg,#8b5cf6,#4c1d95)" : "transparent",
                color: mode === k ? "#fff" : "var(--muted)",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([
          ["Signals", String(bt.signals), "var(--muted)"],
          ["Hit rate", `${w.toFixed(1)}%`, col],
          ["Wins / Losses", `${bt.wins} / ${bt.losses}`, "var(--muted)"],
          ["Max losing run", `${bt.maxLoseStreak}`, bt.maxLoseStreak >= 4 ? "var(--red)" : "var(--muted)"],
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

      <div className="mt-3 rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Cumulative units (1u risk)
          </span>
          <span className="mono text-[11px] font-extrabold" style={{ color: bt.net >= 0 ? "var(--green)" : "var(--red)" }}>
            {bt.net >= 0 ? "+" : ""}
            {bt.net.toFixed(2)}u
          </span>
        </div>
        <MiniCurve eq={bt.equity} c={col} />
      </div>

      <div className="mt-3">
        <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
          Last outcomes
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {bt.results.slice(-24).map((r, i) => (
            <span
              key={i}
              className="grid h-5 w-5 place-items-center rounded text-[9px] font-black"
              style={{ background: r ? "var(--green)" : "var(--red)", color: r ? "#04091f" : "#fff" }}
            >
              {r ? "W" : "L"}
            </span>
          ))}
          {!bt.results.length && (
            <span className="text-[10.5px]" style={{ color: "var(--faint)" }}>
              no {streak}-runs found in this window
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- sub-tab shell ---------------- */
const READY = ["ou", "eo", "freq", "scan"];

export function SignalAI({ sharedFeed, running = false }: { sharedFeed?: MultiFeedState; running?: boolean }) {
  const [sub, setSub] = useState("ou");

  if (!READY.includes(sub)) {
    const label = SUBTABS.find((t) => t.id === sub)?.label ?? "This analyser";
    return (
      <div className="space-y-4">
        <SubTabBar sub={sub} setSub={setSub} />
        <ComingSoonView
          label={label}
          blurb="This analyser is next in the queue. It will run on the same live feed and condition engine as the live tools — prediction, entry point, duration, stake and an honesty check via backtest."
          onBack={() => setSub("ou")}
          onBrowse={() => setSub("ou")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SubTabBar sub={sub} setSub={setSub} />

      {/* the top-bar Run control arms the engine on this tab too */}
      {running && (
        <div
          className="dt-panel A-up flex flex-wrap items-center gap-2.5 px-4 py-2.5"
          style={{ borderColor: "rgba(18,201,160,.4)", background: "rgba(18,201,160,.07)" }}
        >
          <span className="A-blink h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--green)", boxShadow: "0 0 10px var(--green)" }} />
          <span className="text-[11.5px] font-extrabold" style={{ color: "var(--green)" }}>
            Engine armed
          </span>
          <span className="text-[11.5px]" style={{ color: "var(--muted)" }}>
            every condition is scored on the live feed and each armed signal is written into the session history below.
          </span>
          <span className="mono ml-auto rounded-md px-2 py-1 text-[9.5px] font-black" style={{ background: "rgba(18,201,160,.16)", color: "var(--green)" }}>
            press Stop in the top bar to disarm
          </span>
        </div>
      )}

      {sub === "ou" && <OverUnderTool />}
      {sub === "eo" && <EvenOddTool />}
      {sub === "freq" && <DigitFreqTool />}
      {sub === "scan" && <AnalysisTool sharedFeed={sharedFeed} />}
    </div>
  );
}

function SubTabBar({ sub, setSub }: { sub: string; setSub: (s: string) => void }) {
  return (
    <div className="sig-island A-up flex flex-wrap items-center gap-2 p-3">
      <span className="mr-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--faint)" }}>
        Analysis tools
      </span>
      {SUBTABS.map((t, i) => {
        const on = t.id === sub;
        return (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className="group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-extrabold transition-all duration-300 hover:-translate-y-0.5"
            style={{
              borderColor: on ? "var(--cyan)" : "var(--line)",
              color: on ? "#04091f" : t.ready ? "var(--muted)" : "var(--faint)",
              background: on ? "linear-gradient(135deg,var(--cyan),#134b96)" : "transparent",
              animation: `dt-up .5s cubic-bezier(.22,1,.36,1) ${i * 55}ms both`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? "#04091f" : t.ready ? "var(--green)" : "var(--faint)" }} />
            {t.label}
            {!t.ready && (
              <span className="rounded px-1 py-0.5 text-[8px] font-black" style={{ background: "rgba(245,183,49,.16)", color: "var(--gold)" }}>
                SOON
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* wrapper so an empty window can't throw */
function backtestSafe(
  digits: number[],
  barrier: number,
  cfg: { streak: number; hold: number; mode: "fade" | "follow" },
): Backtest {
  if (digits.length < cfg.streak + cfg.hold + 2) {
    return {
      signals: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      maxLoseStreak: 0,
      results: [],
      equity: [],
      net: 0,
    };
  }
  return backtest(digits, barrier, cfg);
}
