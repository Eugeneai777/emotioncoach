import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { TextReveal } from "../components/TextReveal";

interface Props {
  title: string;
  subtitle: string;
  description: string;
}

export const PainPoint: React.FC<Props> = ({ title, subtitle, description }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = interpolate(frame, [170, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineWidth = spring({ frame: frame - 5, fps, config: { damping: 40 } });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", padding: "0 80px", textAlign: "center" }}>
        <TextReveal text={title} fontSize={120} fontWeight={900} delay={10} color="rgba(255,255,255,0.95)" useSerif />
        <div style={{ width: interpolate(lineWidth, [0, 1], [0, 200]), height: 3, background: "linear-gradient(90deg, transparent, rgba(255,180,100,0.8), transparent)", margin: "30px 0" }} />
        <TextReveal text={subtitle} fontSize={56} fontWeight={400} delay={25} color="rgba(255,200,150,0.9)" useSerif={false} />
        <div style={{ marginTop: 60 }}>
          <TextReveal text={description} fontSize={36} fontWeight={300} delay={45} color="rgba(255,255,255,0.5)" useSerif={false} lineHeight={1.8} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
