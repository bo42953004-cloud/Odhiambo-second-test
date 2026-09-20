import { useEffect, useRef, useState } from "react";
import { AnalysisPanel } from "./AnalysisPanel";

/* ============ Floating AI orb → draggable anywhere on screen ============ */
const POS_KEY = "dt-ai-pos";

export function AIOrb() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      return raw ? (JSON.parse(raw) as { x: number; y: number }) : null;
    } catch {
      return null;
    }
  });
  const wrap = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ down: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    try {
      if (pos) localStorage.setItem(POS_KEY, JSON.stringify(pos));
      else localStorage.removeItem(POS_KEY);
    } catch {
      /* noop */
    }
  }, [pos]);

  const onDown = (e: React.PointerEvent) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { down: true, moved: false, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.down || !wrap.current) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    if (!drag.current.moved && Math.hypot(dx, dy) < 6) return;
    drag.current.moved = true;
    const w = wrap.current.offsetWidth;
    const h = wrap.current.offsetHeight;
    const x = Math.min(window.innerWidth - w - 8, Math.max(8, drag.current.ox + dx));
    const y = Math.min(window.innerHeight - h - 8, Math.max(8, drag.current.oy + dy));
    setPos({ x, y });
  };

  const onUp = () => {
    if (!drag.current.down) return;
    const moved = drag.current.moved;
    drag.current.down = false;
    if (!moved) setOpen((o) => !o);
  };

  const reset = () => {
    setPos(null);
    try {
      localStorage.removeItem(POS_KEY);
    } catch {
      /* noop */
    }
  };

  return (
    <>
      <div
        ref={wrap}
        className="fixed z-[90] touch-none select-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => (drag.current.down = false)}
        onDoubleClick={reset}
        style={pos ? { left: pos.x, top: pos.y } : { right: 20, bottom: 20 }}
      >
        {!open && (
          <div
            className="A-drop mb-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-center text-[9.5px] font-extrabold"
            style={{
              borderColor: "rgba(139,92,246,.5)",
              background: "rgba(12,10,40,.92)",
              color: "#d8c9ff",
              boxShadow: "0 18px 40px -20px #a855f7",
            }}
          >
            AI Digit Analysis
            <span className="A-bob ml-1 inline-block" style={{ color: "var(--cyan)" }}>
              ↓
            </span>
          </div>
        )}
        <div className="flex justify-center">
          <button
            title={
              open
                ? "Click to hide · drag to move · double-click to reset"
                : "Click to open · drag to move · double-click to reset"
            }
            className="group relative h-[44px] w-[44px] cursor-grab active:cursor-grabbing"
          >
            <span
              className="absolute inset-0 rounded-full blur-md A-glow"
              style={{ background: "conic-gradient(from 0deg,#8b5cf6,#c026d3,#f472b6,#8b5cf6)" }}
            />
            <span
              className="A-spin-r absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 90deg,#a855f7,#ec4899,#8b5cf6,#a855f7)",
                padding: 2,
              }}
            />
            <span
              className="absolute inset-[3px] grid place-items-center rounded-full transition-transform duration-500 group-hover:scale-105"
              style={{ background: "linear-gradient(160deg,#c084fc,#7c3aed 60%,#4c1d95)" }}
            >
              <span className="text-[11.5px] font-black tracking-tight text-white drop-shadow">AI</span>
            </span>
            <span
              className="A-blink absolute right-0 top-0 h-[11px] w-[11px] rounded-full border-2"
              style={{ background: "var(--green)", borderColor: "#0a1128" }}
            />
            {!open && <span className="A-ring absolute inset-0 rounded-full" />}
            {/* drag grip hint */}
            <span
              className="absolute -left-1 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: "rgba(12,10,40,.9)", borderColor: "rgba(168,85,247,.6)", color: "#d8c9ff" }}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <circle cx="9" cy="6" r="1.6" />
                <circle cx="15" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" />
                <circle cx="15" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" />
                <circle cx="15" cy="18" r="1.6" />
              </svg>
            </span>
            {pos && (
              <span
                className="absolute -right-1 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "rgba(12,10,40,.9)", borderColor: "rgba(168,85,247,.6)", color: "#d8c9ff" }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                title="Reset position"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>

      {open && <AnalysisPanel onClose={() => setOpen(false)} />}
    </>
  );
}

