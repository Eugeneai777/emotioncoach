import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Mic, ChevronRight, Home, Languages, Wrench, ClipboardCheck, Pause, Heart, Share2, MessageCircle } from "lucide-react";
import { LazyIntroShareDialog } from "@/components/common/LazyIntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import UsAICalmButton from "@/components/us-ai/UsAICalmButton";
import UsAIDailyCard from "@/components/us-ai/UsAIDailyCard";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";

const quickEntries = [
  { emoji: "💬", title: "今日对话", desc: "聊聊彼此", route: "/us-ai/tool?type=chat" },
  { emoji: "🔄", title: "情绪翻译", desc: "解码潜台词", route: "/us-ai/tool?type=translate" },
  { emoji: "🔧", title: "冲突修复", desc: "修复关系", route: "/us-ai/tool?type=repair" },
];

const UsAI = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCalm, setShowCalm] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showDaily, setShowDaily] = useState(false);

  return (
    <div className="min-h-screen bg-usai-beige pb-20">
      <Helmet>
        <title>我们AI - 两个人，更懂彼此</title>
        <meta name="description" content="专为情侣和夫妻设计的AI关系助手，帮助两个人更好沟通、理解情绪、修复冲突。" />
      </Helmet>

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
            config={introShareConfigs.usai}
            trigger={
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享给TA</span>
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
          <span className="block text-[22px] font-extrabold tracking-wider text-usai-foreground">
            我们AI
          </span>
          <p className="text-[11px] text-muted-foreground tracking-widest font-medium mt-1">两 个 人 · 更 懂 彼 此</p>
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
            <div className="absolute inset-[-16px] bg-gradient-to-r from-usai-primary/30 to-usai-accent/30 rounded-full animate-pulse opacity-30" />
            <div
              className="absolute inset-[-8px] bg-gradient-to-r from-usai-primary/40 to-usai-accent/40 rounded-full animate-ping opacity-20"
              style={{ animationDuration: "2s" }}
            />

            <div className="relative w-[140px] h-[140px] bg-gradient-to-br from-usai-primary via-usai-accent to-usai-primary 
                            rounded-full flex flex-col items-center justify-center 
                            shadow-2xl shadow-usai-primary/40 
                            hover:scale-105 active:scale-95 
                            transition-all duration-200 ease-out">
              <div className="mb-2 p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <span className="text-white font-bold text-lg">智能语音</span>
            </div>
          </button>

          <p className="mt-6 text-sm text-muted-foreground">
            很多关系不是没有爱，而是不知道怎么表达 💕
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
                onClick={() => navigate(entry.route)}
                className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white shadow-sm 
                           border border-usai-primary/10 
                           active:scale-95 transition-all duration-200"
              >
                <span className="text-2xl">{entry.emoji}</span>
                <span className="text-sm font-semibold text-usai-foreground">{entry.title}</span>
                <span className="text-[11px] text-usai-primary/60">{entry.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* 更多功能区 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="space-y-3 pb-4"
        >
          {/* 关系测评 */}
          <button
            onClick={() => navigate("/us-ai/tool?type=chat")}
            className="w-full flex items-center justify-between 
                       px-5 py-4 rounded-2xl 
                       bg-gradient-to-r from-usai-light to-white 
                       border border-usai-primary/10 
                       active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-usai-foreground">3分钟关系测评</p>
                <p className="text-[11px] text-muted-foreground">看看你们属于哪种关系模式</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-usai-primary/50" />
          </button>

          {/* 冷静按钮 */}
          <button
            onClick={() => setShowCalm(!showCalm)}
            className="w-full flex items-center justify-between 
                       px-5 py-4 rounded-2xl 
                       bg-gradient-to-r from-usai-light to-white 
                       border border-usai-primary/10 
                       active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⏸️</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-usai-foreground">吵架冷静按钮</p>
                <p className="text-[11px] text-muted-foreground">情绪很大时，先暂停90秒</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-usai-primary/50" />
          </button>

          {showCalm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <UsAICalmButton />
            </motion.div>
          )}

          {/* 每日关系卡 */}
          <button
            onClick={() => setShowDaily(!showDaily)}
            className="w-full flex items-center justify-between 
                       px-5 py-4 rounded-2xl 
                       bg-gradient-to-r from-usai-light to-white 
                       border border-usai-primary/10 
                       active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💌</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-usai-foreground">每日关系卡</p>
                <p className="text-[11px] text-muted-foreground">赞美·感恩·理解·梦想</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-usai-primary/50" />
          </button>

          {showDaily && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <UsAIDailyCard />
            </motion.div>
          )}
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
              localStorage.setItem('preferred_audience', 'couple');
              const el = document.getElementById('usai-set-home-toast');
              if (el) { el.textContent = '✅ 已设为默认首页'; setTimeout(() => { el.textContent = '⭐ 设为我的首页'; }, 2000); }
            }}
            className="w-full text-center py-2.5 rounded-xl border border-usai-primary/20 bg-usai-light/50 text-sm text-usai-primary active:scale-[0.98] transition-transform"
          >
            <span id="usai-set-home-toast">⭐ 设为我的首页</span>
          </button>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-xs text-muted-foreground/50">我们AI · 关系是可以练习的</p>
        </div>
      </div>

      {showVoice && user && (
        <CoachVoiceChat
          onClose={() => setShowVoice(false)}
          coachEmoji="💑"
          coachTitle="情侣AI语音教练"
          primaryColor="purple"
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

export default UsAI;
