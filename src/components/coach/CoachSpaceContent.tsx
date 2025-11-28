import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Target, TrendingUp, Calendar, MessageSquare } from "lucide-react";

export const CoachSpaceContent = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* AI 教练主卡片 */}
      <Card className="bg-gradient-to-br from-primary/10 to-warm/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">AI 生活教练</h2>
          <p className="text-muted-foreground mb-6">
            你的私人成长顾问，随时为你提供专业建议
          </p>
          <Button 
            onClick={() => navigate("/ai-coach")}
            className="bg-gradient-to-r from-primary to-warm hover:opacity-90"
          >
            开始对话
          </Button>
        </CardContent>
      </Card>

      {/* 快速功能入口 */}
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
  );
};
