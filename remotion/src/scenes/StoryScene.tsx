import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { TextReveal } from "../components/TextReveal";
import { SERIF_FONT, SANS_FONT } from "../fonts";

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
  const cardScale = spring({ frame: frame - 10, fps, config: { damping: 25 } });
  const cardY = interpolate(cardScale, [0, 1], [80, 0]);
  const quoteOpacity = interpolate(frame, [15, 35], [0, 0.15], { extrapolateRight: "clamp" });
  const userSpring = spring({ frame: frame - 60, fps, config: { damping: 30 } });

  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", padding: "0 60px" }}>
        <div style={{ transform: `translateY(${cardY}px) scale(${interpolate(cardScale, [0, 1], [0.9, 1])})`, opacity: cardScale, background: "rgba(255,255,255,0.04)", borderRadius: 32, padding: "60px 50px", border: "1px solid rgba(255,255,255,0.08)", position: "relative", width: "100%", maxWidth: 900 }}>
          <div style={{ position: "absolute", top: 20, left: 30, fontSize: 180, fontFamily: "Georgia, serif", color: `rgba(255,180,100,${quoteOpacity})`, lineHeight: 1 }}>"</div>
          <TextReveal text={quote} fontSize={42} fontWeight={400} delay={20} color="rgba(255,255,255,0.85)" useSerif lineHeight={1.8} />
        </div>
        <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 16, opacity: userSpring, transform: `translateY(${interpolate(userSpring, [0, 1], [20, 0])}px)` }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #e8927c, #d4a574)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "white", fontWeight: 700, fontFamily: SANS_FONT }}>{name[0]}</div>
          <div>
            <div style={{ fontSize: 28, color: "rgba(255,255,255,0.8)", fontFamily: SANS_FONT, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.4)", fontFamily: SANS_FONT }}>{identity}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
