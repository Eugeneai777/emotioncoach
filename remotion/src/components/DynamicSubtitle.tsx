import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SERIF_FONT, SANS_FONT } from "../fonts";

export interface SubtitleSegment {
  text: string;
  startFrame: number;
  endFrame: number;
  style: "hook" | "pain" | "product" | "question";
  highlight?: string;
}

interface Props {
  segments: SubtitleSegment[];
}

const STYLE_MAP = {
  hook: {
    fontSize: 80,
    color: "rgba(255,255,255,0.98)",
    fontWeight: 900,
    fontFamily: "serif",
    bgOpacity: 0,
  },
  pain: {
    fontSize: 48,
    color: "rgba(255,220,180,0.95)",
    fontWeight: 500,
    fontFamily: "sans",
    bgOpacity: 0.6,
  },
  product: {
    fontSize: 44,
    color: "rgba(255,255,255,0.95)",
    fontWeight: 500,
    fontFamily: "sans",
    bgOpacity: 0.7,
  },
  question: {
    fontSize: 64,
    color: "rgba(239,106,32,0.95)",
    fontWeight: 700,
    fontFamily: "serif",
    bgOpacity: 0,
  },
};

export const DynamicSubtitle: React.FC<Props> = ({ segments }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeSegment = segments.find(
    (s) => frame >= s.startFrame && frame <= s.endFrame
  );

  if (!activeSegment) return null;

  const localFrame = frame - activeSegment.startFrame;
  const duration = activeSegment.endFrame - activeSegment.startFrame;
  const config = STYLE_MAP[activeSegment.style];

  // Enter animation
  const enterSpring = spring({ frame: localFrame, fps, config: { damping: 25, stiffness: 150 } });
  const y = interpolate(enterSpring, [0, 1], [40, 0]);
  const opacity = enterSpring;

  // Exit fade
  const exitFade = interpolate(localFrame, [duration - 10, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse for question style
  const pulse = activeSegment.style === "question"
    ? 1 + Math.sin(localFrame * 0.15) * 0.03
    : 1;

  const fontFamily = config.fontFamily === "serif" ? SERIF_FONT : SANS_FONT;

  // Render text with optional highlight
  const renderText = () => {
    const { text, highlight } = activeSegment;
    if (!highlight || !text.includes(highlight)) {
      return <span>{text}</span>;
    }
    const parts = text.split(highlight);
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span style={{ color: "rgba(239,106,32,1)", textShadow: "0 0 20px rgba(239,106,32,0.4)" }}>
                {highlight}
              </span>
            )}
          </span>
        ))}
      </>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: activeSegment.style === "hook" ? "40%" : 140,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 60px",
        opacity: opacity * exitFade,
        transform: `translateY(${y}px) scale(${pulse})`,
        zIndex: 100,
      }}
    >
      {config.bgOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: "-12px -24px",
            background: `rgba(0,0,0,${config.bgOpacity})`,
            borderRadius: 16,
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          fontSize: config.fontSize,
          fontWeight: config.fontWeight,
          fontFamily,
          color: config.color,
          textAlign: "center",
          lineHeight: 1.5,
          letterSpacing: 2,
          whiteSpace: "pre-wrap",
          textShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        {renderText()}
      </div>
    </div>
  );
};
