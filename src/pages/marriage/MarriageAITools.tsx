import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareWarning, MessagesSquare, BookHeart, Mic } from "lucide-react";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageQuarrelTool } from "@/components/marriage/MarriageQuarrelTool";
import { MarriageBackButton } from "@/components/marriage/MarriageBackButton";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { MarriageDiary } from "@/components/marriage/MarriageDiary";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tabs = [
  { id: "quarrel", label: "吵架复盘", icon: MessageSquareWarning },
  { id: "coach", label: "沟通教练", icon: MessagesSquare },
  { id: "diary", label: "关系日记", icon: BookHeart },
];

const MarriageAITools: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTool = searchParams.get("tool") || "quarrel";
  const [activeTab, setActiveTab] = useState(initialTool);
  const [showVoice, setShowVoice] = useState(false);
  const { user } = useAuth();

  const handleVoiceClick = () => {
    if (!user) {
      toast.error("请先登录后使用语音教练");
      return;
    }
    setShowVoice(true);
  };

  const handleVoiceBriefingSaved = async (briefingId: string, briefingData: any) => {
    if (!user) return;
    await supabase.from("marriage_diary_entries").insert({
      user_id: user.id,
      source: "voice",
      user_input: briefingData.emotion_theme || "语音教练对话",
      ai_result: briefingData.insight || briefingData.growth_story || null,
    });
  };

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
        <meta name="description" content="AI吵架复盘器、AI沟通教练，帮助你梳理情绪、改善沟通。" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-marriage-light to-white pb-24">
        <MarriageBackButton />
        <div className="px-5 pt-8 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground text-center mb-1">AI婚姻教练</h1>
          <p className="text-xs text-muted-foreground text-center mb-5">帮助你梳理情绪，复盘冲突，改善沟通</p>

          {/* Voice Call CTA */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleVoiceClick}
            className="w-full mb-5 bg-gradient-to-r from-marriage-primary to-purple-500 rounded-2xl p-4 shadow-lg shadow-marriage-primary/20 flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold text-white">语音婚姻教练</h3>
              <p className="text-[11px] text-white/80 mt-0.5">像和朋友聊天一样，说出你的困扰</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
          </motion.button>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-marriage-light rounded-xl p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tool: tab.id });
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white text-marriage-primary shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tool content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {activeTab === "quarrel" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">AI吵架复盘器</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  输入最近一次争吵，AI帮你分析冲突原因、误解点和修复建议
                </p>
                <MarriageQuarrelTool mode="quarrel" />
              </div>
            )}

            {activeTab === "coach" && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">AI夫妻沟通教练</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  把"说不清"的委屈和情绪，转化为更容易被理解的表达方式
                </p>
                <MarriageQuarrelTool mode="coach" />
              </div>
            )}

            {activeTab === "diary" && (
              <div className="text-center py-12">
                <BookHeart className="h-12 w-12 text-marriage-primary/30 mx-auto mb-4" />
                <h2 className="text-base font-bold text-foreground mb-1">AI关系日记</h2>
                <p className="text-xs text-muted-foreground">
                  每天记录关系状态，AI帮助分析关系趋势
                </p>
                <p className="text-xs text-muted-foreground mt-4">功能即将上线，敬请期待</p>
              </div>
            )}
          </motion.div>
        </div>
        <MarriageNav />
      </div>
    </>
  );
};

export default MarriageAITools;
