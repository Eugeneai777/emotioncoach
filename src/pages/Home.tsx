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
      description: "随时有人带你看清问题",
      route: "/ai-coach",
      color: "chart-1"
    },
    {
      icon: Wrench,
      title: "成长工具",
      description: "让成长变得\"做得到\"",
      route: "/energy-studio",
      color: "chart-2"
    },
    {
      icon: BookOpen,
      title: "课程学习",
      description: "只学当下最有用的",
      route: "/courses",
      color: "chart-3"
    },
    {
      icon: Target,
      title: "训练营",
      description: "从习惯到突破，让改变真的发生",
      route: "/camp-intro",
      color: "chart-4"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                有劲生活馆
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                个人成长操作系统（Growth OS）
              </p>
            </div>
            
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
