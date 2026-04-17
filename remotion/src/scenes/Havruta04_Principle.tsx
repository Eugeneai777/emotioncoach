import { AbsoluteFill } from "remotion";
import { useEntrance, SERIF_FONT, SANS_FONT, COLORS } from "./HavrutaPrimitives";

export const Havruta04_Principle: React.FC = () => {
  const a = useEntrance(15);
  const b = useEntrance(50);
  const c = useEntrance(85);
  const d = useEntrance(120);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 110px", gap: 36 }}>
      <div style={{ ...a, fontFamily: SERIF_FONT, fontWeight: 700, fontSize: 96, color: COLORS.cream }}>
        不灌输
      </div>
      <div style={{ ...b, fontFamily: SERIF_FONT, fontWeight: 700, fontSize: 96, color: COLORS.cream }}>
        不评判
      </div>
      <div style={{ ...c, fontFamily: SERIF_FONT, fontWeight: 900, fontSize: 96, color: COLORS.amber }}>
        只追问
      </div>
      <div style={{ ...d, marginTop: 30, fontFamily: SANS_FONT, fontSize: 38, lineHeight: 1.55, color: COLORS.dim }}>
        把彼此真实的想法
        <br />一层层逼出来
      </div>
    </AbsoluteFill>
  );
};
