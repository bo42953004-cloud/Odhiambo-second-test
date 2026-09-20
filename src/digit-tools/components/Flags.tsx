/** Inline SVG country flags — no external assets required. */
function starPts(cx: number, cy: number, r: number, n = 5, ir = 0.4) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? r : r * ir;
    const a = (Math.PI / n) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const FLAGS: Record<string, React.ReactNode> = {
  KE: (
    <>
      <rect width="60" height="13" fill="#0a0a0a" />
      <rect y="13" width="60" height="3" fill="#fff" />
      <rect y="16" width="60" height="8" fill="#bb0000" />
      <rect y="24" width="60" height="3" fill="#fff" />
      <rect y="27" width="60" height="13" fill="#006600" />
      <ellipse cx="30" cy="20" rx="9" ry="14" fill="#fff" />
      <ellipse cx="30" cy="20" rx="7" ry="12" fill="#bb0000" />
      <rect x="28.5" y="6" width="3" height="28" fill="#0a0a0a" />
      <ellipse cx="30" cy="20" rx="4.5" ry="9" fill="none" stroke="#fff" strokeWidth="1.2" />
    </>
  ),
  NG: (
    <>
      <rect width="20" height="40" fill="#008751" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#008751" />
    </>
  ),
  GH: (
    <>
      <rect width="60" height="13.34" fill="#ce1126" />
      <rect y="13.34" width="60" height="13.33" fill="#fcd116" />
      <rect y="26.67" width="60" height="13.33" fill="#006b3f" />
      <polygon points={starPts(30, 20, 6.5)} fill="#0a0a0a" />
    </>
  ),
  IN: (
    <>
      <rect width="60" height="13.34" fill="#ff9933" />
      <rect y="13.34" width="60" height="13.33" fill="#fff" />
      <rect y="26.67" width="60" height="13.33" fill="#138808" />
      <circle cx="30" cy="20" r="5" fill="none" stroke="#000080" strokeWidth="1.2" />
      <circle cx="30" cy="20" r="1.2" fill="#000080" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI / 6) * i;
        return (
          <line
            key={i}
            x1={30}
            y1={20}
            x2={30 + 5 * Math.cos(a)}
            y2={20 + 5 * Math.sin(a)}
            stroke="#000080"
            strokeWidth="0.5"
          />
        );
      })}
    </>
  ),
  BR: (
    <>
      <rect width="60" height="40" fill="#009c3b" />
      <polygon points="30,3 57,20 30,37 3,20" fill="#ffdf00" />
      <circle cx="30" cy="20" r="7.5" fill="#002776" />
      <path d="M21.5 17.5a9 9 0 0 1 17 0 9 9 0 0 1-17 0Z" fill="#fff" opacity=".9" />
      <path d="M22 19.4h16" stroke="#002776" strokeWidth="1" />
    </>
  ),
  DE: (
    <>
      <rect width="60" height="13.34" fill="#111" />
      <rect y="13.34" width="60" height="13.33" fill="#dd0000" />
      <rect y="26.67" width="60" height="13.33" fill="#ffce00" />
    </>
  ),
  FR: (
    <>
      <rect width="20" height="40" fill="#002395" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#ed2939" />
    </>
  ),
  AE: (
    <>
      <rect x="15" width="45" height="13.34" fill="#00732f" />
      <rect x="15" y="13.34" width="45" height="13.33" fill="#fff" />
      <rect x="15" y="26.67" width="45" height="13.33" fill="#111" />
      <rect width="15" height="40" fill="#ff0000" />
    </>
  ),
  JP: (
    <>
      <rect width="60" height="40" fill="#fff" />
      <circle cx="30" cy="20" r="11" fill="#bc002d" />
    </>
  ),
  IT: (
    <>
      <rect width="20" height="40" fill="#009246" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#ce2b37" />
    </>
  ),
  EG: (
    <>
      <rect width="60" height="13.34" fill="#ce1126" />
      <rect y="13.34" width="60" height="13.33" fill="#fff" />
      <rect y="26.67" width="60" height="13.33" fill="#111" />
      <path d="M30 8.5c1.6 1.6 1.2 3.4.9 5.2-.4 2.3.2 4 1.3 5.6h-4.4c1.1-1.6 1.7-3.3 1.3-5.6-.3-1.8-.7-3.6.9-5.2Z" fill="#c09300" />
      <path d="M26.8 21.6h6.4l-1 1.6h-4.4l-1-1.6Z" fill="#c09300" />
    </>
  ),
  NL: (
    <>
      <rect width="60" height="13.34" fill="#ae1c28" />
      <rect y="13.34" width="60" height="13.33" fill="#fff" />
      <rect y="26.67" width="60" height="13.33" fill="#21468b" />
    </>
  ),
  ES: (
    <>
      <rect width="60" height="10" fill="#aa151b" />
      <rect y="10" width="60" height="20" fill="#f1bf00" />
      <rect y="30" width="60" height="10" fill="#aa151b" />
      <rect x="13" y="16" width="6" height="9" rx="1" fill="#ad1519" />
      <rect x="14.5" y="13.5" width="3" height="3" rx="1" fill="#c8b100" />
    </>
  ),
  GB: (
    <>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="13" />
      <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7.5" />
    </>
  ),
  US: (
    <>
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} y={(40 / 13) * i} width="60" height={40 / 13} fill={i % 2 === 0 ? "#b22234" : "#fff"} />
      ))}
      <rect width="26" height={(40 / 13) * 7} fill="#3c3b6e" />
      {Array.from({ length: 12 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => (
          <circle key={`${r}-${c}`} cx={3.2 + c * 5.4} cy={2.2 + r * 2.9} r="1" fill="#fff" />
        )),
      )}
    </>
  ),
  VN: (
    <>
      <rect width="60" height="40" fill="#da251d" />
      <polygon points={starPts(30, 20, 11)} fill="#ff0" />
    </>
  ),
  TR: (
    <>
      <rect width="60" height="40" fill="#e30a17" />
      <circle cx="24" cy="20" r="9.5" fill="#fff" />
      <circle cx="26.6" cy="20" r="7.6" fill="#e30a17" />
      <polygon points={starPts(37, 20, 4.6)} fill="#fff" />
    </>
  ),
  RU: (
    <>
      <rect width="60" height="13.34" fill="#fff" />
      <rect y="13.34" width="60" height="13.33" fill="#0039a6" />
      <rect y="26.67" width="60" height="13.33" fill="#d52b1e" />
    </>
  ),
  ID: (
    <>
      <rect width="60" height="20" fill="#ff0000" />
      <rect y="20" width="60" height="20" fill="#fff" />
    </>
  ),
  PL: (
    <>
      <rect width="60" height="20" fill="#fff" />
      <rect y="20" width="60" height="20" fill="#dc143c" />
    </>
  ),
};

export function Flag({ code, className = "" }: { code: string; className?: string }) {
  return (
    <span
      className={`relative inline-block h-[18px] w-[27px] shrink-0 overflow-hidden rounded-[3px] border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,.5)] ${className}`}
    >
      <svg viewBox="0 0 60 40" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
        {FLAGS[code] ?? <rect width="60" height="40" fill="#334155" />}
      </svg>
      <span className="pointer-events-none absolute inset-0 rounded-[3px] bg-gradient-to-b from-white/20 to-transparent opacity-40" />
    </span>
  );
}
