import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, ChevronRight, Home, Share2, MessageCircle, ArrowRight } from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";

import MamaQuickScenarios from "@/components/mama/MamaQuickScenarios";
import MamaAIChat from "@/components/mama/MamaAIChat";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";


const quickEntries = [
  { emoji: "😊", title: "情绪日记", desc: "记录此刻心情", context: "我现在心情不太好，想聊聊...", chatType: "emotion" as "emotion" | "gratitude" },
  { emoji: "🆘", title: "情绪SOS", desc: "崩溃时按一下", route: "/emotion-button" as string | undefined, context: undefined as string | undefined, chatType: "emotion" as "emotion" | "gratitude" },
  { emoji: "✨", title: "能量测评", desc: "了解你的状态", route: "/assessment-tools" as string | undefined, context: undefined as string | undefined, chatType: "emotion" as "emotion" | "gratitude" },
];

const MamaAssistant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>();
  const [initialInput, setInitialInput] = useState<string | undefined>();
  const [chatType, setChatType] = useState<"emotion" | "gratitude">("emotion");

  const openChat = (context?: string, type: "emotion" | "gratitude" = "emotion") => {
    setChatContext(context);
    setInitialInput(undefined);
    setChatType(type);
    setChatOpen(true);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/40 to-white pb-20">
      {/* Sticky conversion bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 shadow-md"
      >
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2.5">
          <span className="text-white text-sm font-medium">🌸 7天有劲训练营 · 找回你的能量</span>
          <button
            onClick={() => navigate("/promo/synergy?source=mama")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 text-rose-600 text-xs font-semibold active:scale-95 transition-transform"
          >
            了解详情 <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

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

          <IntroShareDialog
            config={introShareConfigs.mama}
            trigger={
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享给好友</span>
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
          <span className="text-[22px] font-extrabold tracking-wider text-rose-900">
             女性专区
          </span>
          <p className="text-[11px] text-gray-400 tracking-widest font-medium mt-1">懂 你 的 辛 苦 与 力 量</p>
        </motion.div>

        {/* Hero CTA */}
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
            <div className="absolute inset-[-16px] bg-gradient-to-r from-pink-300 to-rose-300 rounded-full animate-pulse opacity-30" />
            <div
              className="absolute inset-[-8px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-ping opacity-20"
              style={{ animationDuration: "2s" }}
            />

            <div className="relative w-[140px] h-[140px] bg-gradient-to-br from-pink-400 via-rose-500 to-pink-500 
                            rounded-full flex flex-col items-center justify-center 
                            shadow-2xl shadow-pink-400/40 
                            hover:scale-105 active:scale-95 
                            transition-all duration-200 ease-out">
              <div className="mb-2 p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <span className="text-white font-bold text-lg">智能语音</span>
            </div>
          </button>

          <p className="mt-6 text-sm text-muted-foreground">
            不需要坚强，这里可以做自己 💖
          </p>
        </motion.div>

        {/* 3列功能入口 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="pb-4"
        >
          <div className="grid grid-cols-3 gap-3">
            {quickEntries.map((entry) => (
              <button
                key={entry.title}
                onClick={() => {
                  if (entry.route) {
                    navigate(entry.route);
                  } else if (entry.context) {
                    openChat(entry.context, entry.chatType);
                  }
                }}
                className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white shadow-sm 
                           border border-pink-100/60 
                           active:scale-95 transition-all duration-200"
              >
                <span className="text-2xl">{entry.emoji}</span>
                <span className="text-sm font-semibold text-rose-900">{entry.title}</span>
                <span className="text-[11px] text-rose-600/60">{entry.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Quick scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="pb-4"
        >
          <MamaQuickScenarios onSelect={(ctx) => openChat(ctx)} />
        </motion.div>

        {/* 测评入口 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="pb-8 space-y-2"
        >
          <p className="text-xs font-semibold text-rose-800 px-1">📊 测一测</p>
          <button
            onClick={() => navigate("/assessment/women_competitiveness")}
            className="w-full flex items-center justify-between 
                       px-4 py-3 rounded-xl 
                       bg-white border border-pink-100/60 shadow-sm
                       active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50">✨</span>
              <div className="text-left">
                <p className="text-[13px] font-medium text-rose-900">35+女性竞争力测评</p>
                <p className="text-[10px] text-rose-600/60">5分钟 · 免费</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
          <button
            onClick={() => navigate("/assessment/emotion_health")}
            className="w-full flex items-center justify-between 
                       px-4 py-3 rounded-xl 
                       bg-white border border-pink-100/60 shadow-sm
                       active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base w-7 h-7 flex items-center justify-center rounded-lg bg-pink-50">💛</span>
              <div className="text-left">
                <p className="text-[13px] font-medium text-rose-900">情绪健康自评</p>
                <p className="text-[10px] text-rose-600/60">3分钟 · 免费</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </motion.div>

        {/* 设为默认首页 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pb-4"
        >
          <button
            onClick={() => {
              localStorage.setItem('preferred_audience', 'mama');
              const el = document.getElementById('set-home-toast');
              if (el) { el.textContent = '✅ 已设为默认首页'; setTimeout(() => { el.textContent = '⭐ 设为我的首页'; }, 2000); }
            }}
            className="w-full text-center py-2.5 rounded-xl border border-pink-200/60 bg-pink-50/50 text-sm text-rose-600 active:scale-[0.98] transition-transform"
          >
            <span id="set-home-toast">⭐ 设为我的首页</span>
          </button>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-xs text-muted-foreground/50">女性专区 · 懂你的辛苦与力量</p>
        </div>
      </div>

      <MamaAIChat
        open={chatOpen}
        onOpenChange={(v) => {
          setChatOpen(v);
          if (!v) {
            setChatContext(undefined);
            setInitialInput(undefined);
          }
        }}
        initialContext={chatContext}
        initialInput={initialInput}
        chatType={chatType}
      />

      {showVoice && user && (
        <CoachVoiceChat
          onClose={() => setShowVoice(false)}
          coachEmoji="👩"
          coachTitle="女性AI语音教练"
          primaryColor="rose"
          tokenEndpoint="vibrant-life-realtime-token"
          userId={user.id}
          mode="general"
          featureKey="realtime_voice"
          voiceType="zh_female_xinlingjitang_moon_bigtts"
        />
      )}

      <AwakeningBottomNav />
    </div>
  );
};

export default MamaAssistant;
