import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SERIF_FONT, SANS_FONT } from "../fonts";

export const COLORS = {
  bg: "#0F2942",
  amber: "#C8923D",
  cream: "#F4EFE6",
  dim: "rgba(244,239,230,0.55)",
};

export const useEntrance = (delay: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 25, stiffness: 90, mass: 1 } });
  const y = interpolate(s, [0, 1], [40, 0]);
  const blur = interpolate(s, [0, 1], [12, 0]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  return { opacity, transform: `translateY(${y}px)`, filter: `blur(${blur}px)` };
};

export const AmberRule: React.FC<{ delay?: number; width?: number | string }> = ({ delay = 0, width = 200 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ width, height: 2, background: COLORS.amber, transform: `scaleX(${progress})`, transformOrigin: "left center" }} />
  );
};

export { SERIF_FONT, SANS_FONT };
