/**
 * Living background used behind the bots area.
 * Theme-aware: the grid, glyphs and rings read from --amb-* so light mode
 * gets ink-coloured marks and dark mode gets neon ones, while the colour
 * blobs sample the accent palette so the space never looks empty.
 */
export function Ambience({ tones = ["#29d3f5", "#7b5cff", "#12c9a0", "#ffb020"] }: { tones?: string[] }) {
  const glyphs = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "$", "◆", "▲", "%"];
  const floats = Array.from({ length: 16 }, (_, i) => ({
    g: glyphs[i % glyphs.length],
    left: 3 + ((i * 61) % 94),
    size: 13 + ((i * 17) % 22),
    dur: 15 + ((i * 5) % 14),
    delay: (i * 1.35) % 14,
    bottom: (i % 3) * 8,
  }));

  return (
    <div className="amb" aria-hidden>
      {/* colour field */}
      <span className="amb-blob" style={{ left: "-8%", top: "-12%", width: 420, height: 420, background: `${tones[0]}33`, animationDuration: "24s" }} />
      <span className="amb-blob" style={{ right: "-6%", top: "8%", width: 380, height: 380, background: `${tones[1]}30`, animationDuration: "29s", animationDelay: "3s" }} />
      <span className="amb-blob" style={{ left: "26%", bottom: "-18%", width: 460, height: 460, background: `${tones[2]}26`, animationDuration: "33s", animationDelay: "6s" }} />
      <span className="amb-blob" style={{ right: "22%", bottom: "-14%", width: 330, height: 330, background: `${tones[3]}22`, animationDuration: "27s", animationDelay: "9s" }} />

      {/* structure */}
      <span className="amb-grid" />
      <span className="amb-dots" />

      {/* orbital rings, anchored to the corners */}
      <span className="amb-ring" style={{ left: -120, top: -120, width: 340, height: 340 }} />
      <span className="amb-ring" style={{ right: -140, bottom: -160, width: 400, height: 400, animationDirection: "reverse", animationDuration: "80s" }} />

      {/* light passes */}
      <span className="amb-sweep" />
      <span className="amb-scanline" />

      {/* drifting digit glyphs */}
      {floats.map((f, i) => (
        <span
          key={i}
          className="amb-glyph"
          style={{ left: `${f.left}%`, bottom: `${f.bottom}%`, fontSize: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}
        >
          {f.g}
        </span>
      ))}
    </div>
  );
}
