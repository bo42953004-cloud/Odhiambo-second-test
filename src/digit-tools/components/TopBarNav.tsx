import { useEffect, useState } from "react";
import { LiveOrb, LiveText } from "./LiveOrb";

/* ============ 3D demo mark — glowing capital D ============ */
export function DemoD({ size = 30 }: { size?: number }) {
  return (
    <span
      className="demo-d"
      style={{ width: size, height: size, fontSize: size * 0.56, borderRadius: size * 0.3 }}
      title="Demo account"
      aria-label="Demo account"
    >
      D
    </span>
  );
}

/* ============ US flag — 3D tile, drawn as one SVG so the gloss
   can never wash the stripes out (it also scales with any size prop) ============ */
function UsFlag({ size = 30 }: { size?: number }) {
  return (
    <span
      className="flag-3d"
      style={{ width: size * 1.42, height: size, borderRadius: size * 0.2 }}
      title="Real USD account"
      aria-label="United States — USD account"
    >
      <svg viewBox="0 0 60 40" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "100%" }} shapeRendering="crispEdges">
        {/* thirteen stripes */}
        {Array.from({ length: 13 }, (_, i) => (
          <rect key={i} y={(40 / 13) * i} width="60" height={40 / 13 + 0.35} fill={i % 2 === 0 ? "#b22234" : "#ffffff"} />
        ))}
        {/* star canton */}
        <rect width="25" height={(40 / 13) * 7} fill="#3c3b6e" />
        {Array.from({ length: 9 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) => (
            <circle key={`${r}-${c}`} cx={2.6 + c * 5} cy={1.9 + r * 2.9} r="1" fill="#ffffff" />
          )),
        )}
      </svg>
    </span>
  );
}

/* ============ Top bar — account: USD (real) or Demo ============ */
export function TopBar({
  theme,
  onToggleTheme,
}: {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const [account, setAccount] = useState<"USD" | "demo">("USD");
  const [open, setOpen] = useState(false);
  const [real, setReal] = useState(0.3);
  const [demo, setDemo] = useState(10000);

  useEffect(() => {
    const iv = setInterval(() => {
      setReal((b) => Math.max(0.05, +(b + (Math.random() - 0.48) * 0.06).toFixed(2)));
      setDemo((b) => +(b + (Math.random() - 0.42) * 9).toFixed(2));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const isDemo = account === "demo";
  const bal = isDemo ? demo : real;

  const options = [
    { id: "USD" as const, label: "USD", note: "Real account", icon: <UsFlag /> },
    { id: "demo" as const, label: "Demo", note: "Practice balance", icon: <DemoD size={24} /> },
  ];

  return (
    <div
      className="relative z-40"
      style={{ background: "var(--bar-bg)", color: "var(--bar-fg)", borderBottom: "1px solid var(--bar-line)" }}
    >
      <div className="flex h-[62px] items-center gap-3 px-3 sm:px-5">
        {/* live ticker label keeps the bar from feeling empty on the left */}
        <div className="flex items-center gap-2.5">
          <span
            className="logo-shine flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-3"
            style={{ borderColor: "var(--bar-line)", background: "var(--bar-chip)" }}
          >
            <LiveOrb size={20} />
            <LiveText className="text-[10.5px] font-black uppercase tracking-[0.16em]">live feed</LiveText>
          </span>
          <span className="hidden text-[11px] font-semibold sm:block" style={{ color: "var(--bar-sub)" }}>
            20 markets · 1000-tick windows
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* theme switch */}
          <div className="theme-sw" title="Switch theme">
            <button data-on={theme === "dark"} onClick={() => theme !== "dark" && onToggleTheme()} aria-label="Dark theme">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
            </button>
            <button data-on={theme === "light"} onClick={() => theme !== "light" && onToggleTheme()} aria-label="Light theme">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
              </svg>
            </button>
          </div>

          {/* account selector: USD / Demo */}
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[12px] font-bold transition-all hover:-translate-y-0.5"
              style={{ borderColor: "var(--bar-line)", color: "var(--bar-fg)" }}
            >
              {isDemo ? <DemoD size={20} /> : <UsFlag />}
              <span style={{ letterSpacing: "0.02em" }}>{isDemo ? "Demo" : "USD"}</span>
              <svg
                viewBox="0 0 24 24"
                className={`h-3 w-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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
                className="A-drop absolute right-0 top-[46px] z-50 w-[228px] overflow-hidden rounded-xl border p-1.5 shadow-2xl"
                style={{ borderColor: "var(--bar-line)", background: "var(--bar-bg)" }}
              >
                {options.map((o, i) => {
                  const on = o.id === account;
                  return (
                    <button
                      key={o.id}
                      onClick={() => {
                        setAccount(o.id);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-300 hover:translate-x-0.5"
                      style={{ background: on ? "var(--bar-chip)" : "transparent", animation: `dt-up .3s ease ${i * 50}ms both` }}
                    >
                      {o.icon}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-bold" style={{ color: "var(--bar-fg)" }}>
                          {o.label}
                        </span>
                        <span className="block text-[9.5px]" style={{ color: "var(--bar-sub)" }}>
                          {o.note}
                        </span>
                      </span>
                      {on && (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="var(--cyan)" strokeWidth="3.2" strokeLinecap="round">
                          <path d="m5 13 4.5 4.5L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden h-6 w-px sm:block" style={{ background: "var(--bar-line)" }} />

          {/* balance */}
          <div className="flex items-center gap-1.5">
            <span
              className="A-blink live-halo h-2 w-2 rounded-full"
              style={{ background: isDemo ? "var(--cyan)" : "var(--green)", boxShadow: `0 0 10px ${isDemo ? "var(--cyan)" : "var(--green)"}` }}
            />
            <span className="mono text-[21px] font-extrabold tracking-tight" style={{ color: isDemo ? "var(--cyan)" : "#0d9d80" }}>
              {bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[12.5px] font-bold" style={{ color: "var(--bar-sub)" }}>
              USD
            </span>
          </div>

          {isDemo && (
            <span
              className="hidden rounded-md px-2 py-1 text-[9.5px] font-black uppercase sm:block"
              style={{ letterSpacing: "0.14em", background: "rgba(41,211,245,.14)", border: "1px solid rgba(41,211,245,.4)", color: "var(--cyan)" }}
            >
              demo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ Action bar ============
   The rolling market strip was removed (it was heavy and made the chrome busy).
   The bar is kept so the Run control stays exactly where it was placed. */
export function TickerBar({ action }: { action?: React.ReactNode }) {
  return (
    <div
      className="relative z-20 flex items-center gap-3 border-b px-3 py-1.5 sm:px-4"
      style={{ background: "var(--ticker-bg)", borderColor: "var(--line)" }}
    >
      <span className="flex items-center gap-2">
        <LiveOrb size={16} />
        <span className="text-[10.5px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          20 markets · 1000-tick windows
        </span>
      </span>
      <span className="mono ml-auto text-[10.5px]" style={{ color: "var(--faint)" }}>
        paper mode · no real orders placed
      </span>
      {action}
    </div>
  );
}
