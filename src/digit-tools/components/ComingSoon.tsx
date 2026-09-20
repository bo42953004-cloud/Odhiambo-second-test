/* ============ Coming soon — modal + full view ============ */
function Orbit({ c }: { c: string }) {
  return (
    <span className="relative grid h-[86px] w-[86px] shrink-0 place-items-center">
      <span className="A-glow absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${c}, transparent 68%)`, opacity: 0.4 }} />
      <span className="A-spin absolute inset-0 rounded-full border border-dashed" style={{ borderColor: `color-mix(in srgb, ${c} 45%, transparent)`, animationDuration: "14s" }} />
      <span className="A-spin-r absolute inset-[11px] rounded-full border" style={{ borderColor: `color-mix(in srgb, ${c} 30%, transparent)` }} />
      <span className="relative grid h-[52px] w-[52px] place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${c} 16%, transparent)`, color: c }}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      </span>
    </span>
  );
}

export function ComingSoonModal({
  title,
  blurb,
  onClose,
  onBrowse,
}: {
  title: string;
  blurb: string;
  onClose: () => void;
  onBrowse: () => void;
}) {
  return (
    <div className="A-fade fixed inset-0 z-[95] grid place-items-center bg-black/70 p-3 backdrop-blur-md" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="dt-dark-scope A-pop w-full max-w-[430px] overflow-hidden rounded-[20px] border p-6 text-center"
        style={{
          borderColor: "var(--line-2)",
          background: "linear-gradient(180deg,#0c1638,#050b22)",
          boxShadow: "0 60px 120px -40px #000, inset 0 1px 0 rgba(255,255,255,.07)",
        }}
      >
        <div className="flex justify-center">
          <Orbit c="#8b5cf6" />
        </div>
        <span
          className="mt-4 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
          style={{ background: "linear-gradient(90deg,#8b5cf6,#c026d3)", color: "#fff" }}
        >
          Coming soon
        </span>
        <h3 className="mt-3 text-[19px] font-extrabold tracking-tight">{title}</h3>
        <p className="mx-auto mt-2 max-w-[330px] text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
          {blurb}
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            onClick={onBrowse}
            className="rounded-xl py-2.5 text-[12px] font-extrabold text-[#001a17] transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(90deg,#29d3f5,#12c9a0)" }}
          >
            Browse free bots
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border py-2.5 text-[12px] font-extrabold transition-all duration-300 hover:-translate-y-0.5"
            style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}
          >
            Stay on dashboard
          </button>
        </div>
        <p className="mt-4 text-[10.5px]" style={{ color: "var(--faint)" }}>
          Nothing is running for this section yet — you'll see it here as soon as it ships.
        </p>
      </div>
    </div>
  );
}

export function ComingSoonView({
  label,
  blurb,
  onBack,
  onBrowse,
}: {
  label: string;
  blurb: string;
  onBack: () => void;
  onBrowse: () => void;
}) {
  return (
    <div className="dt-panel A-up relative flex flex-col items-center overflow-hidden px-6 py-16 text-center">
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-30"
        style={{ background: "linear-gradient(180deg, rgba(139,92,246,.35), transparent)" }}
      />
      <div className="relative flex justify-center">
        <Orbit c="#8b5cf6" />
      </div>
      <span
        className="mt-5 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
        style={{ background: "linear-gradient(90deg,#8b5cf6,#c026d3)", color: "#fff" }}
      >
        Coming soon
      </span>
      <h2 className="mt-3 text-[24px] font-extrabold tracking-tight sm:text-[28px]">{label}</h2>
      <p className="mx-auto mt-2 max-w-[460px] text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {blurb}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <button
          onClick={onBack}
          className="rounded-xl px-5 py-2.5 text-[12.5px] font-extrabold text-[#001a17] transition-transform hover:-translate-y-0.5"
          style={{ background: "linear-gradient(90deg,#29d3f5,#12c9a0)" }}
        >
          ← Back to dashboard
        </button>
        <button
          onClick={onBrowse}
          className="rounded-xl border px-5 py-2.5 text-[12.5px] font-extrabold transition-all duration-300 hover:-translate-y-0.5"
          style={{ borderColor: "var(--line-2)", color: "var(--cyan)" }}
        >
          Browse free bots
        </button>
      </div>
      <div className="relative mt-8 grid w-full max-w-[560px] gap-3 sm:grid-cols-3">
        {[
          ["Digit tools", "live"],
          ["Bot builder", "live"],
          ["This section", "in build"],
        ].map(([k, v], i) => (
          <div key={k} className="rounded-xl border p-3" style={{ borderColor: "var(--line)", animation: `dt-up .5s ease ${i * 90}ms both` }}>
            <div className="text-[10px]" style={{ color: "var(--faint)" }}>
              {k}
            </div>
            <div className="mt-1 text-[12px] font-extrabold" style={{ color: v === "live" ? "var(--green)" : "var(--gold)" }}>
              {v === "live" ? "✓ live" : "◌ in build"}
            </div>
          </div>
        ))}
      </div>
      <p className="relative mt-6 max-w-[460px] text-[10.5px] leading-relaxed" style={{ color: "var(--faint)" }}>
        Only the Dashboard tab is fully themed right now. The AI button stays available on every tab.
      </p>
    </div>
  );
}
