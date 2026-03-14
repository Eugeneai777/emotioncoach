import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoImage from "@/assets/logo-youjin-ai.png";

const audiences = [
  {
    id: "mama",
    emoji: "👩‍👧",
    label: "宝妈专区",
    subtitle: "陪你一起带娃",
    route: "/mama",
    gradient: "from-rose-400 to-pink-500",
    tag: "热门",
  },
  {
    id: "workplace",
    emoji: "💼",
    label: "职场解压",
    subtitle: "压力·倦怠恢复",
    route: "/promo/synergy",
    gradient: "from-blue-400 to-indigo-500",
    tag: "推荐",
  },
  {
    id: "couple",
    emoji: "💑",
    label: "情侣夫妻",
    subtitle: "亲密关系·沟通",
    route: "/us-ai",
    gradient: "from-purple-400 to-violet-500",
    tag: "热门",
  },
  {
    id: "youth",
    emoji: "🎓",
    label: "青少年",
    subtitle: "学业·情绪·自信",
    route: "/xiaojin",
    gradient: "from-amber-400 to-orange-500",
    tag: "新",
  },
  {
    id: "midlife",
    emoji: "🧭",
    label: "中年觉醒",
    subtitle: "转型·意义重建",
    route: "/laoge",
    gradient: "from-amber-500 to-yellow-600",
    tag: null,
  },
  {
    id: "senior",
    emoji: "🌿",
    label: "银发陪伴",
    subtitle: "长辈陪伴·关怀",
    route: "/elder-care",
    gradient: "from-emerald-400 to-teal-500",
    tag: "推荐",
  },
];

const MiniAppEntry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background flex flex-col relative overflow-hidden">
      {/* 装饰性光晕 */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-amber-200/40 to-orange-200/20 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-16 w-40 h-40 rounded-full bg-gradient-to-br from-rose-200/30 to-pink-200/10 blur-3xl pointer-events-none" />

      {/* 顶部品牌区 — 紧凑水平布局 */}
      <div className="flex items-center gap-3 pt-8 pb-5 px-5 relative z-10">
        <img
          src={logoImage}
          alt="有劲AI"
          className="w-12 h-12 rounded-full object-cover shadow-md flex-shrink-0"
        />
        <div>
          <h1 className="text-base font-bold text-foreground tracking-wide">
            有劲AI
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            每个人的生活教练
          </p>
        </div>
      </div>

      {/* 6 个人群入口 2x3 */}
      <div className="flex-1 px-4 pb-6 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          {audiences.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -3 }}
              onClick={() => navigate(a.route)}
              className="relative flex items-center gap-3 rounded-2xl p-4 bg-background/60 backdrop-blur-md border border-border/40 shadow-sm overflow-hidden text-left transition-shadow hover:shadow-md"
            >
              {/* 左侧渐变条 */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${a.gradient}`} />

              {/* emoji */}
              <span className="text-5xl flex-shrink-0 ml-1">{a.emoji}</span>

              {/* 文字区 */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-foreground block truncate">
                  {a.label}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">
                  {a.subtitle}
                </span>
              </div>

              {/* 右侧箭头 */}
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />

              {/* 标签 badge */}
              {a.tag && (
                <Badge
                  className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4 border-0 bg-gradient-to-r ${a.gradient} text-white font-medium`}
                >
                  {a.tag}
                </Badge>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 底部探索入口 */}
      <div className="pb-8 flex justify-center relative z-10">
        <button
          onClick={() => navigate("/energy-studio")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-muted transition-colors active:scale-95"
        >
          <Compass className="w-3.5 h-3.5" />
          探索更多工具
        </button>
      </div>
    </div>
  );
};

export default MiniAppEntry;
