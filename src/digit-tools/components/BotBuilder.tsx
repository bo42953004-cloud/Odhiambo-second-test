import { useEffect, useRef, useState } from "react";
import { botToXml, type Bot } from "../lib/bots";
import { DemoD } from "./TopBarNav";

/* ---------------- icons ---------------- */
const I = {
  refresh: "M21 12a9 9 0 1 1-3-6.7M21 4v5h-5",
  open: "M4 4h6l2 3h8v13H4z",
  save: "M5 3h11l3 3v15H5zM8 3v6h8V3M8 15h8",
  undo: "M3 10h11a5 5 0 0 1 0 10H8M3 10l4-4M3 10l4 4",
  redo: "M21 10H10a5 5 0 0 0 0 10h6M21 10l-4-4M21 10l-4 4",
  zin: "M12 5v14M5 12h14",
  zout: "M5 12h14",
  chart: "M3 3v18h18M7 14l4-4 3 3 5-6",
  more: "M4 19V9m5 10V5m5 14v-7m5 7V8",
  bloc: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 8c-4 0-7 2-7 4.5V20h14v-4.5C19 13 16 11 12 11Z",
  smile: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.5-10h.01M15.5 11h.01M8.5 15a4 4 0 0 0 7 0",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",
  cube: "m12 3 8 4-8 4-8-4 8-4Zm8 4v10l-8 4-8-4V7m8 4v10",
  chev: "m6 9 6 6 6-6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-5.2-5.2",
  martin: "M4 20V9m5 11V4m5 16v-8m5 8V7",
};

function InputRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bd-input">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Icon({ d, w = 18 }: { d: string; w?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: w, height: w }}>
      <path d={d} />
    </svg>
  );
}

const CATS = [
  { n: "Analysis Logics", hot: true },
  { n: "Trade parameters" },
  { n: "Purchase conditions" },
  { n: "Sell conditions (optional)" },
  { n: "Restart trading conditions" },
  { n: "Analysis", chev: true },
];

function Chip({ label, value }: { label?: string; value: string }) {
  return (
    <span className="bd-chip">
      {label && <em style={{ fontStyle: "normal", opacity: 0.55 }}>{label}</em>}
      {value}
      <Icon d={I.chev} w={10} />
    </span>
  );
}

function Sw({ on }: { on: boolean }) {
  return (
    <span className={`bd-sw${on ? " on" : ""}`}>
      <i />
    </span>
  );
}

/* ---------------- block shells ---------------- */
function Block({ n, title, children, delay = 0, wide }: { n: string; title: string; children: React.ReactNode; delay?: number; wide?: boolean }) {
  return (
    <div className="bd-block" style={{ animationDelay: `${delay}ms`, gridColumn: wide ? "1 / -1" : undefined }}>
      <div className="bd-block-h">
        <span>{n}</span>
        {title}
      </div>
      <div className="bd-block-b">{children}</div>
    </div>
  );
}

