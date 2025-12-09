import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, Sparkles, 
  History, ShoppingBag, LogOut, User, Settings
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  historyRoute?: string;
  historyLabel?: string;
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

  const coachesQuery = useQuery({
    queryKey: ["coach-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_templates")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });

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
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10">
      <div className="container max-w-xl mx-auto px-2 md:px-4 py-2 md:py-3">
        <div className="flex items-center justify-between gap-2">
        {/* Left side */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Hamburger menu dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 min-h-[44px] min-w-[44px]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background/95 backdrop-blur-sm border-border/50">
              <DropdownMenuItem onClick={() => navigate("/user-profile")} className="cursor-pointer hover:bg-accent">
                <User className="mr-2 h-4 w-4" />
                <span>个人资料</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer hover:bg-accent">
                <Settings className="mr-2 h-4 w-4" />
                <span>账户设置</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={() => navigate("/calendar")} className="cursor-pointer hover:bg-accent">
                <span>📅 情绪日历</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/goals")} className="cursor-pointer hover:bg-accent">
                <span>🎯 情绪目标</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/tag-stats")} className="cursor-pointer hover:bg-accent">
                <span>📊 标签统计</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/community")} className="cursor-pointer hover:bg-accent">
                <span>🌸 情绪社区</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/user-manual")} className="cursor-pointer hover:bg-accent">
                <span>📖 使用手册</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={onSignOut} className="cursor-pointer hover:bg-accent text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Coach Space Dropdown - 移动端只显示图标 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <span className="w-4 h-4 flex items-center justify-center text-sm">◎</span>
                <span className="hidden md:inline">教练空间</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-card border shadow-lg z-50">
              {coachesQuery.data?.map((coach) => (
                <DropdownMenuItem
                  key={coach.id}
                  onClick={() => navigate(coach.page_route)}
                  className="gap-2 cursor-pointer hover:bg-accent"
                >
                  <span>{coach.emoji}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{coach.title}</span>
                    {coach.subtitle && (
                      <span className="text-xs text-muted-foreground">{coach.subtitle}</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={() => navigate("/energy-studio#coach")}
                className="gap-2 text-primary cursor-pointer hover:bg-accent"
              >
                <span className="w-4 h-4 flex items-center justify-center text-sm">◎</span>
                <span className="font-medium">查看全部教练</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Energy Studio - 移动端只显示图标 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/energy-studio")}
              className="gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline font-medium">有劲生活馆</span>
            </Button>

            {/* History/Diary Button */}
            {historyRoute && (
              <Button
                size="sm"
                onClick={() => navigate(historyRoute)}
                className={`gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 bg-gradient-to-r ${getGradientClass(primaryColor)} text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 font-semibold border-0`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">{historyLabel}</span>
              </Button>
            )}

            {/* Packages - 合并到更多菜单，移动端隐藏 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/packages")}
              className="hidden sm:flex h-10 min-h-[44px] w-10 min-w-[44px] p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
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
