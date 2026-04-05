import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  // Slow gradient shift from dark blue/purple to warm
  const hue1 = interpolate(frame, [0, 480], [230, 30]);
  const hue2 = interpolate(frame, [0, 480], [260, 45]);
  const lightness = interpolate(frame, [0, 480], [8, 14]);

  // Floating orbs
  const orbs = [
    { x: 300, y: 600, size: 400, speed: 0.008, hueOffset: 0 },
    { x: 700, y: 1200, size: 350, speed: 0.012, hueOffset: 30 },
    { x: 200, y: 1600, size: 300, speed: 0.006, hueOffset: -20 },
  ];

  return (
    <AbsoluteFill>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(160deg, hsl(${hue1}, 40%, ${lightness}%) 0%, hsl(${hue2}, 35%, ${lightness - 3}%) 100%)`,
        }}
      />
      {orbs.map((orb, i) => {
        const ox = orb.x + Math.sin(frame * orb.speed) * 60;
        const oy = orb.y + Math.cos(frame * orb.speed * 0.7) * 40;
        const h = hue1 + orb.hueOffset;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ox - orb.size / 2,
              top: oy - orb.size / 2,
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: `radial-gradient(circle, hsla(${h}, 60%, 30%, 0.15) 0%, transparent 70%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