/* ---------------- the builder ---------------- */
export function BotBuilderView({
  bot,
  onPickBot,
  running,
  onToggleRun,
}: {
  bot: Bot | null;
  onPickBot: () => void;
  /** run state is owned by App so the control can live in the ticker row */
  running: boolean;
  /** same runner, exposed again on the status line */
  onToggleRun: () => void;
}) {
  const [tab, setTab] = useState<"Summary" | "Transactions" | "Journal">("Summary");
  const [fast, setFast] = useState(true);
  const [menuOpen, setMenuOpen] = useState(true);
  const [q, setQ] = useState("");
  const [log, setLog] = useState<{ id: number; t: string; m: string; c?: string }[]>([]);
  const [now, setNow] = useState(new Date());
  const idRef = useRef(0);

  const cfg = bot ?? {
    name: "No strategy",
    market: "R_100",
    contract: "Over/Under",
    barrier: 5,
    stake: 1,
    duration: 1,
    martingale: 0,
    stopLoss: 0,
    takeProfit: 0,
    tier: "free" as const,
    logic: [] as string[],
  };

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setLog([{ id: idRef.current++, t: now2(), m: bot ? `${bot.name} loaded into the workspace` : "no strategy loaded", c: "var(--bd-sub)" }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot?.id]);

  useEffect(() => {
    if (!running) return;
    const iv = window.setInterval(() => {
      const won = Math.random() > 0.36;
      const stake = Math.max(0.35, cfg.stake);
      setLog((l) =>
        [
          {
            id: idRef.current++,
            t: now2(),
            m: won ? `contract won · +${(stake * 0.94).toFixed(2)} USD` : `contract lost · −${stake.toFixed(2)} USD`,
            c: won ? "#0f9d80" : "#e0413f",
          },
          ...l,
        ].slice(0, 40),
      );
    }, 2200);
    return () => window.clearInterval(iv);
  }, [running, cfg.stake]);

  function now2() {
    return new Date().toLocaleTimeString("en-GB", { hour12: false });
  }

  const xml = bot ? botToXml(bot) : "";
  const download = () => {
    if (!bot) return;
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bot.id}-digittools.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const settled = log.filter((l) => l.m.includes("contract")).length;
  const wins = log.filter((l) => l.m.includes("won")).length;
  const losses = settled - wins;
  const pl = wins * cfg.stake * 0.94 - losses * cfg.stake;

  const markerBar = (
    <div className="bd-toolbar A-up">
      {[I.refresh, I.open, I.save].map((d, i) => (
        <button key={i} className="bd-tool" title="File">
          <Icon d={d} />
        </button>
      ))}
      <span className="bd-sep" />
      {[I.undo, I.redo].map((d, i) => (
        <button key={i} className="bd-tool" title="History">
          <Icon d={d} />
        </button>
      ))}
      <span className="bd-sep" />
      {[I.chart, I.more, I.smile].map((d, i) => (
        <button key={i} className="bd-tool" title="View">
          <Icon d={d} />
        </button>
      ))}
      <span className="bd-sep" />
      {[I.zin, I.zout].map((d, i) => (
        <button key={i} className="bd-tool" title="Zoom">
          <Icon d={d} />
        </button>
      ))}
      <span className="bd-sep" />
      <button className="bd-tool" title="Search">
        <Icon d={I.search} />
      </button>
    </div>
  );

  return (
    <div className="space-y-0">
      <div className="bd-wrap bd-lock">
        {/* ============ LEFT ============ */}
        <div className="bd-col space-y-2.5">
          <button className="bd-panel bd-grad A-up bd-qstrat w-full" onClick={onPickBot}>
            Quick strategy
          </button>

          <div className="bd-panel A-up" style={{ animationDelay: "60ms" }}>
            <button className="bd-menuhead" onClick={() => setMenuOpen((o) => !o)}>
              Blocks menu
              <span style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .35s" }}>
                <Icon d={I.chev} w={16} />
              </span>
            </button>

            {menuOpen && (
              <div className="A-fade">
                <div className="bd-search">
                  <Icon d={I.search} w={15} />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
                </div>
                <div>
                  {CATS.filter((c) => (q ? c.n.toLowerCase().includes(q.toLowerCase()) : true)).map((c, i) => (
                    <button key={c.n} className="bd-cat" style={{ animation: `dt-up .4s ease ${i * 45}ms both` }} onClick={onPickBot}>
                      {c.n}
                      {c.hot && <span>🔥</span>}
                      {c.chev && (
                        <span style={{ marginLeft: "auto" }}>
                          <Icon d={I.chev} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ MIDDLE ============ */}
        <div className="bd-main">
          {markerBar}

          {/* live-trading inputs — the visual block builder has been removed */}
          <div className="bd-col bd-panel A-up" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2.5 px-3.5 py-3" style={{ borderBottom: "1px solid var(--bd-line)" }}>
              <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "color-mix(in srgb, #1a8ee0 16%, transparent)", color: "#1a8ee0" }}>
                <Icon d={I.martin} w={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-extrabold">Live strategy inputs</div>
                <div className="bd-sub text-[10.5px]">
                  Everything the runner needs. Wire these to your Deriv token when you take it live.
                </div>
              </div>
              <span
                className="mono rounded-md px-2 py-1 text-[9.5px] font-black uppercase"
                style={{
                  background: running ? "rgba(18,201,160,.16)" : "color-mix(in srgb, var(--bd-fg) 8%, transparent)",
                  color: running ? "#0f9d80" : "var(--bd-sub)",
                }}
              >
                {running ? "armed" : "idle"}
              </span>
            </div>

            <div className="grid gap-x-6 md:grid-cols-2">
              <div>
                <InputRow label="Market">
                  <select value={cfg.market} onChange={() => undefined} className="bd-sel">
                    {[...new Set([cfg.market, "R_10", "R_25", "R_50", "R_75", "R_100", "1HZ10V", "1HZ15V", "1HZ25V", "1HZ30V", "1HZ50V", "1HZ75V", "1HZ90V", "1HZ100V", "JD10", "JD25", "JD50", "JD75", "JD100"])].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </InputRow>
                <InputRow label="Contract type">
                  <select value={cfg.contract} onChange={() => undefined} className="bd-sel">
                    {["Over/Under", "Even/Odd", "Matches/Differs", "Rise/Fall"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </InputRow>
                <InputRow label="Barrier digit">
                  <div className="bd-step">
                    <span className="v">{cfg.contract === "Even/Odd" ? "n/a" : cfg.barrier}</span>
                  </div>
                </InputRow>
                <InputRow label="Stake (USD)">
                  <div className="bd-step">
                    <button>−</button>
                    <span className="v">{cfg.stake.toFixed(2)}</span>
                    <button>+</button>
                  </div>
                </InputRow>
              </div>
              <div>
                <InputRow label="Duration (ticks)">
                  <div className="bd-step">
                    <span className="v">{cfg.duration}</span>
                  </div>
                </InputRow>
                <InputRow label="Recovery multiplier">
                  <div className="bd-step">
                    <span className="v">{cfg.martingale ? `×${cfg.martingale}` : "flat"}</span>
                  </div>
                </InputRow>
                <InputRow label="Stop loss (USD)">
                  <div className="bd-step">
                    <span className="v">{cfg.stopLoss ? cfg.stopLoss.toFixed(2) : "off"}</span>
                  </div>
                </InputRow>
                <InputRow label="Take profit (USD)">
                  <div className="bd-step">
                    <span className="v">{cfg.takeProfit ? cfg.takeProfit.toFixed(2) : "off"}</span>
                  </div>
                </InputRow>
              </div>
            </div>

            {bot && (
              <div className="px-3.5 py-3" style={{ borderTop: "1px solid var(--bd-line)" }}>
                <div className="bd-sub text-[10px] font-bold uppercase tracking-wider">strategy rules</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {bot.logic.map((l) => (
                    <span key={l} className="bd-chip" style={{ whiteSpace: "normal", maxWidth: 320 }}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bd-canvas bd-hidden">
            <div className="bd-grid">
              {/* column A */}
              <div className="space-y-3">
                <Block n="1." title="Trade parameters" delay={80}>
                  <div className="bd-row">
                    <span>Market:</span>
                    <Chip value="synthetic_index" />
                    <span>›</span>
                    <Chip value="random_index" />
                    <span>›</span>
                    <Chip value={cfg.market} />
                  </div>
                  <div className="bd-row">
                    <span>Alternate markets (Continuous Indices only):</span>
                    <Sw on={false} />
                    <Chip label="every" value="1" />
                  </div>
                  <div className="bd-row">
                    <span>Auto-scan volatility markets and trade first match:</span>
                    <Sw on={false} />
                  </div>
                  <div className="bd-row">
                    <span>Virtual Hook:</span>
                    <Chip value="VM Settings" />
                  </div>
                  <div className="bd-row">
                    <span>Trade Type:</span>
                    <Chip value="Digitals" />
                    <span>›</span>
                    <Chip value={cfg.contract} />
                  </div>
                  <div className="bd-row">
                    <span>Contract Type:</span>
                    <Chip value={cfg.contract === "Even/Odd" ? "Even" : cfg.contract === "Matches/Differs" ? "Differs" : `Over ${cfg.barrier}`} />
                  </div>
                  <div className="bd-row">
                    <span>Default Candle Interval:</span>
                    <Chip value="1 minute" />
                  </div>
                  <div className="bd-row">
                    <span>Restart buy/sell on error (disable for better performance):</span>
                    <Sw on={false} />
                  </div>
                  <div className="bd-row">
                    <span>Restart last trade on error (bot ignores the unsuccessful trade):</span>
                    <Sw on={true} />
                  </div>
                  <div className="bd-row">
                    <span>Run once at start:</span>
                    <Sw on={false} />
                  </div>
                  <div className="bd-row">
                    <span>Trade options:</span>
                  </div>
                  <div className="bd-row bd-nest">
                    <Chip label="Duration: Ticks ›" value="1" />
                    <Chip label="Stake: USD" value={String(cfg.stake)} />
                  </div>
                </Block>

                <Block n="2." title="Purchase conditions" delay={230}>
                  <div className="bd-row">
                    <Chip label="Purchase" value={cfg.contract === "Even/Odd" ? "Even" : cfg.contract === "Matches/Differs" ? "Differs" : `Over ${cfg.barrier}`} />
                  </div>
                  {cfg.logic[0] && <div className="bd-row" style={{ opacity: 0.75 }}>{cfg.logic[0]}</div>}
                </Block>
              </div>

              {/* column B */}
              <div className="space-y-3">
                <Block n="3." title="Sell conditions" delay={150}>
                  <div className="bd-row">
                    <span>If</span>
                    <Chip value="Sell is available" />
                    <span>then</span>
                  </div>
                  <div className="bd-row bd-nest" style={{ opacity: 0.8 }}>
                    <Chip label="Stop loss" value={cfg.stopLoss ? `$${cfg.stopLoss}` : "off"} />
                    <Chip label="Take profit" value={cfg.takeProfit ? `$${cfg.takeProfit}` : "off"} />
                  </div>
                  {cfg.logic[3] && <div className="bd-row" style={{ opacity: 0.75 }}>{cfg.logic[3]}</div>}
                </Block>

                <Block n="4." title="Restart trading conditions" delay={300}>
                  <div className="bd-row">
                    <span>Trade again</span>
                  </div>
                  <div className="bd-row bd-nest" style={{ opacity: 0.8 }}>
                    <Chip label="Recovery" value={cfg.martingale ? `×${cfg.martingale}` : "flat"} />
                    <Chip label="Duration" value={`${cfg.duration} ticks`} />
                  </div>
                </Block>

                {bot?.logic.slice(1, 3).map((l, i) => (
                  <Block key={l} n="◦" title="Strategy rule" delay={380 + i * 70}>
                    <div className="bd-row">{l}</div>
                  </Block>
                ))}
              </div>
            </div>

            <button className="bd-trash" title="Clear canvas" onClick={() => setLog([])}>
              <Icon d={I.trash} w={26} />
            </button>
          </div>

          {/* ============ STATUS STRIP (run control now lives in the ticker row) ============ */}
          <div className="bd-runbar A-up" style={{ animationDelay: "120ms" }}>
            <div className="bd-fx">
              Execution
              <b>{fast ? "FAST" : "NORMAL"}</b>
            </div>
            <button
              onClick={() => setFast((f) => !f)}
              style={{ border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0 }}
              title="Toggle execution speed"
            >
              <span className={`bd-sw${fast ? " on" : ""}`}>
                <i />
              </span>
              <span className="bd-sub" style={{ fontSize: 11 }}>
                {fast ? "fast execution" : "standard"}
              </span>
            </button>
            <span className="bd-sub text-[11px]">
              {running ? "runner armed — contracts settle into Transactions" : "runner idle"}
            </span>

            <button
              className={`bd-paper${running ? " on" : ""}`}
              onClick={onToggleRun}
              title={running ? "Stop the paper runner" : "Run this strategy in paper mode"}
            >
              <i />
              {running ? "Stop paper run" : "Run in paper mode"}
            </button>

            <div className="bd-clock">
              <span>© {now.getFullYear()} DigitTools</span>
              <span>●</span>
              <span>
                {now.toISOString().slice(0, 10)} {now.toLocaleTimeString("en-GB", { hour12: false })} GMT
              </span>
              <span>☀</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <DemoD size={18} /> EN
              </span>
            </div>
          </div>
        </div>

        {/* ============ RIGHT ============ */}
        <div className="bd-right bd-col bd-panel A-up" style={{ animationDelay: "100ms" }}>
          <div className="bd-tabs">
            {(["Summary", "Transactions", "Journal"] as const).map((t) => (
              <button key={t} className={`bd-tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {tab === "Summary" && (
            <div className="A-fade">
              <div className="bd-actions">
                <button className="bd-btn-g" onClick={download}>
                  Download
                </button>
                <button className="bd-btn-g" onClick={onPickBot}>
                  View Detail
                </button>
              </div>
              <div className="bd-stats">
                <div className="bd-stat">
                  <div className="k">Type</div>
                  <div className="v">{cfg.contract}</div>
                </div>
                <div className="bd-stat">
                  <div className="k">Entry/Exit spot</div>
                  <div className="v">{cfg.market}</div>
                </div>
                <div className="bd-stat">
                  <div className="k">Buy price and P/L</div>
                  <div className="v">${cfg.stake.toFixed(2)}</div>
                </div>
              </div>
              <div className="bd-cube">
                <Icon d={I.cube} w={54} />
              </div>
              <div className="bd-stats" style={{ borderTop: "1px solid var(--bd-line)" }}>
                <div className="bd-stat">
                  <div className="k">Total stake</div>
                  <div className="v">{(settled * cfg.stake).toFixed(2)} USD</div>
                </div>
                <div className="bd-stat">
                  <div className="k">Total payout</div>
                  <div className="v">{(wins * cfg.stake * 1.94).toFixed(2)} USD</div>
                </div>
                <div className="bd-stat">
                  <div className="k">No. of runs</div>
                  <div className="v">{settled}</div>
                </div>
                <div className="bd-stat">
                  <div className="k">Contracts lost</div>
                  <div className="v">{losses}</div>
                </div>
                <div className="bd-stat">
                  <div className="k">Contracts won</div>
                  <div className="v">{wins}</div>
                </div>
                <div className="bd-stat">
                  <div className="k">Total profit/loss</div>
                  <div className="v" style={{ color: pl >= 0 ? "#0f9d80" : "#e0413f" }}>
                    {pl >= 0 ? "+" : ""}
                    {pl.toFixed(2)} USD
                  </div>
                </div>
              </div>
              <button className="bd-reset" onClick={() => setLog([])}>
                Reset
              </button>
            </div>
          )}

          {tab === "Transactions" && (
            <div className="bd-body A-fade" style={{ maxHeight: 460, overflowY: "auto" }}>
              {log.filter((l) => l.m.includes("contract")).length === 0 && (
                <p className="bd-sub" style={{ fontSize: 11.5 }}>
                  No contracts yet. Press Run and each settled contract will appear here.
                </p>
              )}
              <div className="space-y-1.5">
                {log
                  .filter((l) => l.m.includes("contract"))
                  .map((l) => (
                    <div key={l.id} className="bd-row" style={{ borderBottom: "1px solid var(--bd-line)", paddingBottom: 6 }}>
                      <span className="bd-sub" style={{ fontSize: 10.5, fontFamily: "ui-monospace" }}>
                        {l.t}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: l.c }}>
                        {l.m}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {tab === "Journal" && (
            <div className="bd-body A-fade" style={{ maxHeight: 460, overflowY: "auto" }}>
              <div className="space-y-2">
                {[
                  `${bot?.name ?? "No strategy"} — ${cfg.contract} on ${cfg.market}`,
                  `Barrier ${cfg.contract === "Even/Odd" ? "n/a" : cfg.barrier} · duration ${cfg.duration} tick(s)`,
                  `Stake ${cfg.stake.toFixed(2)} USD · recovery ${cfg.martingale ? `×${cfg.martingale}` : "flat"}`,
                  `Stop loss ${cfg.stopLoss || "off"} · take profit ${cfg.takeProfit || "off"}`,
                  running ? "Execution armed in paper mode" : "Execution idle",
                ].map((m, i) => (
                  <div key={m} className="bd-row" style={{ animation: `dt-up .4s ease ${i * 60}ms both` }}>
                    <span className="bd-sub" style={{ fontSize: 10.5 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 11.5 }}>{m}</span>
                  </div>
                ))}
                {bot?.logic.map((l) => (
                  <div key={l} className="bd-row" style={{ opacity: 0.8 }}>
                    <span style={{ fontSize: 11.5 }}>• {l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
