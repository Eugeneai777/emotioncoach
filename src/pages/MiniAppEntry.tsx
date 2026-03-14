import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import logoImage from "@/assets/logo-youjin-ai.png";

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

const MiniAppEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部品牌区 */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <img
          src={logoImage}
          alt="有劲AI"
          className="w-16 h-16 rounded-full object-cover shadow-md"
        />
        <h1 className="mt-3 text-lg font-bold text-foreground tracking-wide">
          有劲AI
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          每个人的生活教练
        </p>
      </div>

      {/* 6 个人群入口 2x3 */}
      <div className="flex-1 px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {audiences.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(a.route)}
              className="relative flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-sm border border-border/30 h-[140px] active:opacity-90 transition-opacity"
            >
              {/* 渐变背景 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-90`} />
              {/* 内容 */}
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <span className="text-4xl drop-shadow-sm">{a.emoji}</span>
                <span className="text-base font-bold text-white drop-shadow-sm">
                  {a.label}
                </span>
                <span className="text-[11px] text-white/80">
                  {a.subtitle}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 底部探索入口 */}
      <div className="pb-8 flex justify-center">
        <button
          onClick={() => navigate("/energy-studio")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <Compass className="w-3.5 h-3.5" />
          探索更多工具
        </button>
      </div>
    </div>
  );
};

export default MiniAppEntry;
