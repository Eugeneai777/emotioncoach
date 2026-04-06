import { AbsoluteFill, Video, Sequence, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SERIF_FONT, SANS_FONT } from "./fonts";

/**
 * MidlifeCrisisHeyGen — HeyGen 数字人 + 品牌叠加
 * 
 * 直接播放 HeyGen 生成的完整视频，
 * 在关键时刻叠加文字动画和品牌元素。
 */

const BRAND_START = 42 * 30; // ~42s mark, CTA scene starts
const TOTAL_FRAMES = 55 * 30; // ~55s total (50.4s video + buffer)

// Floating subtitle overlay for key moments
const Subtitle: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 30, stiffness: 120 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [30, 0]);
  const fadeOut = interpolate(frame, [delay + 80, delay + 100], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{
      position: "absolute",
      bottom: 180,
      left: 0,
      right: 0,
      textAlign: "center",
      padding: "0 60px",
      opacity: opacity * fadeOut,
      transform: `translateY(${y}px)`,
    }}>
      <div style={{
        display: "inline-block",
        background: "rgba(0,0,0,0.6)",
        borderRadius: 16,
        padding: "16px 32px",
        backdropFilter: "none",
      }}>
        <span style={{
          fontSize: 36,
          fontFamily: SANS_FONT,
          color: "rgba(255,255,255,0.95)",
          fontWeight: 500,
          letterSpacing: 2,
        }}>
          {text}
        </span>
      </div>
    </div>
  );
};

// Brand CTA overlay at the end
const BrandCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const logoSpring = spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 100 } });
  const tagSpring = spring({ frame: frame - 30, fps, config: { damping: 30 } });
  const linkSpring = spring({ frame: frame - 50, fps, config: { damping: 25 } });
  const glowPulse = 0.15 + Math.sin(frame * 0.06) * 0.08;

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {/* Semi-transparent overlay */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "45%",
        background: "linear-gradient(to top, rgba(10,10,30,0.95) 0%, rgba(10,10,30,0.7) 60%, transparent 100%)",
      }} />
      
      {/* Glow */}
      <div style={{
        position: "absolute",
        bottom: "22%",
        left: "50%",
        width: 400,
        height: 400,
        transform: "translate(-50%, 50%)",
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(239,106,32,${glowPulse}) 0%, transparent 70%)`,
      }} />

      {/* Brand content */}
      <div style={{
        position: "absolute",
        bottom: 100,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}>
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          fontFamily: SERIF_FONT,
          color: "white",
          transform: `scale(${interpolate(logoSpring, [0, 1], [0.5, 1])})`,
          opacity: logoSpring,
          letterSpacing: 6,
        }}>
          有劲AI
        </div>

        <div style={{
          width: interpolate(tagSpring, [0, 1], [0, 120]),
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(239,106,32,0.8), transparent)",
        }} />

        <div style={{
          fontSize: 36,
          fontFamily: SANS_FONT,
          color: "rgba(239,106,32,0.9)",
          opacity: tagSpring,
          fontWeight: 600,
          letterSpacing: 3,
        }}>
          7天有劲训练营
        </div>

        <div style={{
          fontSize: 28,
          fontFamily: SANS_FONT,
          color: "rgba(255,255,255,0.6)",
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

export const MidlifeCrisisHeyGen: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1e" }}>
      {/* HeyGen digital human video - full screen */}
      <Video
        src={staticFile("heygen/midlife.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Subtitle overlays at key scene transitions */}
      <Sequence from={0} durationInFrames={120}>
        <Subtitle text="💭 你是不是也这样？" delay={60} />
      </Sequence>

      <Sequence from={300} durationInFrames={120}>
        <Subtitle text="🌅 转折的那一刻" delay={15} />
      </Sequence>

      <Sequence from={600} durationInFrames={120}>
        <Subtitle text="💪 找回你的劲" delay={15} />
      </Sequence>

      {/* Brand CTA overlay in the last ~8 seconds */}
      <Sequence from={BRAND_START} durationInFrames={TOTAL_FRAMES - BRAND_START}>
        <BrandCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
