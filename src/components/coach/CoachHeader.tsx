import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, RotateCcw, Target, ChevronDown, Sparkles, 
  History, ShoppingBag, LogOut, User, Wallet, Clock, 
  Bell, Tent, Users, Volume2 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SmartNotificationCenter } from "@/components/SmartNotificationCenter";

interface CoachHeaderProps {
  emoji: string;
  primaryColor: string;
  historyRoute: string;
  historyLabel: string;
  hasMessages: boolean;
  onRestart: () => void;
  onSignOut: () => void;
  showNotificationCenter?: boolean;
}

export const CoachHeader = ({
  emoji,
  primaryColor,
  historyRoute,
  historyLabel,
  hasMessages,
  onRestart,
  onSignOut,
  showNotificationCenter = true
}: CoachHeaderProps) => {
  const navigate = useNavigate();

  const getGradientClass = (color: string) => {
    const gradients: Record<string, string> = {
      green: "from-primary via-emerald-500 to-teal-500",
      blue: "from-blue-500 via-indigo-500 to-violet-500",
      purple: "from-purple-500 via-pink-500 to-rose-500",
      orange: "from-orange-500 via-amber-500 to-yellow-500"
    };
    return gradients[color] || gradients.green;
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 md:h-9 px-2">
                  <Menu className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-card border shadow-lg z-50">
                <DropdownMenuItem onClick={() => navigate("/settings?tab=profile")}>
                  <User className="w-4 h-4 mr-2" />
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings?tab=account")}>
                  <Wallet className="w-4 h-4 mr-2" />
                  账户
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings?tab=reminders")}>
                  <Clock className="w-4 h-4 mr-2" />
                  提醒设置
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings?tab=notifications")}>
                  <Bell className="w-4 h-4 mr-2" />
                  通知偏好
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings?tab=camp")}>
                  <Tent className="w-4 h-4 mr-2" />
                  训练营
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings?tab=companion")}>
                  <Users className="w-4 h-4 mr-2" />
                  情绪伙伴
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings?tab=voice")}>
                  <Volume2 className="w-4 h-4 mr-2" />
                  语音设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/packages")}>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  全部产品
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/partner")}>
                  <Users className="w-4 h-4 mr-2" />
                  合伙人中心
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className={`gap-1.5 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-${primaryColor}-500 hover:text-${primaryColor}-500 hover:bg-${primaryColor}-500/10 transition-colors font-medium`}
              >
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>返回主页</span>
              </Button>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Coach Space Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">教练空间</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border shadow-lg z-50">
                <DropdownMenuItem onClick={() => navigate("/")} className="gap-2">
                  <span className="text-green-500">💚</span>
                  <div className="flex flex-col">
                    <span className="font-medium">情绪教练</span>
                    <span className="text-xs text-muted-foreground">日常情绪觉察</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/parent-coach")} className="gap-2">
                  <span className="text-purple-500">💜</span>
                  <div className="flex flex-col">
                    <span className="font-medium">亲子教练</span>
                    <span className="text-xs text-muted-foreground">亲子情绪沟通</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/communication-coach")} className="gap-2">
                  <span className="text-blue-500">💙</span>
                  <div className="flex flex-col">
                    <span className="font-medium">沟通教练</span>
                    <span className="text-xs text-muted-foreground">温暖表达影响</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/ai-coach")} className="gap-2">
                  <span className="text-indigo-500">✨</span>
                  <div className="flex flex-col">
                    <span className="font-medium">生活教练</span>
                    <span className="text-xs text-muted-foreground">四维健康分析</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/energy-studio#coach")} className="gap-2 text-primary">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">查看全部教练</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Energy Studio */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/energy-studio")}
              className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 text-primary hover:text-primary hover:bg-primary/10"
            >
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline font-medium">有劲生活馆</span>
              <span className="sm:hidden font-medium">生活馆</span>
            </Button>

            {/* History Button */}
            <Button
              size="sm"
              onClick={() => navigate(historyRoute)}
              className={`gap-1.5 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 bg-gradient-to-r ${getGradientClass(primaryColor)} text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold border-0`}
            >
              <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline font-medium">{historyLabel}</span>
              <span className="sm:hidden font-medium">日记</span>
            </Button>

            {/* Packages */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/packages")}
              className="h-8 md:h-9 w-8 md:w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <ShoppingBag className="w-4 h-4" />
            </Button>

            {/* Notification Center */}
            {showNotificationCenter && <SmartNotificationCenter />}
          </div>
        </div>
      </div>
    </header>
  );
};
