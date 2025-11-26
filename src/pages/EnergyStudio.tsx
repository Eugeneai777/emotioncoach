import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Megaphone
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "emotion" | "exploration" | "management";
  color: string;
  available: boolean;
}

const EnergyStudio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"emotion" | "exploration" | "management">("emotion");
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // 获取工具的渐变配色
  const getToolGradient = (toolId: string): string => {
    const gradientMap: Record<string, string> = {
      // 情绪工具
      'declaration': 'from-purple-500 to-pink-500',
      'breathing': 'from-cyan-500 to-teal-500',
      'meditation': 'from-indigo-500 to-purple-500',
      'first-aid': 'from-rose-500 to-pink-500',
      'mindfulness': 'from-violet-500 to-indigo-500',
      // 自我探索
      'values': 'from-teal-500 to-emerald-500',
      'strengths': 'from-blue-500 to-violet-500',
      'vision': 'from-orange-500 to-rose-500',
      'gratitude': 'from-pink-500 to-purple-500',
      'relationship': 'from-red-500 to-pink-500',
      // 生活管理
      'habits': 'from-green-500 to-teal-500',
      'energy': 'from-yellow-500 to-orange-500',
      'sleep': 'from-blue-600 to-indigo-600',
      'exercise': 'from-orange-500 to-red-500',
      'finance': 'from-emerald-500 to-green-500',
      'time': 'from-sky-500 to-blue-500',
    };
    return gradientMap[toolId] || 'from-primary to-primary';
  };

  const tools: ToolCard[] = [
    // 情绪工具
    {
      id: "declaration",
      title: "能量宣言卡",
      description: "创建个性化能量宣言海报，开启有劲的一天",
      icon: <Megaphone className="w-6 h-6" />,
      category: "emotion",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "breathing",
      title: "呼吸练习",
      description: "多种呼吸模式，帮助你快速平静下来",
      icon: <Wind className="w-6 h-6" />,
      category: "emotion",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "meditation",
      title: "冥想计时器",
      description: "专注冥想，记录你的静心时光",
      icon: <Timer className="w-6 h-6" />,
      category: "emotion",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "first-aid",
      title: "情绪急救箱",
      description: "快速识别情绪，获取即时缓解技巧",
      icon: <HeartPulse className="w-6 h-6" />,
      category: "emotion",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "mindfulness",
      title: "正念练习",
      description: "AI语音引导，体验正念的力量",
      icon: <Sparkles className="w-6 h-6" />,
      category: "emotion",
      color: "hsl(var(--primary))",
      available: true
    },
    // 自我探索工具
    {
      id: "values",
      title: "价值观探索",
      description: "发现你内心真正珍视的东西",
      icon: <Target className="w-6 h-6" />,
      category: "exploration",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "strengths",
      title: "优势发现",
      description: "认识你的独特优势和天赋",
      icon: <Eye className="w-6 h-6" />,
      category: "exploration",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "vision",
      title: "人生愿景画布",
      description: "可视化你的梦想和目标",
      icon: <ImageIcon className="w-6 h-6" />,
      category: "exploration",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "gratitude",
      title: "感恩日记",
      description: "记录生活中的美好瞬间",
      icon: <BookHeart className="w-6 h-6" />,
      category: "exploration",
      color: "hsl(var(--primary))",
      available: true
    },
    // 生活管理工具
    {
      id: "habits",
      title: "习惯追踪",
      description: "养成好习惯，追踪你的进步",
      icon: <Calendar className="w-6 h-6" />,
      category: "management",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "energy",
      title: "能量管理",
      description: "了解你的能量曲线，优化时间安排",
      icon: <Battery className="w-6 h-6" />,
      category: "management",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "sleep",
      title: "睡眠记录",
      description: "追踪睡眠质量，改善休息效果",
      icon: <Moon className="w-6 h-6" />,
      category: "management",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "exercise",
      title: "运动打卡",
      description: "记录运动数据，保持健康活力",
      icon: <Dumbbell className="w-6 h-6" />,
      category: "management",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "finance",
      title: "财务管理",
      description: "记录收支，掌握财务状况",
      icon: <DollarSign className="w-6 h-6" />,
      category: "management",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "time",
      title: "时间管理",
      description: "高效规划，充分利用每一分钟",
      icon: <Clock className="w-6 h-6" />,
      category: "management",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "relationship",
      title: "人际关系",
      description: "维护关系，珍惜每一份联结",
      icon: <Heart className="w-6 h-6" />,
      category: "exploration",
      color: "hsl(var(--primary))",
      available: true
    }
  ];

  const filteredTools = tools.filter(tool => tool.category === activeTab);

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
  };

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
    switch (category) {
      case "emotion":
        return "情绪工具";
      case "exploration":
        return "自我探索";
      case "management":
        return "生活管理";
      default:
        return "";
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case "emotion":
        return "帮助你调节情绪、找回平静";
      case "exploration":
        return "深入了解自己，发现内在力量";
      case "management":
        return "优化生活习惯，提升生活质量";
      default:
        return "";
    }
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
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
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
            <TabsTrigger 
              value="emotion"
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 gap-2"
            >
              💜 情绪工具
            </TabsTrigger>
            <TabsTrigger 
              value="exploration"
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 gap-2"
            >
              💚 自我探索
            </TabsTrigger>
            <TabsTrigger 
              value="management"
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 gap-2"
            >
              🧡 生活管理
            </TabsTrigger>
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
                const gradients = getToolGradient(tool.id);
                return (
                  <Card
                    key={tool.id}
                    className={`group cursor-pointer bg-card/60 backdrop-blur-sm border-2 hover:border-transparent hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl rounded-2xl overflow-hidden animate-fade-in ${
                      tool.id === 'declaration' ? 'ring-2 ring-primary/20' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => handleToolClick(tool.id)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradients} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <CardHeader className="relative pb-3">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {tool.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2 flex-wrap">
                            {tool.title}
                            {tool.id === 'declaration' && (
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
