import { useEffect, useMemo, useRef, useState } from "react";
import { BOTS, botById, type Bot } from "../lib/bots";
import { byId, useDerivFeed } from "../lib/deriv";
import { evaluateStrategy, settleWin, PAYOUT, type Eval, type Entry } from "../lib/auto";

/* ---------------- shared bits ---------------- */
type Pos = { side: string; entry: Entry; remaining: number; stake: number; step: number };
type LogLine = { id: number; t: string; msg: string; tone: string; win?: boolean };

type Engine = {
  running: boolean;
  pos: Pos | null;
  pl: number;
  wins: number;
  losses: number;
  step: number;
  halted: string | null;
  log: LogLine[];
  fired: number;
};

const emptyEngine = (): Engine => ({
  running: false,
  pos: null,
  pl: 0,
  wins: 0,
  losses: 0,
  step: 0,
  halted: null,
  log: [],
  fired: 0,
});

function Toggle({ on, onClick, tone = "var(--green)" }: { on: boolean; onClick: () => void; tone?: string }) {
  return (
    <button
      onClick={onClick}
      className="relative h-7 w-[52px] shrink-0 rounded-full transition-colors duration-300"
      style={{ background: on ? tone : "rgba(255,255,255,.14)" }}
    >
      <span className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300" style={{ left: on ? 27 : 4 }} />
    </button>
  );
}

function CondRow({ c, i }: { c: Eval["conds"][number]; i: number }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border p-2.5"
      style={{
        borderColor: c.ok ? "rgba(18,201,160,.3)" : "var(--line)",
        background: c.ok ? "rgba(18,201,160,.06)" : "transparent",
        animation: `dt-up .4s cubic-bezier(.22,1,.36,1) ${i * 45}ms both`,
      }}
    >
      <span
        className="mt-[1px] grid h-4.5 w-4.5 shrink-0 place-items-center rounded text-[9.5px] font-black"
        style={{ background: c.ok ? "var(--green)" : "rgba(255,255,255,.07)", color: c.ok ? "#04091f" : "var(--faint)", width: 18, height: 18 }}
      >
        {c.ok ? "✓" : "—"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-extrabold">{c.label}</span>
          {c.required && (
            <span className="rounded px-1 py-0.5 text-[7.5px] font-black" style={{ background: "rgba(245,183,49,.18)", color: "var(--gold)" }}>
              REQ
            </span>
          )}
        </div>
        <div className="mono mt-0.5 text-[9.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
          {c.detail}
        </div>
      </div>
    </div>
  );
}

