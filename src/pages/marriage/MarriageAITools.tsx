import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareWarning, MessagesSquare, BookHeart, ArrowLeft } from "lucide-react";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageQuarrelTool } from "@/components/marriage/MarriageQuarrelTool";
import { MarriageBackButton } from "@/components/marriage/MarriageBackButton";

const tabs = [
  { id: "quarrel", label: "吵架复盘", icon: MessageSquareWarning },
  { id: "coach", label: "沟通教练", icon: MessagesSquare },
  { id: "diary", label: "关系日记", icon: BookHeart },
];

const MarriageAITools: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTool = searchParams.get("tool") || "quarrel";
  const [activeTab, setActiveTab] = useState(initialTool);

  return (
    <>
      <Helmet>
        <title>AI关系工具 - 婚因有道</title>
        <meta name="description" content="AI吵架复盘器、AI沟通教练，帮助你梳理情绪、改善沟通。" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-marriage-light to-white pb-24">
        <MarriageBackButton />
        <div className="px-5 pt-8 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground text-center mb-1">AI关系工具</h1>
          <p className="text-xs text-muted-foreground text-center mb-5">帮助你梳理情绪，复盘冲突，改善沟通</p>

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
