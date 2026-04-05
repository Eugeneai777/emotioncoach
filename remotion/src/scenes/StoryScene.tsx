import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { TextReveal } from "../components/TextReveal";

interface Props {
  name: string;
  identity: string;
  quote: string;
}

export const StoryScene: React.FC<Props> = ({ name, identity, quote }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [155, 190], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = fadeIn * fadeOut;

  // Quote card
  const cardScale = spring({ frame: frame - 10, fps, config: { damping: 25 } });
  const cardY = interpolate(cardScale, [0, 1], [80, 0]);

  // Quote marks
  const quoteOpacity = interpolate(frame, [15, 35], [0, 0.15], { extrapolateRight: "clamp" });

  // User info
  const userSpring = spring({ frame: frame - 60, fps, config: { damping: 30 } });

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: "0 60px",
        }}
      >
        {/* Quote card */}
        <div
          style={{
            transform: `translateY(${cardY}px) scale(${interpolate(cardScale, [0, 1], [0.9, 1])})`,
            opacity: cardScale,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 32,
            padding: "60px 50px",
            border: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
            width: "100%",
            maxWidth: 900,
          }}
        >
          {/* Big quote mark */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 30,
              fontSize: 180,
              fontFamily: "Georgia, serif",
              color: `rgba(255,180,100,${quoteOpacity})`,
              lineHeight: 1,
            }}
          >
            "
          </div>

          <TextReveal
            text={quote}
            fontSize={42}
            fontWeight={400}
            delay={20}
            color="rgba(255,255,255,0.85)"
            fontFamily="Noto Serif SC, serif"
            lineHeight={1.8}
          />
        </div>

        {/* User info */}
        <div
          style={{
            marginTop: 50,
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: userSpring,
            transform: `translateY(${interpolate(userSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #e8927c, #d4a574)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: "white",
              fontWeight: 700,
              fontFamily: "Noto Sans SC, sans-serif",
            }}
          >
            {name[0]}
          </div>
          <div>
            <div style={{ fontSize: 28, color: "rgba(255,255,255,0.8)", fontFamily: "Noto Sans SC, sans-serif", fontWeight: 600 }}>
              {name}
            </div>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.4)", fontFamily: "Noto Sans SC, sans-serif" }}>
              {identity}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
