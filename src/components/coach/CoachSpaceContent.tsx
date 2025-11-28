import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, Calendar, MessageSquare } from "lucide-react";
import { CoachCard } from "./CoachCard";

const coaches = [
  {
    id: "emotion-coach",
    title: "情绪梳理教练",
    subtitle: "日常情绪觉察与记录",
    description: "通过对话梳理情绪，生成情绪简报",
    icon: "Heart",
    gradient: "from-green-500 to-emerald-500",
    route: "/",
    badge: "推荐",
  },
  {
    id: "life-coach",
    title: "AI 生活教练",
    subtitle: "四维健康分析",
    description: "情绪、生活、身心、成长全面评估",
    icon: "Sparkles",
    gradient: "from-purple-500 to-indigo-500",
    route: "/ai-coach",
    badge: null,
  },
  {
    id: "parent-coach",
    title: "家长情绪教练",
    subtitle: "亲子情绪四部曲",
    description: "Feel · See · Sense · Transform",
    icon: "Users",
    gradient: "from-orange-500 to-amber-500",
    route: "/parent-coach",
    badge: "新",
  },
  {
    id: "coming-soon",
    title: "更多教练",
    subtitle: "敬请期待",
    description: "职场教练、情侣教练等即将上线",
    icon: "Plus",
    gradient: "from-gray-400 to-gray-500",
    route: null,
    badge: null,
    disabled: true,
  },
];

export const CoachSpaceContent = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">🎯 教练空间</h2>
        <p className="text-muted-foreground">选择适合你的教练开始今天的成长</p>
      </div>

      {/* Coach Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coaches.map((coach) => (
          <CoachCard key={coach.id} {...coach} />
        ))}
      </div>

      {/* Quick Access Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">📊 快捷功能入口</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/goals")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-lg">目标规划</h3>
                <p className="text-sm text-muted-foreground">制定和追踪成长目标</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/tag-stats")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium text-lg">情绪洞察</h3>
                <p className="text-sm text-muted-foreground">查看情绪趋势和分析</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/calendar")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-lg">成长日历</h3>
                <p className="text-sm text-muted-foreground">回顾你的成长历程</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/history")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-medium text-lg">对话历史</h3>
                <p className="text-sm text-muted-foreground">查看历史教练对话</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
