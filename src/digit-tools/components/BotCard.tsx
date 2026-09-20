import { useEffect, useState } from "react";
import type { Bot } from "../lib/bots";

/* ---------------- helpers ---------------- */
function Spark({ curve, c }: { curve: number[]; c: string }) {
  const max = Math.max(...curve) || 1;
  const min = Math.min(...curve);
  const pts = curve
    .map((v, i) => `${(i / (curve.length - 1)) * 100},${34 - ((v - min) / (max - min || 1)) * 30}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 36" className="h-9 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${c.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.42" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,36 ${pts} 100,36`} fill={`url(#g-${c.replace(/[^a-z0-9]/gi, "")})`} />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function RiskMeter({ risk, c }: { risk: Bot["risk"]; c: string }) {
  const n = risk === "Low" ? 1 : risk === "Medium" ? 2 : 3;
  const col = risk === "Low" ? "var(--green)" : risk === "Medium" ? "var(--gold)" : "var(--red)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 w-5 rounded-full transition-all duration-500"
            style={{
              background: i <= n ? col : "rgba(255,255,255,.10)",
              boxShadow: i <= n ? `0 0 8px ${col}` : "none",
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-extrabold" style={{ color: col }}>
        {risk} risk
      </span>
      <span className="mono text-[9.5px]" style={{ color: c }}>
        · {risk === "Low" ? "1 contract" : risk === "Medium" ? "3 contracts" : "5 contracts"}
      </span>
    </div>
  );
}

/* ---------------- the card (compact: robot fills the card, text layered inside) ---------------- */
export function BotCard({
  b,
  i,
  onLoad,
  onDetails,
  loaded,
}: {
  b: Bot;
  i: number;
  onLoad: (b: Bot) => void;
  onDetails: (b: Bot) => void;
  loaded: boolean;
}) {
  const premium = b.tier === "premium";
  const riskCol = b.risk === "Low" ? "var(--green)" : b.risk === "Medium" ? "var(--gold)" : "var(--red)";
  return (
    <article
      className="dt-card dt-sheen group relative flex h-[286px] flex-col overflow-hidden"
      style={{
        borderColor: premium ? "rgba(255,176,32,.55)" : `color-mix(in srgb, ${b.a} 40%, transparent)`,
        boxShadow: premium
          ? "inset 0 1px 0 rgba(255,255,255,.08), 0 0 0 1px rgba(255,176,32,.18), 0 34px 80px -38px rgba(255,176,32,.75)"
          : `inset 0 1px 0 rgba(255,255,255,.07), 0 0 0 1px color-mix(in srgb, ${b.a} 14%, transparent), 0 30px 70px -36px color-mix(in srgb, ${b.a} 70%, transparent)`,
        animation: `dt-up .75s cubic-bezier(.22,1,.36,1) ${i * 110}ms both`,
      }}
    >
      {/* ===== robot fills the whole card (full-bleed, wider than the card) ===== */}
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute inset-0" style={{ background: `radial-gradient(112% 76% at 50% 4%, color-mix(in srgb, ${b.a} 32%, transparent), transparent 74%)` }} />
        <span
          className="absolute inset-0 opacity-[.42]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(140,175,255,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(140,175,255,.10) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(88% 64% at 50% 26%, #000, transparent 80%)",
          }}
        />
        <span className="A-glow absolute left-1/2 top-[33%] h-[196px] w-[196px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px]" style={{ background: `radial-gradient(circle, ${b.a}99, transparent 68%)` }} />
        <span
          className="A-spin absolute left-1/2 top-[33%] h-[168px] w-[168px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
          style={{ borderColor: `color-mix(in srgb, ${b.a} 42%, transparent)`, animationDuration: `${16 + i * 3}s` }}
        />
        {/* wider than the card so the robot spans ~3/4 of it */}
        <img
          src={b.img}
          alt={`${b.name} robot`}
          loading="lazy"
          draggable={false}
          className="dt-blend A-float absolute left-1/2 top-[33%] h-[104%] w-[124%] -translate-x-1/2 -translate-y-1/2 object-contain transition-transform duration-700 ease-out group-hover:scale-[1.14]"
          style={{ filter: b.hue ? `hue-rotate(${b.hue}deg)` : undefined }}
        />
      </div>

      {/* ===== top row: tier + risk + rank ===== */}
      <div className="relative z-20 flex items-start gap-2 p-2.5">
        {premium ? (
          <span
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[9.5px] font-black tracking-wider text-[#2b1600] transition-transform duration-500 group-hover:scale-105"
            style={{ background: "linear-gradient(90deg,#ffe14d,#ffb020)", boxShadow: "0 8px 22px -8px #ffb020" }}
          >
            ★ ELITE
          </span>
        ) : (
          <span
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[9.5px] font-black tracking-wider transition-transform duration-500 group-hover:scale-105"
            style={{ background: "rgba(18,201,160,.18)", color: "var(--green)", border: "1px solid rgba(18,201,160,.4)" }}
          >
            ✓ FREE
          </span>
        )}
        <span
          className="mono flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-black"
          style={{ background: "rgba(3,7,22,.72)", color: riskCol, border: "1px solid var(--line)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: riskCol, boxShadow: `0 0 8px ${riskCol}` }} />
          {b.risk} risk
        </span>
        <span
          className="mono ml-auto grid h-8 w-8 place-items-center rounded-xl border text-[13px] font-extrabold transition-transform duration-500 group-hover:scale-110"
          style={{ borderColor: `color-mix(in srgb, ${b.a} 60%, transparent)`, color: b.a, background: `color-mix(in srgb, ${b.a} 12%, rgba(6,12,34,.72))` }}
        >
          {String(b.rank).padStart(2, "0")}
        </span>
      </div>

      {/* ===== text hovering above the robot ===== */}
      <div className="relative z-20 mt-auto">
        {/* readability scrim over the render */}
        <span
          className="pointer-events-none absolute inset-x-0 -top-14 bottom-0"
          style={{ background: "linear-gradient(180deg, transparent, color-mix(in srgb, #060c22 92%, transparent) 34%, #060c22 100%)" }}
        />

        <div className="relative px-3 pb-3" style={{ ["--t-a" as string]: b.a, ["--t-b" as string]: premium ? "#ffb020" : b.a }}>
          <h3 className="bot-title bot-title-sm">{b.name}</h3>
          <span className="bot-rule" />
          <p className="mt-1.5 text-[10.5px] font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,.9)]" style={{ color: b.a }}>
            {b.tagline}
          </p>

          <p className="line-clamp-1 mt-1.5 text-[10.5px] leading-snug" style={{ color: "#a9bce0" }}>
            {b.desc}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="mono rounded px-1.5 py-0.5 text-[8.5px] font-bold" style={{ background: "rgba(255,255,255,.10)", color: "var(--muted)" }}>
              {b.market}
            </span>
            <span className="rounded px-1.5 py-0.5 text-[8.5px] font-bold" style={{ background: "rgba(255,255,255,.10)", color: "var(--muted)" }}>
              {b.tag}
            </span>
            <span className="mono rounded px-1.5 py-0.5 text-[8.5px] font-bold" style={{ background: "rgba(255,255,255,.10)", color: "var(--muted)" }}>
              {b.duration}t · {b.latency}
            </span>
          </div>

          {/* stats strip */}
          <div className="mt-2 flex items-stretch overflow-hidden rounded-lg border backdrop-blur-sm" style={{ borderColor: "var(--line)", background: "rgba(6,12,34,.55)" }}>
            {([
              ["Win", `${b.win}%`, b.a],
              ["Avg/mo", `+${b.ret}%`, "var(--green)"],
              ["Traders", b.users >= 1000 ? `${(b.users / 1000).toFixed(1)}k` : String(b.users), "var(--muted)"],
            ] as const).map(([k, v, c], idx) => (
              <div key={k} className="flex-1 py-1 text-center" style={{ borderLeft: idx ? "1px solid var(--line)" : "none" }}>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: "var(--faint)" }}>
                  {k}
                </div>
                <div className="mono text-[11.5px] font-extrabold leading-tight" style={{ color: c }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onLoad(b)}
              className="flex-1 rounded-lg py-1.5 text-[10.5px] font-extrabold transition-transform duration-300 hover:-translate-y-0.5"
              style={{
                background: loaded ? `color-mix(in srgb, ${b.a} 22%, transparent)` : premium ? "linear-gradient(90deg,#ffe14d,#ffb020)" : b.a,
                color: loaded ? b.a : "#04091f",
                border: loaded ? `1px solid ${b.a}` : "none",
              }}
            >
              {loaded ? "✓ Loaded" : "Load"}
            </button>
            <button
              onClick={() => onDetails(b)}
              title="Full specification"
              className="rounded-lg border px-2.5 py-1.5 text-[10.5px] font-extrabold transition-transform duration-300 hover:-translate-y-0.5"
              style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------------- details drawer ---------------- */
export function BotDetails({
  bot,
  onClose,
  onLoad,
  loaded,
}: {
  bot: Bot | null;
  onClose: () => void;
  onLoad: (b: Bot) => void;
  loaded: boolean;
}) {
  const [tab, setTab] = useState<"spec" | "logic" | "perf">("spec");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (bot) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bot, onClose]);

  useEffect(() => setTab("spec"), [bot?.id]);

  if (!bot) return null;
  const premium = bot.tier === "premium";

  return (
    <div className="A-fade fixed inset-0 z-[95] flex justify-end bg-black/70 backdrop-blur-md" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="dt-dark-scope dt-sheen A-drop relative flex h-full w-full max-w-[520px] flex-col overflow-y-auto border-l"
        style={{
          borderColor: premium ? "rgba(255,176,32,.5)" : "var(--line-2)",
          background: "linear-gradient(180deg,#0a1338,#050b22)",
          boxShadow: "-40px 0 90px -30px #000",
        }}
      >
        {/* hero */}
        <div className="relative h-[190px] shrink-0 overflow-hidden">
          <span className="absolute inset-0" style={{ background: `radial-gradient(110% 80% at 50% 10%, color-mix(in srgb, ${bot.a} 30%, transparent), transparent 72%)` }} />
          <span className="A-glow absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[44px]" style={{ background: `radial-gradient(circle, ${bot.a}99, transparent 68%)` }} />
          <img
            src={bot.img}
            alt=""
            className="dt-blend A-float absolute left-1/2 top-1/2 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 object-contain"
            style={{ filter: bot.hue ? `hue-rotate(${bot.hue}deg)` : undefined }}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20" style={{ background: "linear-gradient(180deg,transparent,#0a1338)" }} />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300 hover:rotate-90 hover:border-[var(--red)]"
            style={{ borderColor: "var(--line-2)", color: "var(--muted)", background: "rgba(6,12,34,.75)" }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <span
            className="absolute left-4 top-4 rounded-md px-2 py-1 text-[9.5px] font-black tracking-wider"
            style={
              premium
                ? { background: "linear-gradient(90deg,#ffe14d,#ffb020)", color: "#2b1600" }
                : { background: "rgba(18,201,160,.2)", color: "var(--green)", border: "1px solid rgba(18,201,160,.4)" }
            }
          >
            {premium ? "★ ELITE · PREMIUM" : "✓ FREE BOT"}
          </span>
        </div>

        <div
          className="relative -mt-6 px-5 pb-8"
          style={{ ["--t-a" as string]: bot.a, ["--t-b" as string]: premium ? "#ffb020" : "#ffffff" }}
        >
          <h2 className="bot-title bot-title-lg">{bot.name}</h2>
          <span className="bot-rule" style={{ width: 64 }} />
          <p className="mt-1.5 text-[12.5px] font-semibold" style={{ color: bot.a }}>
            {bot.tagline}
          </p>
          <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            {bot.desc}
          </p>

          {/* headline stats */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {([
              ["Win rate", `${bot.win}%`, bot.a],
              ["Avg/month", `+${bot.ret}%`, "var(--green)"],
              ["Runs", bot.runs.toLocaleString(), "var(--muted)"],
              ["Traders", bot.users.toLocaleString(), "var(--muted)"],
            ] as const).map(([k, v, c], i) => (
              <div key={k} className="rounded-xl border p-2.5" style={{ borderColor: "var(--line)", animation: `dt-up .5s ease ${i * 70}ms both` }}>
                <div className="text-[9px]" style={{ color: "var(--faint)" }}>
                  {k}
                </div>
                <div className="mono mt-0.5 text-[13px] font-extrabold" style={{ color: c }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          {/* tabs */}
          <div className="mt-5 flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,.05)" }}>
            {([["spec", "Specification"], ["logic", "Strategy logic"], ["perf", "Performance"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="flex-1 rounded-lg px-2 py-2 text-[11px] font-extrabold transition-all duration-300"
                style={{
                  background: tab === k ? `linear-gradient(135deg, ${bot.a}, color-mix(in srgb, ${bot.a} 40%, #0b1230))` : "transparent",
                  color: tab === k ? "#04091f" : "var(--muted)",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* panels */}
          <div className="mt-3.5">
            {tab === "spec" && (
              <div className="space-y-2">
                {([
                  ["Market", bot.market],
                  ["Contract type", bot.contract],
                  ["Barrier digit", bot.contract === "Even/Odd" ? "not used" : String(bot.barrier)],
                  ["Initial stake", `$${bot.stake.toFixed(2)}`],
                  ["Duration", `${bot.duration} ticks`],
                  ["Recovery", bot.martingale ? `×${bot.martingale}` : "flat (none)"],
                  ["Stop loss", `$${bot.stopLoss.toFixed(2)}`],
                  ["Take profit", `$${bot.takeProfit.toFixed(2)}`],
                  ["Avg entry latency", bot.latency],
                  ["Max concurrent", bot.risk === "Low" ? "1 contract" : bot.risk === "Medium" ? "3 contracts" : "5 contracts"],
                ] as const).map(([k, v], i) => (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                    style={{ borderColor: "var(--line)", animation: `dt-up .45s ease ${i * 45}ms both` }}
                  >
                    <span className="text-[11.5px]" style={{ color: "var(--muted)" }}>
                      {k}
                    </span>
                    <span className="mono text-[12px] font-extrabold" style={{ color: "#e4edff" }}>
                      {v}
                    </span>
                  </div>
                ))}
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
                  <RiskMeter risk={bot.risk} c={bot.a} />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {bot.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border px-2.5 py-1 text-[10px] font-bold"
                      style={{ borderColor: `color-mix(in srgb, ${bot.a} 42%, transparent)`, background: `color-mix(in srgb, ${bot.a} 10%, transparent)`, color: "#dbe7ff" }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tab === "logic" && (
              <div className="space-y-2">
                {bot.logic.map((l, i) => (
                  <div
                    key={l}
                    className="flex items-start gap-3 rounded-xl border p-3"
                    style={{ borderColor: "var(--line)", animation: `dt-up .45s ease ${i * 70}ms both` }}
                  >
                    <span
                      className="mono mt-[2px] grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-black"
                      style={{ background: `color-mix(in srgb, ${bot.a} 20%, transparent)`, color: bot.a }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[12px] leading-relaxed" style={{ color: "#cfdcff" }}>
                      {l}
                    </span>
                  </div>
                ))}
                <p className="pt-1 text-[10.5px] leading-relaxed" style={{ color: "var(--faint)" }}>
                  The builder exports these rules as a DBot XML draft you can import into Deriv Bot and verify block by block.
                </p>
              </div>
            )}

            {tab === "perf" && (
              <div className="space-y-3">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
                      90-day equity curve
                    </span>
                    <span className="mono text-[11px] font-extrabold" style={{ color: "var(--green)" }}>
                      ▲ +{Math.max(...bot.curve).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <Spark curve={bot.curve} c={bot.a} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["Best run", `+${(bot.ret * 3.2).toFixed(1)}%`, "var(--green)"],
                    ["Worst drawdown", `−${(100 - bot.win * 0.6).toFixed(1)}%`, "var(--red)"],
                    ["Longest win streak", `${Math.round(bot.win / 4)}`, bot.a],
                    ["Total contracts", bot.runs.toLocaleString(), "var(--muted)"],
                  ] as const).map(([k, v, c], i) => (
                    <div key={k} className="rounded-xl border p-3" style={{ borderColor: "var(--line)", animation: `dt-up .45s ease ${i * 70}ms both` }}>
                      <div className="text-[9.5px]" style={{ color: "var(--faint)" }}>
                        {k}
                      </div>
                      <div className="mono mt-0.5 text-[14px] font-extrabold" style={{ color: c }}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--faint)" }}>
                  Figures are community-reported simulations over the selected market, not guarantees of future results.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => onLoad(bot)}
              className="flex-1 rounded-xl py-3 text-[12.5px] font-extrabold transition-transform hover:-translate-y-0.5"
              disabled={loaded}
              style={{
                background: loaded ? "rgba(255,255,255,.07)" : premium ? "linear-gradient(90deg,#ffe14d,#ffb020)" : `linear-gradient(90deg, ${bot.a}, color-mix(in srgb, ${bot.a} 45%, #0b1230))`,
                color: loaded ? "var(--muted)" : "#04091f",
              }}
            >
              {loaded ? "✓ Already loaded" : "Load in Bot Builder"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
