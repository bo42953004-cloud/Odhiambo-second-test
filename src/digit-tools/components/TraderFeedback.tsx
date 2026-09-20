import { Flag } from "./Flags";

type Client = {
  name: string;
  country: string;
  code: string;
  quote: string;
  tags: string[];
  region: "Africa" | "Europe" | "Asia" | "Americas";
};

const REGION_COLOR: Record<Client["region"], string> = {
  Africa: "var(--green)",
  Europe: "var(--blue)",
  Asia: "var(--cyan)",
  Americas: "var(--gold)",
};

const CLIENTS: Client[] = [
  {
    name: "James Ochieng",
    country: "Kenya",
    code: "KE",
    region: "Africa",
    quote:
      "The dashboard keeps signals and trading tools together, so I can review opportunities much faster.",
    tags: ["Fast workflow", "All in one"],
  },
  {
    name: "Priya Sharma",
    country: "India",
    code: "IN",
    region: "Asia",
    quote:
      "The digit distribution panel showed me which digits were overdue. I stopped guessing and started planning.",
    tags: ["Digit analysis", "Precise"],
  },
  {
    name: "Markus Weber",
    country: "Germany",
    code: "DE",
    region: "Europe",
    quote:
      "Risk controls sit next to the trade buttons, so my stake discipline improved within the first week.",
    tags: ["Risk first", "Disciplined"],
  },
  {
    name: "Lucas Almeida",
    country: "Brazil",
    code: "BR",
    region: "Americas",
    quote:
      "Switching between volatility indices takes one click. The tick stream never feels behind the market.",
    tags: ["Low latency", "Smooth"],
  },
  {
    name: "Amina Hassan",
    country: "Nigeria",
    code: "NG",
    region: "Africa",
    quote:
      "The market cards are clear and focused. I can compare confidence before choosing my next setup.",
    tags: ["Clear signals", "Simple layout"],
  },
  {
    name: "Hiroshi Tanaka",
    country: "Japan",
    code: "JP",
    region: "Asia",
    quote:
      "The layout is calm and organised, which makes long trading sessions far less tiring on the eyes.",
    tags: ["Clean UI", "Calm"],
  },
  {
    name: "Chloé Dubois",
    country: "France",
    code: "FR",
    region: "Europe",
    quote:
      "I run bots overnight and check the journal in the morning. Everything is exactly where I left it.",
    tags: ["Overnight bots", "Reliable"],
  },
  {
    name: "Aisha Al-Farsi",
    country: "UAE",
    code: "AE",
    region: "Americas",
    quote:
      "The AI scanner flags momentum shifts early. It reads like having an analyst sitting beside me.",
    tags: ["AI scanner", "Early entries"],
  },
  {
    name: "Kwame Mensah",
    country: "Ghana",
    code: "GH",
    region: "Africa",
    quote:
      "Free bots that actually work out of the box. I loaded one, set my stake, and it ran all session.",
    tags: ["Free bots", "No setup"],
  },
  {
    name: "Sofia Rossi",
    country: "Italy",
    code: "IT",
    region: "Europe",
    quote:
      "The Even/Odd and Over/Under tools side by side let me test a strategy in minutes, not days.",
    tags: ["Strategy testing", "Fast"],
  },
  {
    name: "David Mwangi",
    country: "Kenya",
    code: "KE",
    region: "Africa",
    quote:
      "Everything I use most is close by, and the live signal view is easy to understand at a glance.",
    tags: ["Fast workflow", "Clear signals", "Easy to use"],
  },
  {
    name: "Nguyen Minh",
    country: "Vietnam",
    code: "VN",
    region: "Asia",
    quote:
      "Premium AI bots cut my manual screen time in half. I only step in when the signal quality drops.",
    tags: ["Automation", "Time saved"],
  },
  {
    name: "Bram de Vries",
    country: "Netherlands",
    code: "NL",
    region: "Europe",
    quote:
      "Bulk trader lets me mirror the same setup across markets without re-entering numbers each time.",
    tags: ["Bulk trader", "Efficient"],
  },
  {
    name: "Sarah Miller",
    country: "United States",
    code: "US",
    region: "Americas",
    quote:
      "The reports tab makes weekly review simple. I can see exactly which bot earned and which leaked.",
    tags: ["Reporting", "Transparent"],
  },
  {
    name: "Emre Yılmaz",
    country: "Türkiye",
    code: "TR",
    region: "Asia",
    quote:
      "Signal rankings help me focus on stronger opportunities instead of scanning every market manually.",
    tags: ["Signal ranking", "Saves time"],
  },
  {
    name: "Lucía Fernández",
    country: "Spain",
    code: "ES",
    region: "Europe",
    quote:
      "The manual trader gives me full control while the scanner quietly watches the other markets.",
    tags: ["Full control", "Multi-market"],
  },
  {
    name: "Ahmed Karim",
    country: "Egypt",
    code: "EG",
    region: "Africa",
    quote:
      "The activity feed keeps a clear record of every decision, so I can review my discipline honestly.",
    tags: ["Journaling", "Accountable"],
  },
  {
    name: "Tom Bradley",
    country: "United Kingdom",
    code: "GB",
    region: "Europe",
    quote:
      "Two years with other terminals, and this is the first one where the charts and the bots agree.",
    tags: ["Consistent", "Trusted"],
  },
  {
    name: "Anastasia Ivanova",
    country: "Russia",
    code: "RU",
    region: "Europe",
    quote:
      "Even on a slow connection the ticker stays smooth. Performance on mobile is genuinely impressive.",
    tags: ["Mobile ready", "Light"],
  },
  {
    name: "Grace Njeri",
    country: "Kenya",
    code: "KE",
    region: "Africa",
    quote:
      "The layout gives me a simple routine: review the data, compare markets, then make my decision.",
    tags: ["Built-in routine", "Organised"],
  },
];

