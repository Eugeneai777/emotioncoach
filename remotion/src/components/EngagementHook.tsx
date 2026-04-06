import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SERIF_FONT, SANS_FONT } from "../fonts";

interface Props {
  question: string;
  cta?: string;
}

export const EngagementHook: React.FC<Props> = ({ question, cta = "评论区告诉我 👇" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Question text entrance
  const qSpring = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 100 } });
  const qScale = interpolate(qSpring, [0, 1], [0.6, 1]);
  const qOpacity = qSpring;

  // CTA entrance
  const ctaSpring = spring({ frame: frame - 40, fps, config: { damping: 20, stiffness: 120 } });
  const ctaY = interpolate(ctaSpring, [0, 1], [30, 0]);

  // Gentle pulse on question
  const pulse = 1 + Math.sin(frame * 0.08) * 0.02;

  // Glow
  const glowIntensity = 0.15 + Math.sin(frame * 0.06) * 0.08;

  return (
    <AbsoluteFill>
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(10,10,30,0.9) 0%, rgba(10,10,30,0.3) 50%, transparent 100%)",
        }}
      />

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          left: "50%",
          width: 500,
          height: 500,
          transform: "translate(-50%, 50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(239,106,32,${glowIntensity}) 0%, transparent 70%)`,
        }}
      />

      {/* Question */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            fontFamily: SERIF_FONT,
            color: "rgba(255,255,255,0.98)",
            textAlign: "center",
            lineHeight: 1.4,
            letterSpacing: 4,
            opacity: qOpacity,
            transform: `scale(${qScale * pulse})`,
            textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            whiteSpace: "pre-wrap",
          }}
        >
          {question}
        </div>

        {/* Divider */}
        <div
          style={{
            width: interpolate(ctaSpring, [0, 1], [0, 160]),
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(239,106,32,0.8), transparent)",
          }}
        />

        {/* CTA */}
        <div
          style={{
            fontSize: 36,
            fontFamily: SANS_FONT,
            fontWeight: 600,
            color: "rgba(239,106,32,0.9)",
            opacity: ctaSpring,
            transform: `translateY(${ctaY}px)`,
            letterSpacing: 3,
          }}
        >
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};
