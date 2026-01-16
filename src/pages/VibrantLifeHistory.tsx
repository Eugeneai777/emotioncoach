import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Heart, MessageCircle, Sparkles, Users, BookOpen, Lightbulb, CheckCircle, Mail, Loader2 } from "lucide-react";
import { ServiceRecommendationCard } from "@/components/vibrantLife/ServiceRecommendationCard";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface VibrantLifeBriefing {
  id: string;
  user_issue_summary: string | null;
  summary: string | null;
  insight: string | null;
  action: string | null;
  recommended_coach_type: string | null;
  reasoning: string | null;
  conversation_id: string | null;
  created_at: string | null;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const coachTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  emotion: { label: "情绪教练", icon: Heart, color: "text-emerald-600" },
  parent: { label: "亲子教练", icon: Users, color: "text-purple-600" },
  communication: { label: "沟通教练", icon: MessageCircle, color: "text-blue-600" },
  story: { label: "故事教练", icon: BookOpen, color: "text-amber-600" },
  tool: { label: "成长工具", icon: Sparkles, color: "text-cyan-600" },
};

// 判断是否为微信临时邮箱
const isTempEmail = (email: string | null): boolean => {
  if (!email) return true;
  return email.includes('@temp.youjin365.com') || email.startsWith('wechat_');
};

