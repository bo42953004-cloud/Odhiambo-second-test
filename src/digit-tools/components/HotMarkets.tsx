import { useEffect, useState } from "react";
import { DIRECTION_NOTE, type HotMarket } from "../lib/hot";

const TIER = {
  hot: { label: "HOT", bg: "linear-gradient(90deg,#ffc24a,#ff8a1f)", fg: "#3a1a00" },
  warm: { label: "WARM", bg: "rgba(255,176,32,.16)", fg: "#ffb020" },
} as const;

const FLAME =
  "M12 2c.6 3.4-1 5.2-2.6 6.6C7.6 10.2 6 11.7 6 14.4A6 6 0 0 0 18 15c0-2-.8-3.3-1.8-4.4-.6 1-1.2 1.6-2.1 2 .5-2.6-.2-5.2-2.1-6.9.2 1.7-.6 2.6-1.3 3.3-.4-2.1.6-4.6 1.3-7Z";

/* ================================================================
   The fire sign — sits after the last tab.
   ================================================================ */
export function HotSign({
  count,
  scanning,
  onClick,
}: {
  count: number;
  scanning: boolean;
  onClick: () => void;
}) {
  const hot = count > 0;
  /* staggered blob heights — tallest near the middle-right, like the reference art */
  const BLOBS = [
    { h: "42%",   w: 9 },
    { h: "62%",   w: 11 },
    { h: "100%",  w: 13 },
    { h: "78%",   w: 12 },
    { h: "58%",   w: 11 },
    { h: "38%",   w: 9 },
  ];

  return (
    <button
      className="hot-sign"
      data-hot={hot}
      onClick={onClick}
      title={hot ? `${count} hot market${count > 1 ? "s" : ""} — view strategies` : "No markets qualify right now"}
      aria-label={hot ? `${count} hot markets` : "Hot market scanner"}
    >
      {/* fire waves rippling out of the flame cluster while signals are live */}
      {hot && (
        <span className="hot-waves" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="hot-wave" style={{ animationDelay: `${i * 0.8}s` }} />
          ))}
        </span>
      )}

      {hot && <span className="hot-heat" aria-hidden />}

      <span className="hot-glyph" aria-hidden>
        {BLOBS.map((b, i) => (
          <span key={i} className="blob" style={{ height: hot ? b.h : "46%", width: b.w }} />
        ))}
      </span>

      {/* sparks lifting off the flames */}
      {hot && (
        <span className="hot-embers" aria-hidden>
          {[
            { l: "26%", dx: "-6px", d: "0s", dur: "2.1s" },
            { l: "44%", dx: "4px", d: "0.7s", dur: "2.5s" },
            { l: "58%", dx: "9px", d: "1.3s", dur: "2.0s" },
            { l: "72%", dx: "-4px", d: "0.35s", dur: "2.7s" },
            { l: "50%", dx: "7px", d: "1.7s", dur: "2.3s" },
          ].map((e, i) => (
            <span
              key={i}
              className="hot-ember"
              style={{ left: e.l, ["--dx" as string]: e.dx, animationDelay: e.d, animationDuration: e.dur }}
            />
          ))}
        </span>
      )}

      {hot && <span className="hot-badge">{count}</span>}
      {!hot && scanning && <span className="hot-scan" />}
    </button>
  );
}

/* ================================================================
   Dashboard strip — the fire signal surfaced at a glance
   ================================================================ */
