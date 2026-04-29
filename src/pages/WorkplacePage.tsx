import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, ChevronRight, Home, Share2, MessageCircle } from "lucide-react";
import { LazyIntroShareDialog } from "@/components/common/LazyIntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import WorkplaceQuickScenarios from "@/components/workplace/WorkplaceQuickScenarios";
import WorkplaceAIChat from "@/components/workplace/WorkplaceAIChat";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";

const quickEntries = [
  { emoji: "😮‍💨", title: "压力释放", desc: "说出来就好了", context: "我工作压力很大，感觉快撑不住了...", chatType: "stress" as const },
  { emoji: "🆘", title: "情绪SOS", desc: "崩溃时按一下", route: "/emotion-button", context: undefined as string | undefined, chatType: "stress" as const },
  { emoji: "📝", title: "情绪日记", desc: "记录此刻心情", context: "我现在工作上遇到了一些让我很不舒服的事情...", chatType: "diary" as const },
];

const WorkplacePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>();
  const [chatType, setChatType] = useState<"stress" | "diary">("stress");

  const openChat = (context?: string, type: "stress" | "diary" = "stress") => {
    setChatContext(context);
    setChatType(type);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white pb-20">
      <div className="max-w-md mx-auto px-5 pt-4 pb-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { sessionStorage.setItem('skip_preferred_redirect', '1'); navigate("/mini-app"); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            <Home className="w-3.5 h-3.5" />
            <span>主页</span>
          </motion.button>

          <LazyIntroShareDialog
            config={introShareConfigs.workplace}
            trigger={
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享给同事</span>
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
          <span className="text-[22px] font-extrabold tracking-wider text-blue-900">
            职场解压
          </span>
          <p className="text-[11px] text-muted-foreground tracking-widest font-medium mt-1">累 了 就 歇 一 歇</p>
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
              if (!user) { navigate("/auth"); return; }
              setShowVoice(true);
            }}
            className="relative group focus:outline-none touch-manipulation"
            aria-label="智能语音"
          >
            <div className="absolute inset-[-16px] bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full animate-pulse opacity-30" />
            <div
              className="absolute inset-[-8px] bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-ping opacity-20"
              style={{ animationDuration: "2s" }}
            />

            <div className="relative w-[140px] h-[140px] bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-500 
                            rounded-full flex flex-col items-center justify-center 
                            shadow-2xl shadow-blue-400/40 
                            hover:scale-105 active:scale-95 
                            transition-all duration-200 ease-out">
              <div className="mb-2 p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <span className="text-white font-bold text-lg">智能语音</span>
            </div>
          </button>

          <p className="mt-6 text-sm text-muted-foreground">
            工作的事，这里可以放心说 💙
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
                           border border-blue-100/60 
                           active:scale-95 transition-all duration-200"
              >
                <span className="text-2xl">{entry.emoji}</span>
                <span className="text-sm font-semibold text-blue-900">{entry.title}</span>
                <span className="text-[11px] text-blue-600/60">{entry.desc}</span>
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
          <WorkplaceQuickScenarios onSelect={(ctx) => openChat(ctx)} />
        </motion.div>

        {/* 功能入口 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-2.5 pb-8"
        >
          <button
            onClick={() => navigate("/assessment-tools")}
            className="w-full flex items-center justify-between 
                       px-5 py-4 rounded-2xl 
                       bg-gradient-to-r from-blue-50 to-indigo-50 
                       border border-blue-200/60 
                       active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔋</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-800">能量测评 & 工具</p>
                <p className="text-[11px] text-blue-600/70">1分钟了解自己的状态</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </button>

          <button
            onClick={() => navigate("/promo/synergy")}
            className="w-full flex items-center justify-between 
                       px-5 py-4 rounded-2xl 
                       bg-gradient-to-r from-indigo-50 to-blue-50 
                       border border-indigo-200/60 
                       active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔥</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-indigo-800">协同抗压套餐</p>
                <p className="text-[11px] text-indigo-600/70">AI + 真人教练·深度支持</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400" />
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
              localStorage.setItem('preferred_audience', 'workplace');
              const el = document.getElementById('set-home-toast-workplace');
              if (el) { el.textContent = '✅ 已设为默认首页'; setTimeout(() => { el.textContent = '⭐ 设为我的首页'; }, 2000); }
            }}
            className="w-full text-center py-2.5 rounded-xl border border-blue-200/60 bg-blue-50/50 text-sm text-blue-600 active:scale-[0.98] transition-transform"
          >
            <span id="set-home-toast-workplace">⭐ 设为我的首页</span>
          </button>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-xs text-muted-foreground/50">职场解压 · 累了就歇一歇</p>
        </div>
      </div>

      <WorkplaceAIChat
        open={chatOpen}
        onOpenChange={(v) => {
          setChatOpen(v);
          if (!v) setChatContext(undefined);
        }}
        initialContext={chatContext}
        chatType={chatType}
      />

      {showVoice && user && (
        <CoachVoiceChat
          onClose={() => setShowVoice(false)}
          coachEmoji="💼"
          coachTitle="职场AI语音教练"
          primaryColor="blue"
          tokenEndpoint="vibrant-life-realtime-token"
          userId={user.id}
          mode="general"
          featureKey="realtime_voice"
          voiceType={getSavedVoiceType()}
        />
      )}

      <AwakeningBottomNav />
    </div>
  );
};

export default WorkplacePage;