function Stars({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="h-[12px] w-[12px]"
          fill="var(--gold)"
          style={{ animation: `dt-pop .45s cubic-bezier(.22,1,.36,1) ${delay + i * 70}ms both` }}
        >
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
        </svg>
      ))}
    </div>
  );
}

function ClientCard({ c, i }: { c: Client; i: number }) {
  const initials = c.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  const accent = REGION_COLOR[c.region];

  return (
    <article
      className="group relative mr-3 w-[286px] shrink-0 overflow-hidden p-4 transition-all duration-500 hover:-translate-y-1.5 sm:w-[318px]"
      style={{
        borderRadius: "var(--r-lg)",
        background: "linear-gradient(180deg,#0d1740 0%,#070d28 100%)",
        border: "1px solid var(--line)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(120,165,255,.5)";
        e.currentTarget.style.boxShadow = "0 34px 60px -34px rgba(60,120,255,.9), inset 0 1px 0 rgba(255,255,255,.09)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--line)";
        e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.06)";
      }}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: `linear-gradient(180deg,${accent},transparent)` }} />
      <span
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />

      <div className="relative flex items-start gap-3">
        <div className="relative">
          <div
            className="grid h-[46px] w-[46px] place-items-center rounded-full border-2 text-[13px] font-extrabold"
            style={{ borderColor: "rgba(120,165,255,.38)", background: "linear-gradient(145deg,#16224d,#0a1130)", color: "#cfe0ff", animation: `dt-pop .5s cubic-bezier(.22,1,.36,1) ${i * 40}ms both` }}
          >
            {initials}
          </div>
          <span className="absolute -bottom-1 -right-1.5 rounded-[4px] p-[2px]" style={{ background: "#0a1130" }}>
            <Flag code={c.code} className="h-[14px] w-[21px]" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-extrabold">{c.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-[12px] w-[12px] shrink-0" fill="#1d7bf5">
              <path d="M12 1.5 14.6 4l3.5-.4.9 3.4 3 1.9-1.7 3.1 1.7 3.1-3 1.9-.9 3.4-3.5-.4L12 22.5 9.4 20l-3.5.4-.9-3.4-3-1.9L3.7 12 2 8.9l3-1.9.9-3.4L9.4 4 12 1.5Z" />
              <path d="m8.4 12 2.4 2.4 4.8-4.8" stroke="#fff" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="truncate text-[10.5px] font-semibold" style={{ color: "var(--cyan)" }}>
              Verified
            </span>
            <span className="truncate text-[10.5px]" style={{ color: "var(--faint)" }}>
              · {c.country}
            </span>
          </div>
          <div className="mt-1.5">
            <Stars delay={i * 40} />
          </div>
        </div>
      </div>

      <p className="relative mt-3 text-[12.5px] italic leading-relaxed" style={{ color: "#cfdcff" }}>
        &ldquo;{c.quote}&rdquo;
      </p>

      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {c.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border px-2.5 py-1 text-[10px] font-bold"
            style={{ borderColor: "rgba(120,165,255,.32)", background: "rgba(120,165,255,.09)", color: "#d6e4ff" }}
          >
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}

