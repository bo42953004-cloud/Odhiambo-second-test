/**
 * Backdrop for the bot gallery.
 *
 * The raining log columns and the ambience field (blobs, rings, glyphs, sweep)
 * were removed — they were the heaviest thing on the page and made the section
 * feel slow. What remains is a single themed gradient that renders instantly:
 *
 *   dark  → deep navy falloff
 *   light → soft slate
 *
 * Both come from --bots-bg, so light/dark is handled entirely in CSS.
 */
export function BotsBackdrop({ premium = false }: { premium?: boolean }) {
  return (
    <div className="bots-bg" aria-hidden>
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background: premium
            ? "radial-gradient(90% 70% at 50% 0%, rgba(255,176,32,.14), transparent 72%)"
            : "radial-gradient(90% 70% at 50% 0%, rgba(41,211,245,.13), transparent 72%)",
        }}
      />
      <span className="bots-veil" />
    </div>
  );
}