export function HotStrip({
  hot,
  scanning,
  onOpen,
}: {
  hot: HotMarket[];
  scanning: boolean;
  onOpen: () => void;
}) {
  const top = hot.slice(0, 3);
  return (
    <button
      onClick={onOpen}
      className="dt-panel A-up relative w-full overflow-hidden p-4 text-left transition-transform duration-300 hover:-translate-y-1"
      style={{
        borderColor: hot.length ? "rgba(255,120,40,.45)" : "var(--line)",
        background: hot.length ? "linear-gradient(135deg, rgba(255,120,40,.11), rgba(8,16,44,.92) 58%)" : undefined,
      }}
    >
      {hot.length > 0 && (
        <span className="A-glow pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full blur-3xl" style={{ background: "radial-gradient(circle,#ff7a2d,transparent 70%)", opacity: 0.3 }} />
      )}

      <div className="relative flex flex-wrap items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ background: hot.length ? "rgba(255,120,40,.2)" : "rgba(255,255,255,.05)", color: hot.length ? "#ff8a3d" : "var(--faint)" }}
        >
          <svg viewBox="0 0 24 24" className={`h-6 w-6 ${hot.length ? "A-blink" : ""}`} fill="currentColor">
            <path d={FLAME} />
          </svg>
        </span>

        <div className="min-w-[170px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-extrabold tracking-tight">
              {hot.length ? `Hot markets · ${hot.length}` : "Hot market scanner"}
            </span>
            {hot.filter((m) => m.best.tier === "hot").length > 0 && (
              <span className="mono rounded-md px-2 py-0.5 text-[9px] font-black" style={{ background: TIER.hot.bg, color: TIER.hot.fg }}>
                {hot.filter((m) => m.best.tier === "hot").length} HOT
              </span>
            )}
          </div>
          <div className="mono mt-0.5 text-[10.5px]" style={{ color: "var(--muted)" }}>
            {hot.length
              ? hot.map((m) => `${m.id} ${m.best.side}`).slice(0, 3).join(" · ")
              : scanning
                ? "scanning all 20 markets across 1000 ticks…"
                : "no setup qualifies right now — the fire lights when one appears"}
          </div>
        </div>

        {top.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {top.map((m, i) => (
              <span
                key={m.id}
                className="mono flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[10.5px] font-bold"
                style={{
                  borderColor: "rgba(255,138,61,.45)",
                  background: "rgba(255,138,61,.1)",
                  color: "#ffd9b8",
                  animation: `dt-up .5s cubic-bezier(.22,1,.36,1) ${i * 80}ms both`,
                }}
              >
                <span className="A-blink h-1.5 w-1.5 rounded-full" style={{ background: "#ff8a3d", boxShadow: "0 0 8px #ff8a3d" }} />
                {m.id}
                <span style={{ color: "#ffb020" }}>{m.best.side}</span>
                <span style={{ color: "var(--faint)" }}>{m.best.worst.toFixed(1)}%</span>
              </span>
            ))}
          </div>
        )}

        <span className="mono ml-auto shrink-0 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold" style={{ borderColor: "rgba(255,138,61,.45)", color: "#ff8a3d" }}>
          open panel →
        </span>
      </div>
    </button>
  );
}

/* ================================================================
   Panel pieces
   ================================================================ */
function Meter({ v, gradient, tint }: { v: number; gradient?: string; tint?: string }) {
  return (
    <div className="h-[9px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.07)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, v)}%`,
          background: gradient ?? tint ?? "var(--green)",
          boxShadow: v > 2 ? `0 0 12px ${gradient ? "#ff8a1f" : (tint ?? "var(--green)")}` : "none",
        }}
      />
    </div>
  );
}

