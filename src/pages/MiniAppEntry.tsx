import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Info, ChevronDown } from "lucide-react";
import logoImage from "@/assets/logo-youjin-ai.png";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";

const audiences = [
  { id: "mama", emoji: "👩‍👧", label: "宝妈专区", subtitle: "你的辛苦，我都懂", route: "/mama", gradient: "from-rose-500 to-pink-400" },
  { id: "workplace", emoji: "💼", label: "职场解压", subtitle: "累了就歇一歇", route: "/workplace", gradient: "from-blue-500 to-indigo-400" },
  { id: "couple", emoji: "💑", label: "情侣夫妻", subtitle: "爱需要被听见", route: "/us-ai", gradient: "from-purple-500 to-violet-400" },
  { id: "youth", emoji: "🎓", label: "青少年", subtitle: "长大不容易", route: "/xiaojin", gradient: "from-amber-500 to-orange-400" },
  { id: "midlife", emoji: "🧭", label: "中年觉醒", subtitle: "人生下半场", route: "/laoge", gradient: "from-orange-500 to-red-400" },
  { id: "senior", emoji: "🌿", label: "银发陪伴", subtitle: "陪您说说话", route: "/elder-care", gradient: "from-emerald-500 to-teal-400" },
];

const MiniAppEntry = () => {
  const navigate = useNavigate();

  // 检查是否设置了默认首页，自动跳转
  React.useEffect(() => {
    const skip = sessionStorage.getItem('skip_preferred_redirect');
    if (skip) {
      sessionStorage.removeItem('skip_preferred_redirect');
      return;
    }
    const preferred = localStorage.getItem('preferred_audience');
    if (preferred) {
      const match = audiences.find(a => a.id === preferred);
      if (match) {
        navigate(match.route, { replace: true });
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* ── 顶部品牌区（适配小程序胶囊） ── */}
      <div
        className="flex items-center gap-2.5 px-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 48px)", paddingRight: "110px" }}
      >
        <img src={logoImage} alt="有劲AI" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-foreground">有劲AI</h1>
          <p className="text-[10px] text-muted-foreground">每个人的生活教练</p>
        </div>
        <button
          onClick={() => navigate('/platform-intro')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
        >
          <Info className="w-3.5 h-3.5" />
          <span>介绍</span>
        </button>
      </div>




      {/* ── 人群入口 3列网格 ── */}
      <div className="px-3 pb-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-3"
        >
          <h2 className="text-sm font-semibold text-foreground">生活不易，你不必独自扛着</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">选一个最懂你的入口 ↓</p>
        </motion.div>
        <div className="grid grid-cols-3 gap-1.5">
          {audiences.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(a.route)}
              style={{ transform: "translateZ(0)" }}
              className={`relative overflow-hidden rounded-xl p-3 bg-gradient-to-br ${a.gradient} shadow-sm min-h-[88px] flex flex-col items-center justify-center gap-1 active:shadow-md transition-shadow duration-150`}
            >
              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 w-12 h-12 opacity-15">
                <div className="absolute top-0.5 right-0.5 text-2xl opacity-40">
                  {a.emoji}
                </div>
              </div>
              {/* 主要内容 */}
              <div className="relative z-10 text-center">
                <span className="text-xl block mb-1">{a.emoji}</span>
                <h3 className="text-sm font-bold text-white leading-tight">{a.label}</h3>
                <p className="text-[10px] text-white/70 mt-0.5 leading-tight line-clamp-1">{a.subtitle}</p>
              </div>
              {/* 点击反馈 */}
              <div className="absolute inset-0 bg-white/0 active:bg-white/15 transition-colors duration-150" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── 探索更多 ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => navigate('/platform-intro')}
        className="flex flex-col items-center gap-1 w-full pb-24 pt-6 text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="text-xs">还想探索更多？</span>
        <motion.span
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.button>

      {/* ── 底部导航 ── */}
      <AwakeningBottomNav />
    </div>
  );
};

export default MiniAppEntry;
