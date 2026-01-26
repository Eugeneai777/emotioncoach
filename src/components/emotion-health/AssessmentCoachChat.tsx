import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, MessageCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  type PatternType,
  type BlockedDimension,
  coachDialogueScripts,
  universalConversionRounds,
  patternConfig
} from "./emotionHealthData";

interface Message {
  role: 'assistant' | 'user';
  content: string;
  options?: string[];
  showCTA?: boolean;
  ctaType?: 'pattern' | 'conversion';
}

interface AssessmentCoachChatProps {
  pattern: PatternType;
  blockedDimension?: BlockedDimension;
  onComplete?: (action: string) => void;
}

export function AssessmentCoachChat({ pattern, blockedDimension, onComplete }: AssessmentCoachChatProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showConversionRounds, setShowConversionRounds] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const script = coachDialogueScripts[pattern];
  const patternInfo = patternConfig[pattern];

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 初始化第一轮对话
  useEffect(() => {
    if (messages.length === 0) {
      addAIMessage(1);
    }
  }, []);

  const addAIMessage = (round: number) => {
    setIsTyping(true);
    
    // 模拟打字延迟
    setTimeout(() => {
      let roundData;
      let isConversionRound = false;

      if (round <= 5) {
        roundData = script.rounds.find(r => r.round === round);
      } else {
        roundData = universalConversionRounds.find(r => r.round === round);
        isConversionRound = true;
      }

      if (!roundData) {
        setIsTyping(false);
        return;
      }

      const newMessage: Message = {
        role: 'assistant',
        content: roundData.content,
        options: roundData.options,
        showCTA: round === 5 || round === 7,
        ctaType: round === 5 ? 'pattern' : round === 7 ? 'conversion' : undefined
      };

      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      setIsWaiting(roundData.waitForUser);

      // 如果不需要等待用户，自动推进到下一轮
      if (!roundData.waitForUser && round < 7) {
        setTimeout(() => {
          if (round === 5 && !showConversionRounds) {
            // Round 5 后需要用户点击 CTA 或继续聊
            return;
          }
          setCurrentRound(round + 1);
          addAIMessage(round + 1);
        }, 1500);
      }
    }, 800);
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsWaiting(false);

    // 推进到下一轮
    const nextRound = currentRound + 1;
    if (nextRound <= 5 || showConversionRounds) {
      setCurrentRound(nextRound);
      setTimeout(() => addAIMessage(nextRound), 500);
    }
  };

  const handleOptionClick = (option: string) => {
    const userMessage: Message = {
      role: 'user',
      content: option
    };

    setMessages(prev => [...prev, userMessage]);
    setIsWaiting(false);

    // 推进到下一轮
    const nextRound = currentRound + 1;
    if (nextRound <= 5 || showConversionRounds) {
      setCurrentRound(nextRound);
      setTimeout(() => addAIMessage(nextRound), 500);
    }
  };

  const handleCTAClick = (type: 'camp' | 'continue' | 'membership') => {
    if (type === 'continue') {
      // 继续聊天，进入 Round 6-7
      setShowConversionRounds(true);
      setCurrentRound(6);
      addAIMessage(6);
    } else if (type === 'camp') {
      // 进入训练营
      onComplete?.('camp');
      navigate('/camps/emotion');
    } else if (type === 'membership') {
      // 进入会员页
      onComplete?.('membership');
      navigate('/packages');
    }
  };

  const handleStartPatternCoach = () => {
    // 开始对应模式的陪伴
    onComplete?.('coach');
    navigate('/coach-space', {
      state: {
        fromAssessment: 'emotion_health',
        pattern: pattern
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 模式标签 */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-xl">{patternInfo.emoji}</span>
          <Badge variant="secondary" className="text-xs">
            {patternInfo.name}
          </Badge>
          <span className="text-xs text-muted-foreground">· 第{currentRound}轮对话</span>
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
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </Card>

                      {/* 选项按钮 */}
                      {message.options && index === messages.length - 1 && isWaiting && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.options.map((option, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleOptionClick(option)}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Round 5 CTA */}
                      {message.showCTA && message.ctaType === 'pattern' && index === messages.length - 1 && (
                        <div className="mt-4 space-y-2">
                          <Button
                            className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
                            onClick={handleStartPatternCoach}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {script.ctaButton}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground"
                            onClick={() => handleCTAClick('continue')}
                          >
                            或者继续聊聊 →
                          </Button>
                        </div>
                      )}

                      {/* Round 7 转化CTA */}
                      {message.showCTA && message.ctaType === 'conversion' && index === messages.length - 1 && (
                        <div className="mt-4 space-y-2">
                          <Button
                            className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
                            onClick={() => handleCTAClick('camp')}
                          >
                            进入21天情绪修复训练营
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">¥299 · 限时优惠</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleCTAClick('membership')}
                          >
                            升级365陪伴 →
                          </Button>
                        </div>
                      )}
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

          {/* 打字指示器 */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-xs text-muted-foreground">劲老师正在思考...</span>
                    </div>
                  </Card>
                </div>
              </div>
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
            disabled={isTyping || !isWaiting}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || !isWaiting}
            size="icon"
            className="h-11 w-11"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}