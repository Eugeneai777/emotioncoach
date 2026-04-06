import { AbsoluteFill, Video, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SERIF_FONT, SANS_FONT } from "../fonts";

/**
 * Scene 3: Brand CTA — promote 7-day training camp
 * Calm meditation footage + brand overlay
 */
export const MidlifeCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const logoSpring = spring({ frame: frame - 15, fps, config: { damping: 20, stiffness: 100 } });
  const tagSpring = spring({ frame: frame - 40, fps, config: { damping: 30 } });
  const ctaSpring = spring({ frame: frame - 60, fps, config: { damping: 25 } });
  const linkSpring = spring({ frame: frame - 80, fps, config: { damping: 30 } });
  const glowPulse = 0.18 + Math.sin(frame * 0.05) * 0.08;

  // Ken Burns on bg
  const bgScale = interpolate(frame, [0, 240], [1.0, 1.08], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1e", opacity: fadeIn }}>
      {/* Background video */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `scale(${bgScale})`,
        transformOrigin: "center center",
      }}>
        <Video
          src={staticFile("stock/relax.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          startFrom={120}
          volume={0}
        />
      </div>

      {/* Heavy dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(10,10,30,0.85) 0%, rgba(10,10,30,0.95) 100%)",
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute",
        top: "38%", left: "50%",
        width: 500, height: 500,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(239,106,32,${glowPulse}) 0%, transparent 70%)`,
      }} />

      {/* Brand content */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        gap: 30,
      }}>
        {/* Logo */}
        <div style={{
          fontSize: 96,
          fontWeight: 900,
          fontFamily: SERIF_FONT,
          color: "white",
          transform: `scale(${interpolate(logoSpring, [0, 1], [0.5, 1])})`,
          opacity: logoSpring,
          letterSpacing: 8,
        }}>
          有劲AI
        </div>

        {/* Divider */}
        <div style={{
          width: interpolate(tagSpring, [0, 1], [0, 140]),
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(239,106,32,0.8), transparent)",
        }} />

        {/* Tagline */}
        <div style={{
          fontSize: 48,
          fontFamily: SANS_FONT,
          color: "rgba(239,106,32,0.95)",
          opacity: ctaSpring,
          fontWeight: 700,
          letterSpacing: 4,
          transform: `translateY(${interpolate(ctaSpring, [0, 1], [20, 0])}px)`,
        }}>
          7天有劲训练营
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 32,
          fontFamily: SANS_FONT,
          color: "rgba(255,255,255,0.7)",
          opacity: ctaSpring,
          fontWeight: 400,
          letterSpacing: 2,
          transform: `translateY(${interpolate(ctaSpring, [0, 1], [15, 0])}px)`,
        }}>
          免费 · 找回你的劲
        </div>

        {/* Link */}
        <div style={{
          marginTop: 30,
          fontSize: 28,
          fontFamily: SANS_FONT,
          color: "rgba(255,255,255,0.45)",
          opacity: linkSpring,
          transform: `translateY(${interpolate(linkSpring, [0, 1], [15, 0])}px)`,
          letterSpacing: 2,
        }}>
          wechat.eugenewe.net
        </div>
      </div>
    </AbsoluteFill>
  );
};
