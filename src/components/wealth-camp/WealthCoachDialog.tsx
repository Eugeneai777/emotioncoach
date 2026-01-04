import { useState, useEffect, useRef } from "react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

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
    },
    "meditation_analysis" as CoachChatMode
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

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  const primaryColor = template?.primary_color || "amber";
  const themeConfig = template?.theme_config;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

        {/* 全屏对话层 */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
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
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={handleNewConversation}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* 对话内容区 */}
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto pb-32"
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

          {/* 滚动到底部按钮 */}
          {messages.length > 0 && (
            <ScrollToBottomButton
              scrollRef={mainRef}
              messagesEndRef={messagesEndRef}
              primaryColor={primaryColor}
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
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
