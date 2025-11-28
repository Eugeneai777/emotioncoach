import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ModuleCard } from "@/components/home/ModuleCard";
import { TodayQuickActions } from "@/components/home/TodayQuickActions";
import { Settings, LogOut, Sparkles } from "lucide-react";
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
      icon: "🤖",
      title: "AI 教练层",
      description: "个性化指导，智能分析，陪伴你的每一次成长",
      route: "/ai-coach",
      gradient: "from-purple-500 to-blue-500",
      stats: stats ? {
        label: "次对话",
        value: `${stats.conversations}+`
      } : undefined
    },
    {
      icon: "🛠️",
      title: "成长工具层",
      description: "16种实用工具，支持日常情绪管理和自我成长",
      route: "/energy-studio",
      gradient: "from-teal-500 to-emerald-500",
      stats: {
        label: "个工具",
        value: "16"
      }
    },
    {
      icon: "📚",
      title: "课程学习层",
      description: "系统化学习，基于情绪状态的个性化推荐",
      route: "/courses",
      gradient: "from-blue-500 to-cyan-500",
      stats: stats ? {
        label: "门课程",
        value: `${stats.courses}`
      } : undefined
    },
    {
      icon: "🎯",
      title: "行动训练层",
      description: "训练营与目标挑战，将知识转化为行动",
      route: "/camp-intro",
      gradient: "from-orange-500 to-red-500",
      stats: stats ? {
        label: "天打卡",
        value: `${stats.campDays}+`
      } : undefined
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 via-accent/10 to-warm/10 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
                有劲生活馆
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI 教练驱动的成长操作系统
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">设置</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-sm border-2 z-50">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  个人设置
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/user-profile")}>
                  <Sparkles className="w-4 h-4 mr-2" />
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
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12 space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Growth Operating System
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent leading-tight">
            欢迎回来，开启今日成长之旅
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            四大模块协同工作，AI 教练全程陪伴，助你实现持续成长
          </p>
        </section>

        {/* Today Quick Actions */}
        <section className="mb-12">
          <TodayQuickActions />
        </section>

        {/* Module Cards */}
        <section>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">探索四大成长模块</h3>
            <p className="text-muted-foreground">点击卡片进入对应模块</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module, index) => (
              <ModuleCard
                key={index}
                {...module}
                index={index}
              />
            ))}
          </div>
        </section>

        {/* System Introduction */}
        <section className="mt-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
            <span>Growth OS 系统说明</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
          </div>
          
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI教练层贯穿所有模块，提供智能指导；成长工具层提供日常实践支持；
            课程学习层提供系统化知识；行动训练层通过训练营和目标管理，
            帮助你将知识转化为持续的行动习惯。
          </p>
        </section>
      </main>
    </div>
  );
};

export default Home;
