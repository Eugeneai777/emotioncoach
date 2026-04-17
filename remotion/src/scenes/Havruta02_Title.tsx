import { AbsoluteFill } from "remotion";
import { useEntrance, AmberRule, SERIF_FONT, SANS_FONT, COLORS } from "./HavrutaPrimitives";

export const Havruta02_Title: React.FC = () => {
  const a = useEntrance(15);
  const b = useEntrance(45);
  const c = useEntrance(85);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 110px" }}>
      <div style={{ ...a, fontFamily: SANS_FONT, fontSize: 32, letterSpacing: 8, color: COLORS.dim, marginBottom: 40 }}>
        METHOD N°01
      </div>
      <div style={a}><AmberRule delay={30} width={140} /></div>
      <div style={{ ...b, marginTop: 50, fontFamily: SERIF_FONT, fontWeight: 900, fontSize: 160, lineHeight: 1.1, color: COLORS.cream }}>
        海沃塔
      </div>
      <div style={{ ...c, marginTop: 24, fontFamily: SERIF_FONT, fontWeight: 700, fontSize: 90, color: COLORS.amber }}>
        团队研讨
      </div>
    </AbsoluteFill>
  );
};
