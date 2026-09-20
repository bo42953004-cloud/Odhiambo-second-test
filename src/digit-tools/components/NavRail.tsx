import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HotSign } from "./HotMarkets";

type Tab = {
  id: string;
  label: string;
  a: string; // bright accent
  b: string; // deep accent
  anim: "draw" | "gear" | "spark" | "bob" | "flash" | "fan" | "radar" | "scan";
  paths: string[];
  scanline?: string;
  badge?: boolean;
  /** idle motion profile applied while the tab is resting */
  idle: string;
};

export const TABS: Tab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    a: "#3b82f6",
    b: "#0d2f92",
    anim: "draw",
    idle: "dt-bob",
    paths: ["M3 10.5 12 3l9 7.5", "M5.5 9.5V21h13V9.5", "M9.5 21v-6h5v6"],
  },
  {
    id: "botbuilder",
    label: "Bot Builder",
    a: "#29d3f5",
    b: "#0b5f8f",
    anim: "gear",
    idle: "dt-tick-spin",
    paths: [
      "M12 15.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z",
      "M19.6 14.6a1.5 1.5 0 0 0 .3 1.7l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.4v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.7.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.4-.9H3.4a1.9 1.9 0 1 1 0-3.8h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.7l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4V3.4a1.9 1.9 0 1 1 3.8 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.7-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.5 1.5 0 0 0-1.4.9Z",
    ],
  },
  {
    id: "auto",
    label: "Auto Trading",
    a: "#a855f7",
    b: "#5b21b6",
    anim: "spark",
    idle: "dt-breathe",
    badge: true,
    paths: [
      "m12 3 1.9 5.7L19.6 10.6l-5.7 1.9L12 18.2l-1.9-5.7L4.4 10.6l5.7-1.9L12 3Z",
      "m18.6 15.2.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z",
    ],
  },
  {
    id: "free",
    label: "Free Bots",
    a: "#12c9a0",
    b: "#0b6b58",
    anim: "bob",
    idle: "dt-bob",
    paths: [
      "M12 2.6v2.6",
      "M8.5 12.4h.01M15.5 12.4h.01",
      "M5.6 8.4h12.8a1.8 1.8 0 0 1 1.8 1.8v6.2a1.8 1.8 0 0 1-1.8 1.8H5.6a1.8 1.8 0 0 1-1.8-1.8v-6.2a1.8 1.8 0 0 1 1.8-1.8Z",
      "M8.2 18.2v2M15.8 18.2v2",
    ],
  },
  {
    id: "premium",
    label: "Premium AI Bots",
    a: "#f5b731",
    b: "#95611a",
    anim: "flash",
    idle: "dt-swing",
    paths: ["M13.4 2.6 5.6 14h5.3l-1.4 7.4L17 9.9h-5.3l1.7-7.3Z"],
  },
  {
    id: "signal",
    label: "Signal AI",
    a: "#2bb3ff",
    b: "#134b96",
    anim: "radar",
    idle: "dt-breathe",
    paths: [
      "M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8Z",
      "M12 15.9a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8Z",
      "M12 4.6V12l4.4 2.6",
    ],
  },
  {
    id: "manual",
    label: "Manual Trader",
    a: "#ec4899",
    b: "#8d174d",
    anim: "scan",
    idle: "dt-sweep-y",
    paths: ["M3.2 4.6h17.6v11.6H3.2z", "M8 20.4h8", "M12 16.2v4.2"],
    scanline: "M5.4 8.6h13.2",
  },
  {
    id: "bulk",
    label: "Bulk Trader",
    a: "#6366f1",
    b: "#312e81",
    anim: "fan",
    idle: "dt-swing",
    paths: [
      "m12 2.8 8.8 4.4-8.8 4.4-8.8-4.4 8.8-4.4Z",
      "m20.8 11.4-8.8 4.4-8.8-4.4",
      "m20.8 15.6-8.8 4.4-8.8-4.4",
    ],
  },
  {
    id: "clicker",
    label: "",
    a: "#f97316",
    b: "#9a3412",
    anim: "flash",
    idle: "dt-nod",
    paths: ["M14 4.4 20.4 12M14 4.4V2.4M20.4 12h2M3.6 3.8l6.6 16.4 2.2-6.4 6.4-2.3L3.6 3.8Z"],
  },
];

/** default left → right order of the rearrangeable tabs */
export const DEFAULT_TAB_ORDER = ["dashboard", "botbuilder", "auto", "free", "premium", "signal", "manual", "bulk"];

