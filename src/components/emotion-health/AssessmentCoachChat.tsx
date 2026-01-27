import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  type PatternType,
  type BlockedDimension,
  patternConfig
} from "./emotionHealthData";

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface AssessmentCoachChatProps {
  pattern: PatternType;
  blockedDimension?: BlockedDimension;
  onComplete?: (action: string) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assessment-coach-chat`;

export function AssessmentCoachChat({ pattern, blockedDimension, onComplete }: AssessmentCoachChatProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const patternInfo = patternConfig[pattern];
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  
  // 判断是否进入转化阶段（用户发了4条以上消息）
  const isConversionStage = userMessageCount >= 4;

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 流式调用AI
  const streamChat = useCallback(async (chatMessages: Message[]) => {
    setIsLoading(true);
    
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
          pattern,
          patternName: patternInfo.name,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "请求失败");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // 添加空的 assistant 消息
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // 逐行解析 SSE
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              // 更新最后一条 assistant 消息
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                  newMessages[lastIndex] = { ...newMessages[lastIndex], content: assistantContent };
                }
                return newMessages;
              });
            }
          } catch {
            // JSON 解析失败，放回 buffer 等待更多数据
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // 处理剩余 buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                  newMessages[lastIndex] = { ...newMessages[lastIndex], content: assistantContent };
                }
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error('Stream chat error:', error);
      toast.error(error instanceof Error ? error.message : "对话出错，请重试");
      // 移除空的 assistant 消息
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && !prev[prev.length - 1].content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [pattern, patternInfo.name]);

  // 初始化第一轮对话
  useEffect(() => {
    if (!initialized && messages.length === 0) {
      setInitialized(true);
      // 发送初始消息让 AI 开场
      const initialSystemMessage: Message = {
        role: 'user',
        content: `[系统：用户刚完成情绪健康测评，结果显示为"${patternInfo.name}"模式。请作为劲老师，用温暖共情的方式开始第一轮对话，询问用户最近让他们最困扰的是什么。]`
      };
      
      // 发送请求但不显示这个系统消息
      streamChat([initialSystemMessage]);
    }
  }, [initialized, messages.length, patternInfo.name, streamChat]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // 调用 AI
    streamChat(newMessages);
  }, [input, isLoading, messages, streamChat]);

  const handleCTAClick = (type: 'camp' | 'membership') => {
    if (type === 'camp') {
      onComplete?.('camp');
      navigate('/camps/emotion');
    } else if (type === 'membership') {
      onComplete?.('membership');
      navigate('/packages');
    }
  };

  // 快捷选项
  const quickOptions = [
    "我经常感到很累",
    "工作压力很大",
    "情绪起伏不定",
    "不知道怎么调整"
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 模式标签 */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-xl">{patternInfo.emoji}</span>
          <Badge variant="secondary" className="text-xs">
            {patternInfo.name}
          </Badge>
          <span className="text-xs text-muted-foreground">
            · 对话中
          </span>
        </div>
      </div>

      {/* 聊天区域 */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="px-4 py-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' ? (
                <div className="max-w-[85%]">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">劲老师 🌿</div>
                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content || (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              正在思考...
                            </span>
                          )}
                        </p>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="p-3 bg-primary text-primary-foreground max-w-[80%]">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>
              )}
            </div>
          ))}

          {/* 转化阶段 CTA */}
          {isConversionStage && messages.length > 0 && !isLoading && (
            <div className="mt-6 space-y-3 px-2">
              <Button
                className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
                onClick={() => handleCTAClick('camp')}
              >
                进入21天情绪日记训练营
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                ¥299 · 每日AI陪伴 · 情绪日记打卡
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleCTAClick('membership')}
              >
                了解365陪伴会员
              </Button>
            </div>
          )}

          {/* 快捷选项（第一轮时显示） */}
          {messages.length === 1 && !isLoading && (
            <div className="flex flex-wrap gap-2 px-2">
              {quickOptions.map((option, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setInput(option);
                  }}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="border-t p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="说说你的想法..."
            className="resize-none min-h-[44px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-11 w-11"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
