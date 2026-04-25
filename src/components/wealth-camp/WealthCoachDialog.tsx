import { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ChatMessage";
import { CoachInputFooter } from "@/components/coach/CoachInputFooter";
import { MeditationAnalysisIntro } from "./MeditationAnalysisIntro";
import { useDynamicCoachChat, CoachChatMode } from "@/hooks/useDynamicCoachChat";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { getThemeBackgroundGradient } from "@/utils/coachThemeConfig";
import { ScrollToBottomButton } from "@/components/ScrollToBottomButton";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface WealthCoachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage: string;
  campId: string;
  dayNumber: number;
  meditationTitle?: string;
  onCoachingComplete?: () => void;
}

export const WealthCoachDialog = ({
  open,
  onOpenChange,
  initialMessage,
  campId,
  dayNumber,
  meditationTitle,
  onCoachingComplete,
}: WealthCoachDialogProps) => {
  const coachKey = "wealth_coach_4_questions";
  const { data: template } = useCoachTemplate(coachKey);
  const [input, setInput] = useState("");
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [footerHeight, setFooterHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Calculate dynamic padding
  const getContentPaddingBottom = useCallback(() => {
    if (footerHeight > 0) {
      return footerHeight + 16;
    }
    return isMobile ? 140 : 160;
  }, [footerHeight, isMobile]);

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
    (briefingData) => {
      // 简报生成后通知训练营页面
      onCoachingComplete?.();
      // 延迟关闭对话框，让用户看到生成成功的消息
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    },
    "meditation_analysis" as CoachChatMode,
    { dayNumber, campId }
  );

  // 自动发送初始消息
  useEffect(() => {
    if (open && initialMessage && template && !hasAutoSent && messages.length === 0 && !isLoading) {
      setHasAutoSent(true);
      setShowIntro(true);
      const timer = setTimeout(() => {
        sendMessage(initialMessage);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, initialMessage, template, hasAutoSent, messages.length, isLoading, sendMessage]);

  // AI 回复后隐藏引导
  useEffect(() => {
    if (messages.length > 1 && showIntro) {
      setShowIntro(false);
    }
  }, [messages.length, showIntro]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 重置状态当 dialog 打开时
  useEffect(() => {
    if (open) {
      setHasAutoSent(false);
      setShowIntro(true);
      setInput("");
    } else {
      // 关闭时重置对话
      resetConversation();
    }
  }, [open]);

  // ESC 键关闭对话框
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // 防止对话框打开时页面滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const primaryColor = template?.primary_color || "amber";
  const themeConfig = template?.theme_config;

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="wealth-coach-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60]"
        >
          {/* 背景遮罩 */}
          <motion.div 
            className="absolute inset-0 bg-black/60" 
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 全屏对话层 */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute inset-x-0 bottom-0 top-0 sm:top-8 sm:rounded-t-2xl overflow-hidden bg-gradient-to-br ${getThemeBackgroundGradient(primaryColor, themeConfig)} flex flex-col`}
          >
          {/* 顶部栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">{template?.emoji || "💰"}</span>
              <div>
                <h3 className="font-semibold text-sm">{template?.title || "财富教练"}</h3>
                <p className="text-xs text-muted-foreground">Day {dayNumber} · 冥想梳理</p>
              </div>
            </div>
            <div className="flex items-center gap-2 relative z-50">
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={handleNewConversation} className="pointer-events-auto">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="pointer-events-auto hover:bg-destructive/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* 对话内容区 */}
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto"
            style={{ paddingBottom: `${getContentPaddingBottom()}px` }}
          >
            <div className="container max-w-xl mx-auto px-4 py-4">
              {/* 冥想分析引导 */}
              {messages.length === 0 && isLoading && showIntro ? (
                <MeditationAnalysisIntro
                  dayNumber={dayNumber}
                  meditationTitle={meditationTitle}
                />
              ) : messages.length === 0 && !isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>准备开始教练梳理...</p>
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
          </main>

          {/* 滚动到底部按钮 - Dialog 使用 fixed 定位 */}
          {messages.length > 0 && (
            <ScrollToBottomButton
              scrollRef={mainRef}
              messagesEndRef={messagesEndRef}
              primaryColor={primaryColor}
              embedded={false}
            />
          )}

          {/* 输入区 */}
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
            showVoiceInputSuccessToast={false}
            onHeightChange={setFooterHeight}
          />
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
