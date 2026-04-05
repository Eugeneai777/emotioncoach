import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "./components/Background";
import { PainPoint } from "./scenes/PainPoint";
import { StoryScene } from "./scenes/StoryScene";
import { BrandOutro } from "./scenes/BrandOutro";

interface Props {
  painTitle: string;
  painSub: string;
  painDesc: string;
  quoteName: string;
  quoteIdentity: string;
  quoteText: string;
  brandLine: string;
}

export const VideoComposition: React.FC<Props> = (props) => {
  // 16s = 480 frames at 30fps
  // Scene 1: Pain point (0-210, 7s)
  // Scene 2: Story/quote (180-370, ~6.3s)
  // Scene 3: Brand outro (340-480, ~4.7s)
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0} durationInFrames={210}>
        <PainPoint title={props.painTitle} subtitle={props.painSub} description={props.painDesc} />
      </Sequence>
      <Sequence from={180} durationInFrames={190}>
        <StoryScene name={props.quoteName} identity={props.quoteIdentity} quote={props.quoteText} />
      </Sequence>
      <Sequence from={340} durationInFrames={140}>
        <BrandOutro line={props.brandLine} />
      </Sequence>
    </AbsoluteFill>
  );
};
