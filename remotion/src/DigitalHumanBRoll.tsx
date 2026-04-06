import { AbsoluteFill, Video, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { BRollCutaway } from "./components/BRollCutaway";
import { DynamicSubtitle, SubtitleSegment } from "./components/DynamicSubtitle";
import { ProductShowcase, ProductAnnotation } from "./components/ProductShowcase";
import { EngagementHook } from "./components/EngagementHook";

interface BRollClipConfig {
  src: string;
  type: "video" | "image";
  startFrame: number;
  durationInFrames: number;
  effect?: "zoom-in" | "zoom-out" | "slide-left" | "slide-right" | "dissolve";
}

interface ProductScreenConfig {
  src: string;
  startFrame: number;
  durationInFrames: number;
  annotations?: ProductAnnotation[];
}

export interface DigitalHumanBRollProps {
  avatarVideo: string;
  brollClips: BRollClipConfig[];
  subtitles: SubtitleSegment[];
  productScreenshots: ProductScreenConfig[];
  closingQuestion: string;
  closingCta?: string;
  questionStartFrame: number;
  brandName?: string;
}

/**
 * DigitalHumanBRoll — 数字人 + B-Roll 混剪模板
 *
 * 5层结构：
 * L0: 背景音乐（muted for now）
 * L1: 数字人口说视频（全程底层）
 * L2: B-Roll 素材（特定时间段覆盖）
 * L3: 产品截图展示（手机 mockup）
 * L4: 动态字幕（始终最上层）
 *
 * 5段叙事：Hook(3s) → 痛点(7s) → 产品(8s) → 效果(7s) → 提问(5s)
 */
export const DigitalHumanBRoll: React.FC<DigitalHumanBRollProps> = ({
  avatarVideo,
  brollClips,
  subtitles,
  productScreenshots,
  closingQuestion,
  closingCta,
  questionStartFrame,
}) => {
  const frame = useCurrentFrame();

  // Vignette that intensifies during B-Roll
  const hasBRoll = brollClips.some(
    (c) => frame >= c.startFrame && frame < c.startFrame + c.durationInFrames
  );
  const vignetteOpacity = hasBRoll ? 0.4 : 0.2;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1e" }}>
      {/* Layer 1: Digital Human — continuous bottom layer */}
      <Video
        src={staticFile(avatarVideo)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        volume={0}
      />

      {/* Layer 2: B-Roll cutaways */}
      {brollClips.map((clip, i) => (
        <Sequence key={`broll-${i}`} from={clip.startFrame} durationInFrames={clip.durationInFrames}>
          <BRollCutaway clip={clip} />
        </Sequence>
      ))}

      {/* Layer 3: Product screenshots */}
      {productScreenshots.map((ps, i) => (
        <Sequence key={`product-${i}`} from={ps.startFrame} durationInFrames={ps.durationInFrames}>
          <ProductShowcase screenshotSrc={ps.src} annotations={ps.annotations} />
        </Sequence>
      ))}

      {/* Engagement question overlay */}
      <Sequence from={questionStartFrame} durationInFrames={900 - questionStartFrame}>
        <EngagementHook question={closingQuestion} cta={closingCta} />
      </Sequence>

      {/* Layer 4: Dynamic subtitles — always on top */}
      <DynamicSubtitle segments={subtitles} />

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
          pointerEvents: "none",
          zIndex: 200,
        }}
      />
    </AbsoluteFill>
  );
};
