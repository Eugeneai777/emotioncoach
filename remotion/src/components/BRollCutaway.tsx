import { AbsoluteFill, Video, Img, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from "remotion";

interface BRollClip {
  src: string;
  type: "video" | "image";
  effect?: "zoom-in" | "zoom-out" | "slide-left" | "slide-right" | "dissolve";
}

interface Props {
  clip: BRollClip;
}

export const BRollCutaway: React.FC<Props> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const effect = clip.effect || "zoom-in";

  // Fade in/out
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = fadeIn * fadeOut;

  // Effect transforms
  let transform = "";
  switch (effect) {
    case "zoom-in":
      const scaleIn = interpolate(frame, [0, durationInFrames], [1.0, 1.2], { extrapolateRight: "clamp" });
      transform = `scale(${scaleIn})`;
      break;
    case "zoom-out":
      const scaleOut = interpolate(frame, [0, durationInFrames], [1.2, 1.0], { extrapolateRight: "clamp" });
      transform = `scale(${scaleOut})`;
      break;
    case "slide-left":
      const slideX = interpolate(frame, [0, durationInFrames], [30, -30], { extrapolateRight: "clamp" });
      transform = `translateX(${slideX}px) scale(1.1)`;
      break;
    case "slide-right":
      const slideXR = interpolate(frame, [0, durationInFrames], [-30, 30], { extrapolateRight: "clamp" });
      transform = `translateX(${slideXR}px) scale(1.1)`;
      break;
    case "dissolve":
      transform = "scale(1.05)";
      break;
  }

  const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  return (
    <AbsoluteFill style={{ opacity, transform, transformOrigin: "center center" }}>
      {clip.type === "video" ? (
        <Video src={staticFile(clip.src)} style={mediaStyle} volume={0} />
      ) : (
        <Img src={staticFile(clip.src)} style={mediaStyle} />
      )}
    </AbsoluteFill>
  );
};
