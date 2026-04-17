import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HavrutaBackground } from "./scenes/HavrutaBackground";
import { Havruta01_Hook } from "./scenes/Havruta01_Hook";
import { Havruta02_Title } from "./scenes/Havruta02_Title";
import { Havruta03_Origin } from "./scenes/Havruta03_Origin";
import { Havruta04_Principle } from "./scenes/Havruta04_Principle";
import { HavrutaStep } from "./scenes/HavrutaStep";
import { Havruta09_CTA } from "./scenes/Havruta09_CTA";

// Scene durations in frames @ 30fps. Each ≈ audio length + ~1.5s breathing room.
// Audio durations (s): 8.57 / 5.74 / 6.94 / 6.36 / 4.97 / 5.95 / 4.68 / 5.62 / 8.76
const SCENES = [
  { dur: 310, audio: "havruta-01.mp3" }, // 10.33s
  { dur: 220, audio: "havruta-02.mp3" }, // 7.33s
  { dur: 250, audio: "havruta-03.mp3" }, // 8.33s
  { dur: 235, audio: "havruta-04.mp3" }, // 7.83s
  { dur: 195, audio: "havruta-05.mp3" }, // 6.50s
  { dur: 220, audio: "havruta-06.mp3" }, // 7.33s
  { dur: 190, audio: "havruta-07.mp3" }, // 6.33s
  { dur: 210, audio: "havruta-08.mp3" }, // 7.00s
  { dur: 320, audio: "havruta-09.mp3" }, // 10.66s
];
const TRANSITION = 18;

// Total: sum(durations) - 8 transitions * TRANSITION_FRAMES
export const HAVRUTA_TOTAL_FRAMES =
  SCENES.reduce((s, x) => s + x.dur, 0) - 8 * TRANSITION; // 2150 - 144 = 2006 frames ≈ 66.9s

// Audio offsets (in absolute frames) — account for transition overlap.
// Each scene starts at: cumulative scene start - (sceneIndex * TRANSITION)
const AUDIO_OFFSETS: number[] = [];
{
  let cursor = 0;
  for (let i = 0; i < SCENES.length; i++) {
    AUDIO_OFFSETS.push(cursor);
    cursor += SCENES[i].dur - TRANSITION;
  }
}

const fadeT = () => ({
  presentation: fade(),
  timing: linearTiming({ durationInFrames: TRANSITION }),
});

export const HavrutaIntroVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <HavrutaBackground />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES[0].dur}>
          <Havruta01_Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fadeT()} />

        <TransitionSeries.Sequence durationInFrames={SCENES[1].dur}>
          <Havruta02_Title />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fadeT()} />

        <TransitionSeries.Sequence durationInFrames={SCENES[2].dur}>
          <Havruta03_Origin />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fadeT()} />

        <TransitionSeries.Sequence durationInFrames={SCENES[3].dur}>
          <Havruta04_Principle />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fadeT()} />

        <TransitionSeries.Sequence durationInFrames={SCENES[4].dur}>
          <HavrutaStep index="01" word="倾听" sub={"不打断\n不预判"} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fadeT()} />

        <TransitionSeries.Sequence durationInFrames={SCENES[5].dur}>
          <HavrutaStep index="02" word="追问" sub={"用「为什么」「然后呢」\n代替建议"} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fadeT()} />

        <TransitionSeries.Sequence durationInFrames={SCENES[6].dur}>
          <HavrutaStep index="03" word="挑战" sub={"善意地戳破回避"} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fadeT()} />

        <TransitionSeries.Sequence durationInFrames={SCENES[7].dur}>
          <HavrutaStep index="04" word="共识" sub={"不必赢\n只求看见"} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition {...fadeT()} />

        <TransitionSeries.Sequence durationInFrames={SCENES[8].dur}>
          <Havruta09_CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Voiceover audio tracks, each delayed ~10 frames into its scene for breathing room */}
      {SCENES.map((s, i) => (
        <Sequence key={i} from={AUDIO_OFFSETS[i] + 10}>
          <Audio src={staticFile(`audio/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
