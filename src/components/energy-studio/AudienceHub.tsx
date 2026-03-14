import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const audiences = [
  {
    id: "mama",
    emoji: "👩‍👧",
    label: "宝妈专区",
    subtitle: "陪你一起带娃",
    route: "/mama",
    gradient: "from-rose-400 to-pink-500",
    coverHeight: "h-24",
    heat: "2.1k",
  },
  {
    id: "workplace",
    emoji: "💼",
    label: "职场解压",
    subtitle: "压力·倦怠恢复",
    route: "/promo/synergy",
    gradient: "from-blue-400 to-indigo-500",
    coverHeight: "h-16",
    heat: "1.8k",
  },
  {
    id: "couple",
    emoji: "💑",
    label: "情侣夫妻",
    subtitle: "亲密关系·沟通",
    route: "/us-ai",
    gradient: "from-purple-400 to-violet-500",
    coverHeight: "h-20",
    heat: "3.2k",
  },
  {
    id: "youth",
    emoji: "🎓",
    label: "青少年",
    subtitle: "学业·情绪·自信",
    route: "/xiaojin",
    gradient: "from-amber-400 to-orange-500",
    coverHeight: "h-16",
    heat: "1.5k",
  },
  {
    id: "midlife",
    emoji: "🧭",
    label: "中年觉醒",
    subtitle: "转型·意义重建",
    route: "/laoge",
    gradient: "from-amber-500 to-yellow-600",
    coverHeight: "h-24",
    heat: "2.8k",
  },
  {
    id: "senior",
    emoji: "🌿",
    label: "银发陪伴",
    subtitle: "长辈陪伴·关怀",
    route: "/elder-care",
    gradient: "from-emerald-400 to-teal-500",
    coverHeight: "h-20",
    heat: "1.2k",
  },
];

const AudienceHub = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-xs font-semibold text-muted-foreground mb-2.5 tracking-wide">
        🎯 找到适合你的入口
      </h2>
      <div className="columns-2 gap-3 space-y-3">
        {audiences.map((a, i) => (
          <motion.button
            key={a.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(a.route)}
            className="break-inside-avoid w-full rounded-2xl bg-card shadow-md border border-border/30 overflow-hidden text-left hover:shadow-lg transition-shadow"
          >
            {/* Gradient cover */}
            <div className={`w-full ${a.coverHeight} bg-gradient-to-br ${a.gradient} flex items-center justify-center`}>
              <span className="text-3xl drop-shadow-sm">{a.emoji}</span>
            </div>
            {/* Content */}
            <div className="p-2.5">
              <p className="text-sm font-semibold text-foreground leading-tight">{a.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{a.subtitle}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                <span className="text-[10px] text-muted-foreground">{a.heat}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default AudienceHub;
