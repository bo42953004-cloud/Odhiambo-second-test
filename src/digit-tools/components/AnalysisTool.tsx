import { useMemo, useState } from "react";
import { GROUPS, MARKETS, type Group } from "../lib/deriv";
import { useMultiFeed, type MarketStatus, type MultiFeedState } from "../lib/multifeed";

/* ---------------- per-market scan maths ---------------- */
type Scan = {
  id: string;
  label: string;
  group: Group;
  groupColor: string;
  n: number;
  price: number | null;
  per: number[];
  counts: number[];
  hot: number;
  cold: number;
  last: number | null;
  strip: number[];
  evenP: number;
  oddP: number;
  riseP: number;
  fallP: number;
  overP: number;
  underP: number;
  spread: number;
  ready: boolean;
  /** rank of each digit by count: 0 = most appearing, 9 = least appearing */
  rank: number[];
  /** size of the rolling buffer this market holds */
  sampleSize: number;
};

function scan(
  id: string,
  digits: number[],
  quotes: number[],
  priceNow: number | undefined,
  n: number,
  barrier: number,
  bufferSize: number,
): Scan {
  const m = MARKETS.find((x) => x.id === id)!;
  const used = digits.slice(-n);
  const qs = quotes.slice(-n);
  const total = used.length;
  const counts = Array.from({ length: 10 }, () => 0);
  for (const d of used) counts[d]++;

  const per = counts.map((c) => (total ? (c / total) * 100 : 0));
  let hot = 0;
  let cold = 0;
  for (let d = 1; d < 10; d++) {
    if (counts[d] > counts[hot]) hot = d;
    if (counts[d] < counts[cold]) cold = d;
  }

  const evenC = used.filter((d) => d % 2 === 0).length;
  const overC = used.filter((d) => d > barrier).length;

  let rise = 0;
  let fall = 0;
  for (let i = 1; i < qs.length; i++) {
    if (qs[i] > qs[i - 1]) rise++;
    else if (qs[i] < qs[i - 1]) fall++;
  }
  const moves = rise + fall || 1;

  const groupColor = GROUPS.find((g) => g.key === m.group)?.color ?? "var(--cyan)";

  // ranking: count desc, ties broken by digit asc so the colours never flicker
  const order = Array.from({ length: 10 }, (_, d) => d).sort((a, b) => counts[b] - counts[a] || a - b);
  const rank = Array.from({ length: 10 }, () => 0);
  order.forEach((d, pos) => {
    rank[d] = pos;
  });

  return {
    id,
    label: m.label,
    group: m.group,
    groupColor,
    n: total,
    price: priceNow ?? null,
    per,
    counts,
    hot,
    cold,
    last: total ? used[total - 1] : null,
    strip: used.slice(-10),
    evenP: total ? (evenC / total) * 100 : 0,
    oddP: total ? ((total - evenC) / total) * 100 : 0,
    riseP: (rise / moves) * 100,
    fallP: (fall / moves) * 100,
    overP: total ? (overC / total) * 100 : 0,
    underP: total ? ((total - overC) / total) * 100 : 0,
    spread: per.length ? Math.max(...per) - Math.min(...per) : 0,
    ready: total >= 20,
    rank,
    sampleSize: bufferSize,
  };
}

/* ---------------- ranked colouring ----------------
   #1 most appearing  → green
   #2 most appearing  → blue
   #2 least appearing → yellow
   #1 least appearing → red
   everything else    → neutral                                       */
const RANK_STYLE = [
  { bg: "color-mix(in srgb, var(--green) 26%, transparent)", bd: "var(--green)", fg: "var(--green)", glow: "0 0 16px color-mix(in srgb, var(--green) 55%, transparent)" },
  { bg: "color-mix(in srgb, #2f7bff 26%, transparent)", bd: "#5b95ff", fg: "#9dc0ff", glow: "0 0 14px color-mix(in srgb, #2f7bff 45%, transparent)" },
  { bg: "rgba(255,255,255,.055)", bd: "var(--line-2)", fg: "var(--muted)", glow: "none" },
  { bg: "color-mix(in srgb, var(--gold) 22%, transparent)", bd: "var(--gold)", fg: "var(--gold)", glow: "0 0 14px color-mix(in srgb, var(--gold) 45%, transparent)" },
  { bg: "color-mix(in srgb, var(--red) 24%, transparent)", bd: "var(--red)", fg: "#ff97a1", glow: "0 0 16px color-mix(in srgb, var(--red) 50%, transparent)" },
];

