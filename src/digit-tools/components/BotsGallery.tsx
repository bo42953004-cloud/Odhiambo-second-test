import { useState } from "react";
import { BOTS, type Bot } from "../lib/bots";
import { BotCard, BotDetails } from "./BotCard";
import { BotsBackdrop } from "./BotsBackdrop";

/* ============ advanced capability matrix (premium only) ============ */
type CellVal = string | boolean;

const MATRIX: [string, CellVal, CellVal][] = [
  ["Markets traded at once", "1 (locked)", true],
  ["AI barrier re-tuning", false, true],
  ["Volatility governor", false, true],
  ["Session scheduler", false, true],
  ["Adaptive position sizing", false, true],
  ["Drawdown shield", false, true],
  ["Low-latency engine", `${"~200 ms"}`, true],
  ["Priority signal feed", false, true],
  ["VIP desk support", false, true],
];

function Cell({ v, c }: { v: CellVal; c: string }) {
  if (v === true)
    return (
      <span className="grid h-6 w-6 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c }}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 13 4.5 4.5L19 7" />
        </svg>
      </span>
    );
  if (v === false)
    return (
      <span className="grid h-6 w-6 place-items-center rounded-lg" style={{ background: "rgba(255,255,255,.05)", color: "var(--faint)" }}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </span>
    );
  return (
    <span className="mono text-[11.5px] font-extrabold" style={{ color: c }}>
      {v}
    </span>
  );
}

