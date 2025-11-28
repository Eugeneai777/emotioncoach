import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ModuleCard } from "@/components/home/ModuleCard";
import { Settings, LogOut, User, Brain, Wrench, BookOpen, Target } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // 查询统计数据
  const { data: stats } = useQuery({
    queryKey: ['home-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // 获取总对话数
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 获取活跃目标数
      const { count: activeGoalsCount } = await supabase
        .from('emotion_goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // 获取活跃训练营
      const { data: activeCamps } = await supabase
        .from('training_camps')
        .select('completed_days')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const totalCompletedDays = activeCamps?.reduce((sum, camp) => sum + (camp.completed_days || 0), 0) || 0;

      // 获取课程数量（系统总数）
      const { count: coursesCount } = await supabase
        .from('video_courses')
        .select('*', { count: 'exact', head: true });

      return {
        conversations: conversationsCount || 0,
        activeGoals: activeGoalsCount || 0,
        campDays: totalCompletedDays,
        courses: coursesCount || 358
      };
    },
    enabled: !!user
  });

  const modules = [
    {
      icon: Brain,
      title: "教练空间",
      description: "AI 教练陪伴，个性化指导与智能分析",
      route: "/ai-coach",
      color: "chart-1",
      stats: stats ? {
        label: "次对话",
        value: `${stats.conversations}`
      } : undefined
    },
    {
      icon: Wrench,
      title: "成长工具",
      description: "16 种实用工具，支持日常情绪管理",
      route: "/energy-studio",
      color: "chart-2",
      stats: {
        label: "个工具",
        value: "16"
      }
    },
    {
      icon: BookOpen,
      title: "课程学习",
      description: "系统化课程，基于情绪状态智能推荐",
      route: "/courses",
      color: "chart-3",
      stats: stats ? {
        label: "门课程",
        value: `${stats.courses}`
      } : undefined
    },
    {
      icon: Target,
      title: "训练营",
      description: "21 天情绪日记训练营，知识转化行动",
      route: "/camp-intro",
      color: "chart-4",
      stats: stats ? {
        label: "天打卡",
        value: `${stats.campDays}`
      } : undefined
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              有劲生活馆
            </h1>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  个人设置
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/user-profile")}>
                  <User className="w-4 h-4 mr-2" />
                  我的资料
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-12 space-y-2 animate-fade-in">
          <h2 className="text-4xl font-bold text-foreground">
            欢迎回来
          </h2>
          <p className="text-muted-foreground">
            选择一个模块开始今日成长
          </p>
        </section>

        {/* Module Cards */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {modules.map((module, index) => (
              <ModuleCard
                key={index}
                {...module}
                index={index}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
