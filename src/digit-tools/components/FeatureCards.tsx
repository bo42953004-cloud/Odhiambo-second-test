const CARDS = [
  {
    n: "01",
    title: "LOAD BOT",
    sub: "Open your trading strategy",
    img: "/icons/load-bot.png",
    c: "var(--blue)",
    rgb: "47,123,255",
  },
  {
    n: "02",
    title: "PREMIUM BOTS",
    sub: "Exclusive automated strategies",
    img: "/icons/premium-bots.png",
    c: "var(--gold)",
    rgb: "245,183,49",
  },
  {
    n: "03",
    title: "SPEED BOT",
    sub: "One-click automated trading",
    img: "/icons/speed-bot.png",
    c: "var(--cyan)",
    rgb: "41,211,245",
  },
  {
    n: "04",
    title: "MANUAL TRADING",
    sub: "Full control, trade your way",
    img: "/icons/manual-trading.png",
    c: "var(--purple)",
    rgb: "139,92,246",
    popular: true,
  },
];

function Corner({ c, pos }: { c: string; pos: string }) {
  const map: Record<string, string> = {
    tl: "left-0 top-0 border-l-2 border-t-2 rounded-tl-[18px]",
    tr: "right-0 top-0 border-r-2 border-t-2 rounded-tr-[18px]",
    bl: "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-[18px]",
    br: "right-0 bottom-0 border-r-2 border-b-2 rounded-br-[18px]",
  };
  return (
    <span
      className={`pointer-events-none absolute h-6 w-6 opacity-0 transition-all duration-500 group-hover:opacity-100 ${map[pos]}`}
      style={{ borderColor: c, filter: `drop-shadow(0 0 6px ${c})` }}
    />
  );
}

export function FeatureCards({
  onPick,
  badges,
}: {
  onPick: (t: string) => void;
  badges?: Partial<Record<string, string>>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((cd, i) => (
        <button
          key={cd.title}
          onClick={() => onPick(cd.title)}
          aria-label={cd.title}
          className="dt-card dt-sheen group relative overflow-hidden p-5 text-center active:scale-[.99]"
          style={{
            borderColor: `rgba(${cd.rgb},.55)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.07), 0 0 0 1px rgba(${cd.rgb},.16), 0 30px 70px -34px rgba(${cd.rgb},.75)`,
            animation: `dt-up .8s cubic-bezier(.22,1,.36,1) ${i * 130}ms both`,
          }}
        >
          {/* number badge */}
          <span
            className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center rounded-lg border text-[15px] font-extrabold transition-transform duration-500 group-hover:scale-110"
            style={{
              borderColor: `rgba(${cd.rgb},.6)`,
              color: cd.c,
              background: `rgba(${cd.rgb},.10)`,
            }}
          >
            {cd.n}
          </span>

          {cd.popular && (
            <span
              className="absolute left-3.5 top-3.5 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black tracking-wider text-white"
              style={{ background: "linear-gradient(90deg,#8b5cf6,#c026d3)", boxShadow: "0 6px 18px -6px #a855f7" }}
            >
              ★ POPULAR
            </span>
          )}

          {/* halo */}
          <span
            className="pointer-events-none absolute left-1/2 top-[38%] h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[46px] A-glow"
            style={{ background: `radial-gradient(circle, rgba(${cd.rgb},.55), transparent 68%)`, animationDelay: `${i * 400}ms` }}
          />

          {/* orbit ring */}
          <span
            className="pointer-events-none absolute left-1/2 top-[38%] h-[178px] w-[178px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed A-spin"
            style={{ borderColor: `rgba(${cd.rgb},.30)`, animationDuration: `${16 + i * 3}s` }}
          />

          <div className="relative mx-auto h-[168px] w-[168px]">
            <img
              src={cd.img}
              alt={cd.title}
              loading="lazy"
              className="dt-blend h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.12] group-hover:-rotate-3"
              draggable={false}
            />
          </div>

          <h3
            className="relative mt-1 text-[19px] font-extrabold tracking-[0.06em] transition-all duration-500 group-hover:tracking-[0.12em]"
            style={{ color: cd.popular ? "#c9b1ff" : cd.c }}
          >
            {cd.title}
          </h3>
          <p className="relative mt-1.5 text-[12.5px] leading-snug" style={{ color: "var(--muted)" }}>
            {cd.sub}
          </p>

          <span
            className="relative mt-3 inline-block h-[3px] w-8 rounded-full transition-all duration-500 group-hover:w-16"
            style={{ background: cd.c, boxShadow: `0 0 12px ${cd.c}` }}
          />

          {badges?.[cd.title] && (
            <span
              className="relative mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider transition-transform duration-500 group-hover:scale-105"
              style={{ borderColor: `rgba(${cd.rgb},.5)`, background: `rgba(${cd.rgb},.10)`, color: cd.c }}
            >
              {badges[cd.title]}
            </span>
          )}

          <Corner c={cd.c} pos="tl" />
          <Corner c={cd.c} pos="tr" />
          <Corner c={cd.c} pos="bl" />
          <Corner c={cd.c} pos="br" />
        </button>
      ))}
    </div>
  );
}
