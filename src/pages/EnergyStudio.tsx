import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, Info, Home } from "lucide-react";
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

import { CoachSpaceContent } from "@/components/coach/CoachSpaceContent";
import SafetyButtonsGrid from "@/components/tools/SafetyButtonsGrid";

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
const EnergyStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user
  } = useAuth();
  const { showTour, completeTour } = usePageTour('energy_studio');
  const [primaryTab, setPrimaryTab] = useState<"coach" | "tools" | "courses" | "camp" | "partner">("tools");
  const [activeTab, setActiveTab] = useState<"emotion" | "exploration" | "management">("emotion");
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // 根据 URL hash 设置初始 tab
  useEffect(() => {
    if (location.hash === "#coach") {
      setPrimaryTab("coach");
    }
  }, [location.hash]);

  // 一级菜单配置
  const primaryMenuItems = [{
    id: "coach" as const,
    label: "教练空间",
    emoji: "🎯",
    route: "/coach-space"
  }, {
    id: "tools" as const,
    label: "成长工具",
    emoji: "🛠️",
    route: null
  }, {
    id: "courses" as const,
    label: "学习课程",
    emoji: "📚",
    route: "/courses"
  }, {
    id: "camp" as const,
    label: "训练营",
    emoji: "🏕️",
    route: "/camps"
  }, {
    id: "partner" as const,
    label: "合伙人",
    emoji: "🤝",
    route: "/partner/type"
  }];

  // 从数据库查询工具数据
  const {
    data: tools = [],
    isLoading
  } = useQuery({
    queryKey: ['energy-studio-tools'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('energy_studio_tools').select('*').eq('is_available', true).order('display_order');
      if (error) throw error;
      return data as ToolCard[];
    }
  });
  const filteredTools = tools.filter(tool => tool.category === activeTab);

  // 获取图标组件
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Sparkles;
    return <Icon className="w-6 h-6" />;
  };
  const handleToolClick = (toolId: string) => {
    // 目标设定有独立页面，直接跳转
    if (toolId === 'goals') {
      navigate('/goals');
      return;
    }
    // 财富卡点测评有独立页面
    if (toolId === 'wealth-block') {
      navigate('/wealth-block');
      return;
    }
    setActiveTool(toolId);
  };
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>;
  }
  const renderTool = () => {
    switch (activeTool) {
      case "breathing":
        return <BreathingExercise />;
      case "mindfulness":
        return <MindfulnessPractice />;
      case "values":
        return <ValuesExplorer />;
      case "strengths":
        return <StrengthsFinder />;
      case "vision":
        return <VisionBoard />;
      case "gratitude":
        return <GratitudeJournal />;
      case "habits":
        return <HabitTracker />;
      case "energy":
        return <EnergyManagement />;
      case "sleep":
        return <SleepLogger />;
      case "exercise":
        return <ExerciseLogger />;
      case "finance":
        return <FinanceTracker />;
      case "time":
        return <TimeManagement />;
      case "relationships":
        return <RelationshipTracker />;
      case "declaration":
        return <EnergyDeclaration />;
      default:
        return null;
    }
  };
  const getCategoryTitle = (category: string) => {
    return getCategoryConfig(category)?.name || "";
  };
  const getCategoryDescription = (category: string) => {
    return getCategoryConfig(category)?.description || "";
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Helmet>
        <title>能量工作室 - 有劲AI</title>
        <meta name="description" content="多种情绪工具，随时调节你的能量状态" />
        <meta property="og:title" content="有劲AI • 有劲生活馆" />
        <meta property="og:description" content="情绪急救、情绪日记、冥想引导等多种工具" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/energy-studio" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* Header with gradient background */}
      <PageHeader 
        title="有劲生活馆"
        className="bg-gradient-to-r from-primary/10 via-accent/10 to-warm/10"
        rightActions={
          <Button variant="outline" size="sm" onClick={() => navigate("/user-manual")} className="gap-2">
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">使用指南</span>
            <span className="sm:hidden">指南</span>
          </Button>
        }
      />

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* 一级导航菜单 - 5等分紧凑布局 */}
        <div className="flex justify-center mb-4 sm:mb-6 px-1 sm:px-2">
          <div className="grid w-full max-w-4xl grid-cols-5 bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-full p-0.5 sm:p-1.5 border shadow-sm gap-0.5 sm:gap-1">
            {primaryMenuItems.map(item => <Button key={item.id} variant={primaryTab === item.id ? "default" : "ghost"} onClick={() => {
            if (item.route) {
              navigate(item.route);
            } else {
              setPrimaryTab(item.id);
              setActiveTool(null);
            }
          }} className={cn("rounded-lg sm:rounded-full py-1.5 sm:py-2.5 px-0.5 sm:px-3 gap-0.5 sm:gap-1 transition-all duration-300 flex-col sm:flex-row h-auto min-h-[48px] sm:min-h-0", primaryTab === item.id && "bg-gradient-to-r from-primary to-warm text-white shadow-lg")}>
                <span className="text-sm sm:text-base">{item.emoji}</span>
                <span className="text-[9px] sm:text-sm whitespace-nowrap font-medium">{item.label}</span>
              </Button>)}
          </div>
        </div>

        {/* 根据一级菜单显示内容 */}
        {primaryTab === "coach" && <CoachSpaceContent />}

        {primaryTab === "tools" && <>
            {activeTool ? <div>
            <Button variant="ghost" size="sm" onClick={() => setActiveTool(null)} className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回工具列表
            </Button>
            {renderTool()}
          </div> : <>
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full max-w-md sm:max-w-2xl mx-auto grid-cols-3 mb-4 sm:mb-8 h-auto p-1 sm:p-1.5 bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-full">
            {categories.map(category => <TabsTrigger key={category.id} value={category.id} className={cn("rounded-lg sm:rounded-full transition-all duration-300 gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 text-xs sm:text-sm", "data-[state=active]:text-white data-[state=active]:shadow-lg", category.id === "emotion" && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500", category.id === "exploration" && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500", category.id === "management" && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500")}>
                <span>{category.emoji}</span>
                <span className="hidden xs:inline">{category.name}</span>
              </TabsTrigger>)}
          </TabsList>

          <div className="mb-4 sm:mb-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">{getCategoryDescription(activeTab)}</p>
          </div>

          {/* 情绪按钮作为核心工具置顶显示 */}
          {activeTab === "emotion" && <div className="mb-8">
              <SafetyButtonsGrid />
            </div>}

          <TabsContent value={activeTab} className="mt-0">
            {/* 更多工具分隔标题 - 仅在情绪tab且有其他工具时显示 */}
            {activeTab === "emotion" && filteredTools.length > 0 && <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-sm text-muted-foreground font-medium">更多情绪工具</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filteredTools.map((tool, index) => {
                  return <Card key={tool.id} className={`group cursor-pointer bg-white/70 backdrop-blur-sm border hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden animate-fade-in ${tool.tool_id === 'declaration' ? 'ring-2 ring-primary/20' : ''}`} style={{
                    animationDelay: `${index * 50}ms`
                  }} onClick={() => handleToolClick(tool.tool_id)}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <CardHeader className="relative pb-2 pt-3 px-3 sm:px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 sm:p-3 rounded-lg bg-gradient-to-br ${tool.gradient} text-white shadow-md group-hover:scale-105 transition-transform duration-300`}>
                          {getIcon(tool.icon_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm sm:text-base group-hover:text-primary transition-colors flex items-center gap-2">
                            <span className="truncate">{tool.title}</span>
                            {tool.tool_id === 'declaration' && <span className="text-[10px] sm:text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                推荐
                              </span>}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative pt-0 pb-3 px-3 sm:px-4">
                      <CardDescription className="text-xs sm:text-sm leading-relaxed line-clamp-1 sm:line-clamp-2">
                        {tool.description}
                      </CardDescription>
                    </CardContent>
                  </Card>;
                })}
            </div>
          </TabsContent>
        </Tabs>
          </>}
          </>}
      </main>
      <PageTour open={showTour} onComplete={completeTour} steps={pageTourConfig.energy_studio} pageTitle="有劲生活馆" />
    </div>;
};
export default EnergyStudio;