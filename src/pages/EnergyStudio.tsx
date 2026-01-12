import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import * as Icons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { categories, getCategoryConfig } from "@/config/energyStudioTools";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";
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

import SafetyButtonsGrid from "@/components/tools/SafetyButtonsGrid";
import { MobileCard } from "@/components/ui/mobile-card";

interface ToolCard {
  id: string;
  tool_id: string;
  title: string;
  description: string;
  icon_name: string;
  category: "emotion" | "exploration" | "management";
  gradient: string;
  is_available: boolean;
}

// 快捷入口配置
const quickEntries = [
  { id: "coach", label: "AI教练", emoji: "🎯", route: "/coach-space", gradient: "from-rose-500 to-pink-500" },
  { id: "courses", label: "学习课程", emoji: "📚", route: "/courses", gradient: "from-blue-500 to-indigo-500" },
  { id: "camp", label: "训练营", emoji: "🏕️", route: "/camps", gradient: "from-amber-500 to-orange-500" },
  { id: "partner", label: "合伙人", emoji: "🤝", route: "/partner/type", gradient: "from-emerald-500 to-teal-500" },
];

const EnergyStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showTour, completeTour } = usePageTour('energy_studio');
  const [activeCategory, setActiveCategory] = useState<"emotion" | "exploration" | "management">("emotion");
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

  const filteredTools = tools.filter(tool => tool.category === activeCategory);

  // 获取图标组件
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Sparkles;
    return <Icon className="w-5 h-5" />;
  };

  const handleToolClick = (toolId: string) => {
    if (toolId === 'goals') {
      navigate('/goals');
      return;
    }
    if (toolId === 'wealth-block') {
      navigate('/wealth-block');
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
      default: return null;
    }
  };

  const getCategoryDescription = (category: string) => {
    return getCategoryConfig(category)?.description || "";
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>有劲生活馆 - 有劲AI</title>
        <meta name="description" content="多种情绪工具，随时调节你的能量状态" />
        <meta property="og:title" content="有劲AI • 有劲生活馆" />
        <meta property="og:description" content="情绪急救、情绪日记、冥想引导等多种工具" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/energy-studio" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>

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
            {/* 快捷入口 - 2x2 网格 */}
            <div className="grid grid-cols-4 gap-2">
              {quickEntries.map((entry) => (
                <MobileCard 
                  key={entry.id}
                  interactive
                  className="text-center py-3"
                  onClick={() => navigate(entry.route)}
                >
                  <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${entry.gradient} flex items-center justify-center mb-1.5`}>
                    <span className="text-lg">{entry.emoji}</span>
                  </div>
                  <span className="text-xs font-medium">{entry.label}</span>
                </MobileCard>
              ))}
            </div>

            {/* 分类选择 - 简洁横向滚动 */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id as typeof activeCategory)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <span className="mr-1">{category.emoji}</span>
                  {category.name}
                </button>
              ))}
            </div>

            {/* 分类描述 */}
            <p className="text-xs text-muted-foreground text-center">
              {getCategoryDescription(activeCategory)}
            </p>

            {/* 情绪按钮 - 核心工具 */}
            {activeCategory === "emotion" && (
              <SafetyButtonsGrid />
            )}

            {/* 更多工具分隔 */}
            {activeCategory === "emotion" && filteredTools.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">更多工具</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            {/* 工具列表 - 紧凑卡片 */}
            <div className="space-y-2">
              {filteredTools.map((tool, index) => (
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
      </main>

      <PageTour 
        open={showTour} 
        onComplete={completeTour} 
        steps={pageTourConfig.energy_studio} 
        pageTitle="有劲生活馆" 
      />
    </div>
  );
};

export default EnergyStudio;
