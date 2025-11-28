import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ModuleBanner } from "@/components/home/ModuleBanner";
import { Settings, LogOut, User, Brain, Wrench, BookOpen, Target, BookOpenText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Home = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const modules = [
    {
      icon: Brain,
      title: "教练空间",
      description: "随时有人带你看清问题",
      route: "/ai-coach",
      gradientStart: "var(--gradient-blue-start)",
      gradientEnd: "var(--gradient-blue-end)"
    },
    {
      icon: Wrench,
      title: "成长工具",
      description: "让成长变得\"做得到\"",
      route: "/energy-studio",
      gradientStart: "var(--gradient-orange-start)",
      gradientEnd: "var(--gradient-orange-end)"
    },
    {
      icon: BookOpen,
      title: "课程学习",
      description: "只学当下最有用的",
      route: "/courses",
      gradientStart: "var(--gradient-green-start)",
      gradientEnd: "var(--gradient-green-end)"
    },
    {
      icon: Target,
      title: "训练营",
      description: "从习惯到突破，让改变真的发生",
      route: "/camp-intro",
      gradientStart: "var(--gradient-purple-start)",
      gradientEnd: "var(--gradient-purple-end)"
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--warm-bg))" }}>
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Centered title section */}
            <div className="flex-1 text-center">
              <h1 
                className="text-3xl font-bold mb-1"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--gradient-purple-start)), hsl(var(--gradient-purple-end)))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                有劲生活馆
              </h1>
              <p className="text-sm text-muted-foreground">
                探索更好的自己 · 享受有劲生活
              </p>
            </div>
            
            {/* Right buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/user-manual")}
              >
                <BookOpenText className="w-4 h-4 mr-2" />
                使用指南
              </Button>
              
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {modules.map((module, index) => (
            <ModuleBanner
              key={index}
              {...module}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
