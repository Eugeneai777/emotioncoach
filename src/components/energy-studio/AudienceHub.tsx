import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";

const audiences = [
  {
    id: "mama",
    emoji: "👩‍👧",
    label: "宝妈专区",
    subtitle: "陪你一起带娃",
    route: "/mama",
    gradient: "from-rose-400 to-pink-500",
  },
  {
    id: "workplace",
    emoji: "💼",
    label: "职场解压",
    subtitle: "压力·倦怠恢复",
    route: "/promo/synergy",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    id: "couple",
    emoji: "💑",
    label: "情侣夫妻",
    subtitle: "亲密关系·沟通",
    route: "/us-ai",
    gradient: "from-purple-400 to-violet-500",
  },
  {
    id: "youth",
    emoji: "🎓",
    label: "青少年",
    subtitle: "学业·情绪·自信",
    route: "/xiaojin",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "midlife",
    emoji: "🧭",
    label: "中年觉醒",
    subtitle: "转型·意义重建",
    route: "/laoge",
    gradient: "from-amber-500 to-yellow-600",
  },
  {
    id: "senior",
    emoji: "🌿",
    label: "银发陪伴",
    subtitle: "长辈陪伴·关怀",
    route: "/elder-care",
    gradient: "from-emerald-400 to-teal-500",
  },
];

interface AudienceHubProps {
  showExploreEntry?: boolean;
}

const AudienceHub = ({ showExploreEntry = false }: AudienceHubProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="text-center pt-2">
        <h2 className="text-lg font-bold text-foreground tracking-wide">
          🎯 找到适合你的入口
        </h2>
        <p className="text-xs text-muted-foreground mt-1">选择你的场景，开启专属旅程</p>
      </div>

      {/* 2x3 大卡片网格 */}
      <div className="grid grid-cols-2 gap-3">
        {audiences.map((a, i) => (
          <motion.button
            key={a.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(a.route)}
            className="relative flex flex-col items-center justify-center gap-2 rounded-2xl py-6 px-3 overflow-hidden shadow-sm border border-border/30 active:opacity-80 transition-all"
          >
            {/* 渐变背景 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-10`} />
            
            {/* 大 emoji */}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-md`}>
              <span className="text-2xl">{a.emoji}</span>
            </div>
            
            {/* 文字 */}
            <span className="text-sm font-bold text-foreground relative z-10">{a.label}</span>
            <span className="text-[11px] text-muted-foreground relative z-10">{a.subtitle}</span>
          </motion.button>
        ))}
      </div>

      {/* 探索更多工具入口 */}
      {showExploreEntry && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/energy-studio/explore")}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/60 border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <Compass className="w-4 h-4" />
          <span>探索更多工具与测评</span>
        </motion.button>
      )}
    </div>
  );
};

export default AudienceHub;
