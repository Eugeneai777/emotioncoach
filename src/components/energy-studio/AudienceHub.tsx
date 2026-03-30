import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const audiences = [
  {
    id: "mama",
    emoji: "👩",
    label: "女性专区",
    subtitle: "懂你的辛苦与力量",
    route: "/mama",
    gradient: "from-rose-400 to-pink-500",
    bgColor: "hsl(350 80% 96%)",
  },
  {
    id: "senior",
    emoji: "🌿",
    label: "银发陪伴",
    subtitle: "长辈陪伴·关怀",
    route: "/elder-care",
    gradient: "from-emerald-400 to-teal-500",
    bgColor: "hsl(160 60% 95%)",
  },
  {
    id: "couple",
    emoji: "💑",
    label: "情侣夫妻",
    subtitle: "亲密关系·沟通",
    route: "/us-ai",
    gradient: "from-purple-400 to-violet-500",
    bgColor: "hsl(270 70% 96%)",
  },
  {
    id: "midlife",
    emoji: "🧭",
    label: "中年觉醒",
    subtitle: "转型·意义重建",
    route: "/laoge",
    gradient: "from-amber-500 to-yellow-600",
    bgColor: "hsl(40 80% 95%)",
  },
  {
    id: "youth",
    emoji: "🎓",
    label: "青少年",
    subtitle: "学业·情绪·自信",
    route: "/xiaojin",
    gradient: "from-amber-400 to-orange-500",
    bgColor: "hsl(35 90% 95%)",
  },
  {
    id: "workplace",
    emoji: "💼",
    label: "职场解压",
    subtitle: "压力·倦怠恢复",
    route: "/workplace",
    gradient: "from-blue-400 to-indigo-500",
    bgColor: "hsl(220 80% 96%)",
  },
];

const AudienceHub = () => {
  const navigate = useNavigate();
  const [illustrations, setIllustrations] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from('audience_illustrations')
      .select('audience_id, image_url')
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((row: any) => { map[row.audience_id] = row.image_url; });
          setIllustrations(map);
        }
      });
  }, []);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-3">
      <h2 className="text-xs font-semibold text-muted-foreground mb-2.5 tracking-wide">
        🎯 找到适合你的入口
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {audiences.map((a, i) => (
          <motion.button
            key={a.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(a.route)}
            className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 transition-colors active:opacity-80"
            style={{ backgroundColor: a.bgColor }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-sm overflow-hidden`}>
              {illustrations[a.id] ? (
                <img src={illustrations[a.id]} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-lg">{a.emoji}</span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-foreground leading-tight">{a.label}</span>
            <span className="text-[9px] text-muted-foreground leading-tight">{a.subtitle}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default AudienceHub;
