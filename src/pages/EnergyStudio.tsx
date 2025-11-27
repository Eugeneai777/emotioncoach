import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Wind, 
  Timer, 
  HeartPulse, 
  Sparkles,
  Target,
  Eye,
  ImageIcon,
  BookHeart,
  Calendar,
  Battery,
  Moon,
  Dumbbell,
  DollarSign,
  Clock,
  Heart,
  Megaphone,
  Info
} from "lucide-react";
import * as Icons from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { categories, getCategoryConfig } from "@/config/energyStudioTools";
import { cn } from "@/lib/utils";
import { BreathingExercise } from "@/components/tools/BreathingExercise";
import { MeditationTimer } from "@/components/tools/MeditationTimer";
import { EmotionFirstAid } from "@/components/tools/EmotionFirstAid";
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"emotion" | "exploration" | "management">("emotion");
  const [activeTool, setActiveTool] = useState<string | null>(null);

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

  const filteredTools = tools.filter(tool => tool.category === activeTab);

  // 获取图标组件
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Sparkles;
    return <Icon className="w-6 h-6" />;
  };

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  const renderTool = () => {
    switch (activeTool) {
      case "breathing":
        return <BreathingExercise />;
      case "meditation":
        return <MeditationTimer />;
      case "first-aid":
        return <EmotionFirstAid />;
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
      case "relationship":
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header with gradient background */}
      <header className="bg-gradient-to-r from-primary/10 via-accent/10 to-warm/10 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 hover:bg-background/80"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
                有劲生活馆
              </h1>
              <p className="text-sm text-muted-foreground mt-1">探索更好的自己 · 享受有劲生活</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/energy-studio-intro")}
                className="gap-2"
              >
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">使用指南</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/ai-coach")}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI教练</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Training Camp Banner */}
        <Card className="mb-8 overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-purple-950/20 animate-in fade-in-50 slide-in-from-top-4 duration-500">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 text-6xl">🏕️</div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  21天情绪日记训练营
                </h3>
                <p className="text-muted-foreground">
                  每天10分钟，让情绪变成你的力量。系统化情绪管理，获得专属成长档案 ✨
                </p>
              </div>
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => navigate("/camp-intro")}
                  variant="outline"
                  className="gap-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5"
                >
                  了解详情
                </Button>
                <Button 
                  onClick={() => navigate("/")}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  立即加入
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Online Courses Entry */}
        <Card className="mb-8 overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-950/20 dark:via-cyan-950/20 dark:to-blue-950/20 animate-in fade-in-50 slide-in-from-top-4 duration-500">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 text-6xl">📚</div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  线上课程中心
                </h3>
                <p className="text-muted-foreground">
                  358门精选课程，涵盖领导力、个人成长、情绪管理、人际关系。系统化学习，持续成长 📖
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button 
                  onClick={() => navigate("/courses")}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                >
                  <BookHeart className="w-4 h-4" />
                  浏览全部课程
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {activeTool ? (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTool(null)}
              className="mb-6 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回工具列表
            </Button>
            {renderTool()}
          </div>
        ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8 h-auto p-1.5 bg-card/50 backdrop-blur-sm rounded-full">
            {categories.map(category => (
              <TabsTrigger 
                key={category.id}
                value={category.id}
                className={cn(
                  "rounded-full transition-all duration-300 gap-2 py-2.5 px-4",
                  "data-[state=active]:text-white data-[state=active]:shadow-lg",
                  category.id === "emotion" && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500",
                  category.id === "exploration" && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500",
                  category.id === "management" && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500"
                )}
              >
                {category.emoji} {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mb-8 text-center space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-warm bg-clip-text text-transparent">
              {getCategoryTitle(activeTab)}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
              <p className="text-muted-foreground">{getCategoryDescription(activeTab)}</p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTools.map((tool, index) => {
                return (
                  <Card
                    key={tool.id}
                    className={`group cursor-pointer bg-card/60 backdrop-blur-sm border-2 hover:border-transparent hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl rounded-2xl overflow-hidden animate-fade-in ${
                      tool.tool_id === 'declaration' ? 'ring-2 ring-primary/20' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => handleToolClick(tool.tool_id)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <CardHeader className="relative pb-3">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {getIcon(tool.icon_name)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2 flex-wrap">
                            {tool.title}
                            {tool.tool_id === 'declaration' && (
                              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full">
                                推荐
                              </span>
                            )}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <CardDescription className="text-sm leading-relaxed">
                        {tool.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  );
};

export default EnergyStudio;