function RollingRow({
  items,
  duration,
  reverse,
  reversePx,
}: {
  items: Client[];
  duration: number;
  reverse?: boolean;
  reversePx?: boolean;
}) {
  const track = [...items, ...items];
  return (
    <div className="dt-marquee relative overflow-hidden">
      <div
        className="dt-track flex w-max"
        style={{
          animation: `${reverse ? "dt-x-right" : "dt-x-left"} ${duration}s linear infinite`,
          flexDirection: reversePx ? "row-reverse" : "row",
        }}
      >
        {track.map((c, i) => (
          <ClientCard key={`${c.name}-${i}`} c={c} i={i % items.length} />
        ))}
      </div>
    </div>
  );
}

export function TraderFeedback() {
  const rowA = CLIENTS.slice(0, 10);
  const rowB = CLIENTS.slice(10);

  const countries = Array.from(new Set(CLIENTS.map((c) => c.code)));

  return (
    <section className="dt-panel relative overflow-hidden py-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(120,165,255,.75),transparent)" }}
      />

      {/* heading */}
      <div className="px-4 sm:px-6">
        <h2 className="reveal text-center text-[13px] font-extrabold uppercase text-[#cfe0ff]">
          Trader Feedback
        </h2>
        <div className="mx-auto mt-2 h-[2px] w-24 rounded-full" style={{ background: "linear-gradient(90deg,transparent,var(--cyan),transparent)" }} />

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {countries.map((code, i) => (
              <span
                key={code}
                style={{ animation: `dt-pop .5s cubic-bezier(.22,1,.36,1) ${i * 55}ms both` }}
                className="transition-transform duration-300 hover:-translate-y-1"
              >
                <Flag code={code} />
              </span>
            ))}
            <span
              className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold"
              style={{ borderColor: "rgba(120,165,255,.35)", color: "#cfe0ff", animation: `dt-pop .5s ease ${countries.length * 55}ms both` }}
            >
              + many more
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "rgba(18,201,160,.35)", background: "rgba(18,201,160,.08)" }}>
            <span className="h-1.5 w-1.5 rounded-full A-blink" style={{ background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
            <span className="text-[10.5px] font-extrabold" style={{ color: "var(--green)" }}>
              {CLIENTS.length} verified traders · {countries.length} countries
            </span>
          </div>
          <span className="hidden items-center gap-1.5 text-[10.5px] font-semibold lg:flex" style={{ color: "var(--faint)" }}>
            hover the strip to pause
            <svg viewBox="0 0 24 24" className="h-3 w-3 A-blink" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
            </svg>
          </span>
        </div>
      </div>

      {/* row 1 — leftward */}
      <div className="mt-6">
        <RollingRow items={rowA} duration={58} />
      </div>
      {/* row 2 — same direction, slower, offset for depth */}
      <div className="mt-3">
        <RollingRow items={rowB} duration={74} />
      </div>

      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-16 left-0 w-16 sm:w-28" style={{ background: "linear-gradient(90deg,#081130 10%,transparent)" }} />
      <div className="pointer-events-none absolute inset-y-16 right-0 w-16 sm:w-28" style={{ background: "linear-gradient(270deg,#07102c 10%,transparent)" }} />
    </section>
  );
}
