import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, Calendar, MessageSquare } from "lucide-react";
import { CoachCard } from "./CoachCard";
const coaches = [{
  id: "emotion-coach",
  title: "情绪觉醒教练",
  subtitle: "日常情绪觉察与记录",
  description: "通过对话梳理情绪，生成情绪简报",
  icon: "Heart",
  gradient: "from-green-500 to-emerald-500",
  route: "/",
  badge: "推荐"
}, {
  id: "parent-coach",
  title: "家长情绪教练",
  subtitle: "亲子情绪四部曲",
  description: "Feel · See · Sense · Transform",
  icon: "Users",
  gradient: "from-orange-500 to-amber-500",
  route: "/parent-coach",
  badge: null
}, {
  id: "communication-coach",
  title: "卡内基沟通教练",
  subtitle: "Dale Carnegie",
  description: "See · Understand · Influence · Act",
  icon: "MessageSquare",
  gradient: "from-blue-500 to-indigo-500",
  route: "/communication-coach",
  badge: "新"
}, {
  id: "vibrant-life-coach",
  title: "有劲生活教练",
  subtitle: "劲老师带你活出光彩",
  description: "温暖陪伴，点亮心灯",
  icon: "Sparkles",
  gradient: "from-rose-500 to-red-500",
  route: "/coach/vibrant_life_sage",
  badge: "新"
}, {
  id: "life-coach",
  title: "AI 生活教练",
  subtitle: "四维健康分析",
  description: "情绪、生活、身心、成长全面评估",
  icon: "Sparkles",
  gradient: "from-purple-500 to-indigo-500",
  route: "/ai-coach",
  badge: null
}];
export const CoachSpaceContent = () => {
  const navigate = useNavigate();
  return <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">🎯 教练空间</h2>
        <p className="text-muted-foreground">选择适合你的教练开始今天的成长</p>
      </div>

      {/* Coach Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coaches.map(coach => <CoachCard key={coach.id} {...coach} />)}
      </div>

      {/* Quick Access Section */}
      
    </div>;
};