function MarketRow({ m, i, onOpenSignal }: { m: HotMarket; i: number; onOpenSignal: () => void }) {
  const b = m.best;
  const grad = "linear-gradient(90deg,#ffc24a,#ff7a1f)";
  return (
    <article
      className="relative overflow-hidden rounded-[22px] border-[1.5px] p-5"
      style={{
        borderColor: b.tier === "hot" ? "rgba(255,140,50,.5)" : "rgba(255,140,50,.28)",
        background: "linear-gradient(155deg, rgba(24,20,44,.92), rgba(10,16,40,.94) 55%)",
        animation: `dt-up .55s cubic-bezier(.22,1,.36,1) ${i * 80}ms both`,
      }}
    >
      <span
        className="A-glow pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle,#ff7a2d,transparent 70%)", opacity: 0.35 }}
      />

      {/* ---------- header row ---------- */}
      <div className="relative flex flex-wrap items-start gap-4">
        <span className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-2xl" style={{ background: "rgba(255,120,40,.16)", color: "#ff8a3d" }}>
          <svg viewBox="0 0 24 24" className="h-7 w-7 A-blink" fill="currentColor">
            <path d={FLAME} />
          </svg>
        </span>

        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-[19px] font-extrabold leading-none tracking-tight">{m.label}</h3>
            <span className="mono rounded-lg px-2.5 py-1 text-[11px] font-bold" style={{ background: "rgba(255,255,255,.07)", color: "var(--muted)" }}>
              {m.id}
            </span>
            <span className="rounded-lg px-2.5 py-1 text-[10.5px] font-black tracking-wider" style={{ background: TIER[b.tier].bg, color: TIER[b.tier].fg }}>
              {TIER[b.tier].label}
            </span>
          </div>
          <div className="mono mt-2 text-[12px]" style={{ color: "var(--muted)" }}>
            {m.price != null ? m.price.toFixed(3) : "—"} · {m.n} ticks · {m.signals.length} strateg{m.signals.length === 1 ? "y" : "ies"} qualified
          </div>
        </div>

        <div className="shrink-0 pl-4 text-right">
          <div className="mono text-[34px] font-black leading-none" style={{ color: "#ff8a3d", filter: "drop-shadow(0 0 18px rgba(255,138,61,.45))" }}>
            {m.score}
          </div>
          <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--faint)" }}>
            heat
          </div>
        </div>
      </div>

      {/* ---------- recommendation ---------- */}
      <div className="relative mt-4 flex flex-wrap items-center gap-3.5">
        <span className="mono rounded-xl px-5 py-3 text-[15px] font-black tracking-wide" style={{ background: grad, color: "#3a1a00", boxShadow: "0 14px 30px -14px rgba(255,138,31,.9)" }}>
          BUY {b.side}
        </span>
        <span className="text-[13.5px] font-semibold" style={{ color: "#ffe0c8" }}>
          {DIRECTION_NOTE[b.side]}
        </span>
      </div>

      {/* ---------- losing digits ---------- */}
      <div className="relative mt-4">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--faint)" }}>
          losing digits · full window vs last 100
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {b.losers.map((d, k) => {
            const p = b.per[k];
            const r = b.recentPer[k];
            const climb = r > p + 0.2;
            return (
              <span
                key={d}
                className="mono flex items-center gap-2.5 rounded-xl border-[1.5px] px-3 py-2 text-[12.5px] font-bold"
                style={{ borderColor: "rgba(18,201,160,.55)", background: "rgba(18,201,160,.09)", color: "var(--green)" }}
                title={`digit ${d}: ${p.toFixed(2)}% overall · ${r.toFixed(2)}% in the last 100 ticks`}
              >
                <span className="grid h-[22px] w-[22px] place-items-center rounded-md text-[12px] font-black" style={{ background: "var(--green)", color: "#04140f" }}>
                  {d}
                </span>
                {p.toFixed(2)}%
                <span className="flex items-center gap-0.5 font-semibold" style={{ color: climb ? "var(--gold)" : "#6fbfa6" }}>
                  {climb ? "▲" : "▼"}
                  {r.toFixed(1)}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* ---------- meters ---------- */}
      <div className="relative mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="mono w-[104px] shrink-0 text-[11.5px]" style={{ color: "var(--faint)" }}>
            block {b.block.toFixed(1)}%
          </span>
          <Meter v={(b.block / b.blockBase) * 100} tint="#12c9a0" />
          <span className="mono w-[92px] shrink-0 text-right text-[11.5px]" style={{ color: "var(--muted)" }}>
            fair {b.blockBase}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono w-[104px] shrink-0 text-[11.5px]" style={{ color: "var(--faint)" }}>
            ceiling margin
          </span>
          <Meter v={(Math.max(0, b.margin) / 9.9) * 300} gradient={grad} />
          <span className="mono w-[92px] shrink-0 text-right text-[11.5px]" style={{ color: "var(--muted)" }}>
            {b.margin >= 0 ? "+" : ""}
            {b.margin.toFixed(2)}pp
          </span>
        </div>
      </div>

      {/* ---------- per-strategy breakdown ---------- */}
      <div className="relative mt-4 flex flex-wrap gap-2.5">
        {m.signals.map((s) => {
          const on = s === b;
          return (
            <span
              key={s.side}
              className="mono rounded-xl border-[1.5px] px-3.5 py-2 text-[11.5px] font-bold transition-transform duration-300 hover:-translate-y-0.5"
              style={
                on
                  ? { borderColor: "rgba(255,194,74,.65)", color: "#ffc24a", background: "rgba(255,194,74,.1)" }
                  : { borderColor: "var(--line-2)", color: "var(--faint)" }
              }
            >
              {s.side} · worst {s.worst.toFixed(2)}%
            </span>
          );
        })}
      </div>

      {/* ---------- why ---------- */}
      <div className="relative mt-4">
        <span
          className="mono inline-block rounded-xl px-3.5 py-2 text-[11.5px]"
          style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)" }}
        >
          {b.tier === "hot" ? "✓ " : "◌ "}
          {b.reason}
        </span>
      </div>

      {/* ---------- action ---------- */}
      <div className="relative mt-4 flex flex-wrap items-center gap-3.5">
        <button
          onClick={onOpenSignal}
          className="rounded-xl px-5 py-3 text-[13.5px] font-black text-[#3a1a00] transition-transform duration-300 hover:-translate-y-0.5"
          style={{ background: grad, boxShadow: "0 14px 30px -14px rgba(255,138,31,.95)" }}
        >
          Open in Signal AI →
        </button>
        <span className="mono text-[11.5px]" style={{ color: "var(--faint)" }}>
          {b.tier === "hot" ? "every loser under 9.9% · no climb" : "close call — verify in the rule lab"}
        </span>
      </div>
    </article>
  );
}

