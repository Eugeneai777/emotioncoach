import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface Props {
  line: string;
}

export const BrandOutro: React.FC<Props> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  // Logo / brand name
  const logoSpring = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 100 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.5, 1]);

  // Tagline
  const tagSpring = spring({ frame: frame - 25, fps, config: { damping: 30 } });

  // Glow pulse
  const glowIntensity = 0.2 + Math.sin(frame * 0.08) * 0.1;

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {/* Warm glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: 600,
          height: 600,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,180,100,${glowIntensity}) 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          gap: 40,
        }}
      >
        {/* Brand name */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            fontFamily: "Noto Serif SC, serif",
            color: "white",
            transform: `scale(${logoScale})`,
            opacity: logoSpring,
            letterSpacing: 8,
          }}
        >
          有劲AI
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: interpolate(tagSpring, [0, 1], [0, 120]),
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(255,200,150,0.6), transparent)",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 400,
            fontFamily: "Noto Sans SC, sans-serif",
            color: "rgba(255,200,150,0.8)",
            opacity: tagSpring,
            transform: `translateY(${interpolate(tagSpring, [0, 1], [20, 0])}px)`,
            letterSpacing: 4,
          }}
        >
          {line}
        </div>

        {/* Bottom hint */}
        <div
          style={{
            position: "absolute",
            bottom: 100,
            fontSize: 24,
            color: "rgba(255,255,255,0.25)",
            fontFamily: "Noto Sans SC, sans-serif",
            opacity: tagSpring,
          }}
        >
          你的AI情绪教练 · 24小时在线
        </div>
      </div>
    </AbsoluteFill>
  );
};
