/**
 * LiveOrb — a pulsing core with a circle and a square orbiting around it.
 * Two counter-rotating tracks so the motion never looks mechanical.
 * Used anywhere the app reports a live feed.
 */
export function LiveOrb({
  size = 18,
  tone = "#12c9a0",
  ring = "#7dffd4",
  square = "#29d3f5",
}: {
  size?: number;
  tone?: string;
  ring?: string;
  square?: string;
}) {
  return (
    <span className="live-orb" style={{ width: size, height: size }} aria-hidden>
      <span className="live-core" style={{ background: tone, boxShadow: `0 0 10px ${tone}` }} />

      <span className="orbit o1">
        <i style={{ background: ring, boxShadow: `0 0 8px ${ring}` }} />
        <b style={{ background: square, boxShadow: `0 0 8px ${square}` }} />
      </span>

      <span className="orbit o2">
        <i style={{ background: square, boxShadow: `0 0 8px ${square}` }} />
        <b style={{ background: ring, boxShadow: `0 0 8px ${ring}` }} />
      </span>

      <span className="live-halo" />
    </span>
  );
}

/** Animated live label — shimmering gradient text. */
export function LiveText({
  children,
  tone = "#12c9a0",
  className = "",
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span className={`live-text ${className}`} style={{ ["--lt-c" as string]: tone }}>
      {children}
    </span>
  );
}
