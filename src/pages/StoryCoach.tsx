import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StoryCreationFlow from "@/components/coach/StoryCreationFlow";
import CommunityWaterfall from "@/components/community/CommunityWaterfall";
import { CoachHeader } from "@/components/coach/CoachHeader";
import PageHeader from "@/components/PageHeader";
import { CoachNotificationsModule } from "@/components/coach/CoachNotificationsModule";
import { supabase } from "@/integrations/supabase/client";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { toast } from "sonner";
import { Send, BookOpen, ChevronDown, RotateCcw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

  // Dynamic footer height measurement
  useEffect(() => {
    if (!footerRef.current) return;
    
    const measureHeight = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.getBoundingClientRect().height);
      }
    };

    measureHeight();
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(footerRef.current);

    return () => resizeObserver.disconnect();
  }, [showCreation]);

  const getContentPaddingBottom = useCallback(() => {
    if (footerHeight > 0) {
      return footerHeight + 24;
    }
    return isMobile ? 180 : 200;
  }, [footerHeight, isMobile]);
  
  // 智能通知
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
    deleteNotification,
    triggerNotification,
  } = useSmartNotification('story_coach');

  // 游客模式：允许浏览，不强制跳转到登录页

  const handleComplete = async (data: { title: string; story: string; emotionTag?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("请先登录");
        navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
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

      // 触发智能提醒
      triggerNotification('after_story', {
        title: data.title,
        emotionTag: data.emotionTag
      });

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
    // 清除微信 OpenID 缓存，防止账号切换后复用旧 OpenID
    localStorage.removeItem('cached_wechat_openid');
    sessionStorage.removeItem('cached_wechat_openid');
    localStorage.removeItem('cached_payment_openid');
    sessionStorage.removeItem('cached_payment_openid');
    localStorage.removeItem('cached_payment_openid_gzh');
    sessionStorage.removeItem('cached_payment_openid_gzh');
    localStorage.removeItem('cached_payment_openid_mp');
    sessionStorage.removeItem('cached_payment_openid_mp');
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleQuickStart = () => {
    if (input.trim()) {
      // TODO: Use the input as initial story prompt
      setShowCreation(true);
      setInput("");
    }
  };

  return (
    <>
      <DynamicOGMeta pageKey="storyCoach" />
      <div className="min-h-screen bg-background flex flex-col">
      {/* Header - 使用共享的 CoachHeader 组件 */}
      <PageHeader
        title="故事教练"
        showBack
        showHomeButton
        rightActions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/my-stories')}
              className="gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">故事广场</span>
            </Button>
            <CoachNotificationsModule 
              notifications={notifications}
              loading={notificationsLoading}
              currentIndex={currentNotificationIndex}
              onIndexChange={setCurrentNotificationIndex}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              colorTheme="pink"
              coachLabel="故事教练"
            />
          </div>
        }
      />

      {/* Main Content */}
      <main 
        className="flex-1 container max-w-xl mx-auto px-3 md:px-4 flex flex-col overflow-y-auto overscroll-none scroll-container"
        style={{ paddingBottom: `${getContentPaddingBottom()}px` }}
      >
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

              {/* Smart Notifications */}
              <CoachNotificationsModule
                notifications={notifications}
                loading={notificationsLoading}
                currentIndex={currentNotificationIndex}
                onIndexChange={setCurrentNotificationIndex}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                colorTheme="pink"
                coachLabel="故事教练"
              />

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
      <footer 
        ref={footerRef}
        className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-20 safe-bottom"
      >
        <div className="container max-w-xl mx-auto px-3 md:px-4 pt-1.5 pb-1.5">
          {/* Quick Action Buttons */}
          {!showCreation && (
            <div className="mb-2 flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCreation(true)}
                className="border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 min-h-[40px]"
              >
                📝 从头开始创作
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/history")}
                className="border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 min-h-[40px]"
              >
                📋 从情绪简报创作
              </Button>
            </div>
          )}
          
          {/* Input Area - 44px touch targets */}
          <div className="flex gap-2 items-end">
            {showCreation && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRestart}
                title="返回主页"
                className="h-11 w-11 min-w-[44px] flex-shrink-0 rounded-full"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            
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
              className="resize-none min-h-[44px] max-h-[100px] w-full py-2.5 px-3 text-base rounded-2xl leading-relaxed"
              style={{ fontSize: '16px' }}
              rows={1}
              enterKeyHint="send"
              inputMode="text"
            />
            <Button
              size="icon"
              onClick={handleQuickStart}
              disabled={!input.trim()}
              className="h-11 w-11 min-w-[44px] flex-shrink-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
