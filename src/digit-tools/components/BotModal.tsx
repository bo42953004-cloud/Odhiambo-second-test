import { useEffect, useMemo, useRef, useState } from "react";
import { BOTS, type Bot } from "../lib/bots";
import { parseBotXml, readTextFile } from "../lib/botFile";

function TierTag({ tier }: { tier: Bot["tier"] }) {
  const pre = tier === "premium";
  return (
    <span
      className="rounded-md px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wide"
      style={
        pre
          ? { background: "linear-gradient(90deg,#8b5cf6,#c026d3)", color: "#fff" }
          : { background: "rgba(18,201,160,.16)", color: "var(--green)" }
      }
    >
      {pre ? "★ Premium" : "Free"}
    </span>
  );
}

function BotRow({
  b,
  onLoad,
  active,
  i,
}: {
  b: Bot;
  onLoad: (b: Bot) => void;
  active: boolean;
  i: number;
}) {
  return (
    <div
      className="group flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        borderColor: active ? `color-mix(in srgb, ${b.a} 55%, transparent)` : "var(--line)",
        background: active ? `color-mix(in srgb, ${b.a} 9%, transparent)` : "transparent",
        animation: `dt-up .5s cubic-bezier(.22,1,.36,1) ${i * 45}ms both`,
      }}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[14px] font-black"
        style={{ background: `color-mix(in srgb, ${b.a} 18%, transparent)`, color: b.a }}
      >
        {b.name[0]}
      </span>
      <div className="min-w-0 flex-1 basis-[190px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[13px] font-extrabold">{b.name}</span>
          <TierTag tier={b.tier} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]" style={{ color: "var(--muted)" }}>
          <span className="mono rounded px-1.5 py-0.5" style={{ background: "rgba(255,255,255,.06)" }}>
            {b.market}
          </span>
          <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(255,255,255,.06)" }}>
            {b.tag}
          </span>
          <span className="mono">{b.duration}t</span>
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <div className="mono text-[13px] font-extrabold" style={{ color: b.a }}>
          {b.win}%
        </div>
        <div className="text-[9px]" style={{ color: "var(--faint)" }}>
          win rate
        </div>
      </div>
      <button
        onClick={() => onLoad(b)}
        className="shrink-0 rounded-lg border px-3.5 py-2 text-[11.5px] font-extrabold transition-all duration-300 hover:-translate-y-0.5"
        style={{
          borderColor: active ? b.a : "var(--line-2)",
          color: active ? "#04091f" : b.a,
          background: active ? b.a : "transparent",
        }}
      >
        {active ? "✓ Loaded" : "Load"}
      </button>
    </div>
  );
}

