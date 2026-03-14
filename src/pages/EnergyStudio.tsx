import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ChevronRight, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import * as Icons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { categories, assessmentToolIds, getToolById } from "@/config/energyStudioTools";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
import AudienceHub from "@/components/energy-studio/AudienceHub";

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

// 快捷入口配置
const quickEntries = [
  { id: "coach", label: "教练", emoji: "🧭", route: "/coach-space", gradient: "from-rose-500 to-pink-500" },
  { id: "courses", label: "课程", emoji: "📚", route: "/courses", gradient: "from-blue-500 to-indigo-500" },
  { id: "camp", label: "训练营", emoji: "🏕️", route: "/camps", gradient: "from-amber-500 to-orange-500" },
  { id: "partner", label: "合伙人", emoji: "🤝", route: "/partner/type", gradient: "from-purple-500 to-violet-500" },
  { id: "store", label: "商城", emoji: "🛒", route: "/health-store", gradient: "from-green-500 to-emerald-500" },
];

const EnergyStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"tools" | "assessments">("tools");
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    if (location.hash === "#coach") {
      navigate("/coach-space");
    }
  }, [location.hash, navigate]);

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['energy-studio-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('energy_studio_tools')
        .select('*')
        .eq('is_available', true)
        .order('display_order');
      if (error) throw error;
      return data as ToolCard[];
    }
  });

  const toolItems = tools.filter(t => !assessmentToolIds.has(t.tool_id));
  const assessmentItems = tools.filter(t => assessmentToolIds.has(t.tool_id));

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-6 h-6 animate-pulse mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

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

  const currentItems = activeTab === "tools" ? toolItems : assessmentItems;

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-rose-50/40 via-background to-background dark:from-rose-950/10" style={{ WebkitOverflowScrolling: 'touch' }}>
      <DynamicOGMeta pageKey="energyStudio" />
      <PageHeader title="有劲生活馆" />

      <main className="container max-w-2xl mx-auto px-3 py-3 space-y-4">
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
            {/* 人群专区 - 瀑布流 */}
            <AudienceHub />

            {/* 快捷入口 - 横向滚动胶囊 */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
              {quickEntries.map((entry, i) => (
                <motion.button
                  key={entry.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(entry.route)}
                  className={`snap-start flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r ${entry.gradient} text-white text-xs font-medium shadow-sm min-h-[40px]`}
                >
                  <span>{entry.emoji}</span>
                  <span>{entry.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Tab 切换 - 下划线指示器 */}
            <div className="flex gap-6 border-b border-border/40 relative">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={cn(
                    "relative pb-2.5 text-sm transition-colors min-h-[44px]",
                    activeTab === cat.id
                      ? "font-bold text-foreground"
                      : "font-normal text-muted-foreground hover:text-foreground/70"
                  )}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.name}
                  {activeTab === cat.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* 分类描述 */}
            <p className="text-xs text-muted-foreground">
              {categories.find(c => c.id === activeTab)?.description}
            </p>

            {/* 内容区域 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* SOS banner (tools tab only) */}
                {activeTab === "tools" && <EmotionSOSPreviewCard />}

                {/* 双列卡片网格 */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {currentItems.map((tool, index) => {
                    const config = getToolById(tool.tool_id);
                    const tags = config?.tags || [];
                    const duration = config?.duration;

                    return (
                      <motion.button
                        key={tool.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-20px" }}
                        transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleToolClick(tool.tool_id)}
                        className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left"
                      >
                        {/* Gradient header with icon */}
                        <div className={`relative w-full h-16 bg-gradient-to-br ${tool.gradient} flex items-center justify-center`}>
                          <div className="text-white/90">
                            {getIcon(tool.icon_name)}
                          </div>
                          {/* Tag badges */}
                          {tags.length > 0 && (
                            <div className="absolute top-1.5 right-1.5 flex gap-1">
                              {tags.map(tag => (
                                <span
                                  key={tag}
                                  className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-white/25 text-white backdrop-blur-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {tool.tool_id === "declaration" && (
                            <span className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-white/25 text-white backdrop-blur-sm">
                              推荐
                            </span>
                          )}
                        </div>
                        {/* Content */}
                        <div className="p-2.5">
                          <p className="text-[13px] font-semibold text-foreground leading-tight line-clamp-1">{tool.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{tool.description}</p>
                          {duration && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className="text-[9px] text-muted-foreground">{duration}</span>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
};

export default EnergyStudio;
