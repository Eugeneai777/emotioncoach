import { AbsoluteFill, Sequence } from "remotion";
import { MidlifeOpening } from "./scenes/MidlifeOpening";
import { MidlifeTurning } from "./scenes/MidlifeTurning";
import { MidlifeCTA } from "./scenes/MidlifeCTA";

/**
 * MidlifeStockVideo — 真人素材混剪版中年觉醒视频
 * 
 * 3段结构：
 * 1. 深夜痛点（0-300帧 = 10秒）
 * 2. 转折觉醒（270-570帧 = 10秒，30帧交叉淡入）
 * 3. 品牌CTA（540-780帧 = 8秒，30帧交叉淡入）
 * 
 * 总计约26秒 @ 30fps = 780帧
 */
export const MidlifeStockVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1e" }}>
      {/* Scene 1: Pain point — 10s */}
      <Sequence from={0} durationInFrames={300}>
        <MidlifeOpening />
      </Sequence>

      {/* Scene 2: Turning point — 10s, starts with 30f overlap */}
      <Sequence from={270} durationInFrames={300}>
        <MidlifeTurning />
      </Sequence>

      {/* Scene 3: CTA — 8s, starts with 30f overlap */}
      <Sequence from={540} durationInFrames={240}>
        <MidlifeCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