function Spark({ eq, c }: { eq: number[]; c: string }) {
  if (eq.length < 2) return <div className="h-8" />;
  const max = Math.max(...eq, 1);
  const min = Math.min(...eq, -1);
  const pts = eq.map((v, i) => `${(i / (eq.length - 1)) * 100},${32 - ((v - min) / (max - min || 1)) * 28}`).join(" ");
  return (
    <svg viewBox="0 0 100 34" className="h-8 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- one strategy engine row ---------------- */
function EngineCard({
  bot,
  engine,
  feed,
  ev,
  onPick,
  onToggle,
  index,
}: {
  bot: Bot;
  engine: Engine;
  feed: { digits: number[]; source: string; updated: number; total?: number };
  ev: Eval;
  onPick: (id: string) => void;
  onToggle: () => void;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const tone = bot.a;
  const pos = engine.pos;

  return (
    <article
      className="dt-panel relative overflow-hidden p-4"
      style={{
        borderColor: engine.running ? `color-mix(in srgb, ${tone} 45%, transparent)` : "var(--line)",
        animation: `dt-up .6s cubic-bezier(.22,1,.36,1) ${index * 90}ms both`,
      }}
    >
      <span className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg,transparent,${tone},transparent)` }} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[14px] font-black" style={{ background: `color-mix(in srgb, ${tone} 18%, transparent)`, color: tone }}>
          {bot.name[0]}
        </span>
        <div className="min-w-[140px] flex-1">
          <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-[13.5px] font-extrabold">
              {bot.name}
              <span className="text-[9px]" style={{ color: "var(--faint)" }}>
                ▼
              </span>
            </button>
            {open && (
              <div className="A-drop absolute left-0 top-7 z-30 max-h-[260px] w-[240px] overflow-y-auto rounded-xl border p-1.5" style={{ borderColor: "var(--line-2)", background: "rgba(8,16,44,.98)", boxShadow: "0 30px 60px -20px #000" }}>
                {BOTS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onPick(b.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-transform hover:translate-x-1"
                    style={{ background: b.id === bot.id ? "rgba(41,211,245,.12)" : "transparent" }}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: b.a }} />
                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold">{b.name}</span>
                    <span className="mono text-[9px]" style={{ color: "var(--faint)" }}>
                      {b.market}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mono mt-0.5 flex flex-wrap gap-1.5 text-[9.5px]">
            {[bot.market, bot.contract, `barrier ${bot.contract === "Even/Odd" ? "n/a" : bot.barrier}`, `${bot.duration}t`, `$${bot.stake.toFixed(2)}`].map((x) => (
              <span key={x} className="rounded px-1.5 py-0.5" style={{ background: "rgba(255,255,255,.06)", color: "var(--muted)" }}>
                {x}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="mono text-[14px] font-extrabold" style={{ color: engine.pl >= 0 ? "var(--green)" : "var(--red)" }}>
              {engine.pl >= 0 ? "+" : ""}
              {engine.pl.toFixed(2)}
            </div>
            <div className="mono text-[9px]" style={{ color: "var(--faint)" }}>
              {engine.wins}W / {engine.losses}L
            </div>
          </div>
          <Toggle on={engine.running} onClick={onToggle} tone={tone} />
        </div>
      </div>

      {/* status strip */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="lp-none rounded-md px-2 py-1 text-[9.5px] font-black uppercase tracking-wider"
          style={{
            background: engine.halted ? "rgba(239,59,74,.16)" : engine.running ? `color-mix(in srgb, ${tone} 20%, transparent)` : "rgba(255,255,255,.07)",
            color: engine.halted ? "var(--red)" : engine.running ? tone : "var(--muted)",
          }}
        >
          {engine.halted ? `halted · ${engine.halted}` : engine.running ? (pos ? "in a contract" : "scanning conditions") : "idle"}
        </span>
        <span className="mono rounded-md px-2 py-1 text-[9.5px]" style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)" }}>
          {feed.source === "live" ? "live feed" : feed.source === "sim" ? "simulated feed" : "connecting"}
        </span>
        <span className="mono rounded-md px-2 py-1 text-[9.5px]" style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)" }}>
          conf {engine.running ? ev.conf : 0}%
        </span>
        <span className="mono rounded-md px-2 py-1 text-[9.5px]" style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)" }}>
          fired {engine.fired}
        </span>
      </div>

      {/* open position */}
      {pos && engine.running && (
        <div className="mt-3 rounded-xl border p-3" style={{ borderColor: `color-mix(in srgb, ${tone} 45%, transparent)`, background: `color-mix(in srgb, ${tone} 8%, transparent)` }}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="mono text-[13px] font-black" style={{ color: tone }}>
              {pos.side}
            </span>
            <span className="mono text-[10.5px]" style={{ color: "var(--muted)" }}>
              stake ${pos.stake.toFixed(2)} · step {pos.step} · entry digit {pos.entry.digit}
            </span>
            <span className="mono ml-auto rounded-md px-2 py-1 text-[10px] font-black" style={{ background: "rgba(255,255,255,.08)", color: "var(--text)" }}>
              settles in {pos.remaining}t
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.09)" }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(pos.remaining / (bot.duration || 1)) * 100}%`, background: tone }} />
          </div>
        </div>
      )}

      {/* conditions */}
      {engine.running && !pos && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--faint)" }}>
              conditions
            </span>
            <span className="mono text-[10px]" style={{ color: ev.armed ? "var(--green)" : "var(--muted)" }}>
              {ev.conds.filter((c) => c.ok).length}/{ev.conds.length} met · {ev.reason}
            </span>
          </div>
          {ev.conds.map((c, i) => (
            <CondRow key={c.label} c={c} i={i} />
          ))}
        </div>
      )}

      {/* per-strategy log */}
      <div className="mt-3 space-y-1.5">
        {engine.log.slice(0, 4).map((l, i) => (
          <div
            key={l.id}
            className="flex items-start gap-2.5 rounded-lg border px-2.5 py-1.5"
            style={{ borderColor: "var(--line)", opacity: 1 - i * 0.16, animation: "dt-up .4s cubic-bezier(.22,1,.36,1) both" }}
          >
            <span className="mono shrink-0 text-[9px]" style={{ color: "var(--faint)" }}>
              {l.t}
            </span>
            <span className="text-[10.5px] leading-relaxed" style={{ color: l.tone }}>
              {l.msg}
            </span>
          </div>
        ))}
        {!engine.log.length && (
          <p className="text-[10.5px]" style={{ color: "var(--faint)" }}>
            No activity yet — switch the strategy on and it will log every condition check that fires.
          </p>
        )}
      </div>
    </article>
  );
}

