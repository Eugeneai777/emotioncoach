import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import * as Icons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { categories, assessmentToolIds, getToolById } from "@/config/energyStudioTools";
import { cn } from "@/lib/utils";
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
import { MobileCard } from "@/components/ui/mobile-card";
import { HealthStoreGrid } from "@/components/store/HealthStoreGrid";
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
  { id: "coach", label: "教练空间", emoji: "🧭", route: "/coach-space", gradient: "from-rose-500 to-pink-500" },
  { id: "courses", label: "学习课程", emoji: "📚", route: "/courses", gradient: "from-blue-500 to-indigo-500" },
  { id: "camp", label: "训练营", emoji: "🏕️", route: "/camps", gradient: "from-amber-500 to-orange-500" },
  { id: "partner", label: "合伙人", emoji: "🤝", route: "/partner/type", gradient: "from-purple-500 to-violet-500" },
  { id: "store", label: "健康商城", emoji: "🛒", route: "/health-store", gradient: "from-green-500 to-emerald-500" },
];

const EnergyStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"tools" | "assessments">("tools");
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // 根据 URL hash 跳转
  useEffect(() => {
    if (location.hash === "#coach") {
      navigate("/coach-space");
    }
  }, [location.hash, navigate]);

  // 从数据库查询工具数据
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

  // 按 type 筛选：用 assessmentToolIds 判断
  const toolItems = tools.filter(t => !assessmentToolIds.has(t.tool_id));
  const assessmentItems = tools.filter(t => assessmentToolIds.has(t.tool_id));

  // 获取图标组件
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
      "male-midlife-vitality": "/assessment/male_midlife_vitality",
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

  const currentCategory = categories.find(c => c.id === activeTab);

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
      <DynamicOGMeta pageKey="energyStudio" />

      <PageHeader title="有劲生活馆" />

      <main className="container max-w-2xl mx-auto px-3 py-3 space-y-3">
        {/* 如果正在使用工具 */}
        {activeTool ? (
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool(null)} 
              className="mb-3 gap-1.5 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            {renderTool()}
          </div>
        ) : (
          <>
            {/* 人群专区入口 */}
            <AudienceHub />

            {/* 快捷入口 */}
            <div className="grid grid-cols-5 gap-1.5">
              {quickEntries.map((entry) => (
                <MobileCard 
                  key={entry.id}
                  interactive
                  className="text-center py-2.5 px-1"
                  onClick={() => entry.route ? navigate(entry.route) : navigate('/health-store')}
                >
                  <div className={`w-9 h-9 mx-auto rounded-xl bg-gradient-to-br ${entry.gradient} flex items-center justify-center mb-1`}>
                    <span className="text-base">{entry.emoji}</span>
                  </div>
                  <span className="text-[11px] font-medium whitespace-nowrap">{entry.label}</span>
                </MobileCard>
              ))}
            </div>

            {/* 两个主标签：日常工具 / 专业测评 */}
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activeTab === cat.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 分类描述 */}
            <p className="text-xs text-muted-foreground text-center">
              {currentCategory?.description}
            </p>

            {/* 日常工具列表 */}
            {activeTab === "tools" && (
              <>
                <EmotionSOSPreviewCard />
                <div className="space-y-2">
                  {toolItems.map((tool, index) => (
                    <MobileCard
                      key={tool.id}
                      interactive
                      className={cn(
                        "animate-fade-in",
                        tool.tool_id === 'declaration' && "ring-1 ring-primary/30"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => handleToolClick(tool.tool_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.gradient} text-white`}>
                          {getIcon(tool.icon_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">{tool.title}</span>
                            {tool.tool_id === 'declaration' && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                推荐
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </MobileCard>
                  ))}
                </div>
              </>
            )}

            {/* 专业测评列表 */}
            {activeTab === "assessments" && (
              <div className="space-y-2">
                {assessmentItems.map((tool, index) => {
                  const config = getToolById(tool.tool_id);
                  const tags = config?.tags || [];
                  const duration = config?.duration;

                  return (
                    <MobileCard
                      key={tool.id}
                      interactive
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => handleToolClick(tool.tool_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.gradient} text-white`}>
                          {getIcon(tool.icon_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium">{tool.title}</span>
                            {tags.map(tag => (
                              <span
                                key={tag}
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                  tag === "热门" && "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
                                  tag === "新" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                                  tag === "推荐" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                                  tag === "专业" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                                )}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                          {duration && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">{duration}</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </MobileCard>
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

export default EnergyStudio;
