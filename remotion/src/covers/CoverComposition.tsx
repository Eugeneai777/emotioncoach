import { AbsoluteFill } from "remotion";
import { SERIF_FONT, SANS_FONT } from "../fonts";

interface Props {
  title: string;
  subtitle: string;
  tag: string;
}

export const CoverComposition: React.FC<Props> = ({ title, subtitle, tag }) => {
  return (
    <AbsoluteFill>
      {/* Background gradient - full coverage */}
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(165deg, #1a1035 0%, #0d1b2a 50%, #1b2838 100%)" }} />
      
      {/* Subtle warm glow top-right */}
      <div style={{ position: "absolute", top: 100, right: -50, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,160,80,0.1) 0%, transparent 70%)" }} />
      
      {/* Subtle cool glow bottom-left */}
      <div style={{ position: "absolute", bottom: 300, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(150,120,255,0.06) 0%, transparent 70%)" }} />

      {/* Main content centered */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", padding: "0 80px", textAlign: "center", position: "relative" }}>
        {/* Tag */}
        <div style={{ fontSize: 26, fontFamily: SANS_FONT, color: "rgba(255,180,100,0.9)", background: "rgba(255,180,100,0.08)", border: "1px solid rgba(255,180,100,0.15)", borderRadius: 30, padding: "10px 32px", marginBottom: 60, fontWeight: 500, letterSpacing: 2 }}>{tag}</div>

        {/* Main title */}
        <div style={{ fontSize: 100, fontWeight: 900, fontFamily: SERIF_FONT, color: "white", lineHeight: 1.3, whiteSpace: "pre-wrap", marginBottom: 40, textShadow: "0 4px 30px rgba(0,0,0,0.3)" }}>{title}</div>

        {/* Subtitle */}
        <div style={{ fontSize: 46, fontWeight: 400, fontFamily: SANS_FONT, color: "rgba(255,200,150,0.75)", lineHeight: 1.5 }}>{subtitle}</div>
      </div>

      {/* Bottom brand */}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,200,150,0.3), transparent)" }} />
        <div style={{ fontSize: 30, fontWeight: 700, fontFamily: SERIF_FONT, color: "rgba(255,255,255,0.5)", letterSpacing: 6 }}>有劲AI</div>
        <div style={{ fontSize: 18, fontFamily: SANS_FONT, color: "rgba(255,255,255,0.2)" }}>你的AI情绪教练</div>
      </div>
    </AbsoluteFill>
  );
};