const VibrantLifeHistory = () => {
  const navigate = useNavigate();
  const [selectedBriefing, setSelectedBriefing] = useState<VibrantLifeBriefing | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showNoEmailDialog, setShowNoEmailDialog] = useState(false);
  const { showTour, completeTour } = usePageTour('vibrant_life_history');

  const { data: briefings, isLoading } = useQuery({
    queryKey: ["vibrant-life-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const { data, error } = await supabase
        .from("vibrant_life_sage_briefings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VibrantLifeBriefing[];
    },
  });

  const handleCardClick = async (briefing: VibrantLifeBriefing) => {
    setSelectedBriefing(briefing);
    
    if (briefing.conversation_id) {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", briefing.conversation_id)
          .order("created_at", { ascending: true });

        if (!error && data) {
          setConversationMessages(data as Message[]);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    }
  };

  const getCoachConfig = (type: string | null) => {
    if (!type) return null;
    return coachTypeConfig[type] || null;
  };

  const handleSendEmail = async (briefingId: string) => {
    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-life-briefing-email", {
        body: { briefingId },
      });

      if (error) throw error;
      
      if (data?.error) {
        toast.error(data.error, {
          description: data.hint || undefined,
        });
        return;
      }

      toast.success("已发送到您的邮箱", {
        description: data.email ? `发送至 ${data.email}` : undefined,
      });
    } catch (err: any) {
      console.error("Send email error:", err);
      toast.error("发送失败", {
        description: err.message || "请稍后重试",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 发送邮件前检查邮箱
  const handleSendEmailClick = async (briefingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || isTempEmail(user.email)) {
      setShowNoEmailDialog(true);
      return;
    }
    handleSendEmail(briefingId);
  };

  return (
    <>
      <DynamicOGMeta pageKey="vibrantLifeHistory" />
      <PageTour
        steps={pageTourConfig.vibrant_life_history}
        open={showTour}
        onComplete={completeTour}
      />
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-red-50 to-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg">❤️</span>
            <h1 className="text-lg font-semibold">我的生活记录</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : !briefings?.length ? (
          <Card className="bg-white/60 backdrop-blur-sm border-rose-100">
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-rose-300 mx-auto mb-4" />
              <p className="text-muted-foreground">还没有生活记录</p>
              <p className="text-sm text-muted-foreground mt-1">
                和有劲AI聊聊，记录会自动保存在这里
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/coach/vibrant_life_sage")}
              >
                开始对话
              </Button>
            </CardContent>
          </Card>
        ) : (
          briefings.map((briefing) => {
            const coachConfig = getCoachConfig(briefing.recommended_coach_type);
            const CoachIcon = coachConfig?.icon || Sparkles;

            return (
              <Card
                key={briefing.id}
                className="bg-white/60 backdrop-blur-sm border-rose-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCardClick(briefing)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {briefing.created_at
                        ? format(new Date(briefing.created_at), "yyyy年M月d日 HH:mm", { locale: zhCN })
                        : ""}
                    </span>
                    {coachConfig && (
                      <span className={`text-xs flex items-center gap-1 ${coachConfig.color}`}>
                        <CoachIcon className="h-3 w-3" />
                        {coachConfig.label}
                      </span>
                    )}
                  </div>

                  {/* Issue Summary */}
                  {briefing.user_issue_summary && (
                    <p className="text-sm font-medium line-clamp-2">
                      💬 {briefing.user_issue_summary}
                    </p>
                  )}

                  {/* Summary Preview - 新增 */}
                  {briefing.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {briefing.summary}
                    </p>
                  )}

                  {/* Fallback to reasoning if no summary */}
                  {!briefing.summary && briefing.reasoning && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      💡 {briefing.reasoning}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedBriefing} onOpenChange={() => setSelectedBriefing(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <span>❤️</span>
                <span>对话详情</span>
              </SheetTitle>
              {selectedBriefing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendEmailClick(selectedBriefing.id)}
                  disabled={isSendingEmail}
                  className="flex items-center gap-1.5"
                >
                  {isSendingEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span className="hidden xs:inline">{isSendingEmail ? "发送中" : "发送到邮箱"}</span>
                </Button>
              )}
            </div>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(85vh-80px)] py-4">
            {selectedBriefing && (
              <div className="space-y-4 px-1">
                {/* Summary Card */}
                <Card className="bg-rose-50/50 border-rose-100">
                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs text-muted-foreground">
                      {selectedBriefing.created_at
                        ? format(new Date(selectedBriefing.created_at), "yyyy年M月d日 HH:mm", { locale: zhCN })
                        : ""}
                    </div>
                    
                    {selectedBriefing.user_issue_summary && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">问题摘要</p>
                        <p className="text-sm">{selectedBriefing.user_issue_summary}</p>
                      </div>
                    )}

                    {selectedBriefing.recommended_coach_type && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">AI推荐</p>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const config = getCoachConfig(selectedBriefing.recommended_coach_type);
                            const Icon = config?.icon || Sparkles;
                            return (
                              <span className={`text-sm flex items-center gap-1 ${config?.color || 'text-muted-foreground'}`}>
                                <Icon className="h-4 w-4" />
                                {config?.label || selectedBriefing.recommended_coach_type}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Summary - 对话总结 */}
                    {selectedBriefing.summary && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">📝 对话总结</p>
                        <p className="text-sm">{selectedBriefing.summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Insight Card - 核心洞察 */}
                {selectedBriefing.insight && (
                  <Card className="bg-amber-50/50 border-amber-100">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <Lightbulb className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">💡 核心洞察</p>
                          <p className="text-sm">{selectedBriefing.insight}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Card - 行动建议 */}
                {selectedBriefing.action && (
                  <Card className="bg-green-50/50 border-green-100">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">✅ 行动建议</p>
                          <p className="text-sm">{selectedBriefing.action}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Service Recommendation - 推荐服务 */}
                {selectedBriefing.recommended_coach_type && (
                  <ServiceRecommendationCard 
                    coachType={selectedBriefing.recommended_coach_type}
                    reasoning={selectedBriefing.reasoning}
                  />
                )}

                {/* Conversation Messages */}
                {selectedBriefing.conversation_id && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">对话记录</p>
                    {isLoadingMessages ? (
                      <div className="space-y-2">
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                      </div>
                    ) : conversationMessages.length > 0 ? (
                      conversationMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg text-sm ${
                            msg.role === "user"
                              ? "bg-primary/10 ml-8"
                              : "bg-muted mr-8"
                          }`}
                        >
                          <p className="text-xs text-muted-foreground mb-1">
                            {msg.role === "user" ? "我" : "有劲AI"}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        暂无对话记录
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 无邮箱提示对话框 */}
      <Dialog open={showNoEmailDialog} onOpenChange={setShowNoEmailDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              请先设置邮箱
            </DialogTitle>
            <DialogDescription>
              您还没有设置邮箱地址，无法发送邮件。请先在设置页面设置您的邮箱。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowNoEmailDialog(false)}
              className="flex-1"
            >
              稍后设置
            </Button>
            <Button 
              onClick={() => navigate("/settings?tab=account")}
              className="flex-1"
            >
              去设置
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
};

export default VibrantLifeHistory;
