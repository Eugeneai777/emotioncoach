import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import logoImage from "@/assets/logo-youjin-ai.png";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { usePersonalizedGreeting } from "@/hooks/usePersonalizedGreeting";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { greeting, isLoading } = usePersonalizedGreeting();

  // 小程序入口页：缓存 mp_openid / mp_unionid，供后续页面（如情绪按钮、产品中心）支付复用
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpOpenId = params.get('mp_openid');
    const mpUnionId = params.get('mp_unionid');
    if (mpOpenId) {
      sessionStorage.setItem('wechat_mp_openid', mpOpenId);
    }
    if (mpUnionId) {
      sessionStorage.setItem('wechat_mp_unionid', mpUnionId);
    }
  }, []);

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
      {/* ── 顶部标题 ── */}
      <div className="px-4 pb-3 pt-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <h1 className="text-lg font-bold text-foreground">有劲AI生活教练</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">选一个最懂你的入口 ↓</p>
        </motion.div>
      </div>

      {/* ── 人群入口 3列网格 ── */}
      <div className="px-3 pb-4">
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
              <div className="absolute top-0 right-0 w-12 h-12 opacity-15">
                <div className="absolute top-0.5 right-0.5 text-2xl opacity-40">
                  {a.emoji}
                </div>
              </div>
              <div className="relative z-10 text-center">
                <span className="text-xl block mb-1">{a.emoji}</span>
                <h3 className="text-sm font-bold text-white leading-tight">{a.label}</h3>
                <p className="text-[10px] text-white/70 mt-0.5 leading-tight line-clamp-1">{a.subtitle}</p>
              </div>
              <div className="absolute inset-0 bg-white/0 active:bg-white/15 transition-colors duration-150" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── 个性化欢迎语 ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="px-5 py-4"
      >
        <div className="text-center">
          {isLoading ? (
            <Skeleton className="h-7 w-56 mx-auto rounded-full" />
          ) : (
            <p className="text-base font-medium text-foreground/80 leading-relaxed">
              ✨ {greeting}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Powered by 有劲AI ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-1.5 py-3"
      >
        <span className="text-[11px] text-muted-foreground/60">Powered by</span>
        <img src={logoImage} alt="有劲AI" className="w-4 h-4 rounded object-cover" />
        <span className="text-[11px] text-muted-foreground/80 font-medium">有劲AI</span>
      </motion.div>

      {/* ── 底部导航 ── */}
      <AwakeningBottomNav />
    </div>
  );
};

export default MiniAppEntry;
