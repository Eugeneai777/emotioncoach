import { AbsoluteFill, Video, staticFile, useCurrentFrame, interpolate, Sequence } from "remotion";
import { TextReveal } from "../components/TextReveal";
import { SANS_FONT } from "../fonts";

/**
 * Scene 2: Turning point — sunrise, hope, AI coach discovery
 * Warmer tones, lighter overlay, uplifting text
 */
export const MidlifeTurning: React.FC = () => {
  const frame = useCurrentFrame();

  // Ken Burns: slow pan up
  const translateY = interpolate(frame, [0, 300], [5, -5], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 300], [1.05, 1.12], { extrapolateRight: "clamp" });
  // Warmer, lighter overlay
  const overlayOpacity = interpolate(frame, [0, 30], [0.3, 0.55], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [270, 300], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1008", opacity: fadeOut > 0 ? fadeOut : 0 }}>
      {/* Sunrise video */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `scale(${scale}) translateY(${translateY}%)`,
        transformOrigin: "center center",
      }}>
        <Video
          src={staticFile("stock/sunrise.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          startFrom={60}
          volume={0}
        />
      </div>

      {/* Warm overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(to bottom, rgba(30,20,5,${overlayOpacity}) 0%, rgba(20,15,5,0.85) 100%)`,
      }} />

      {/* Text — two beats */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "0 70px", textAlign: "center", gap: 24,
      }}>
        {/* First beat: discovery */}
        <Sequence from={0} durationInFrames={160}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <TextReveal text="每天15分钟" fontSize={90} fontWeight={900} delay={10} color="rgba(255,220,160,0.95)" useSerif />
            <TextReveal text="跟着AI教练做情绪训练" fontSize={44} fontWeight={400} delay={30} color="rgba(255,255,255,0.8)" useSerif={false} />
          </div>
        </Sequence>

        {/* Second beat: result */}
        <Sequence from={130} durationInFrames={170}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <TextReveal text="第三天" fontSize={80} fontWeight={900} delay={10} color="rgba(255,220,160,0.95)" useSerif />
            <TextReveal text="一觉睡到天亮" fontSize={52} fontWeight={500} delay={25} color="rgba(255,255,255,0.85)" useSerif={false} />
            <div style={{ marginTop: 20 }}>
              <TextReveal text="老婆说 你最近脾气好多了" fontSize={36} fontWeight={300} delay={45} color="rgba(255,255,255,0.5)" useSerif={false} />
            </div>
          </div>
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
