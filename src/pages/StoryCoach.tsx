import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StoryCreationFlow from "@/components/coach/StoryCreationFlow";
import CommunityWaterfall from "@/components/community/CommunityWaterfall";
import { SmartNotificationCenter } from "@/components/SmartNotificationCenter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Menu, RotateCcw, History, LogOut, Sparkles, ChevronDown, 
  Send, User, Wallet, Clock, Tent, Users, Target, ShoppingBag, BookOpen, Bell
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const HERO_JOURNEY_STAGES = [
  {
    id: 1,
    icon: "🌪️",
    title: "问题",
    subtitle: "The Problem",
    description: "故事的开始，遇到的挑战或困境"
  },
  {
    id: 2,
    icon: "💡",
    title: "转折",
    subtitle: "The Turning",
    description: "关键时刻，新的思考与选择"
  },
  {
    id: 3,
    icon: "🌱",
    title: "成长",
    subtitle: "The Growth",
    description: "经历之后，对自己的新认识"
  },
  {
    id: 4,
    icon: "✨",
    title: "反思",
    subtitle: "The Reflection",
    description: "总结收获，对未来的展望"
  }
];

export default function StoryCoach() {
  const navigate = useNavigate();
  const [showCreation, setShowCreation] = useState(false);
  const [input, setInput] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleComplete = async (data: { title: string; story: string; emotionTag?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("请先登录");
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          title: data.title,
          content: data.story,
          post_type: 'story',
          emotion_theme: data.emotionTag,
          visibility: 'public'
        });

      if (error) throw error;

      toast.success("故事已保存！");
      setShowCreation(false);
      navigate("/community");
    } catch (error) {
      console.error('Error saving story:', error);
      toast.error("保存失败，请重试");
    }
  };

  const handleRestart = () => {
    setShowCreation(false);
    setInput("");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleQuickStart = () => {
    if (input.trim()) {
      // TODO: Use the input as initial story prompt
      setShowCreation(true);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left side - Menu & Back to home */}
            <div className="flex items-center gap-2">
              {/* Hamburger Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 md:h-9 px-2"
                  >
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
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {showCreation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-primary hover:text-primary hover:bg-primary/10 transition-colors font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>返回主页</span>
                </Button>
              )}
            </div>

            {/* Right side - Main navigation */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* 教练空间快速切换 */}
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
                <DropdownMenuContent align="end" className="w-52 bg-card border shadow-lg z-50">
                  <DropdownMenuItem
                    onClick={() => navigate("/coach/vibrant_life_sage")}
                    className="gap-2"
                  >
                    <span className="text-rose-500">❤️</span>
                    <div className="flex flex-col">
                      <span className="font-medium">有劲生活教练</span>
                      <span className="text-xs text-muted-foreground">温暖陪伴点亮心灯</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/")}
                    className="gap-2"
                  >
                    <span className="text-blue-500">💙</span>
                    <div className="flex flex-col">
                      <span className="font-medium">情绪教练</span>
                      <span className="text-xs text-muted-foreground">日常情绪觉察</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/parent-coach")}
                    className="gap-2"
                  >
                    <span className="text-purple-500">💜</span>
                    <div className="flex flex-col">
                      <span className="font-medium">亲子教练</span>
                      <span className="text-xs text-muted-foreground">亲子情绪沟通</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/communication-coach")}
                    className="gap-2"
                  >
                    <span className="text-blue-500">💙</span>
                    <div className="flex flex-col">
                      <span className="font-medium">沟通教练</span>
                      <span className="text-xs text-muted-foreground">温暖表达影响</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/story-coach")}
                    className="gap-2"
                  >
                    <span className="text-orange-500">📖</span>
                    <div className="flex flex-col">
                      <span className="font-medium">故事教练</span>
                      <span className="text-xs text-muted-foreground">英雄之旅创作</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate("/energy-studio#coach")}
                    className="gap-2 text-primary"
                  >
                    <Target className="w-4 h-4" />
                    <span className="font-medium">查看全部教练</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/energy-studio")}
                className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline font-medium">有劲生活馆</span>
                <span className="sm:hidden font-medium">生活馆</span>
              </Button>

              <Button
                size="sm"
                onClick={() => navigate("/my-stories")}
                className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold border-0"
              >
                <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline font-medium">我的故事</span>
                <span className="sm:hidden font-medium">故事</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/packages")}
                className="h-8 md:h-9 w-8 md:w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <ShoppingBag className="w-4 h-4" />
              </Button>

              <SmartNotificationCenter />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-xl mx-auto px-3 md:px-4 flex flex-col overflow-y-auto pb-32">
        {!showCreation ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-8 px-3 md:px-4">
            <div className="text-center space-y-3 md:space-y-4 w-full max-w-xl animate-in fade-in-50 duration-700">
              {/* Title Section */}
              <div className="space-y-1.5 md:space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  说好故事教练
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  用英雄之旅的方法，把你的经历变成动人的成长故事
                </p>
              </div>

              {/* Hero Journey - 2x2 Collapsible Cards */}
              <div className="bg-card border border-border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
                <div className="mb-card-gap flex items-center justify-between">
                  <h3 className="font-medium text-foreground flex items-center gap-1.5 text-sm">
                    <span className="text-orange-500 text-sm">📖</span>
                    英雄之旅四部曲
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/story-coach-intro")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    了解详情 →
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-card-gap">
                  {HERO_JOURNEY_STAGES.map((stage) => (
                    <Collapsible 
                      key={stage.id} 
                      open={expandedStep === stage.id} 
                      onOpenChange={() => setExpandedStep(expandedStep === stage.id ? null : stage.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="bg-background/50 rounded-card p-card-sm border border-border/50 hover:border-orange-300/50 transition-all duration-200 group cursor-pointer">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs group-hover:bg-orange-500 group-hover:text-white transition-all">
                              {stage.icon}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <h4 className="font-medium text-foreground text-sm truncate">
                                {stage.title}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">{stage.subtitle}</p>
                            </div>
                            <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expandedStep === stage.id ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1">
                        <div className="bg-background/30 rounded-card p-card-sm border border-border/30">
                          <p className="text-xs text-foreground leading-snug">
                            {stage.description}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>

              {/* Start Creating CTA Card */}
              <div className="w-full mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <div className="bg-card border border-border rounded-card-lg p-card-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    ✨ 开始创作你的故事
                  </h3>
                  <p className="text-sm text-muted-foreground mb-card">
                    把你的经历变成动人的成长故事
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setShowCreation(true)} 
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      开始创作
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/my-stories")}
                      className="flex-1"
                    >
                      我的故事广场
                    </Button>
                  </div>
                </div>
              </div>

              {/* Community Waterfall Preview */}
              <div className="w-full mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <CommunityWaterfall />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 py-4 md:py-6">
            <StoryCreationFlow onComplete={handleComplete} />
          </div>
        )}
      </main>

      {/* Fixed Footer Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-20">
        <div className="container max-w-xl mx-auto px-4 py-3">
          {/* Quick Action Buttons */}
          {!showCreation && (
            <div className="mb-3 flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCreation(true)}
                className="border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                📝 从头开始创作
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/history")}
                className="border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                📋 从情绪简报创作
              </Button>
            </div>
          )}
          
          {/* Input Area */}
          <div className="flex gap-2 items-end">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickStart();
                }
              }}
              placeholder="描述你想写的故事主题..."
              className="min-h-[60px] max-h-[160px] resize-none rounded-xl"
            />
            <Button
              size="icon"
              onClick={handleQuickStart}
              disabled={!input.trim()}
              className="h-10 w-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