/* ---------------- the view ---------------- */
export function AutoTrader() {
  const [ids, setIds] = useState<string[]>(["digit-sniper-v4", "even-hunter-pro", "pegasus-grid-ai"]);
  const [engines, setEngines] = useState<Engine[]>([emptyEngine(), emptyEngine(), emptyEngine()]);
  const [trades, setTrades] = useState<{ id: number; t: string; bot: string; side: string; stake: number; win: boolean; pl: number }[]>([]);
  const idRef = useRef(0);
  const lastTick = useRef<number[]>([0, 0, 0]);

  const bots = useMemo(() => ids.map((i) => botById(i) as Bot), [ids]);
  const m0 = useMemo(() => byId(bots[0].market), [bots]);
  const m1 = useMemo(() => byId(bots[1].market), [bots]);
  const m2 = useMemo(() => byId(bots[2].market), [bots]);

  const f0 = useDerivFeed(m0);
  const f1 = useDerivFeed(m1);
  const f2 = useDerivFeed(m2);
  const feeds = [f0, f1, f2];

  const evals = useMemo(
    () => bots.map((b, i) => evaluateStrategy(b, feeds[i].digits, feeds[i].quotes ?? [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bots, f0.digits, f1.digits, f2.digits, f0.updated, f1.updated, f2.updated],
  );

  const push = (i: number, msg: string, tone: string) => {
    setEngines((prev) =>
      prev.map((e, k) =>
        k !== i ? e : { ...e, log: [{ id: idRef.current++, t: new Date().toLocaleTimeString("en-GB", { hour12: false }), msg, tone }, ...e.log].slice(0, 12) },
      ),
    );
  };

  /* ---- per-tick settlement + entry ---- */
  useEffect(() => {
    if (!engines.some((e) => e.running)) return;

    engines.forEach((e, i) => {
      if (!e.running) return;
      const feed = feeds[i];
      const bot = bots[i];
      if (feed.updated === lastTick.current[i]) return;
      lastTick.current[i] = feed.updated;
      const digits = feed.digits;
      const quotes = feed.quotes ?? [];
      const lastDigit = digits[digits.length - 1];
      const lastQuote = quotes[quotes.length - 1];
      if (lastDigit == null) return;

      // 1) settle an open paper contract
      if (e.pos) {
        const remaining = e.pos.remaining - 1;
        if (remaining > 0) {
          setEngines((prev) => prev.map((x, k) => (k === i ? { ...x, pos: { ...x.pos!, remaining } } : x)));
          return;
        }
        const win = settleWin(bot, e.pos.side, e.pos.entry, lastDigit, lastQuote ?? e.pos.entry.quote);
        const pl = win ? e.pos.stake * PAYOUT : -e.pos.stake;
        const step = win ? 0 : Math.min(e.pos.step + 1, 5);
        const nextBase = bot.martingale ? Math.min(bot.stake * Math.pow(bot.martingale, step), bot.stake * 32) : bot.stake;
        const newPl = e.pl + pl;
        const capped = e.pos.step >= 5;

        setEngines((prev) =>
          prev.map((x, k) =>
            k !== i
              ? x
              : {
                  ...x,
                  pos: null,
                  pl: newPl,
                  wins: x.wins + (win ? 1 : 0),
                  losses: x.losses + (win ? 0 : 1),
                  step,
                  halted:
                    newPl <= -bot.stopLoss ? "stop loss" : newPl >= bot.takeProfit ? "take profit" : capped ? "recovery cap" : null,
                },
          ),
        );
        setTrades((t) =>
          [
            {
              id: idRef.current++,
              t: new Date().toLocaleTimeString("en-GB", { hour12: false }),
              bot: bot.name,
              side: e.pos!.side,
              stake: e.pos!.stake,
              win,
              pl,
            },
            ...t,
          ].slice(0, 40),
        );
        push(
          i,
          win
            ? `won +$${pl.toFixed(2)} on ${e.pos.side} · back to base stake`
            : `lost −$${Math.abs(pl).toFixed(2)} on ${e.pos.side} · recovery step ${step} (next stake $${nextBase.toFixed(2)})`,
          win ? "var(--green)" : "var(--red)",
        );
        return;
      }

      // 2) no position → evaluate conditions and fire
      if (e.halted) return;
      const ev = evals[i];
      if (!ev.armed) return;
      const stake = bot.martingale ? Math.min(bot.stake * Math.pow(bot.martingale, e.step), bot.stake * 32) : bot.stake;
      setEngines((prev) =>
        prev.map((x, k) =>
          k !== i
            ? x
            : {
                ...x,
                pos: { side: ev.side, entry: { digit: lastDigit, quote: lastQuote ?? 0 }, remaining: Math.max(1, bot.duration), stake, step: x.step },
                fired: x.fired + 1,
              },
        ),
      );
      push(i, `entered ${ev.side} · $${stake.toFixed(2)} · conf ${ev.conf}% · ${ev.reason}`, bot.a);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f0.updated, f1.updated, f2.updated]);

  const runningCount = engines.filter((e) => e.running).length;
  const totalPl = engines.reduce((a, e) => a + e.pl, 0);
  const wins = engines.reduce((a, e) => a + e.wins, 0);
  const losses = engines.reduce((a, e) => a + e.losses, 0);
  const hit = wins + losses ? (wins / (wins + losses)) * 100 : 0;

  let cum = 0;
  const equity = [...trades].reverse().map((t) => (cum += t.pl));

  return (
    <div className="space-y-4">
      {/* master panel */}
      <div className="dt-panel A-up p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[220px] flex-1">
            <h1 className="text-[17px] font-extrabold tracking-tight">Auto Trader</h1>
            <p className="mt-0.5 text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
              Each strategy watches its own market and only fires when its condition set is fully met — then it manages the
              contract, the recovery step and its own stop loss.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              ["Net P/L", `${totalPl >= 0 ? "+" : ""}${totalPl.toFixed(2)}`, totalPl >= 0 ? "var(--green)" : "var(--red)"],
              ["Contracts", `${wins + losses}`, "var(--cyan)"],
              ["Hit rate", `${hit.toFixed(0)}%`, hit >= 50 ? "var(--green)" : "var(--red)"],
              ["Running", `${runningCount}/3`, "var(--gold)"],
            ] as const).map(([k, v, c]) => (
              <div key={k} className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--line)" }}>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--faint)" }}>
                  {k}
                </div>
                <div className="mono mt-0.5 text-[14px] font-extrabold" style={{ color: c }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setEngines((prev) =>
                  prev.map((e) => ({ ...emptyEngine(), running: true, log: [{ id: idRef.current++, t: new Date().toLocaleTimeString("en-GB", { hour12: false }), msg: "engine started · scanning conditions", tone: "var(--cyan)" }, ...e.log].slice(0, 12) })),
                )
              }
              className="rounded-xl px-4 py-2.5 text-[12px] font-black text-[#001a17] transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(90deg,#29d3f5,#12c9a0)" }}
            >
              ▶ Start all
            </button>
            <button
              onClick={() => setEngines((prev) => prev.map((e) => ({ ...e, running: false, pos: null })))}
              className="rounded-xl border px-4 py-2.5 text-[12px] font-extrabold transition-transform hover:-translate-y-0.5"
              style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}
            >
              ■ Stop all
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: "rgba(245,183,49,.35)", background: "rgba(245,183,49,.06)" }}>
          <span className="text-[10.5px] font-black uppercase tracking-wider" style={{ color: "var(--gold)" }}>
            paper mode
          </span>
          <span className="text-[11px]" style={{ color: "var(--muted)" }}>
            Contracts settle against the live tick stream but no real orders are placed. Wire your own Deriv token to execute for real.
          </span>
        </div>
      </div>

      {/* engines */}
      <div className="grid gap-4 xl:grid-cols-2">
        {bots.map((b, i) => (
          <EngineCard
            key={`${i}-${b.id}`}
            index={i}
            bot={b}
            engine={engines[i]}
            feed={feeds[i]}
            ev={evals[i]}
            onPick={(id) => {
              setIds((prev) => prev.map((x, k) => (k === i ? id : x)));
              setEngines((prev) => prev.map((x, k) => (k === i ? emptyEngine() : x)));
            }}
            onToggle={() =>
              setEngines((prev) =>
                prev.map((x, k) =>
                  k !== i
                    ? x
                    : {
                        ...x,
                        running: !x.running,
                        halted: !x.running ? null : x.halted,
                        log: [{ id: idRef.current++, t: new Date().toLocaleTimeString("en-GB", { hour12: false }), msg: !x.running ? "strategy armed · watching conditions" : "strategy paused", tone: !x.running ? "var(--cyan)" : "var(--muted)" }, ...x.log].slice(0, 12),
                      },
                ),
              )
            }
          />
        ))}
      </div>

      {/* portfolio */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <div className="dt-panel p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-extrabold tracking-tight">Session equity</h3>
            <span className="mono text-[12px] font-extrabold" style={{ color: totalPl >= 0 ? "var(--green)" : "var(--red)" }}>
              {totalPl >= 0 ? "+" : ""}
              {totalPl.toFixed(2)} USD
            </span>
          </div>
          <Spark eq={equity} c={totalPl >= 0 ? "var(--green)" : "var(--red)"} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {([["Wins", wins, "var(--green)"], ["Losses", losses, "var(--red)"], ["Open", engines.filter((e) => e.pos).length, "var(--cyan)"]] as const).map(([k, v, c]) => (
              <div key={k} className="rounded-xl border p-2.5" style={{ borderColor: "var(--line)" }}>
                <div className="text-[9px]" style={{ color: "var(--faint)" }}>
                  {k}
                </div>
                <div className="mono mt-0.5 text-[14px] font-extrabold" style={{ color: c }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dt-panel p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-extrabold tracking-tight">Contract journal</h3>
            <span className="mono text-[10.5px]" style={{ color: "var(--faint)" }}>
              {trades.length} settled
            </span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider" style={{ color: "var(--faint)" }}>
                  {["Time", "Strategy", "Side", "Stake", "Result", "P/L"].map((h) => (
                    <th key={h} className="pb-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="a-row border-t text-[12px]" style={{ borderColor: "var(--line)" }}>
                    <td className="mono py-2.5" style={{ color: "var(--muted)" }}>
                      {t.t}
                    </td>
                    <td className="py-2.5 font-semibold">{t.bot}</td>
                    <td className="mono py-2.5" style={{ color: "var(--cyan)" }}>
                      {t.side}
                    </td>
                    <td className="mono py-2.5">${t.stake.toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className="rounded px-1.5 py-0.5 text-[9.5px] font-black" style={t.win ? { background: "var(--green)", color: "#04091f" } : { background: "var(--red)", color: "#fff" }}>
                        {t.win ? "WIN" : "LOSS"}
                      </span>
                    </td>
                    <td className="mono py-2.5 font-extrabold" style={{ color: t.pl >= 0 ? "var(--green)" : "var(--red)" }}>
                      {t.pl >= 0 ? "+" : ""}
                      {t.pl.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {!trades.length && (
                  <tr>
                    <td colSpan={6} className="py-4 text-[11.5px]" style={{ color: "var(--faint)" }}>
                      No contracts yet. Start a strategy — it will only enter once every required condition is met.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
