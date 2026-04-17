import { AbsoluteFill } from "remotion";
import { useEntrance, AmberRule, SERIF_FONT, SANS_FONT, COLORS } from "./HavrutaPrimitives";

interface Props {
  index: string;
  word: string;
  sub: string;
}

export const HavrutaStep: React.FC<Props> = ({ index, word, sub }) => {
  const a = useEntrance(10);
  const b = useEntrance(40);
  const c = useEntrance(85);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 110px" }}>
      <div style={{ ...a, fontFamily: SANS_FONT, fontSize: 40, letterSpacing: 10, color: COLORS.amber, fontWeight: 600 }}>
        STEP {index}
      </div>
      <div style={{ ...a, marginTop: 20 }}><AmberRule delay={30} width={120} /></div>
      <div style={{ ...b, marginTop: 50, fontFamily: SERIF_FONT, fontWeight: 900, fontSize: 280, lineHeight: 1, color: COLORS.cream }}>
        {word}
      </div>
      <div style={{ ...c, marginTop: 50, fontFamily: SANS_FONT, fontSize: 44, lineHeight: 1.5, color: COLORS.cream, fontWeight: 400, whiteSpace: "pre-line" }}>
        {sub}
      </div>
    </AbsoluteFill>
  );
};
