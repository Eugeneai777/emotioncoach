import { Suspense, lazy, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Share2, ChevronRight, Home } from "lucide-react";
import { parseAndStoreChildRef } from "@/utils/elderMoodUpload";
import { LazyIntroShareDialog } from "@/components/common/LazyIntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";
import { FamilyPhotoUploader } from "@/components/elder-care/FamilyPhotoUploader";
import { FamilyPhotoWaterfall } from "@/components/elder-care/FamilyPhotoWaterfall";

const CoachVoiceChat = lazy(() => import("@/components/coach/CoachVoiceChat").then((m) => ({ default: m.CoachVoiceChat })));

const ElderCarePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [showVoice, setShowVoice] = useState(false);

  useEffect(() => {
    const from = searchParams.get("from");
    if (from) {
      parseAndStoreChildRef(from);
    }
  }, [searchParams]);

  const quickEntries = [
    { emoji: "☀️", title: "问候", desc: "每日暖心", route: "/elder-care/greeting" },
    { emoji: "🔔", title: "提醒", desc: "吃药喝水", route: "/elder-care/reminders" },
    { emoji: "😊", title: "心情", desc: "记录今天", route: "/elder-care/mood" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/40 to-white pb-20">
      <div className="max-w-md mx-auto px-5 pt-4 pb-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { sessionStorage.setItem('skip_preferred_redirect', '1'); navigate("/mini-app"); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
          >
            <Home className="w-3.5 h-3.5" />
            <span>主页</span>
          </motion.button>

          <LazyIntroShareDialog
            config={introShareConfigs.dajin}
            trigger={
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享给长辈</span>
              </motion.button>
            }
          />
        </div>

        {/* Brand header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-1"
        >
          <span className="text-[22px] font-extrabold tracking-wider text-orange-900">
            大劲AI
          </span>
          <p className="text-[11px] text-gray-400 tracking-widest font-medium mt-1">陪 长 辈 ， 有 大 劲</p>
        </motion.div>

        {/* Voice CTA — Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col items-center py-8"
        >
          <button
            onClick={() => {
              if (!user) {
                navigate("/auth");
                return;
              }
              setShowVoice(true);
            }}
            className="relative group focus:outline-none touch-manipulation"
            aria-label="智能语音"
          >
            <div className="absolute inset-[-16px] bg-gradient-to-r from-orange-300 to-amber-300 rounded-full animate-pulse opacity-30" />
            <div
              className="absolute inset-[-8px] bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-ping opacity-20"
              style={{ animationDuration: "2s" }}
            />

            <div className="relative w-[140px] h-[140px] bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 
                            rounded-full flex flex-col items-center justify-center 
                            shadow-2xl shadow-orange-400/40 
                            hover:scale-105 active:scale-95 
                            transition-all duration-200 ease-out">
              <div className="mb-2 p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <span className="text-white font-bold text-lg">智能语音</span>
            </div>
          </button>

          <p className="mt-6 text-sm text-muted-foreground">
            像有人在身边陪着你 🌿
          </p>
        </motion.div>

        {/* 3列功能入口 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="pb-6"
        >
          <div className="grid grid-cols-3 gap-3">
            {quickEntries.map((entry) => (
              <button
                key={entry.title}
                onClick={() => navigate(entry.route)}
                className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white shadow-sm 
                           border border-orange-100/60 
                           active:scale-95 transition-all duration-200"
              >
                <span className="text-2xl">{entry.emoji}</span>
                <span className="text-sm font-semibold text-orange-900">{entry.title}</span>
                <span className="text-[11px] text-orange-600/60">{entry.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="pb-4"
        >
          <button
            onClick={() => navigate("/alive-check")}
            className="w-full flex items-center justify-between 
                       px-5 py-4 rounded-2xl 
                       bg-gradient-to-r from-emerald-50 to-teal-50 
                       border border-emerald-200/60 
                       active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-emerald-800">每日安全守护</p>
                <p className="text-[11px] text-emerald-600/70">轻点一下，让家人放心</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          </button>
          <FamilyPhotoUploader />
        </motion.div>

        {/* 家人相册瀑布流 */}
        <div className="pb-6">
          <FamilyPhotoWaterfall />
        </div>

        {/* 设为默认首页 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pb-4"
        >
          <button
            onClick={() => {
              localStorage.setItem('preferred_audience', 'senior');
              const el = document.getElementById('set-home-toast-senior');
              if (el) { el.textContent = '✅ 已设为默认首页'; setTimeout(() => { el.textContent = '⭐ 设为我的首页'; }, 2000); }
            }}
            className="w-full text-center py-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/50 text-sm text-emerald-600 active:scale-[0.98] transition-transform"
          >
            <span id="set-home-toast-senior">⭐ 设为我的首页</span>
          </button>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-xs text-muted-foreground/50">大劲AI · 让陪伴更简单</p>
        </div>
      </div>

      {showVoice && user && (
        <Suspense fallback={null}>
        <CoachVoiceChat
          onClose={() => setShowVoice(false)}
          coachEmoji="🧓"
          coachTitle="大劲AI语音教练"
          primaryColor="orange"
          tokenEndpoint="vibrant-life-realtime-token"
          userId={user.id}
          mode="general"
          scenario="老人陪伴"
          featureKey="realtime_voice"
          voiceType={getSavedVoiceType()}
        />
        </Suspense>
      )}

      <AwakeningBottomNav />
    </div>
  );
};

export default ElderCarePage;
