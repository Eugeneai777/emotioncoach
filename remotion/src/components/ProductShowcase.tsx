import { AbsoluteFill, Img, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from "remotion";
import { SANS_FONT } from "../fonts";

export interface ProductAnnotation {
  x: number; // percentage 0-100
  y: number;
  label: string;
}

interface Props {
  screenshotSrc: string;
  annotations?: ProductAnnotation[];
}

export const ProductShowcase: React.FC<Props> = ({ screenshotSrc, annotations = [] }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Phone mockup slides in
  const slideIn = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const phoneY = interpolate(slideIn, [0, 1], [200, 0]);
  const phoneOpacity = slideIn;

  // Fade out
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Dimmed background */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,30,0.85)" }} />

      {/* Phone mockup */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${phoneY}px)`,
          opacity: phoneOpacity,
          width: 380,
          height: 760,
          borderRadius: 40,
          border: "4px solid rgba(255,255,255,0.2)",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(239,106,32,0.15)",
          background: "#111",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 140,
            height: 28,
            background: "#111",
            borderRadius: "0 0 16px 16px",
            zIndex: 10,
          }}
        />
        {/* Screenshot */}
        <Img
          src={staticFile(screenshotSrc)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Annotations */}
      {annotations.map((ann, i) => {
        const annSpring = spring({ frame: frame - 20 - i * 10, fps, config: { damping: 15, stiffness: 100 } });
        const annScale = interpolate(annSpring, [0, 1], [0, 1]);
        const annOpacity = annSpring;

        // Convert percentage to absolute position relative to phone
        const phoneLeft = (1080 - 380) / 2;
        const phoneTop = (1920 - 760) / 2;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: phoneLeft + (ann.x / 100) * 380,
              top: phoneTop + (ann.y / 100) * 760,
              transform: `scale(${annScale}) translate(-50%, -50%)`,
              opacity: annOpacity,
              zIndex: 20,
            }}
          >
            {/* Pulse ring */}
            <div
              style={{
                position: "absolute",
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2px solid rgba(239,106,32,0.8)",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame * 0.1) * 0.2})`,
                opacity: 0.6,
              }}
            />
            {/* Label */}
            <div
              style={{
                position: "absolute",
                left: 30,
                top: -12,
                whiteSpace: "nowrap",
                background: "rgba(239,106,32,0.9)",
                color: "white",
                fontSize: 20,
                fontFamily: SANS_FONT,
                fontWeight: 600,
                padding: "6px 16px",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {ann.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
