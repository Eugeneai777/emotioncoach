import { useState } from "react";
import { usePackagesPurchased } from "@/hooks/usePackagePurchased";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Home, Share2, ArrowRight, Mic } from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";

import { MamaToolCard, type MamaRoundConfig } from "@/components/mama/MamaToolCard";
import MamaAIChat from "@/components/mama/MamaAIChat";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { useAuth } from "@/hooks/useAuth";

// 4 pain-point tools with 3-round configs
const mamaTools: { tool: string; title: string; description: string; icon: string; rounds: MamaRoundConfig[] }[] = [
  {
    tool: "career",
    title: "职场跃迁",
    description: "突破瓶颈，找回自信",
    icon: "💼",
    rounds: [
      { fields: [{ key: "status", label: "你目前的职业状态", placeholder: "例如：在职但感觉没有发展空间", type: "text" }], buttonText: "聊一聊 →" },
      { fields: [{ key: "painPoint", label: "最大的卡点是什么", placeholder: "例如：晋升受阻、薪资停滞" }, { key: "goal", label: "你期望的改变", placeholder: "例如：转行、升职、创业" }], buttonText: "继续分析 →" },
      { fields: [{ key: "impact", label: "这对你生活影响有多大", placeholder: "例如：影响了自信心和家庭关系" }], buttonText: "获取诊断报告 →" },
    ],
  },
  {
    tool: "balance",
    title: "生活平衡",
    description: "找回属于自己的能量",
    icon: "🌿",
    rounds: [
      { fields: [{ key: "pressure", label: "你最大的压力来源", placeholder: "例如：家务、育儿、老人照顾", type: "text" }], buttonText: "聊一聊 →" },
      { fields: [{ key: "energy", label: "你的能量都花在哪了", placeholder: "例如：80%给家人，20%给自己" }, { key: "wantChange", label: "最想改变什么", placeholder: "例如：想要自己的时间和空间" }], buttonText: "继续分析 →" },
      { fields: [{ key: "meTime", label: "你有属于自己的时间吗", placeholder: "例如：几乎没有/每天半小时" }], buttonText: "获取诊断报告 →" },
    ],
  },
  {
    tool: "emotion",
    title: "情绪疏导",
    description: "被看见，被理解",
    icon: "💛",
    rounds: [
      { fields: [{ key: "feeling", label: "你现在的情绪状态", placeholder: "例如：焦虑、委屈、疲惫", type: "text" }], buttonText: "聊一聊 →" },
      { fields: [{ key: "duration", label: "这种感觉持续多久了", placeholder: "例如：几天/几个月/很久了" }, { key: "support", label: "有人可以倾诉吗", placeholder: "例如：没有/偶尔和朋友说" }], buttonText: "继续分析 →" },
      { fields: [{ key: "release", label: "你平时怎么释放情绪", placeholder: "例如：忍着/哭/运动/吃东西" }], buttonText: "获取诊断报告 →" },
    ],
  },
  {
    tool: "growth",
    title: "副业增收",
    description: "发现你的隐藏优势",
    icon: "💰",
    rounds: [
      { fields: [{ key: "skills", label: "你擅长什么/有什么资源", placeholder: "例如：写作、烘焙、人脉广", type: "text" }], buttonText: "聊一聊 →" },
      { fields: [{ key: "time", label: "每周能投入多少时间", placeholder: "例如：5小时/10小时" }, { key: "interest", label: "最感兴趣的方向", placeholder: "例如：自媒体、教育、手工" }], buttonText: "继续分析 →" },
      { fields: [{ key: "concern", label: "你最大的顾虑是什么", placeholder: "例如：怕失败/不知道从哪开始" }], buttonText: "获取成长规划 →" },
    ],
  },
];

const toolEntries = [
  { emoji: "🎙", title: "语音教练", desc: "AI陪你聊", action: "voice" as const },
  { emoji: "😊", title: "情绪日记", desc: "记录心情", action: "emotion" as const },
  { emoji: "🆘", title: "情绪SOS", desc: "崩溃时按", action: "sos" as const },
];

const MamaAssistant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>();
  const [initialInput, setInitialInput] = useState<string | undefined>();
  const [chatType, setChatType] = useState<"emotion" | "gratitude">("emotion");

  const { data: purchasedMap } = usePackagesPurchased(['synergy_bundle']);
  const campPurchased = !!user && !!purchasedMap?.['synergy_bundle'];

  const openChat = (context?: string, type: "emotion" | "gratitude" = "emotion") => {
    setChatContext(context);
    setInitialInput(undefined);
    setChatType(type);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/40 to-white pb-20">
      {/* Sticky conversion bar - hidden if purchased */}
      {!campPurchased && (
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
      )}

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
          className="text-center mb-6"
        >
          <span className="text-[22px] font-extrabold tracking-wider text-rose-900">
            女性专区
          </span>
          <p className="text-[11px] text-gray-400 tracking-widest font-medium mt-1">懂 你 也 懂 生 活</p>
        </motion.div>

        {/* 4 pain-point tool cards — 2x2 grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="pb-5"
        >
          <div className="grid grid-cols-2 gap-3">
            {mamaTools.map((t) => (
              <MamaToolCard key={t.tool} {...t} />
            ))}
          </div>
        </motion.div>

        {/* 测评入口 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="pb-5 space-y-2"
        >
          <p className="text-xs font-semibold text-rose-800 px-1">📊 测一测</p>
          <button
            onClick={() => navigate("/assessment/women_competitiveness")}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-pink-100/60 shadow-sm active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50">✨</span>
              <div className="text-left">
                <p className="text-[13px] font-medium text-rose-900">35+女性竞争力测评</p>
                <p className="text-[10px] text-rose-600/60">7分钟 · 限时¥9.9</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
          <button
            onClick={() => navigate("/emotion-health")}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-pink-100/60 shadow-sm active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base w-7 h-7 flex items-center justify-center rounded-lg bg-pink-50">💛</span>
              <div className="text-left">
                <p className="text-[13px] font-medium text-rose-900">情绪健康自评</p>
                <p className="text-[10px] text-rose-600/60">5分钟 · 限时¥9.9</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </motion.div>

        {/* 3-col tool entries: voice, diary, SOS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="pb-8"
        >
          <div className="grid grid-cols-3 gap-3">
            {toolEntries.map((entry) => (
              <button
                key={entry.title}
                onClick={() => {
                  if (entry.action === "voice") {
                    if (!user) { navigate("/auth"); return; }
                    setShowVoice(true);
                  } else if (entry.action === "sos") {
                    navigate("/emotion-button");
                  } else {
                    openChat("我现在心情不太好，想聊聊...", "emotion");
                  }
                }}
                className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white shadow-sm border border-pink-100/60 active:scale-95 transition-all duration-200"
              >
                <span className="text-2xl">{entry.emoji}</span>
                <span className="text-sm font-semibold text-rose-900">{entry.title}</span>
                <span className="text-[11px] text-rose-600/60">{entry.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* 设为默认首页 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
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
          <p className="text-xs text-muted-foreground/50">女性专区 · 懂你也懂生活</p>
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
