import { AbsoluteFill } from "remotion";
import { useEntrance, AmberRule, SERIF_FONT, SANS_FONT, COLORS } from "./HavrutaPrimitives";

export const Havruta09_CTA: React.FC = () => {
  const a = useEntrance(10);
  const b = useEntrance(40);
  const c = useEntrance(80);
  const d = useEntrance(130);
  const e = useEntrance(180);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 110px" }}>
      <div style={{ ...a, fontFamily: SANS_FONT, fontSize: 32, letterSpacing: 8, color: COLORS.amber, fontWeight: 600 }}>
        THIS WEEK
      </div>
      <div style={{ ...a, marginTop: 18 }}><AmberRule delay={30} width={140} /></div>

      <div style={{ ...b, marginTop: 50, fontFamily: SERIF_FONT, fontWeight: 900, fontSize: 110, lineHeight: 1.15, color: COLORS.cream }}>
        7天有劲<br />训练营
      </div>

      <div style={{ ...c, marginTop: 50, fontFamily: SANS_FONT, fontSize: 38, lineHeight: 1.7, color: COLORS.cream, fontWeight: 400 }}>
        每晚 21:00　·　4–6 人一组
        <br />戴西老师领读
      </div>

      <div style={{ ...d, marginTop: 60, fontFamily: SERIF_FONT, fontWeight: 700, fontSize: 64, color: COLORS.amber, lineHeight: 1.4 }}>
        这一次<br />不再一个人扛
      </div>

      <div style={{ ...e, marginTop: 50, fontFamily: SANS_FONT, fontSize: 28, color: COLORS.dim, letterSpacing: 4 }}>
        eugeneai.me
      </div>
    </AbsoluteFill>
  );
};
