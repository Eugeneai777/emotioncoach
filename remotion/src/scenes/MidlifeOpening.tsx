import { AbsoluteFill, Video, staticFile, useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import { TextReveal } from "../components/TextReveal";

/**
 * Scene 1: Pain point — late night overtime, exhaustion
 * Dark overlay + Ken Burns slow zoom + bold text
 */
export const MidlifeOpening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns: slow zoom in
  const scale = interpolate(frame, [0, 300], [1.0, 1.15], { extrapolateRight: "clamp" });
  // Dark overlay fades in
  const overlayOpacity = interpolate(frame, [0, 20], [0.4, 0.7], { extrapolateRight: "clamp" });
  // Fade out at end
  const fadeOut = interpolate(frame, [260, 300], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1e", opacity: fadeOut > 0 ? fadeOut : 0 }}>
      {/* Background video with Ken Burns */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}>
        <Video
          src={staticFile("stock/overtime.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          startFrom={0}
          volume={0}
        />
      </div>

      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(to bottom, rgba(10,10,30,${overlayOpacity}) 0%, rgba(10,10,30,0.9) 100%)`,
      }} />

      {/* Text content */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "0 80px", textAlign: "center", gap: 30,
      }}>
        <TextReveal text="凌晨三点" fontSize={110} fontWeight={900} delay={15} color="rgba(255,255,255,0.95)" useSerif />
        <TextReveal text="加班到胸口发紧" fontSize={52} fontWeight={400} delay={30} color="rgba(255,200,150,0.9)" useSerif={false} />
        <div style={{ marginTop: 40 }}>
          <TextReveal text="我才四十二岁\n这日子还能撑多久？" fontSize={38} fontWeight={300} delay={55} color="rgba(255,255,255,0.55)" useSerif={false} lineHeight={1.8} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