/* ============ Bot picker modal (from the LOAD BOT card) ============ */
export function BotPickerModal({
  open,
  onClose,
  onLoad,
  loadedId,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (b: Bot) => void;
  loadedId: string | null;
}) {
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [xmlMsg, setXmlMsg] = useState<{ text: string; ok: boolean } | null>(null);

  /** read a DBot XML from the device and hand it straight to the builder */
  const onXml = async (file: File) => {
    setXmlMsg({ text: `Reading ${file.name}…`, ok: true });
    try {
      const text = await readTextFile(file);
      const { bot, warnings, found } = parseBotXml(text, file.name);
      onLoad(bot);
      setXmlMsg({
        text: found.length
          ? `${file.name} loaded · ${found.join(" · ")}${warnings.length ? ` · ${warnings.length} note(s)` : ""}`
          : `${file.name} loaded, but no known fields were found — check it in the builder`,
        ok: found.length > 0,
      });
    } catch (err) {
      setXmlMsg({ text: `Could not read ${file.name}: ${err instanceof Error ? err.message : "unknown error"}`, ok: false });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const list = useMemo(
    () =>
      BOTS.filter((b) => (tier === "all" ? true : b.tier === tier)).filter((b) =>
        q.trim()
          ? `${b.name} ${b.tag} ${b.market}`.toLowerCase().includes(q.trim().toLowerCase())
          : true,
      ),
    [tier, q],
  );

  if (!open) return null;

  return (
    <div
      className="A-fade fixed inset-0 z-[95] grid place-items-center bg-black/72 p-3 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dt-dark-scope A-drop flex max-h-[86vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[20px] border"
        style={{
          borderColor: "var(--line-2)",
          background: "linear-gradient(180deg,#0a1338,#050b22)",
          boxShadow: "0 60px 120px -40px #000, inset 0 1px 0 rgba(255,255,255,.07)",
        }}
      >
        <div className="flex items-center gap-3 border-b p-4" style={{ borderColor: "var(--line)" }}>
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[15px]"
            style={{ background: "color-mix(in srgb, var(--cyan) 18%, transparent)", color: "var(--cyan)" }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3v4a1 1 0 0 0 1 1h4M5 8a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z" />
              <path d="M9 14l2 2 4-4" />
            </svg>
          </span>
          <div>
            <h2 className="text-[16px] font-extrabold tracking-tight">Load a bot</h2>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              Pick a strategy — it opens in the Bot Builder so you can tune it before running.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300 hover:rotate-90 hover:border-[var(--red)]"
            style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* ---- load from device ---- */}
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileRef}
              type="file"
              accept=".xml,text/xml,application/xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onXml(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[12.5px] font-extrabold text-[#04121f] transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(90deg,#29d3f5,#12c9a0)", boxShadow: "0 16px 32px -16px rgba(41,211,245,.9)" }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h6l2 3h8v13H4z" />
                <path d="M12 11v6m0-6-2.5 2.5M12 11l2.5 2.5" />
              </svg>
              Load XML from device
            </button>
            <div className="min-w-[150px] flex-1">
              <div className="text-[11.5px] font-bold">Open a Deriv Bot file</div>
              <div className="text-[10.5px]" style={{ color: "var(--muted)" }}>
                Reads market, contract, barrier, stake, duration and recovery straight out of the XML — or pick a ready-made bot below.
              </div>
            </div>
          </div>
          {xmlMsg && (
            <div
              className="mono mt-2.5 rounded-lg border px-2.5 py-2 text-[10.5px]"
              style={{
                borderColor: xmlMsg.ok ? "rgba(18,201,160,.45)" : "rgba(239,59,74,.45)",
                background: xmlMsg.ok ? "rgba(18,201,160,.08)" : "rgba(239,59,74,.08)",
                color: xmlMsg.ok ? "var(--green)" : "var(--red)",
              }}
            >
              {xmlMsg.text}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
          <div className="relative flex rounded-xl p-1" style={{ background: "rgba(255,255,255,.05)" }}>
            {(["all", "free", "premium"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-extrabold capitalize transition-all duration-300"
                style={{
                  background: tier === t ? "linear-gradient(135deg,var(--cyan),#134b96)" : "transparent",
                  color: tier === t ? "#04091f" : "var(--muted)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search bots…"
            className="w-[180px] rounded-xl border bg-transparent px-3 py-2 text-[12px] outline-none transition-colors focus:border-[var(--cyan)]"
            style={{ borderColor: "var(--line-2)" }}
          />
          <span className="mono ml-auto text-[10.5px]" style={{ color: "var(--faint)" }}>
            {list.length} of {BOTS.length}
          </span>
        </div>

        <div className="space-y-2.5 overflow-y-auto p-4">
          {list.map((b, i) => (
            <BotRow key={b.id} b={b} onLoad={onLoad} active={b.id === loadedId} i={i} />
          ))}
          {!list.length && (
            <p className="py-8 text-center text-[12px]" style={{ color: "var(--faint)" }}>
              No bots match that search.
            </p>
          )}
        </div>

        <div className="border-t px-4 py-3 text-[10.5px]" style={{ borderColor: "var(--line)", color: "var(--faint)" }}>
          Strategies are templates — always verify parameters and stake limits before running live.
        </div>
      </div>
    </div>
  );
}
