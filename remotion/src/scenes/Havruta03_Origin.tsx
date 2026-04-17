import { AbsoluteFill } from "remotion";
import { useEntrance, AmberRule, SERIF_FONT, SANS_FONT, COLORS } from "./HavrutaPrimitives";

export const Havruta03_Origin: React.FC = () => {
  const a = useEntrance(15);
  const b = useEntrance(55);
  const c = useEntrance(95);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 110px" }}>
      <div style={{ ...a, fontFamily: SANS_FONT, fontSize: 36, color: COLORS.dim, letterSpacing: 4 }}>
        源自
      </div>
      <div style={{ ...b, marginTop: 30, fontFamily: SERIF_FONT, fontWeight: 900, fontSize: 130, lineHeight: 1.15, color: COLORS.cream }}>
        犹太人
        <br />
        <span style={{ color: COLORS.amber }}>2000年</span>
      </div>
      <div style={{ ...b, marginTop: 24 }}><AmberRule delay={70} width={260} /></div>
      <div style={{ ...c, marginTop: 40, fontFamily: SANS_FONT, fontSize: 44, lineHeight: 1.6, color: COLORS.cream, fontWeight: 400 }}>
        一种提问式的
        <br />深度对话传统
      </div>
    </AbsoluteFill>
  );
};
