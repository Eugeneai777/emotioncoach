import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const audiences = [
  {
    id: "mama",
    emoji: "👩‍👧",
    label: "宝妈专区",
    subtitle: "陪你一起带娃",
    route: "/mama",
    gradient: "from-rose-400 to-pink-500",
    bg: "bg-rose-50",
  },
  {
    id: "workplace",
    emoji: "💼",
    label: "职场解压",
    subtitle: "压力管理·倦怠恢复",
    route: "/coach-space",
    gradient: "from-blue-400 to-indigo-500",
    bg: "bg-blue-50",
  },
  {
    id: "couple",
    emoji: "💑",
    label: "情侣夫妻",
    subtitle: "亲密关系·沟通",
    route: "/communication-assessment",
    gradient: "from-purple-400 to-violet-500",
    bg: "bg-purple-50",
  },
  {
    id: "youth",
    emoji: "🎓",
    label: "青少年成长",
    subtitle: "学业·情绪·自信",
    route: "/emotion-health",
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
  },
  {
    id: "senior",
    emoji: "🌿",
    label: "中老年关怀",
    subtitle: "退休适应·健康",
    route: "/midlife-awakening",
    gradient: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-50",
  },
];

const AudienceHub = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <span>🎯</span> 找到适合你的入口
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
        {audiences.map((a, i) => (
          <motion.button
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(a.route)}
            className={`flex-shrink-0 w-[100px] rounded-2xl ${a.bg} border border-border/50 p-3 text-center transition-shadow hover:shadow-md active:shadow-sm`}
          >
            <div className={`w-11 h-11 mx-auto rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center mb-1.5 shadow-sm`}>
              <span className="text-xl">{a.emoji}</span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-tight">{a.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{a.subtitle}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default AudienceHub;
