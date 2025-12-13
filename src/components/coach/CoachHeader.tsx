import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles, History, ShoppingBag, Menu, RotateCcw, Target } from "lucide-react";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SmartNotificationCenter } from "@/components/SmartNotificationCenter";
import { hamburgerMenuItems } from "@/config/hamburgerMenuConfig";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
interface CoachHeaderProps {
  emoji: string;
  primaryColor: string;
  historyRoute?: string;
  historyLabel?: string;
  historyLabelShort?: string;
  hasMessages: boolean;
  onRestart: () => void;
  onSignOut: () => void;
  showNotificationCenter?: boolean;
  currentCoachKey?: string;
}

export const CoachHeader = ({
  emoji,
  primaryColor,
  historyRoute,
  historyLabel,
  historyLabelShort,
  hasMessages,
  onRestart,
  onSignOut,
  showNotificationCenter = true,
  currentCoachKey
}: CoachHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: coaches } = useActiveCoachTemplates();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdminRole();
  }, [user]);

  const filteredMenuItems = hamburgerMenuItems.filter(item => {
    if (item.requireAdmin && !isAdmin) return false;
    return true;
  });

  const isActiveRoute = (path: string) => {
    if (!path) return false;
    const [pathname, search] = path.split('?');
    if (location.pathname !== pathname) return false;
    if (search) {
      return location.search.includes(search);
    }
    return true;
  };

  const getGradientClass = (color: string) => {
    const gradients: Record<string, string> = {
      green: "from-primary via-emerald-500 to-teal-500",
      blue: "from-blue-500 via-indigo-500 to-violet-500",
      purple: "from-purple-500 via-pink-500 to-rose-500",
      orange: "from-orange-500 via-amber-500 to-yellow-500",
      pink: "from-pink-400 via-pink-500 to-rose-500",
      rose: "from-rose-400 via-rose-500 to-pink-500"
    };
    return gradients[color] || gradients.green;
  };

  const getRestartButtonClass = (color: string) => {
    const classes: Record<string, string> = {
      green: "text-primary hover:text-primary hover:bg-primary/10",
      blue: "text-blue-600 hover:text-blue-600 hover:bg-blue-100",
      purple: "text-purple-600 hover:text-purple-600 hover:bg-purple-100",
      orange: "text-orange-600 hover:text-orange-600 hover:bg-orange-100",
      pink: "text-pink-600 hover:text-pink-600 hover:bg-pink-100",
      rose: "text-rose-600 hover:text-rose-600 hover:bg-rose-100"
    };
    return classes[color] || classes.green;
  };

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10">
      <div className="container max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-2 md:px-4 py-2 md:py-3">
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
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-card border shadow-lg z-50">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => item.path ? navigate(item.path) : onSignOut()}
                      className={cn(
                        "cursor-pointer hover:bg-accent",
                        item.danger && "text-destructive",
                        isActiveRoute(item.path) && "bg-accent font-medium"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Restart/Back Button - Only show when has messages */}
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestart}
                className={`gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 active:scale-95 transition-all font-medium ${getRestartButtonClass(primaryColor)}`}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">返回主页</span>
              </Button>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Coach Space Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Target className="w-4 h-4" />
              <span className="hidden sm:inline">教练空间</span>
              <span className="sm:hidden">教练</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border shadow-lg z-50">
              {coaches?.map((coach) => (
                  <DropdownMenuItem
                    key={coach.id}
                    onClick={() => navigate(coach.page_route)}
                    className={`gap-2 cursor-pointer hover:bg-accent ${currentCoachKey === coach.coach_key ? 'bg-muted' : ''}`}
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
              className="gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">有劲生活馆</span>
              <span className="sm:hidden font-medium">生活馆</span>
            </Button>

            {/* History/Diary Button */}
            {historyRoute && (
              <Button
                size="sm"
                onClick={() => navigate(historyRoute)}
                className={`gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 bg-gradient-to-r ${getGradientClass(primaryColor)} text-white shadow-md hover:shadow-lg active:scale-95 transition-all font-semibold border-0`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">{historyLabel}</span>
                {historyLabelShort && <span className="sm:hidden font-medium">{historyLabelShort}</span>}
              </Button>
            )}

            {/* Packages - hide on mobile */}
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