/* ================================================================
   Hot markets panel
   ================================================================ */
export function HotMarketsPanel({
  open,
  onClose,
  hot,
  scanning,
  total,
  source,
  detail,
  strict,
  onToggleStrict,
  onRefresh,
  onOpenSignal,
}: {
  open: boolean;
  onClose: () => void;
  hot: HotMarket[];
  scanning: boolean;
  total: number;
  source: string;
  detail: string;
  strict: boolean;
  onToggleStrict: () => void;
  onRefresh: () => void;
  onOpenSignal: () => void;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const hotCount = hot.filter((m) => m.best.tier === "hot").length;
  const warmCount = hot.length - hotCount;
  const list = hot.filter((m) => (q ? `${m.label} ${m.id} ${m.best.side}`.toLowerCase().includes(q.toLowerCase()) : true));

  return (
    <div className="A-fade fixed inset-0 z-[96] grid place-items-center bg-black/72 p-3 backdrop-blur-md" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="dt-dark-scope A-drop flex max-h-[94vh] w-full max-w-[1090px] flex-col overflow-hidden rounded-[24px] border-[1.5px]"
        style={{ borderColor: "rgba(255,140,50,.35)", background: "linear-gradient(180deg,#160f28,#0a0f24)", boxShadow: "0 70px 140px -50px #000" }}
      >
        {/* ---------- header ---------- */}
        <div className="relative shrink-0 border-b px-5 py-4" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,120,40,.06), transparent)" }}>
          <span className="A-glow pointer-events-none absolute -left-16 -top-24 h-56 w-56 rounded-full blur-3xl" style={{ background: "radial-gradient(circle,#ff7a2d,transparent 70%)", opacity: 0.3 }} />

          <div className="relative flex flex-wrap items-center gap-4">
            <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl" style={{ background: "rgba(255,120,40,.16)", color: "#ff8a3d" }}>
              <svg viewBox="0 0 24 24" className="h-7 w-7 A-blink" fill="currentColor">
                <path d={FLAME} />
              </svg>
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="flex flex-wrap items-center gap-2.5 text-[21px] font-black tracking-tight">
                Hot Markets
                <span className="mono text-[19px]" style={{ color: "#ff8a3d" }}>
                  {hot.length}
                </span>
                <span className="mono text-[15px] font-bold" style={{ color: "var(--faint)" }}>
                  /{total}
                </span>
                <span className="rounded-lg px-2.5 py-1 text-[10.5px] font-black tracking-wider" style={{ background: TIER.hot.bg, color: TIER.hot.fg }}>
                  {hotCount} HOT
                </span>
                <span className="rounded-lg px-2.5 py-1 text-[10.5px] font-black tracking-wider" style={{ background: "rgba(255,176,32,.14)", color: "var(--gold)" }}>
                  {warmCount} WARM
                </span>
              </h2>
              <p className="mono mt-1.5 text-[12px]" style={{ color: "var(--muted)" }}>
                1000-tick scan · losers under 9.9% · {source === "live" ? "live" : source === "sim" ? "simulated" : "connecting"}
              </p>
              <p className="mono mt-0.5 text-[11px]" style={{ color: "var(--faint)" }}>
                {detail}
              </p>
            </div>

            <button
              onClick={onRefresh}
              className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-2xl border transition-all duration-300 hover:rotate-180"
              style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}
              title="Rescan"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-2xl border transition-all duration-300 hover:rotate-90 hover:border-[var(--red)]"
              style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}
              title="Close"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          {/* filter row */}
          <div className="relative mt-3.5 flex flex-wrap items-center gap-2.5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter markets or strategy…"
              className="mono w-[240px] rounded-xl border-[1.5px] bg-transparent px-3.5 py-2.5 text-[12px] outline-none"
              style={{ borderColor: "var(--line-2)", color: "var(--text)" }}
            />
            {(["OVER 2", "OVER 3", "UNDER 7", "UNDER 6"] as const).map((s) => {
              const c = hot.filter((m) => m.signals.some((x) => x.side === s)).length;
              return (
                <button
                  key={s}
                  onClick={onToggleStrict}
                  className="mono rounded-xl border-[1.5px] px-3 py-2 text-[11.5px] font-bold transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: c ? "rgba(255,140,50,.5)" : "var(--line)", color: c ? "#ffc24a" : "var(--faint)" }}
                >
                  {s} · {c}
                </button>
              );
            })}
            <button
              onClick={onToggleStrict}
              className="mono ml-auto rounded-xl border-[1.5px] px-3.5 py-2 text-[11.5px] font-bold transition-transform duration-300 hover:-translate-y-0.5"
              style={{
                borderColor: strict ? "rgba(255,138,61,.7)" : "var(--line-2)",
                color: strict ? "#ff8a3d" : "var(--muted)",
                background: strict ? "rgba(255,138,61,.12)" : "transparent",
              }}
              title="Show only markets where every losing digit is strictly under 9.9%"
            >
              {strict ? "◉ hot only (strict)" : "◎ include warm setups"}
            </button>
          </div>
        </div>

        {/* ---------- list ---------- */}
        <div className="space-y-4 overflow-y-auto p-5">
          {scanning && !hot.length && (
            <div className="py-14 text-center">
              <span
                className="A-spin mx-auto block h-10 w-10 rounded-full border-2"
                style={{ borderColor: "transparent", borderTopColor: "#ff8a3d", borderRightColor: "rgba(255,138,61,.4)" }}
              />
              <p className="mt-4 text-[13px]" style={{ color: "var(--muted)" }}>
                Scanning every market across 1000 ticks…
              </p>
            </div>
          )}

          {!scanning && !list.length && (
            <div className="py-14 text-center">
              <p className="text-[14px] font-extrabold" style={{ color: "var(--muted)" }}>
                No market qualifies right now
              </p>
              <p className="mx-auto mt-2 max-w-[420px] text-[12.5px] leading-relaxed" style={{ color: "var(--faint)" }}>
                The scan lights up when a losing block runs cold and none of its digits is climbing back toward 10%.
                That is a genuinely rare edge — the fire stays dark until one appears.
              </p>
              <button onClick={onRefresh} className="mt-5 rounded-xl border-[1.5px] px-5 py-2.5 text-[12px] font-extrabold" style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}>
                Rescan now
              </button>
            </div>
          )}

          {list.map((m, i) => (
            <MarketRow
              key={m.id}
              m={m}
              i={i}
              onOpenSignal={() => {
                onOpenSignal();
                onClose();
              }}
            />
          ))}
        </div>

        {/* ---------- footer ---------- */}
        <div className="shrink-0 border-t px-5 py-3.5 text-[11.5px] leading-relaxed" style={{ borderColor: "var(--line)", background: "rgba(255,120,40,.04)", color: "var(--faint)" }}>
          A cold losing block raises the win share of the opposite digits — but the market stays random. Verify any setup
          in the Rule Lab and size your stake before running it live.
        </div>
      </div>
    </div>
  );
}
