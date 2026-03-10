import React, { useState, useCallback, lazy, Suspense } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareWarning, MessagesSquare, BookHeart, Mic, Sparkles } from "lucide-react";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageQuarrelTool } from "@/components/marriage/MarriageQuarrelTool";
import { MarriageBackButton } from "@/components/marriage/MarriageBackButton";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { MarriageDiary } from "@/components/marriage/MarriageDiary";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tabs = [
  { id: "quarrel", label: "吵架复盘", icon: MessageSquareWarning, desc: "分析冲突原因" },
  { id: "coach", label: "沟通教练", icon: MessagesSquare, desc: "改善表达方式" },
  { id: "diary", label: "关系日记", icon: BookHeart, desc: "查看成长轨迹" },
];

const MarriageAITools: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTool = searchParams.get("tool") || "quarrel";
  const [activeTab, setActiveTab] = useState(initialTool);
  const [showVoice, setShowVoice] = useState(false);
  const { user } = useAuth();

  const handleVoiceClick = useCallback(() => {
    setShowVoice(true);
  }, []);

  const handleVoiceBriefingSaved = useCallback(async (briefingId: string, briefingData: any) => {
    if (!user) return;
    await supabase.from("marriage_diary_entries").insert({
      user_id: user.id,
      source: "voice",
      user_input: briefingData.emotion_theme || "语音教练对话",
      ai_result: briefingData.insight || briefingData.growth_story || null,
    });
  }, [user]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tool: tabId });
  }, [setSearchParams]);

  if (showVoice) {
    return (
      <CoachVoiceChat
        onClose={() => setShowVoice(false)}
        coachEmoji="💜"
        coachTitle="AI婚姻教练"
        primaryColor="purple"
        tokenEndpoint="marriage-realtime-token"
        userId={user?.id}
        mode="general"
        featureKey="realtime_voice"
        skipBilling={true}
        onBriefingSaved={handleVoiceBriefingSaved}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>AI婚姻教练 - 婚因有道</title>
        <meta name="description" content="AI吵架复盘器、AI沟通教练、语音婚姻教练，帮助你梳理情绪、改善沟通、记录成长。" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-marriage-light via-white to-marriage-light/30 pb-24">
        <MarriageBackButton />
        <div className="px-5 pt-8 max-w-lg mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-1.5 bg-marriage-primary/10 text-marriage-primary text-[10px] font-medium px-3 py-1 rounded-full mb-2">
              <Sparkles className="h-3 w-3" />
              AI驱动 · 专业温暖
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">AI婚姻教练</h1>
            <p className="text-xs text-muted-foreground">先看见问题，再解决问题</p>
          </motion.div>

          {/* Voice Call CTA */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleVoiceClick}
            className="w-full mb-5 bg-gradient-to-r from-marriage-primary via-purple-500 to-marriage-accent rounded-2xl p-4 shadow-lg shadow-marriage-primary/20 flex items-center gap-3 relative overflow-hidden group"
          >
            {/* Decorative ring animation */}
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border-2 border-white/10 group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full border border-white/10 group-hover:scale-125 transition-transform duration-500" />
            
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 text-left relative z-10">
              <h3 className="text-sm font-bold text-white">语音婚姻教练</h3>
              <p className="text-[11px] text-white/80 mt-0.5">像和朋友聊天一样，说出你的困扰</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center relative z-10">
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            </div>
          </motion.button>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2 mb-6 bg-marriage-light/80 backdrop-blur-sm rounded-2xl p-1.5 border border-marriage-border"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white text-marriage-primary shadow-sm shadow-marriage-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Tool content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "quarrel" && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquareWarning className="h-4 w-4 text-marriage-primary" />
                    <h2 className="text-base font-bold text-foreground">AI吵架复盘器</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    输入最近一次争吵，AI帮你分析冲突原因、误解点和修复建议
                  </p>
                  <MarriageQuarrelTool mode="quarrel" />
                </div>
              )}

              {activeTab === "coach" && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessagesSquare className="h-4 w-4 text-marriage-primary" />
                    <h2 className="text-base font-bold text-foreground">AI夫妻沟通教练</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    把"说不清"的委屈和情绪，转化为更容易被理解的表达方式
                  </p>
                  <MarriageQuarrelTool mode="coach" />
                </div>
              )}

              {activeTab === "diary" && <MarriageDiary />}
            </motion.div>
          </AnimatePresence>
        </div>
        <MarriageNav />
      </div>
    </>
  );
};

export default MarriageAITools;