export function PremiumShowcase({
  onLoad,
  loadedId,
  onDetails,
}: {
  onLoad: (b: Bot) => void;
  loadedId: string | null;
  onDetails: (b: Bot) => void;
}) {
  const list = BOTS.filter((b) => b.tier === "premium");
  return (
    <div className="space-y-5">
      {/* banner */}
      <div
        className="dt-panel A-up relative overflow-hidden p-5"
        style={{ borderColor: "rgba(255,176,32,.5)", background: "linear-gradient(135deg, rgba(255,176,32,.12), rgba(8,16,44,.92) 60%)" }}
      >
        <span className="A-glow pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-[70px]" style={{ background: "rgba(255,176,32,.35)" }} />
        <div className="relative flex flex-wrap items-center gap-4">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
            style={{ background: "linear-gradient(135deg,#ffe14d,#ffb020)", color: "#2b1600" }}
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
              <path d="m12 2 2.9 6.3 6.9.9-5.1 4.7 1.3 6.9L12 17.5 6 20.8l1.3-6.9L2.2 9.2l6.9-.9L12 2Z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[20px] font-extrabold tracking-tight" style={{ color: "var(--gold)" }}>
                Premium AI Bots
              </h2>
              <span className="rounded-md px-2 py-0.5 text-[9.5px] font-black" style={{ background: "rgba(255,176,32,.16)", color: "var(--gold)" }}>
                ELITE TIER
              </span>
            </div>
            <p className="mt-1 max-w-[640px] text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
              These aren't just extra strategies — they run a different engine: multi-market rotation, AI re-tuning of the
              barrier, adaptive sizing and a drawdown shield. Every one is simulation-previewed here while onboarding finishes.
            </p>
          </div>
          <div className="flex gap-3">
            {([["Avg / month", "+28.8%"], ["Markets", "multi"], ["Engine", "adaptive"]] as const).map(([k, v]) => (
              <div key={k} className="rounded-xl border px-3 py-2" style={{ borderColor: "rgba(255,176,32,.3)" }}>
                <div className="text-[9px]" style={{ color: "var(--faint)" }}>
                  {k}
                </div>
                <div className="mono mt-0.5 text-[13px] font-extrabold" style={{ color: "var(--gold)" }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((b, i) => (
          <BotCard key={b.id} b={b} i={i} onLoad={onLoad} onDetails={onDetails} loaded={b.id === loadedId} />
        ))}
      </div>

      {/* capability matrix */}
      <div className="dt-panel A-up overflow-hidden p-4">
        <h3 className="text-[14px] font-extrabold tracking-tight">Elite vs Free engine</h3>
        <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
          What actually changes when a bot is promoted to the elite engine.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[430px] border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider" style={{ color: "var(--faint)" }}>
                <th className="pb-2 text-left font-bold">Capability</th>
                <th className="pb-2 text-left font-bold">Free bots</th>
                <th className="pb-2 text-left font-bold" style={{ color: "var(--gold)" }}>
                  Premium AI
                </th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map(([k, free, pre], i) => (
                <tr key={k} className="border-t" style={{ borderColor: "var(--line)", animation: `dt-up .45s ease ${i * 60}ms both` }}>
                  <td className="py-2.5 text-[12px] font-semibold">{k}</td>
                  <td className="py-2.5">
                    <Cell v={free} c="var(--faint)" />
                  </td>
                  <td className="py-2.5">
                    <Cell v={pre} c="var(--gold)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============ gallery (free tab, with premium reachable) ============ */
export function BotsGallery({
  onLoad,
  loadedId,
}: {
  onLoad: (b: Bot) => void;
  loadedId: string | null;
}) {
  const [tier, setTier] = useState<"free" | "premium">("free");
  const [sort, setSort] = useState<"rank" | "win" | "ret">("rank");
  const [details, setDetails] = useState<Bot | null>(null);

  const list = BOTS.filter((b) => b.tier === tier).sort((a, b) =>
    sort === "win" ? b.win - a.win : sort === "ret" ? b.ret - a.ret : a.rank - b.rank,
  );

  const freeCount = BOTS.filter((b) => b.tier === "free").length;
  const premCount = BOTS.filter((b) => b.tier === "premium").length;

  return (
    <div className="relative">
      {/* themed backdrop: explicit gradient + raining trade logs + living field */}
      <BotsBackdrop premium={tier === "premium"} />

      <div className="relative z-10 space-y-5">
      {tier === "free" && (
        <div
          className="dt-panel A-up flex flex-wrap items-center gap-3 p-4"
          style={{ borderColor: "rgba(245,183,49,.35)", background: "linear-gradient(180deg,rgba(245,183,49,.09),rgba(8,16,44,.9))" }}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: "rgba(245,183,49,.16)", color: "var(--gold)" }}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="m12 2 2.9 6.3 6.9.9-5.1 4.7 1.3 6.9L12 17.5 6 20.8l1.3-6.9L2.2 9.2l6.9-.9L12 2Z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-extrabold" style={{ color: "var(--gold)" }}>
              Your Premium card brought you here
            </div>
            <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
              All {freeCount} bots below are free to load right now. The elite engine is one tap away on the premium tab.
            </p>
          </div>
          <button
            onClick={() => setTier("premium")}
            className="shrink-0 rounded-xl px-3.5 py-2 text-[11.5px] font-extrabold text-[#2b1600] transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(90deg,#ffe14d,#ffb020)" }}
          >
            ★ See premium → 
          </button>
        </div>
      )}

      <div className="dt-panel A-up flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-[19px] font-extrabold tracking-tight sm:text-[21px]">
            {tier === "free" ? "Free Bots" : "Premium AI Bots"}
          </h1>
          <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
            {tier === "free"
              ? "Ready-made strategies with full specs. Load one into the builder and tune it before running."
              : "The elite engine — advanced automation, adaptive risk and multi-market rotation."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,.05)" }}>
            {([["free", `Free ${freeCount}`], ["premium", `★ Premium ${premCount}`]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTier(k)}
                className="rounded-lg px-3 py-1.5 text-[11.5px] font-extrabold transition-all duration-300"
                style={{
                  background: tier === k ? (k === "premium" ? "linear-gradient(135deg,#ffe14d,#ffb020)" : "linear-gradient(135deg,var(--cyan),#134b96)") : "transparent",
                  color: tier === k ? "#04091f" : "var(--muted)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
              Sort
            </span>
            {([["rank", "Rank"], ["win", "Win rate"], ["ret", "Returns"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className="rounded-lg border px-2.5 py-1.5 text-[11px] font-extrabold transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: sort === k ? "var(--cyan)" : "var(--line)",
                  color: sort === k ? "var(--cyan)" : "var(--muted)",
                  background: sort === k ? "rgba(41,211,245,.12)" : "transparent",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tier === "premium" ? (
        <PremiumShowcase onLoad={onLoad} loadedId={loadedId} onDetails={setDetails} />
      ) : (
        <div key={`${tier}-${sort}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((b, i) => (
            <BotCard key={b.id} b={b} i={i} onLoad={onLoad} onDetails={setDetails} loaded={b.id === loadedId} />
          ))}
        </div>
      )}

        <BotDetails bot={details} onClose={() => setDetails(null)} onLoad={onLoad} loaded={details?.id === loadedId} />
      </div>
    </div>
  );
}
