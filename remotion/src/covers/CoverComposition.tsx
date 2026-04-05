import { AbsoluteFill } from "remotion";

interface Props {
  title: string;
  subtitle: string;
  tag: string;
}

export const CoverComposition: React.FC<Props> = ({ title, subtitle, tag }) => {
  return (
    <AbsoluteFill>
      {/* Background gradient */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(165deg, #1a1035 0%, #0d1b2a 40%, #1b2838 100%)",
        }}
      />

      {/* Warm glow orb top-right */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,160,80,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Warm glow orb bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: -150,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,120,255,0.08) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: "0 80px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Tag */}
        <div
          style={{
            fontSize: 24,
            fontFamily: "Noto Sans SC, sans-serif",
            color: "rgba(255,180,100,0.9)",
            background: "rgba(255,180,100,0.1)",
            border: "1px solid rgba(255,180,100,0.2)",
            borderRadius: 30,
            padding: "8px 28px",
            marginBottom: 50,
            fontWeight: 500,
          }}
        >
          {tag}
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            fontFamily: "Noto Serif SC, serif",
            color: "white",
            lineHeight: 1.3,
            whiteSpace: "pre-wrap",
            marginBottom: 30,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 44,
            fontWeight: 400,
            fontFamily: "Noto Sans SC, sans-serif",
            color: "rgba(255,200,150,0.8)",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Bottom brand */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 60,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(255,200,150,0.4), transparent)",
          }}
        />
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            fontFamily: "Noto Serif SC, serif",
            color: "rgba(255,255,255,0.6)",
            letterSpacing: 6,
          }}
        >
          有劲AI
        </div>
        <div
          style={{
            fontSize: 18,
            fontFamily: "Noto Sans SC, sans-serif",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          你的AI情绪教练
        </div>
      </div>
    </AbsoluteFill>
  );
};
