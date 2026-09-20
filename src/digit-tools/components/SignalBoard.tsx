import { useEffect, useRef, useState } from "react";

const MARKS = [
  { label: "VOL 10", base: 9488.83, dir: 1 },
  { label: "VOL 25", base: 2663.417, dir: -1 },
  { label: "VOL 50", base: 90.2596, dir: -1 },
  { label: "VOL 75", base: 45399.21, dir: 1 },
  { label: "VOL 100", base: 923.45, dir: -1 },
  { label: "BULL MKT", base: 1029.236, dir: 1 },
  { label: "BEAR MKT", base: 933.4101, dir: -1 },
  { label: "STEP IDX", base: 9002.4, dir: 1 },
];

function Spark({ seed, up }: { seed: number; up: boolean }) {
  const pts = Array.from({ length: 22 }, (_, i) => {
    const v = Math.sin((i + seed) * 0.7) * 12 + Math.sin((i + seed) * 0.31) * 7;
    return `${(i / 21) * 100},${20 - v * (up ? 1 : -1) - 20 * 0} `;
  }).join(" ");
  const c = up ? "var(--cyan)" : "var(--red)";
  return (
    <svg viewBox="0 0 100 40" className="h-10 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.35" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <polygon points={`0,40 ${pts} 100,40`} fill={`url(#sg${seed})`} />
    </svg>
  );
}

function MarketCard({ m, i }: { m: (typeof MARKS)[number]; i: number }) {
  const [p, setP] = useState(m.base);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setP((v) => +(v * (1 + (Math.random() - 0.5) * 0.0016)).toFixed(4));
      setTick((t) => t + 1);
    }, 1500 + i * 160);
    return () => clearInterval(iv);
  }, [i]);
  const up = m.dir > 0;
  const conf = 62 + ((i * 37) % 34);

  return (
    <div
      className="dt-card group p-3.5"
      style={{ animation: `dt-up .7s cubic-bezier(.22,1,.36,1) ${i * 70}ms both` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-extrabold tracking-wide" style={{ color: "#cfe0ff" }}>{m.label}</span>
        <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-black" style={{ background: up ? "rgba(41,211,245,.16)" : "rgba(239,59,74,.16)", color: up ? "var(--cyan)" : "var(--red)" }}>
          1S
        </span>
      </div>
      <div className="mono mt-1.5 flex items-baseline gap-1.5 text-[17px] font-extrabold" style={{ color: up ? "var(--cyan)" : "var(--red)" }}>
        <span key={tick} className="A-tick">{p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</span>
        <span className="text-[11px]">{up ? "▲" : "▼"}</span>
      </div>
      <div className="mt-1 transition-transform duration-500 group-hover:scale-105">
        <Spark seed={i + 1} up={up} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.08)" }}>
          <div className="h-full rounded-full" style={{ width: `${conf}%`, background: up ? "linear-gradient(90deg,#29d3f5,#12c9a0)" : "linear-gradient(90deg,#ef3b4a,#f5b731)" }} />
        </div>
        <span className="mono text-[10px] font-bold" style={{ color: "var(--muted)" }}>{conf}%</span>
      </div>
    </div>
  );
}

const FEED = [
  "SCAN · Volatility 100 · digit 6 overdue, confidence 81%",
  "SIGNAL · Even/Odd edge detected on Volatility 25 — favour EVEN",
  "BOT · Digit Sniper V4 finished 12 contracts, +$18.40 net",
  "RISK · Daily loss cap at 62% used, stake reduced to $6",
  "SCAN · Bull Market momentum building for 5 consecutive ticks",
  "SIGNAL · Differs 4 setup valid on Volatility 75 (score 76)",
];

export function SignalBoard() {
  const [lines, setLines] = useState<{ id: number; text: string; color: string }[]>([]);
  const id = useRef(0);

  useEffect(() => {
    const colors = ["var(--cyan)", "var(--green)", "var(--gold)", "var(--purple)"];
    const iv = setInterval(() => {
      setLines((l) => [
        { id: id.current++, text: FEED[id.current % FEED.length], color: colors[id.current % colors.length] },
        ...l,
      ].slice(0, 5));
    }, 2600);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      <div className="dt-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-extrabold tracking-tight">Live Market Signals</h3>
            <span className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[9.5px] font-black" style={{ background: "rgba(18,201,160,.14)", color: "var(--green)" }}>
              <span className="h-1.5 w-1.5 rounded-full A-blink" style={{ background: "var(--green)" }} />
              STREAMING
            </span>
          </div>
          <div className="flex gap-1.5">
            {["All", "Volatility", "Bull/Bear", "Step"].map((t, k) => (
              <button key={t} className="rounded-lg border px-2.5 py-1 text-[10.5px] font-bold transition-all duration-300 hover:-translate-y-0.5"
                style={{ borderColor: k === 0 ? "var(--cyan)" : "var(--line)", color: k === 0 ? "var(--cyan)" : "var(--muted)", background: k === 0 ? "rgba(41,211,245,.12)" : "transparent" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {MARKS.map((m, i) => (
            <MarketCard key={m.label} m={m} i={i} />
          ))}
        </div>
      </div>

      <div className="dt-panel flex flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "rgba(139,92,246,.18)", color: "#c4b5fd" }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4L12 3Zm6.5 9.5.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z" /></svg>
          </span>
          <h3 className="text-[15px] font-extrabold tracking-tight">AI Activity Feed</h3>
        </div>
        <div className="mt-4 flex-1 space-y-2.5">
          {lines.map((l, i) => (
            <div
              key={l.id}
              className="flex items-start gap-2.5 rounded-xl border p-2.5"
              style={{
                borderColor: "var(--line)",
                background: i === 0 ? "rgba(120,165,255,.07)" : "transparent",
                animation: "dt-up .45s cubic-bezier(.22,1,.36,1) both",
                opacity: 1 - i * 0.14,
              }}
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: l.color, boxShadow: `0 0 8px ${l.color}` }} />
              <span className="text-[11.5px] leading-relaxed" style={{ color: "#cfdcff" }}>{l.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
          <span className="text-[10.5px]" style={{ color: "var(--muted)" }}>Scanner load</span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full A-blink" style={{ background: "var(--gold)" }} />
            <span className="mono text-[12px] font-extrabold" style={{ color: "var(--gold)" }}>12 ms</span>
          </div>
        </div>
      </div>
    </section>
  );
}
