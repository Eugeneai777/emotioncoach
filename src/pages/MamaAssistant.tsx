import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, ChevronRight, Home, Share2 } from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";

import MamaQuickScenarios from "@/components/mama/MamaQuickScenarios";
import MamaAIChat from "@/components/mama/MamaAIChat";


const quickEntries = [
  { emoji: "😊", title: "情绪检测", desc: "此刻还好吗", context: "我现在心情不太好，想聊聊..." },
  { emoji: "⚡", title: "能量评估", desc: "1分钟自测", route: "/assessment-tools" as string | undefined, context: undefined as string | undefined },
  { emoji: "📝", title: "感恩日记", desc: "记录美好", context: "我想记录一件今天让我感恩的小事..." },
];

const MamaAssistant = () => {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>();
  const [initialInput, setInitialInput] = useState<string | undefined>();
  

  const openChat = (context?: string) => {
    setChatContext(context);
    setInitialInput(undefined);
    setChatOpen(true);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/40 to-white">
      <div className="max-w-md mx-auto px-5 pt-4 pb-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
          >
            <Home className="w-3.5 h-3.5" />
            <span>有劲生活馆</span>
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
                <span>分享给闺蜜</span>
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
             宝妈AI
          </span>
          <p className="text-[11px] text-gray-400 tracking-widest font-medium mt-1">懂 你 的 温 暖 陪 伴</p>
        </motion.div>

        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col items-center py-8"
        >
          <button
            onClick={() => openChat()}
            className="relative group focus:outline-none touch-manipulation"
            aria-label="开始聊天"
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
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <span className="text-white font-bold text-lg">聊一聊</span>
            </div>
          </button>

          <p className="mt-6 text-sm text-muted-foreground">
            不需要坚强，这里可以放下所有 💖
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
                    openChat(entry.context);
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

        {/* 趣味测评 CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="pb-8"
        >
          <button
            onClick={() => navigate("/assessment-tools")}
            className="w-full flex items-center justify-between 
                       px-5 py-4 rounded-2xl 
                       bg-gradient-to-r from-pink-50 to-rose-50 
                       border border-pink-200/60 
                       active:scale-[0.98] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔋</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-rose-800">能量测评 & 工具</p>
                <p className="text-[11px] text-rose-600/70">1分钟了解自己的状态</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-xs text-muted-foreground/50">妈妈AI · 温暖陪伴每一天</p>
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
      />
    </div>
  );
};

export default MamaAssistant;
