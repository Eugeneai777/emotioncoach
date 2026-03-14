import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Clock, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { categories, assessmentToolIds, getToolById } from "@/config/energyStudioTools";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import { BreathingExercise } from "@/components/tools/BreathingExercise";
import { MindfulnessPractice } from "@/components/tools/MindfulnessPractice";
import { ValuesExplorer } from "@/components/tools/ValuesExplorer";
import { StrengthsFinder } from "@/components/tools/StrengthsFinder";
import { VisionBoard } from "@/components/tools/VisionBoard";
import { GratitudeJournal } from "@/components/tools/GratitudeJournal";
import { HabitTracker } from "@/components/tools/HabitTracker";
import { EnergyManagement } from "@/components/tools/EnergyManagement";
import { SleepLogger } from "@/components/tools/SleepLogger";
import { ExerciseLogger } from "@/components/tools/ExerciseLogger";
import { FinanceTracker } from "@/components/tools/FinanceTracker";
import { TimeManagement } from "@/components/tools/TimeManagement";
import { RelationshipTracker } from "@/components/tools/RelationshipTracker";
import { EnergyDeclaration } from "@/components/tools/EnergyDeclaration";
import { AliveCheck } from "@/components/tools/AliveCheck";
import EmotionSOSPreviewCard from "@/components/tools/EmotionSOSPreviewCard";
import PageHeader from "@/components/PageHeader";

interface ToolCard {
  id: string;
  tool_id: string;
  title: string;
  description: string;
  icon_name: string;
  category: string;
  gradient: string;
  is_available: boolean;
}

const EnergyStudioExplore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"tools" | "assessments">("tools");
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["energy-studio-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_studio_tools")
        .select("*")
        .eq("is_available", true)
        .order("display_order");
      if (error) throw error;
      return data as ToolCard[];
    },
  });

  const toolItems = tools.filter((t) => !assessmentToolIds.has(t.tool_id));
  const assessmentItems = tools.filter((t) => assessmentToolIds.has(t.tool_id));

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Sparkles;
    return <Icon className="w-5 h-5" />;
  };

  const handleToolClick = (toolId: string) => {
    const navRoutes: Record<string, string> = {
      awakening: "/awakening",
      goals: "/goals",
      "wealth-block": "/wealth-block",
      scl90: "/scl90",
      "emotion-health": "/emotion-health",
      "women-competitiveness": "/women-competitiveness",
      "comm-assessment": "/communication-assessment",
      "parent-ability": "/parent-ability-assessment",
      "midlife-awakening": "/midlife-awakening",
    };
    if (navRoutes[toolId]) {
      navigate(navRoutes[toolId]);
      return;
    }
    setActiveTool(toolId);
  };

  const renderTool = () => {
    switch (activeTool) {
      case "breathing": return <BreathingExercise />;
      case "mindfulness": return <MindfulnessPractice />;
      case "values": return <ValuesExplorer />;
      case "strengths": return <StrengthsFinder />;
      case "vision": return <VisionBoard />;
      case "gratitude": return <GratitudeJournal />;
      case "habits": return <HabitTracker />;
      case "energy": return <EnergyManagement />;
      case "sleep": return <SleepLogger />;
      case "exercise": return <ExerciseLogger />;
      case "finance": return <FinanceTracker />;
      case "time": return <TimeManagement />;
      case "relationships": return <RelationshipTracker />;
      case "declaration": return <EnergyDeclaration />;
      case "alive-check": return <AliveCheck />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="w-6 h-6 animate-pulse text-primary" />
      </div>
    );
  }

  const currentCategory = categories.find((c) => c.id === activeTab);

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: "touch" }}>
      <DynamicOGMeta pageKey="energyStudio" />
      <PageHeader title="探索工具" backTo="/energy-studio" />

      <main className="container max-w-2xl mx-auto px-3 py-3 space-y-3">
        {activeTool ? (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setActiveTool(null)} className="mb-3 gap-1.5 text-sm">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            {renderTool()}
          </div>
        ) : (
          <>
            {/* Tab 切换 — 下划线风格 */}
            <div className="flex justify-center gap-6 relative">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className="relative pb-2 text-sm font-medium transition-colors"
                >
                  <span className={cn(
                    activeTab === cat.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {cat.emoji} {cat.name}
                  </span>
                  {activeTab === cat.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">{currentCategory?.description}</p>

            {/* 日常工具 — 双列瀑布流卡片 */}
            {activeTab === "tools" && (
              <>
                <EmotionSOSPreviewCard />
                <div className="columns-2 gap-3 space-y-3">
                  {toolItems.map((tool, i) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleToolClick(tool.tool_id)}
                      className="break-inside-avoid cursor-pointer rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* 渐变色头部 */}
                      <div className={`bg-gradient-to-br ${tool.gradient} p-4 flex items-center justify-center`}>
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                          {getIcon(tool.icon_name)}
                        </div>
                      </div>
                      {/* 文字区 */}
                      <div className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-foreground">{tool.title}</span>
                          {tool.tool_id === "declaration" && (
                            <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">推荐</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* 专业测评 — 双列瀑布流卡片 */}
            {activeTab === "assessments" && (
              <div className="columns-2 gap-3 space-y-3">
                {assessmentItems.map((tool, i) => {
                  const config = getToolById(tool.tool_id);
                  const tags = config?.tags || [];
                  const duration = config?.duration;

                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleToolClick(tool.tool_id)}
                      className="break-inside-avoid cursor-pointer rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* 渐变色头部 */}
                      <div className={`bg-gradient-to-br ${tool.gradient} p-4 flex items-center justify-center relative`}>
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                          {getIcon(tool.icon_name)}
                        </div>
                        {/* 标签 */}
                        {tags.length > 0 && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-white/80 text-foreground backdrop-blur-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* 文字区 */}
                      <div className="p-3">
                        <span className="text-sm font-semibold text-foreground">{tool.title}</span>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
                        {duration && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{duration}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default EnergyStudioExplore;
