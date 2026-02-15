import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, RotateCcw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "@/components/ChatMessage";
import { CoachInputFooter } from "@/components/coach/CoachInputFooter";
import { MeditationAnalysisIntro } from "./MeditationAnalysisIntro";
import { useDynamicCoachChat, CoachChatMode } from "@/hooks/useDynamicCoachChat";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { getThemeBackgroundGradient } from "@/utils/coachThemeConfig";
import { ScrollToBottomButton } from "@/components/ScrollToBottomButton";
import { toast } from "sonner";
import { useEnsureWealthProfile } from "@/hooks/useEnsureWealthProfile";
import { useSmartNotification } from "@/hooks/useSmartNotification";
interface WealthCoachEmbeddedProps {
  initialMessage: string;
  campId: string;
  dayNumber: number;
  meditationTitle?: string;
  onCoachingComplete?: () => void;
}

export const WealthCoachEmbedded = ({
  initialMessage,
  campId,
  dayNumber,
  meditationTitle,
  onCoachingComplete,
}: WealthCoachEmbeddedProps) => {
  const coachKey = "wealth_coach_4_questions";
  const { data: template } = useCoachTemplate(coachKey);
  const [input, setInput] = useState("");
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  
  // 确保用户画像存在
  const { profileExists, isChecking } = useEnsureWealthProfile();
  
  // 智能通知
  const { triggerNotification } = useSmartNotification('wealth_coach_4_questions_coach');
  
  // 调试日志：画像状态
  useEffect(() => {
    console.log('📊 [WealthCoachEmbedded] 画像状态:', { profileExists, isChecking, dayNumber, campId });
  }, [profileExists, isChecking, dayNumber, campId]);

  // 简报生成后触发智能通知
  const handleBriefingGenerated = useCallback((briefingData: any) => {
    console.log('📬 [WealthCoachEmbedded] 触发智能通知:', briefingData);
    
    // 触发智能通知
    triggerNotification('after_wealth_coaching', {
      behavior_insight: briefingData.behavior_insight,
      emotion_insight: briefingData.emotion_insight,
      belief_insight: briefingData.belief_insight,
      giving_action: briefingData.giving_action,
      day_number: dayNumber,
    });
    
    // 调用外部回调
    onCoachingComplete?.();
  }, [triggerNotification, dayNumber, onCoachingComplete]);

  const {
    messages,
    isLoading,
    sendMessage,
    resetConversation,
  } = useDynamicCoachChat(
    template?.coach_key || coachKey,
    template?.edge_function_name || "wealth_coach_4_questions-coach",
    template?.briefing_table_name || "wealth_coach_4_questions_briefings",
    template?.briefing_tool_config as any,
    undefined,
    handleBriefingGenerated,
    "meditation_analysis" as CoachChatMode,
    { dayNumber, campId }
  );

  // 自动发送初始消息
  useEffect(() => {
    if (initialMessage && template && !hasAutoSent && messages.length === 0 && !isLoading) {
      console.log('[WealthCoachEmbedded] 自动发送触发:', {
        dayNumber,
        msgPreview: initialMessage.slice(0, 50),
        templateKey: template.coach_key,
      });
      setHasAutoSent(true);
      setShowIntro(true);
      const timer = setTimeout(() => {
        sendMessage(initialMessage);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialMessage, template, hasAutoSent, messages.length, isLoading, sendMessage, dayNumber]);

  // AI 回复后隐藏引导
  useEffect(() => {
    if (messages.length > 1 && showIntro) {
      setShowIntro(false);
    }
  }, [messages.length, showIntro]);

  // dayNumber/campId 变化时重置对话（用于补卡场景）
  // 使用 ref 跳过首次 mount，避免和自动发送 effect 竞态
  const isFirstMount = useRef(true);
  const prevDayRef = useRef(dayNumber);
  const prevCampRef = useRef(campId);
  
  useEffect(() => {
    // 首次 mount 时跳过 reset
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    
    // 只有当 dayNumber 或 campId 真正变化时才 reset
    if (prevDayRef.current !== dayNumber || prevCampRef.current !== campId) {
      console.log('[WealthCoachEmbedded] Day/Camp changed, resetting conversation', { 
        from: { day: prevDayRef.current, camp: prevCampRef.current },
        to: { day: dayNumber, camp: campId }
      });
      resetConversation();
      setHasAutoSent(false);
      setShowIntro(true);
      prevDayRef.current = dayNumber;
      prevCampRef.current = campId;
    }
  }, [dayNumber, campId, resetConversation]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const messageToSend = input.trim();
    setInput("");
    await sendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    resetConversation();
    setHasAutoSent(false);
    setShowIntro(true);
    toast.success("已开始新对话");
  };

  const primaryColor = template?.primary_color || "amber";
  const themeConfig = template?.theme_config;

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${getThemeBackgroundGradient(primaryColor, themeConfig)}`}>
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">{template?.emoji || "💰"}</span>
          <div>
            <h3 className="font-semibold text-sm">{template?.title || "财富教练"}</h3>
            <p className="text-xs text-muted-foreground">Day {dayNumber} · 冥想梳理</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleNewConversation} className="gap-1">
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs">新对话</span>
          </Button>
        )}
      </div>

      {/* 对话内容区 */}
      <div
        ref={mainRef}
        className="h-[60vh] overflow-y-auto relative"
      >
        <div className="px-4 py-4">
          {/* 冥想分析引导 */}
          {messages.length === 0 && isLoading && showIntro ? (
            <MeditationAnalysisIntro
              dayNumber={dayNumber}
              meditationTitle={meditationTitle}
            />
          ) : messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-medium text-foreground">准备好梳理今天的冥想体验了吗？</p>
                <p className="text-sm text-muted-foreground">教练将引导你回顾和反思</p>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  const msg = initialMessage || `【Day ${dayNumber}】请帮我梳理财富卡点`;
                  console.log('[WealthCoachEmbedded] 手动发送:', msg.slice(0, 50));
                  sendMessage(msg);
                }}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 text-base px-8 animate-pulse"
              >
                <MessageSquare className="w-5 h-5" />
                开始教练梳理
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  isLastMessage={index === messages.length - 1}
                  primaryColor={primaryColor}
                />
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">正在思考...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 滚动到底部按钮 - 使用 embedded 模式确保在滚动容器内正确定位 */}
        {messages.length > 0 && (
          <ScrollToBottomButton
            scrollRef={mainRef}
            messagesEndRef={messagesEndRef}
            primaryColor={primaryColor}
            embedded={true}
          />
        )}
      </div>

      {/* 输入区 */}
      <div className="border-t bg-background/80 backdrop-blur-sm">
        <CoachInputFooter
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onKeyPress={handleKeyPress}
          onNewConversation={handleNewConversation}
          placeholder={template?.placeholder || "分享你的想法..."}
          isLoading={isLoading}
          hasMessages={messages.length > 0}
          gradient={template?.gradient || "from-amber-500 to-orange-500"}
          primaryColor={primaryColor}
          messagesCount={messages.length}
          enableVoiceInput={true}
          embedded={true}
        />
      </div>
    </Card>
  );
};
