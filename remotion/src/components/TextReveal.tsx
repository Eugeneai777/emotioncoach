import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface Props {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
}

export const TextReveal: React.FC<Props> = ({
  text,
  delay = 0,
  fontSize = 72,
  color = "white",
  fontWeight = 700,
  lineHeight = 1.4,
  letterSpacing = 0,
  fontFamily = "Noto Serif SC, serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = text.split("\n");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: fontSize * 0.15 }}>
      {lines.map((line, li) => {
        const lineDelay = delay + li * 8;
        const s = spring({
          frame: frame - lineDelay,
          fps,
          config: { damping: 30, stiffness: 120 },
        });
        const opacity = interpolate(s, [0, 1], [0, 1]);
        const y = interpolate(s, [0, 1], [40, 0]);

        return (
          <div
            key={li}
            style={{
              fontSize,
              fontWeight,
              color,
              lineHeight,
              letterSpacing,
              fontFamily,
              opacity,
              transform: `translateY(${y}px)`,
              whiteSpace: "pre-wrap",
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};
