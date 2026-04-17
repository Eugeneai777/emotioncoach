import { AbsoluteFill, useCurrentFrame } from "remotion";

export const HavrutaBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 120) * 12;

  return (
    <AbsoluteFill style={{ background: "#0F2942" }}>
      {/* Paper noise overlay using inline SVG */}
      <AbsoluteFill style={{ opacity: 0.06 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0.96  0 0 0 0 0.94  0 0 0 0 0.90  0 0 0 1 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </AbsoluteFill>

      {/* Slow drifting amber dots */}
      {[
        { x: 120, y: 240 },
        { x: 920, y: 380 },
        { x: 200, y: 1500 },
        { x: 880, y: 1700 },
        { x: 540, y: 960 },
      ].map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x + drift * (i % 2 === 0 ? 1 : -1),
            top: p.y + drift * 0.6,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#C8923D",
            opacity: 0.35,
          }}
        />
      ))}

      {/* Top + bottom thin amber rule */}
      <div style={{ position: "absolute", top: 90, left: 90, right: 90, height: 1, background: "#C8923D", opacity: 0.5 }} />
      <div style={{ position: "absolute", bottom: 90, left: 90, right: 90, height: 1, background: "#C8923D", opacity: 0.5 }} />

      {/* Top tag */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 90,
          fontFamily: "sans-serif",
          fontSize: 22,
          letterSpacing: 6,
          color: "#C8923D",
          fontWeight: 500,
        }}
      >
        HAVRUTA · 团队研讨
      </div>
      <div
        style={{
          position: "absolute",
          top: 110,
          right: 90,
          fontFamily: "sans-serif",
          fontSize: 22,
          letterSpacing: 4,
          color: "#F4EFE6",
          opacity: 0.5,
        }}
      >
        eugeneai.me
      </div>
    </AbsoluteFill>
  );
};
