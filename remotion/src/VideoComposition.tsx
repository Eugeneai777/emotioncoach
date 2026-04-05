import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
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
  audioPrefix?: string;
}

export const VideoComposition: React.FC<Props> = (props) => {
  const prefix = props.audioPrefix;

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

      {prefix && (
        <>
          <Sequence from={0} durationInFrames={180}>
            <Audio src={staticFile(`audio/${prefix}_pain.mp3`)} />
          </Sequence>
          <Sequence from={180} durationInFrames={160}>
            <Audio src={staticFile(`audio/${prefix}_quote.mp3`)} />
          </Sequence>
          <Sequence from={340} durationInFrames={140}>
            <Audio src={staticFile(`audio/${prefix}_outro.mp3`)} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
