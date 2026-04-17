import { AbsoluteFill } from "remotion";
import { useEntrance, SERIF_FONT, COLORS } from "./HavrutaPrimitives";

export const Havruta01_Hook: React.FC = () => {
  const a = useEntrance(20);
  const b = useEntrance(70);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 110px" }}>
      <div style={{ ...a, fontFamily: SERIF_FONT, fontWeight: 900, fontSize: 110, lineHeight: 1.35, color: COLORS.cream, textAlign: "center" }}>
        一个人想
      </div>
      <div style={{ ...b, marginTop: 30, fontFamily: SERIF_FONT, fontWeight: 900, fontSize: 110, lineHeight: 1.35, color: COLORS.amber, textAlign: "center" }}>
        永远绕不出
        <br />那个圈
      </div>
    </AbsoluteFill>
  );
};
