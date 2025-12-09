import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/ChatMessage";
import { useParentCoach } from "@/hooks/useParentCoach";
import { CoachScenarioChips } from "@/components/coach/CoachScenarioChips";
import { ParentStageProgress } from "@/components/coach/ParentStageProgress";
import { useAuth } from "@/hooks/useAuth";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { ParentJourneySummary } from "@/components/coach/ParentJourneySummary";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { NotificationCard } from "@/components/NotificationCard";
import CommunityWaterfall from "@/components/community/CommunityWaterfall";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import BriefingShareDialog from "@/components/briefing/BriefingShareDialog";
import { 
  Send, 
  RotateCcw, 
  History, 
  LogOut, 
  Loader2, 
  Settings, 
  Sparkles, 
  ChevronDown, 
  Bell, 
  Video, 
  Menu, 
  User, 
  Wallet, 
  Clock, 
  Tent, 
  Users, 
  Volume2,
  Heart,
  Target,
  ShoppingBag,
  BookHeart
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SmartNotificationCenter } from "@/components/SmartNotificationCenter";

const parentStages = [
  { 
    id: 1, 
    name: "觉察", 
    subtitle: "Feel it", 
    description: "从情绪被动 → 情绪被看见" 
  },
  { 
    id: 2, 
    name: "看见", 
    subtitle: "See it", 
    description: "从怪孩子 → 看见我和孩子都在卡点里" 
  },
  { 
    id: 3, 
    name: "反应", 
    subtitle: "Sense it", 
    description: "从自动反应 → 有选择的反应" 
  },
  { 
    id: 4, 
    name: "转化", 
    subtitle: "Transform it", 
    description: "从情绪拉扯 → 关系松动，开始出现新的可能" 
  }
];