/** position: 0 = hottest, 1 = 2nd hottest, 8 = 2nd coldest, 9 = coldest */
function rankStyle(position: number) {
  if (position === 0) return RANK_STYLE[0];
  if (position === 1) return RANK_STYLE[1];
  if (position === 8) return RANK_STYLE[3];
  if (position === 9) return RANK_STYLE[4];
  return RANK_STYLE[2];
}

function SplitBar({
  lLabel,
  rLabel,
  lp,
  rp,
  lBg,
  rBg,
}: {
  lLabel: string;
  rLabel: string;
  lp: number;
  rp: number;
  lBg: string;
  rBg: string;
}) {
  return (
    <div className="flex h-6 overflow-hidden rounded-lg text-[10px] font-extrabold">
      <div className="flex min-w-0 items-center gap-1 px-2" style={{ width: `${lp}%`, background: lBg, color: "#04170f" }}>
        <span className="truncate">
          {lLabel}: {lp.toFixed(1)}%
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1 px-2" style={{ background: rBg, color: "#fff" }}>
        <span className="truncate">
          {rLabel}: {rp.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

/** one digit bubble, coloured by its frequency rank */
function DigitCircle({
  d,
  p,
  rank,
  isLast,
  hasData,
}: {
  d: number;
  p: number;
  rank: number;
  isLast: boolean;
  hasData: boolean;
}) {
  const r = rankStyle(rank);
  const top = rank <= 1;
  const bottom = rank >= 8;
  return (
    <div
      className="relative flex aspect-square flex-col items-center justify-center rounded-full py-1 transition-all duration-300"
      style={{
        background: r.bg,
        border: `1.5px solid ${isLast ? "var(--cyan)" : r.bd}`,
        boxShadow: isLast ? "0 0 0 3px rgba(41,211,245,.22), 0 0 18px rgba(41,211,245,.5)" : r.glow,
      }}
    >
      <span className="mono text-[14px] font-extrabold leading-none" style={{ color: top || bottom ? r.fg : "#e6eeff" }}>
        {d}
      </span>
      <span className="mono mt-0.5 text-[8.5px] font-bold leading-none" style={{ color: r.fg }}>
        {hasData ? `${p.toFixed(1)}%` : "—"}
      </span>
      {isLast && (
        <span
          className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full text-[7px] font-black"
          style={{ background: "var(--cyan)", color: "#04121f" }}
        >
          ●
        </span>
      )}
    </div>
  );
}

/** Glowing ▲ with its own contrasting plate so it reads on any background. */
function LastPointer({ on, seq }: { on: boolean; seq: number }) {
  return (
    <span className="relative flex h-6 items-end justify-center">
      {on && (
        <>
          {/* beam rising to the digit */}
          <span
            key={`beam-${seq}`}
            className="pointer-events-none absolute -top-3 bottom-0 w-[3px] rounded-full"
            style={{
              background: "linear-gradient(180deg,transparent,var(--cyan))",
              boxShadow: "0 0 14px var(--cyan), 0 0 4px #fff",
            }}
          />
          {/* arrow on a dark puck so it never washes out */}
          <span
            className="A-bob absolute -top-2 grid h-[20px] w-[20px] place-items-center rounded-full"
            style={{
              background: "linear-gradient(160deg, rgba(8,16,44,.96), rgba(4,8,26,.98))",
              border: "1.5px solid var(--cyan)",
              boxShadow: "0 0 16px var(--cyan), 0 0 0 3px rgba(41,211,245,.16)",
            }}
          >
            <span className="text-[11px] leading-none" style={{ color: "var(--cyan)", textShadow: "0 0 8px var(--cyan)" }}>
              ▲
            </span>
          </span>
        </>
      )}
    </span>
  );
}

const STATUS_STYLE: Record<MarketStatus, { c: string; t: string }> = {
  live: { c: "var(--green)", t: "live" },
  history: { c: "var(--cyan)", t: "history" },
  pending: { c: "var(--gold)", t: "loading" },
  unavailable: { c: "var(--red)", t: "unavailable" },
  failed: { c: "var(--red)", t: "no feed" },
};

function ScanCard({ s, i, sample, status }: { s: Scan; i: number; sample: number; status: MarketStatus }) {
  return (
    <article
      className="dt-panel dt-sheen relative overflow-hidden p-3"
      style={{ animation: `dt-up .6s cubic-bezier(.22,1,.36,1) ${Math.min(i, 18) * 45}ms both` }}
    >
      <span className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg,transparent,${s.groupColor},transparent)` }} />

      {/* header */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[12.5px] font-extrabold tracking-tight">{s.label}</h3>
          <div className="mono mt-0.5 text-[15px] font-black" style={{ color: "var(--green)" }}>
            {s.price != null ? s.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 }) : "loading…"}
          </div>
          <div className="mono mt-0.5 text-[9.5px]" style={{ color: s.n >= 30 ? "var(--faint)" : "var(--gold)" }}>
            {s.n.toLocaleString()} / {s.sampleSize} ticks collected
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className="mono rounded-md px-2 py-0.5 text-[9.5px] font-black"
            style={{ background: "rgba(140,175,255,.16)", color: "#bcd2ff", border: "1px solid rgba(140,175,255,.28)" }}
          >
            Last {sample}
          </span>
          <span className="mono flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[8.5px] font-black" style={{ background: `color-mix(in srgb, ${STATUS_STYLE[status].c} 14%, transparent)`, color: STATUS_STYLE[status].c }}>
            <span className={status === "pending" ? "A-blink h-1.5 w-1.5 rounded-full" : "h-1.5 w-1.5 rounded-full"} style={{ background: STATUS_STYLE[status].c }} />
            {STATUS_STYLE[status].t}
          </span>
          <span className="mono rounded-md px-1.5 py-0.5 text-[8.5px] font-black" style={{ background: "rgba(255,255,255,.06)", color: s.groupColor }}>
            {s.group}
          </span>
        </div>
      </div>

      {/* empty state — only while this market has no ticks yet */}
      {s.n === 0 && (
        <div className="mt-2.5 flex items-center gap-2 rounded-xl border px-2.5 py-2" style={{ borderColor: "var(--line)", background: "var(--chip)" }}>
          <span className="A-spin h-3.5 w-3.5 shrink-0 rounded-full border-2" style={{ borderColor: "transparent", borderTopColor: "var(--cyan)", borderRightColor: "var(--cyan)" }} />
          <span className="mono text-[10px]" style={{ color: "var(--muted)" }}>
            waiting for Deriv ticks on {s.id}…
          </span>
        </div>
      )}

      {/* digit board — 2 rows of 5 circles, pointer gutter between the rows */}
      <div className="mt-2.5 grid grid-cols-5 gap-x-1.5">
        {[0, 1, 2, 3, 4].map((d) => (
          <DigitCircle key={d} d={d} p={s.per[d]} rank={s.rank[d]} isLast={d === s.last} hasData={s.n > 0} />
        ))}

        {/* middle gutter — pointer for the upper row */}
        <div className="col-span-5 grid grid-cols-5 gap-x-1.5 py-1">
          {[0, 1, 2, 3, 4].map((d) => (
            <LastPointer key={d} on={d === s.last} seq={s.n} />
          ))}
        </div>

        {[5, 6, 7, 8, 9].map((d) => (
          <DigitCircle key={d} d={d} p={s.per[d]} rank={s.rank[d]} isLast={d === s.last} hasData={s.n > 0} />
        ))}
      </div>

      {/* pointer row for the lower digits */}
      <div className="mt-0.5 grid grid-cols-5 gap-x-1.5">
        {[5, 6, 7, 8, 9].map((d) => (
          <LastPointer key={d} on={d === s.last} seq={s.n} />
        ))}
      </div>

      {/* tick strip */}
      <div className="mt-2.5 grid grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, k) => {
          const d = s.strip[k];
          const has = d != null;
          const over = has && d > barrier;
          return (
            <span
              key={k}
              className="mono grid h-7 place-items-center rounded-md text-[10.5px] font-extrabold transition-all duration-300"
              style={{
                background: !has
                  ? "rgba(255,255,255,.04)"
                  : over
                    ? "color-mix(in srgb, var(--green) 20%, transparent)"
                    : "color-mix(in srgb, var(--red) 18%, transparent)",
                color: !has ? "var(--faint)" : over ? "var(--green)" : "#ff9aa5",
                border: k === 9 && has ? "1px solid rgba(255,255,255,.22)" : "1px solid transparent",
              }}
            >
              {has ? d : "·"}
            </span>
          );
        })}
      </div>

      {/* split bars */}
      <div className="mt-2.5 space-y-1.5">
        <SplitBar
          lLabel="Even"
          rLabel="Odd"
          lp={s.evenP}
          rp={s.oddP}
          lBg="linear-gradient(90deg,#0f9d7a,#12c9a0)"
          rBg="linear-gradient(90deg,#f59e0b,#ef6c2b)"
        />
        <SplitBar
          lLabel="Rise"
          rLabel="Fall"
          lp={s.riseP}
          rp={s.fallP}
          lBg="linear-gradient(90deg,#0f9d7a,#12c9a0)"
          rBg="linear-gradient(90deg,#e8484f,#ef3b4a)"
        />
        <SplitBar
          lLabel={`Over ${barrier}`}
          rLabel={`Under ${barrier + 1}`}
          lp={s.overP}
          rp={s.underP}
          lBg="linear-gradient(90deg,#0f9d7a,#12c9a0)"
          rBg="linear-gradient(90deg,#e8484f,#ef3b4a)"
        />
      </div>
    </article>
  );
}

const barrier = 4; // Over 4 / Under 5 — matches the reference board

/* ---------------- the board ---------------- */
export function AnalysisTool({ sharedFeed }: { sharedFeed?: MultiFeedState }) {
  const ids = useMemo(() => MARKETS.map((m) => m.id), []);
  const cap = 1000; // rolling buffer per market — data is pulled the moment this tab opens

  /* Prefer the app-level scan feed, but only while it is actually delivering.
     If it is still connecting or has no ticks, this tool opens its own sockets
     so the board can never sit permanently empty. */
  const sharedOk =
    !!sharedFeed &&
    (sharedFeed.total > 0 ||
      sharedFeed.source === "live" ||
      Object.values(sharedFeed.digits).some((d) => (d ? d.length > 0 : false)));
  const own = useMultiFeed(ids, cap, !sharedOk);
  const feed = sharedOk && sharedFeed ? sharedFeed : own;

  const [sample, setSample] = useState(1000);
  const [group, setGroup] = useState<"ALL" | Group>("ALL");
  const [sort, setSort] = useState<"default" | "spread" | "over" | "under">("default");

  const scans = useMemo(
    () =>
      ids.map((id) =>
        scan(id, feed.digits[id] ?? [], feed.quotes[id] ?? [], feed.price[id], sample, barrier, cap),
      ),
    [ids, feed.digits, feed.quotes, feed.price, sample],
  );

  const list = useMemo(() => {
    const f = scans.filter((s) => (group === "ALL" ? true : s.group === group));
    const ready = f.filter((s) => s.ready);
    if (sort === "spread") return [...f].sort((a, b) => b.spread - a.spread);
    if (sort === "over") return [...f].sort((a, b) => b.overP - a.overP);
    if (sort === "under") return [...f].sort((a, b) => b.underP - a.underP);
    // default: markets with data first
    return [...ready, ...f.filter((s) => !s.ready)];
  }, [scans, group, sort]);

  const live = scans.filter((s) => s.ready).length;
  const avgSpread = live ? scans.filter((s) => s.ready).reduce((a, s) => a + s.spread, 0) / live : 0;
  const mostOver = live ? scans.filter((s) => s.ready).reduce((a, b) => (b.overP > a.overP ? b : a)) : null;
  const mostUnder = live ? scans.filter((s) => s.ready).reduce((a, b) => (b.underP > a.underP ? b : a)) : null;
  const mostEven = live ? scans.filter((s) => s.ready).reduce((a, b) => (Math.abs(b.evenP - 50) > Math.abs(a.evenP - 50) ? b : a)) : null;

  return (
    <div className="space-y-4">
      {/* controls */}
      <div className="dt-panel A-up flex flex-wrap items-center gap-3 p-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--faint)" }}>
            Analysis tool
          </div>
          <p className="mt-0.5 max-w-[330px] text-[11.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Live scan of every market at once — digit heat, tick tape, parity, rise/fall and the over/under split.
          </p>
        </div>

        <div>
          <label className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Window
          </label>
            <div className="mt-1 flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,.05)" }}>
            {[100, 250, 500, 1000].map((v) => (
              <button
                key={v}
                onClick={() => setSample(v)}
                className="mono rounded-lg px-2.5 py-1.5 text-[10.5px] font-extrabold transition-all duration-300"
                style={{
                  background: sample === v ? "linear-gradient(135deg,var(--cyan),#134b96)" : "transparent",
                  color: sample === v ? "#04091f" : "var(--muted)",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Group
          </label>
          <div className="mt-1 flex flex-wrap gap-1">
            {(["ALL", ...GROUPS.map((g) => g.key)] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g as "ALL" | Group)}
                className="rounded-lg border px-2.5 py-1.5 text-[10.5px] font-extrabold transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: group === g ? "var(--cyan)" : "var(--line)",
                  color: group === g ? "var(--cyan)" : "var(--muted)",
                  background: group === g ? "rgba(41,211,245,.12)" : "transparent",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
            Sort
          </label>
          <div className="mt-1 flex flex-wrap gap-1">
            {([["default", "Default"], ["spread", "Digit spread"], ["over", "Most over"], ["under", "Most under"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className="rounded-lg border px-2.5 py-1.5 text-[10.5px] font-extrabold transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: sort === k ? "var(--purple)" : "var(--line)",
                  color: sort === k ? "#b79bfb" : "var(--muted)",
                  background: sort === k ? "rgba(139,92,246,.14)" : "transparent",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex flex-col items-end gap-1.5">
          <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold" style={{ color: feed.source === "live" ? "var(--green)" : "var(--gold)" }}>
            <span className="A-blink h-2 w-2 rounded-full" style={{ background: feed.source === "live" ? "var(--green)" : "var(--gold)" }} />
            {feed.source === "live"
              ? `LIVE · ${ids.length - feed.broken.length}/${ids.length} markets · via ${
                  feed.transport === "wss" ? "WebSocket" : feed.transport === "https" ? "HTTPS polling" : "feed"
                }`
              : feed.source === "sim"
                ? "OFFLINE · nothing is connecting"
                : "CONNECTING…"}
          </span>
          <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
            {feed.total.toLocaleString()} ticks · {feed.detail}
          </span>
          <button onClick={feed.retry} className="rounded-lg border px-2.5 py-1 text-[10.5px] font-extrabold" style={{ borderColor: "var(--cyan)", color: "var(--cyan)" }}>
            ↔ Reconnect now
          </button>
        </div>
      </div>

      {/* ---- transport diagnostics: tells you exactly what is blocked ---- */}
      {(feed.source !== "live" || feed.broken.length > 0) && (
        <div
          className="dt-panel flex flex-wrap items-start gap-3 p-3.5"
          style={{
            borderColor: feed.source === "live" ? "rgba(245,183,49,.45)" : "rgba(239,59,74,.45)",
            background: feed.source === "live" ? "rgba(245,183,49,.06)" : "rgba(239,59,74,.06)",
          }}
        >
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[15px]"
            style={{ background: feed.source === "live" ? "rgba(245,183,49,.16)" : "rgba(239,59,74,.16)", color: feed.source === "live" ? "var(--gold)" : "var(--red)" }}
          >
            !
          </span>
          <div className="min-w-[240px] flex-1">
            <div className="text-[12px] font-extrabold" style={{ color: feed.source === "live" ? "var(--gold)" : "var(--red)" }}>
              {feed.source === "live" ? "Partial coverage" : "No transport reached Deriv"}
            </div>
            <div className="mono mt-1 text-[10.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {feed.diag || "No error captured yet."}
            </div>
            <div className="mono mt-1 text-[10px]" style={{ color: "var(--faint)" }}>
              tried: WebSocket (3 endpoints) → HTTPS polling ·{" "}
              {feed.transport === "none" ? "no transport succeeded" : `winner: ${feed.transport}`}
              {feed.broken.length > 0 && ` · unavailable: ${feed.broken.join(", ")}`}
            </div>
            {feed.source === "sim" && (
              <div className="mt-2 text-[10.5px] leading-relaxed" style={{ color: "#cfdcff" }}>
                Both the <b>WebSocket</b> and the <b>HTTPS</b> route to Deriv were refused by this browser context —
                that is a sandbox/CSP block on the page hosting the app, not a bug in the analyser. Open the built file
                in a normal browser tab (or your own domain) and it will stream. The board keeps working meanwhile with a
                clearly-labelled simulated feed.
              </div>
            )}
          </div>
        </div>
      )}

      {/* summary strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {([
          ["Markets scanned", `${live}/${ids.length}`, "var(--cyan)"],
          ["Avg digit spread", `${avgSpread.toFixed(1)}pp`, "var(--purple)"],
          ["Most over-biased", mostOver ? `${mostOver.id} · ${mostOver.overP.toFixed(1)}%` : "—", "var(--green)"],
          ["Most under-biased", mostUnder ? `${mostUnder.id} · ${mostUnder.underP.toFixed(1)}%` : "—", "var(--red)"],
        ] as const).map(([k, v, c], i) => (
          <div
            key={k}
            className="dt-panel p-3.5"
            style={{ borderColor: `color-mix(in srgb, ${c} 28%, transparent)`, animation: `dt-up .55s cubic-bezier(.22,1,.36,1) ${i * 70}ms both` }}
          >
            <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--faint)" }}>
              {k}
            </div>
            <div className="mono mt-1 text-[15px] font-extrabold" style={{ color: c }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      {mostEven && (
        <div className="dt-panel flex flex-wrap items-center gap-3 px-4 py-2.5 text-[11px]">
          <span className="mono rounded-md px-2 py-1 font-extrabold" style={{ background: "rgba(41,211,245,.14)", color: "var(--cyan)" }}>
            parity tilt
          </span>
          <span style={{ color: "var(--muted)" }}>
            Strongest parity skew right now: <b style={{ color: "#dbe7ff" }}>{mostEven.label}</b> at{" "}
            <b style={{ color: mostEven.evenP >= 50 ? "var(--cyan)" : "var(--gold)" }}>
              {mostEven.evenP >= 50 ? `even ${mostEven.evenP.toFixed(1)}%` : `odd ${mostEven.oddP.toFixed(1)}%`}
            </b>{" "}
            against a fair coin.
          </span>
        </div>
      )}

      {/* board — 3 compact cards per row */}
      <div key={`${group}-${sort}-${sample}`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {list.map((s, i) => (
          <ScanCard key={s.id} s={s} i={i} sample={sample} status={feed.status[s.id] ?? "pending"} />
        ))}
      </div>

      <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--faint)" }}>
        Digits come from each market's own <span className="mono">pip_size</span>. Percentages cover the newest {sample} ticks of a
        rolling {cap}-tick buffer. Green/red in the tape = over {barrier} / under {barrier + 1}. Rise &amp; fall compare consecutive
        quotes; unchanged ticks are excluded from that split.
      </p>
    </div>
  );
}
