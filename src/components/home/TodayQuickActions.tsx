import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Target, 
  Calendar,
  TrendingUp,
  Sparkles,
  BookOpen,
  Zap
} from "lucide-react";
import { getTodayInBeijing } from "@/utils/dateUtils";

export const TodayQuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 查询今日是否已对话
  const { data: todayConversation } = useQuery({
    queryKey: ['today-conversation', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .limit(1)
        .maybeSingle();
      
      return data;
    },
    enabled: !!user
  });

  // 查询活跃目标数
  const { data: activeGoals } = useQuery({
    queryKey: ['active-goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('emotion_goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      return data || [];
    },
    enabled: !!user
  });

  // 查询活跃训练营
  const { data: activeCamp } = useQuery({
    queryKey: ['active-camp', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('training_camps')
        .select('*, camp_daily_progress(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
    enabled: !!user
  });

  // 查询今日是否已打卡
  const checkInDates = Array.isArray(activeCamp?.check_in_dates) ? activeCamp.check_in_dates : [];
  const todayCheckedIn = checkInDates.includes(getTodayInBeijing());

  const quickActions = [
    {
      icon: MessageCircle,
      title: todayConversation ? "继续今日对话" : "开始情绪对话",
      description: todayConversation ? "与AI教练继续探索情绪" : "记录你的情绪状态",
      route: "/chat",
      gradient: "from-purple-500 to-blue-500",
      completed: !!todayConversation
    },
    {
      icon: Calendar,
      title: todayCheckedIn ? "已完成打卡" : "训练营打卡",
      description: activeCamp 
        ? `${activeCamp.camp_name} · 第${activeCamp.current_day}天`
        : "加入21天训练营",
      route: activeCamp ? "/camp-checkin" : "/camp-intro",
      gradient: "from-orange-500 to-red-500",
      completed: todayCheckedIn
    },
    {
      icon: Target,
      title: "我的目标",
      description: activeGoals && activeGoals.length > 0
        ? `${activeGoals.length}个活跃目标`
        : "设置情绪目标",
      route: "/goals",
      gradient: "from-teal-500 to-emerald-500",
      completed: false
    },
    {
      icon: BookOpen,
      title: "今日课程",
      description: "查看推荐学习内容",
      route: "/courses",
      gradient: "from-blue-500 to-cyan-500",
      completed: false
    }
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-background to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Zap className="w-6 h-6 text-primary" />
          今日快捷入口
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-center gap-3 hover:border-transparent hover:shadow-lg transition-all duration-300 group relative overflow-hidden ${
                  action.completed ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => navigate(action.route)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} text-white flex items-center justify-center group-hover:scale-110 transition-transform relative z-10`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="text-center space-y-1 relative z-10">
                  <div className="font-semibold text-sm flex items-center gap-2 justify-center">
                    {action.title}
                    {action.completed && (
                      <Sparkles className="w-3 h-3 text-primary" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
