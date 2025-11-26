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
  MessageCircle,
  NotebookPen,
  DollarSign,
  Clock,
  Heart
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

  const tools: ToolCard[] = [
    // 情绪工具
    {
      id: "emotion-coach",
      title: "情绪教练",
      description: "AI陪伴式情绪梳理，找到情绪的力量",
      icon: <MessageCircle className="w-6 h-6" />,
      category: "emotion",
      color: "hsl(var(--primary))",
      available: true
    },
    {
      id: "emotion-diary",
      title: "我的情绪日记",
      description: "查看历史记录，回顾成长轨迹",
      icon: <NotebookPen className="w-6 h-6" />,
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
    // 特殊处理：情绪教练跳转到首页
    if (toolId === "emotion-coach") {
      navigate("/");
      return;
    }
    // 特殊处理：情绪日记跳转到历史页面
    if (toolId === "emotion-diary") {
      navigate("/history");
      return;
    }
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">有劲生活馆</h1>
              <p className="text-sm text-muted-foreground">发现更好的自己，享受更有劲的生活</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/ai-coach")}
              className="gap-2 border-purple-200 hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">AI生活教练</span>
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
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="emotion" className="gap-2">
              <HeartPulse className="w-4 h-4" />
              情绪工具
            </TabsTrigger>
            <TabsTrigger value="exploration" className="gap-2">
              <Eye className="w-4 h-4" />
              自我探索
            </TabsTrigger>
            <TabsTrigger value="management" className="gap-2">
              <Calendar className="w-4 h-4" />
              生活管理
            </TabsTrigger>
          </TabsList>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold mb-2">{getCategoryTitle(activeTab)}</h2>
            <p className="text-muted-foreground">{getCategoryDescription(activeTab)}</p>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <Card
                  key={tool.id}
                  className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2"
                  style={{
                    borderColor: `${tool.color}20`
                  }}
                  onClick={() => handleToolClick(tool.id)}
                >
                  <CardHeader>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors"
                      style={{
                        backgroundColor: `${tool.color}20`,
                        color: tool.color
                      }}
                    >
                      {tool.icon}
                    </div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tool.available ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        style={{
                          borderColor: tool.color,
                          color: tool.color
                        }}
                      >
                        开始使用
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        即将推出
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  );
};

export default EnergyStudio;