/* ============ Risk disclaimer — dismissed for the session once closed ============ */
export function RiskDisclaimer() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  const dismiss = () => {
    setOpen(false);
    setHidden(true); // returns on the next page refresh
  };

  if (hidden) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-3 z-50 flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-extrabold text-[#2b2200] transition-transform duration-300 hover:-translate-y-1 sm:left-5"
        style={{
          background: "linear-gradient(180deg,#ffe14d,#ffc400)",
          boxShadow: "0 14px 30px -14px rgba(255,196,0,.9)",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="currentColor">
          <path d="M12 2 1.5 21h21L12 2Zm0 6 1 7h-2l1-7Zm0 9.6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
        </svg>
        Risk Disclaimer
      </button>

      {open && (
        <div
          className="dt-dark-scope A-fade fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-md"
          onClick={dismiss}
        >
          <div
            className="A-pop w-full max-w-[620px] rounded-[20px] border p-7 sm:p-10"
            style={{
              borderColor: "rgba(255,255,255,.07)",
              background: "linear-gradient(180deg,#111a2e 0%,#0c1526 58%,#0a1120 100%)",
              boxShadow: "0 60px 120px -45px rgba(0,0,0,.95), inset 0 1px 0 rgba(255,255,255,.05)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center gap-3.5">
              <span
                className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px]"
                style={{
                  background: "linear-gradient(160deg,#43390f,#332b0a)",
                  border: "1px solid rgba(255,212,0,.28)",
                  color: "#ffd400",
                  boxShadow: "0 10px 24px -12px rgba(255,212,0,.7), inset 0 1px 0 rgba(255,255,255,.14)",
                }}
              >
                <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" fill="currentColor">
                  <path d="M12 2 1.5 21h21L12 2Zm0 6 1 7h-2l1-7Zm0 9.6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
                </svg>
              </span>
              <h3 className="text-[21px] font-extrabold tracking-tight" style={{ color: "#f2f6ff" }}>
                Risk Disclaimer
              </h3>
            </div>

            {/* body copy */}
            <p className="mt-5 text-[15.5px] leading-[1.7]" style={{ color: "#a3b1cc" }}>
              Trading derivative and synthetic index products carries a high level of risk and may not be suitable for
              every trader. Past performance is not a reliable indicator of future results. Automated bots, signals and
              AI tools on this workspace are decision aids — never guarantees. Only trade with money you can afford to
              lose, and always set your own stake and stop limits.
            </p>

            {/* limits */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[["Max daily loss", "5%"], ["Default stake", "$10"], ["Martingale", "OFF"]].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border px-4 py-3.5"
                  style={{ borderColor: "rgba(255,255,255,.08)", background: "rgba(255,255,255,.035)" }}
                >
                  <div className="text-[12px]" style={{ color: "#8e9db8" }}>
                    {k}
                  </div>
                  <div className="mono mt-1.5 text-[19px] font-extrabold leading-none" style={{ color: "var(--cyan)" }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>

            {/* action */}
            <button
              onClick={dismiss}
              className="mt-6 w-full rounded-xl py-4 text-[15px] font-extrabold transition-transform duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(90deg,#29d3f5 0%,#12c9a0 100%)",
                color: "#04241f",
                boxShadow: "0 18px 36px -18px rgba(41,211,245,.95)",
              }}
            >
              I understand · don't show again
            </button>

            <p className="mt-3.5 text-center text-[12.5px]" style={{ color: "#7b8aa6" }}>
              Closes the disclaimer for this session — it reappears if you refresh the page.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/* ============ Toast ============ */
export function Toast({ msg, c }: { msg: string; c: string }) {
  return (
    <div
      className="A-drop fixed right-4 z-[88] flex max-w-[86vw] items-center gap-2.5 rounded-xl border px-4 py-3 text-[12.5px] font-bold backdrop-blur-xl"
      style={{
        top: "calc(var(--chrome-h, 152px) + 10px)",
        borderColor: c,
        color: c,
        background: "rgba(9,17,44,.94)",
        boxShadow: `0 20px 40px -20px ${c}`,
      }}
    >
      <span className="grid h-5 w-5 place-items-center rounded-full text-[11px]" style={{ background: c, color: "#04091f" }}>✓</span>
      {msg}
    </div>
  );
}