/* ------------------------------------------------ arrange sheet */
function ArrangeSheet({
  order,
  onClose,
  onSave,
  onReset,
}: {
  order: string[];
  onClose: () => void;
  onSave: (o: string[]) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<string[]>(order);

  useEffect(() => setDraft(order), [order]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.length) return;
    const next = [...draft];
    [next[i], next[j]] = [next[j], next[i]];
    setDraft(next);
  };

  return (
    <div className="A-fade fixed inset-0 z-[95] flex items-start justify-center bg-black/70 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="dt-dark-scope A-drop mt-[6vh] w-full max-w-[430px] overflow-hidden rounded-[20px] border"
        style={{ borderColor: "var(--line-2)", background: "linear-gradient(180deg,#0a1338,#050b22)", boxShadow: "0 60px 120px -40px #000" }}
      >
        <div className="flex items-center gap-3 border-b p-4" style={{ borderColor: "var(--line)" }}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: "rgba(245,183,49,.16)", color: "var(--gold)" }}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h10M4 12h13M4 17h7M18 5v6M18 13v6M15.5 8.5 18 11l2.5-2.5M15.5 15.5 18 13l2.5 2.5" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15.5px] font-extrabold tracking-tight">Arrange tabs</h2>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              Move each tab up or down, then save your layout.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300 hover:rotate-90 hover:border-[var(--red)]"
            style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="max-h-[52vh] space-y-2 overflow-y-auto p-4">
          {draft.map((id, i) => {
            const t = TABS.find((x) => x.id === id);
            if (!t) return null;
            return (
              <div key={id} className="arr-row" style={{ animation: `dt-up .4s cubic-bezier(.22,1,.36,1) ${i * 45}ms both` }}>
                <span className="mono w-4 text-[10px] font-black" style={{ color: "var(--faint)" }}>
                  {i + 1}
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${t.a} 18%, transparent)`, color: t.a }}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {t.paths.map((d) => (
                      <path key={d} d={d} />
                    ))}
                  </svg>
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold">{t.label}</span>
                <button className="arr-mv" disabled={i === 0} onClick={() => move(i, -1)} title="Move up">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M6 11l6-6 6 6" />
                  </svg>
                </button>
                <button className="arr-mv" disabled={i === draft.length - 1} onClick={() => move(i, 1)} title="Move down">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M6 13l6 6 6-6" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 border-t p-4" style={{ borderColor: "var(--line)" }}>
          <button
            onClick={() => {
              onReset();
              onClose();
            }}
            className="flex-1 rounded-xl border py-2.5 text-[12px] font-extrabold transition-transform hover:-translate-y-0.5"
            style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}
          >
            ↺ Reset to default
          </button>
          <button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="flex-1 rounded-xl py-2.5 text-[12px] font-extrabold text-[#001a17] transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(90deg,#29d3f5,#12c9a0)" }}
          >
            ✓ Save order
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------ rail */
export function NavRail({
  active,
  setActive,
  order,
  onSaveOrder,
  onResetOrder,
  hotCount,
  hotScanning,
  onOpenHot,
}: {
  active: string;
  setActive: (s: string) => void;
  order: string[];
  onSaveOrder: (o: string[]) => void;
  onResetOrder: () => void;
  hotCount: number;
  hotScanning: boolean;
  onOpenHot: () => void;
}) {
  const rail = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, w: 0, ready: false });
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; c: string }[]>([]);
  const [arrange, setArrange] = useState(false);
  const idRef = useRef(0);

  const ordered = useMemo(
    () => order.map((id) => TABS.find((t) => t.id === id)).filter((t): t is Tab => !!t),
    [order],
  );
  const orderKey = order.join("|");

  const measure = useCallback(
    (center = false) => {
      const el = track.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
      if (!el) return;
      setPos({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
      if (center) {
        const railEl = rail.current;
        if (railEl) railEl.scrollTo({ left: el.offsetLeft - railEl.clientWidth / 2 + el.offsetWidth / 2, behavior: "smooth" });
      }
    },
    // orderKey ensures the pill re-measures after a rearrange
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, orderKey],
  );

  useLayoutEffect(() => {
    measure(true);
  }, [measure]);

  useEffect(() => {
    const onResize = () => measure(false);
    window.addEventListener("resize", onResize);
    const t = window.setTimeout(() => measure(false), 800);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [measure]);

  const fire = (el: HTMLElement, color: string) => {
    const r = rail.current?.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    if (!r) return;
    const id = idRef.current++;
    setBursts((l) => [...l, { id, x: b.left - r.left + b.width / 2, y: b.height / 2 + 8, c: color }]);
    window.setTimeout(() => setBursts((l) => l.filter((x) => x.id !== id)), 720);
  };

  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  const renderTab = (t: Tab, i: number) => {
    const on = t.id === active;
    const isClicker = t.id === "clicker";
    return (
      <button
        key={t.id}
        data-tab={t.id}
        data-active={on}
        title={isClicker ? "One-click trading" : t.label}
        onClick={(e) => {
          setActive(t.id);
          fire(e.currentTarget, t.a);
        }}
        onMouseMove={(e) => {
          if (isClicker) return;
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
          e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
        }}
        className={`tab ${isClicker ? "ml-1 !px-2" : ""}`}
        style={{
          ["--i" as string]: i,
          /* the tab's own accent drives every active-state detail */
          color: t.a,
          animation: `dt-drop .55s cubic-bezier(.34,1.42,.5,1) ${i * 55}ms both`,
        }}
      >
        {on && <span className="halo" aria-hidden />}

        <span
          className={`ico ico-${t.anim}`}
          style={{
            color: t.a,
            /* idle motion profile + glow colour per tab */
            ["--idle-anim" as string]: t.idle,
            ["--idle-c" as string]: `${t.a}bb`,
          }}
        >
          <span className="ico-ring" />
          <span className="ico-ring2" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {t.paths.map((d) => (
              <path key={d} d={d} />
            ))}
            {t.scanline && <path className="scanline" d={t.scanline} strokeWidth="2.6" />}
          </svg>
        </span>

        {!isClicker && <span className="lbl">{t.label}</span>}

        {t.badge && (
          <span className="relative ml-1 grid h-[18px] w-[18px] shrink-0 place-items-center">
            <svg viewBox="0 0 40 40" className="A-spin absolute inset-0 h-full w-full" style={{ animationDuration: "5.5s" }}>
              <polygon
                points="20,1 25,6 32,4 34,11 40,14 37,20 40,26 34,29 32,36 25,34 20,39 15,34 8,36 6,29 0,26 3,20 0,14 6,11 8,4 15,6"
                fill="#e8232f"
              />
            </svg>
            <span className="relative text-[4.5px] font-black leading-none text-white">NEW</span>
          </span>
        )}

        <span className="toptab" />
        <span className="trim" />
        <span className="dotp" />
      </button>
    );
  };

  return (
    <>
      {/* the wrapper is the positioning context — the sink must live OUTSIDE the
          scrolling rail, otherwise it scrolls away with the tabs */}
      <div className="dt-rail-wrap">
      <div className="dt-rail" ref={rail}>
        <div ref={track} className="dt-track">
          {pos.ready && (
            <span
              className="dt-trail"
              style={{
                transform: `translateX(${pos.x}px)`,
                width: pos.w,
                background: `linear-gradient(135deg, ${current.a}, ${current.b})`,
              }}
            />
          )}
          {pos.ready && (
            <span
              className="dt-pill"
              style={{
                transform: `translateX(${pos.x}px)`,
                width: pos.w,
                background: `linear-gradient(135deg, ${current.a} 0%, ${current.b} 62%, ${current.b} 100%)`,
                boxShadow: `0 16px 38px -14px ${current.a}, 0 0 0 1px color-mix(in srgb, ${current.a} 45%, transparent), inset 0 1px 0 rgba(255,255,255,.35)`,
              }}
            />
          )}
          {/* the sign — opens the tab arranger */}
          <button className="arr-sign" onClick={() => setArrange(true)} title="Arrange tabs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h10M4 12h13M4 17h7M18 5v6M18 13v6M15.5 8.5 18 11l2.5-2.5M15.5 15.5 18 13l2.5 2.5" />
            </svg>
            <span>Arrange</span>
          </button>

          {ordered.map(renderTab)}
        </div>
      </div>

      {/* tabs scroll behind this sink — the sign never moves */}
      <div className="rail-sink">
        <HotSign count={hotCount} scanning={hotScanning} onClick={onOpenHot} />
      </div>

      {bursts.map((b) => (
        <span key={b.id} className="dt-ring-out" style={{ left: b.x, top: b.y, color: b.c }} />
      ))}
      </div>

      {arrange && (
        <ArrangeSheet order={ordered.map((t) => t.id)} onClose={() => setArrange(false)} onSave={onSaveOrder} onReset={onResetOrder} />
      )}
    </>
  );
}