export default function ParentCoach() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campId = searchParams.get('campId');
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  
  const {
    session,
    messages,
    isLoading,
    isCreating,
    videoRecommendations,
    createSession,
    sendMessage,
    addAssistantMessage,
    fetchRecommendations,
    resetRecommendations
  } = useParentCoach();

  const [input, setInput] = useState("");
  const [briefing, setBriefing] = useState<any>(null);
  const [pendingBriefing, setPendingBriefing] = useState<any>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [isStepsCardExpanded, setIsStepsCardExpanded] = useState(true);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // 首次访问展开，再次访问折叠
  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_parent_steps_card');
    if (hasSeen) {
      setIsStepsCardExpanded(false);
    } else {
      localStorage.setItem('has_seen_parent_steps_card', 'true');
    }
  }, []);

  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();

  // 从数据库加载教练配置
  const { data: coachConfig } = useCoachTemplate('parent');

  // 获取家长训练营模板
  const { data: parentCampTemplate } = useQuery({
    queryKey: ['camp-template', 'parent_emotion_21'],
    queryFn: async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('camp_type', 'parent_emotion_21')
        .single();
      return data;
    }
  });

  // 查询用户是否已有家长训练营
  const { data: existingParentCamp } = useQuery({
    queryKey: ['existing-parent-camp', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('training_camps')
        .select('id, camp_name, current_day')
        .eq('user_id', user.id)
        .eq('camp_type', 'parent_emotion_21')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  const hasJoinedParentCamp = !!existingParentCamp;

  const { 
    notifications, 
    loading: notificationsLoading,
    markAsRead, 
    deleteNotification 
  } = useSmartNotification('parent_coach');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const initSession = async () => {
      // Prevent duplicate calls
      if (initRef.current || session || isCreating) {
        return;
      }
      
      if (user) {
        initRef.current = true;
        await createSession(campId || undefined);
      }
    };
    
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session, isCreating]);


  const formatBriefingMessage = (briefing: any): string => {
    return `🌿 《亲子情绪四部曲简报》

🎭 今日主题情绪
${briefing.emotion_theme}

📖 情绪四部曲旅程

1️⃣ 觉察（Feel it）
${briefing.stage_1_content || '暂无记录'}

2️⃣ 看见（See it）
${briefing.stage_2_content || '暂无记录'}

3️⃣ 反应（Sense it）
${briefing.stage_3_content || '暂无记录'}

4️⃣ 转化（Transform it）
${briefing.stage_4_content || '暂无记录'}

💡 今日洞察
${briefing.insight || '暂无记录'}

✅ 今日行动
${briefing.action || '暂无记录'}

🌸 1mm的松动
${briefing.growth_story || '暂无记录'}

💾 简报已自动保存到你的亲子日记中`;
  };

  const handleSendMessage = async (message: string) => {
    const response = await sendMessage(message);
    
    if (response?.completed && response?.briefingId) {
      // Don't show summary immediately, store the briefing data
      setPendingBriefing(response.toolCall?.args);
    }
  };

  const handleGenerateBriefing = async () => {
    if (pendingBriefing) {
      const briefingMessage = formatBriefingMessage(pendingBriefing);
      addAssistantMessage(briefingMessage);
      setBriefing(pendingBriefing);
      
      // 获取课程推荐
      await fetchRecommendations(pendingBriefing);
      
      setPendingBriefing(null);
      toast({
        title: "简报已生成",
        description: "已保存到你的亲子日记中"
      });
    }
  };


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await handleSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRestart = () => {
    setBriefing(null);
    setPendingBriefing(null);
    resetRecommendations();
    initRef.current = false;
    createSession(campId || undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleShare = () => {
    if (briefing) {
      setShareDialogOpen(true);
    } else {
      toast({
        title: "暂无简报",
        description: "请先完成对话生成简报后再分享"
      });
    }
  };

  const handleDownload = () => {
    toast({
      title: "导出功能开发中",
      description: "即将支持导出简报为图片"
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/80 via-pink-50/50 to-rose-50/30 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-rose-950/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/80 via-pink-50/50 to-rose-50/30 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-rose-950/10 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container max-w-xl mx-auto px-2 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left side - Menu, Coach Space & Back to home */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Hamburger Menu */}
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
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>


              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 text-purple-600 hover:text-purple-600 hover:bg-purple-100 active:scale-95 transition-all font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">返回主页</span>
                </Button>
              )}
            </div>

            {/* Right side - Main navigation */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* 教练空间 - 移动端只显示图标 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Target className="w-4 h-4" />
                    <span className="hidden md:inline">教练空间</span>
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
                    <span className="text-green-500">💚</span>
                    <div className="flex flex-col">
                      <span className="font-medium">情绪教练</span>
                      <span className="text-xs text-muted-foreground">日常情绪觉察</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/parent-coach")}
                    className="gap-2 bg-muted"
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

              {/* 有劲生活馆 - 移动端只显示图标 */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/energy-studio")}
                className="gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline font-medium">有劲生活馆</span>
              </Button>

              {/* 我的亲子日记 - 主CTA */}
              <Button
                size="sm"
                onClick={() => navigate("/parent-diary")}
                className="gap-1 text-xs md:text-sm h-10 min-h-[44px] px-2 md:px-3 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-md hover:shadow-lg active:scale-95 transition-all font-semibold border-0"
              >
                <BookHeart className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">亲子日记</span>
              </Button>

              {/* 全部产品 - 移动端隐藏 */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/packages")}
                className="hidden sm:flex h-10 min-h-[44px] w-10 min-w-[44px] p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <ShoppingBag className="w-4 h-4" />
              </Button>

              {/* 通知中心 */}
              <SmartNotificationCenter />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-xl mx-auto px-3 md:px-4 flex flex-col overflow-y-auto overscroll-none scroll-container pb-44">
        {/* Stage Progress - Show when there are messages */}
        {messages.length > 0 && session && (
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-3 -mx-3 px-3 md:-mx-4 md:px-4 mb-4">
            <ParentStageProgress currentStage={session.current_stage || 0} />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-8 px-3 md:px-4">
            <div className="text-center space-y-3 md:space-y-4 w-full max-w-xl animate-in fade-in-50 duration-700">
              <div className="space-y-1.5 md:space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">家长情绪教练</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  劲老师陪着你，用四部曲化解亲子情绪困扰
                </p>
              </div>

              {/* 亲子情绪四部曲 - 可折叠 */}
              <Collapsible open={isStepsCardExpanded} onOpenChange={setIsStepsCardExpanded}>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between cursor-pointer">
                      <h3 className="font-medium text-foreground flex items-center gap-1.5 text-sm">
                        <span className="text-purple-600 text-sm">💜</span>
                        亲子情绪四部曲
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/parent-camp");
                          }}
                          className="text-xs text-purple-600 hover:text-purple-700 p-0 h-auto"
                        >
                          了解更多 →
                        </Button>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isStepsCardExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-card-gap mt-card-gap">
                      {parentStages.map((stage) => (
                        <Collapsible 
                          key={stage.id}
                          open={expandedStep === stage.id} 
                          onOpenChange={() => setExpandedStep(expandedStep === stage.id ? null : stage.id)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="bg-white/70 rounded-card p-card-sm border border-purple-200/50 hover:border-purple-400/50 transition-all duration-200 group cursor-pointer">
                              <div className="flex items-center gap-1.5">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold text-xs group-hover:bg-purple-500 group-hover:text-white transition-all">
                                  {stage.id}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <h4 className="font-medium text-foreground text-sm truncate">
                                    {stage.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">{stage.subtitle}</p>
                                </div>
                                <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expandedStep === stage.id ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-1">
                            <div className="bg-white/50 rounded-card p-card-sm border border-purple-200/30 space-y-1">
                              <p className="text-xs text-foreground leading-snug">
                                {stage.description}
                              </p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* 家长情绪训练营 */}
              <div className="w-full mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-card-lg p-card-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-card-gap">
                    <h3 className="text-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      🏕️ 21天青少年困境突破营
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-card">
                    通过父母三力模型（稳定力、洞察力、修复力），21天系统提升亲子关系
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (hasJoinedParentCamp && existingParentCamp) {
                          navigate(`/camp/${existingParentCamp.id}`);
                        } else {
                          setShowStartDialog(true);
                        }
                      }} 
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {hasJoinedParentCamp ? '进入训练营' : '加入训练营'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/parent-camp")}
                      className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      了解详情
                    </Button>
                  </div>
                </div>
              </div>

              {/* 智能提醒模块 - 紫色主题 */}
              {(() => {
                const unreadNotifications = notifications.filter(n => !n.is_read);
                
                if (notificationsLoading || unreadNotifications.length === 0) {
                  return null;
                }
                
                const safeIndex = Math.min(currentNotificationIndex, Math.max(0, unreadNotifications.length - 1));
                
                return (
                  <div className="w-full mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-card-lg p-card shadow-md animate-in fade-in-50 duration-300">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
                        <Bell className="h-4 w-4 text-purple-600" />
                        <span className="text-purple-700">智能提醒</span>
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">家长教练</span>
                      </h4>
                      
                      <div className="space-y-3">
                        <NotificationCard
                          key={unreadNotifications[safeIndex].id}
                          notification={unreadNotifications[safeIndex]}
                          onClick={() => {
                            markAsRead(unreadNotifications[safeIndex].id);
                            if (safeIndex >= unreadNotifications.length - 1) {
                              setCurrentNotificationIndex(0);
                            }
                          }}
                          onDelete={() => {
                            deleteNotification(unreadNotifications[safeIndex].id);
                            if (safeIndex >= unreadNotifications.length - 1) {
                              setCurrentNotificationIndex(0);
                            }
                          }}
                          colorTheme="purple"
                        />
                        
                        {unreadNotifications.length > 1 && (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-purple-600/70">
                              {safeIndex + 1} / {unreadNotifications.length}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentNotificationIndex((prev) => (prev + 1) % unreadNotifications.length)}
                              className="h-7 text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                            >
                              下一条
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 有劲社区 - 瀑布流展示 */}
              <div className="w-full mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <CommunityWaterfall />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 py-4 md:py-6 space-y-3 md:space-y-4">
            {messages.map((message, index) => (
              <ChatMessage 
                key={index}
                role={message.role as "user" | "assistant"} 
                content={message.content}
                onOptionClick={(option) => {
                  handleSendMessage(option);
                }}
                videoRecommendations={videoRecommendations}
                isLastMessage={index === messages.length - 1}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card rounded-card-lg p-card shadow-sm">
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-purple-500" />
                </div>
              </div>
            )}
            
            {/* Briefing confirmation prompt */}
            {pendingBriefing && !isLoading && (
              <div className="flex justify-start animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-card-lg p-card shadow-lg max-w-[85%]">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-2">
                          你今天太棒了！🎉
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          完成了一次完整的情绪觉察之旅，亲子关系又松动了1mm。要不要生成简报，记录今天的成长？
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 opacity-75">
                          简报将直接显示在对话中
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleGenerateBriefing}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        生成简报
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 训练营推广卡片 - 在简报生成后显示 */}
            {briefing && !pendingBriefing && videoRecommendations.length > 0 && (
              <div className="flex justify-start animate-in fade-in-50 slide-in-from-bottom-4 duration-500 mt-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-card-lg p-card shadow-lg max-w-[85%]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏕️</span>
                      <h4 className="font-semibold text-purple-700">推荐：21天青少年困境突破营</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      通过父母三力模型（稳定力、洞察力、修复力），21天系统提升亲子关系
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (hasJoinedParentCamp && existingParentCamp) {
                            navigate(`/camp/${existingParentCamp.id}`);
                          } else {
                            setShowStartDialog(true);
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        size="sm"
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        {hasJoinedParentCamp ? '进入训练营' : '加入训练营'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/parent-camp")}
                        size="sm"
                        className="border-purple-300 text-purple-600"
                      >
                        了解详情
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* 训练营加入对话框 - 放在外面确保始终可用 */}
        {parentCampTemplate && (
          <StartCampDialog 
            open={showStartDialog}
            onOpenChange={setShowStartDialog}
            campTemplate={parentCampTemplate}
            onSuccess={(campId) => navigate(`/camp/${campId}`)}
          />
        )}

        {/* 简报分享对话框 */}
        {briefing && (
          <BriefingShareDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            coachType="parent"
            briefingId={briefing.id || session?.id || ''}
            emotionTheme={briefing.theme}
            insight={briefing.insight}
            action={briefing.action}
            growthStory={briefing.growthStory}
          />
        )}
      </main>

      {/* Footer - Fixed bottom input */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-20 safe-bottom">
        <div className="container max-w-xl mx-auto px-3 md:px-4 pt-2 pb-2">
            {messages.length === 0 && coachConfig?.enable_scenarios && coachConfig?.scenarios && (
              <div className="mb-2 animate-in slide-in-from-bottom-2 duration-300">
                <CoachScenarioChips
                  scenarios={coachConfig.scenarios as any[]}
                  onSelectScenario={async (prompt) => {
                    setInput("");
                    await handleSendMessage(prompt);
                  }}
                  primaryColor={coachConfig.primary_color}
                />
              </div>
            )}
            <div className="flex gap-2 items-end">
              {/* 新对话按钮 - 44px 触摸区域 */}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRestart}
                  disabled={isLoading}
                  title="开始新对话"
                  className="h-11 w-11 min-w-[44px] flex-shrink-0 rounded-full"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              
              <div className="flex-1 relative group">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="分享一件亲子互动中的小事..."
                  className="resize-none min-h-[44px] max-h-[100px] w-full py-2.5 px-3 text-base rounded-2xl leading-relaxed border-purple-200 focus:border-purple-400"
                  style={{ fontSize: '16px' }}
                  disabled={isLoading}
                  rows={1}
                  enterKeyHint="send"
                  inputMode="text"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-11 w-11 min-w-[44px] flex-shrink-0 rounded-full shadow-md bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </footer>
    </div>
  );
}
