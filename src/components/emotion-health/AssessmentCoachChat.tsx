import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Loader2, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedStageProgress, type StageConfig } from "@/components/coach/UnifiedStageProgress";
import { ParentJourneySummary } from "@/components/coach/ParentJourneySummary";
import { useRealtimeSpeechInput } from "@/hooks/useRealtimeSpeechInput";
import {
  type PatternType,
  type BlockedDimension,
  patternConfig
} from "./emotionHealthData";

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface BriefingData {
  emotion_theme: string;
  stage_1_content: string;
  stage_2_content: string;
  stage_3_content: string;
  stage_4_content: string;
  insight: string;
  action: string;
  growth_story: string;
}

interface AssessmentCoachChatProps {
  pattern: PatternType;
  blockedDimension?: BlockedDimension;
  onComplete?: (action: string) => void;
  resumeSessionId?: string;
  fromAssessment?: string;
  midlifeData?: {
    personalityType?: string;
    dimensions?: any[];
    aiAnalysis?: any;
  };
}

const EMOTION_COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assessment-emotion-coach`;
const MIDLIFE_COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assessment-coach-chat`;

// 情绪四部曲阶段配置
const emotionStages: StageConfig[] = [
  { id: 1, name: "觉察", subtitle: "Feel it", emoji: "🌱" },
  { id: 2, name: "理解", subtitle: "Name it", emoji: "💭" },
  { id: 3, name: "反应", subtitle: "React it", emoji: "👁️" },
  { id: 4, name: "转化", subtitle: "Transform it", emoji: "🦋" }
];

export function AssessmentCoachChat({ pattern, blockedDimension, onComplete, resumeSessionId, fromAssessment, midlifeData }: AssessmentCoachChatProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [isResumed, setIsResumed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionCompletedRef = useRef(false);
  const { isListening, isSupported: isSpeechInputSupported, toggleListening, stopListening } = useRealtimeSpeechInput({
    onTextChange: setInput,
    onError: (message) => toast.error(message),
  });

  const isMidlife = fromAssessment === 'midlife_awakening';
  const CHAT_URL = isMidlife ? MIDLIFE_COACH_URL : EMOTION_COACH_URL;
  const patternInfo = patternConfig[pattern] || patternConfig['exhaustion'];
  const displayName = isMidlife ? (midlifeData?.personalityType || pattern) : patternInfo.name;

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, briefing]);

  // 创建会话（仅用于情绪教练模式）
  const createSession = useCallback(async () => {
    if (isMidlife) return null; // 觉醒教练不需要session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("请先登录");
        return null;
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_session',
          pattern,
          patternName: patternInfo.name,
        }),
      });

      if (response.status === 402) {
        setShowUpsell(true);
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "创建会话失败");
      }

      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      console.error('Create session error:', error);
      toast.error(error instanceof Error ? error.message : "创建会话失败");
      return null;
    }
  }, [pattern, patternInfo.name, isMidlife]);

  // 发送消息
  const sendMessage = useCallback(async (userMessage: string, sid: string) => {
    setIsLoading(true);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("请先登录");
        return;
      }

      if (isMidlife) {
        // 觉醒教练：流式响应
        const allMessages = [
          ...messages.filter(m => !m.content.startsWith('[系统：')).map(m => ({ role: m.role, content: m.content })),
          { role: 'user' as const, content: userMessage }
        ];

        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            pattern,
            patternName: displayName,
            fromAssessment: 'midlife_awakening',
            midlifeData,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "请求失败");
        }

        // Parse SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        if (reader) {
          setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    assistantContent += delta;
                    setMessages(prev => {
                      const updated = [...prev];
                      updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                      return updated;
                    });
                  }
                } catch { /* skip unparseable lines */ }
              }
            }
          }
        }
      } else {
        // 情绪教练：JSON响应
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            sessionId: sid,
            message: userMessage,
            pattern,
            patternName: patternInfo.name,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "请求失败");
        }

        const data = await response.json();
        
        if (data.current_stage !== undefined) {
          setCurrentStage(data.current_stage);
        }

        if (data.tool_call?.function === 'generate_briefing') {
          setBriefing(data.tool_call.args);
          sessionCompletedRef.current = true;
        }

        if (data.content) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Send message error:', error);
      toast.error(error instanceof Error ? error.message : "对话出错，请重试");
    } finally {
      setIsLoading(false);
    }
  }, [pattern, patternInfo.name, isMidlife, displayName, midlifeData, messages]);

  // 恢复未完成会话
  const resumeExistingSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // 如果有指定的 sessionId，优先恢复
      const targetSessionId = resumeSessionId;

      let existingSessions: any[] | null = null;

      if (targetSessionId) {
        const { data } = await supabase
          .from('emotion_coaching_sessions')
          .select('id, messages, current_stage, status')
          .eq('id', targetSessionId)
          .eq('status', 'active' as any)
          .limit(1) as any;
        existingSessions = data;
      } else {
        const result = await (supabase
          .from('emotion_coaching_sessions')
          .select('id, messages, current_stage, status')
          .eq('status', 'active') as any)
          .eq('source', 'assessment')
          .order('updated_at', { ascending: false })
          .limit(1);
        existingSessions = result.data;
      }

      if (existingSessions && existingSessions.length > 0) {
        const existingSession = existingSessions[0];
        const savedMessages = (existingSession.messages as any[]) || [];
        
        // 只恢复有实际对话内容的会话
        if (savedMessages.length > 0) {
          setSessionId(existingSession.id);
          setCurrentStage(existingSession.current_stage || 0);
          
          // 过滤出 user 和 assistant 消息用于展示
          const displayMessages: Message[] = savedMessages
            .filter((m: any) => m.role === 'user' || m.role === 'assistant')
            .map((m: any) => ({ role: m.role, content: m.content }));
          
          setMessages(displayMessages);
          setIsResumed(true);
          console.log('Resumed session:', existingSession.id, 'stage:', existingSession.current_stage);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Resume session error:', error);
      return false;
    }
  }, [resumeSessionId]);

  // 初始化
  useEffect(() => {
    const init = async () => {
      if (initialized) return;
      setInitialized(true);

      if (isMidlife) {
        // 觉醒教练：无需session，直接发送初始消息
        setSessionId('midlife-direct');
        const initialMessage = `[系统：用户刚完成中场觉醒力测评，人格类型为"${displayName}"。请作为劲老师（觉醒教练），用温暖共情的方式开始第一轮对话。]`;
        setMessages([{ role: 'user', content: initialMessage }]);
        await sendMessage(initialMessage, 'midlife-direct');
        return;
      }

      // 情绪教练：先尝试恢复，再创建session
      const resumed = await resumeExistingSession();
      if (resumed) return;

      const sid = await createSession();
      if (!sid) return;
      
      setSessionId(sid);
      
      const initialMessage = `[系统：用户刚完成情绪健康测评，结果显示为"${patternInfo.name}"模式。请作为劲老师，用温暖共情的方式开始第一轮对话。]`;
      await sendMessage(initialMessage, sid);
    };

    init();
  }, [initialized, createSession, sendMessage, patternInfo.name, resumeExistingSession, isMidlife, displayName]);

  // 离开页面时触发未完成对话通知
  useEffect(() => {
    return () => {
      // 组件卸载时，如果对话未完成，触发通知
      if (sessionId && !sessionCompletedRef.current && messages.length > 1) {
        supabase.functions.invoke('generate-smart-notification', {
          body: {
            scenario: 'incomplete_emotion_session',
            context: {
              sessionId,
              current_stage: currentStage,
              pattern,
              patternName: patternInfo.name,
              message_count: messages.length
            }
          }
        }).catch(err => console.error('Failed to trigger incomplete session notification:', err));
      }
    };
  }, [sessionId, currentStage, messages.length, pattern, patternInfo.name]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading || (!sessionId && !isMidlife)) return;

    const userMessage = input.trim();
    stopListening();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    sendMessage(userMessage, sessionId || 'midlife-direct');
  }, [input, isLoading, sessionId, sendMessage, isMidlife, stopListening]);

  const handleCTAClick = (type: 'camp' | 'membership') => {
    if (type === 'camp') {
      onComplete?.('camp');
      navigate('/camp-intro/emotion_journal_21');
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

  // 额度用完的提示
  if (showUpsell) {
    return (
      <div className="flex flex-col h-full p-4">
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="text-center space-y-4">
            <span className="text-4xl">😔</span>
            <h3 className="text-lg font-medium">体验已结束</h3>
            <p className="text-sm text-muted-foreground">
              你已经使用过一次免费的AI情绪教练简报<br/>
              想要继续获得AI陪伴，可以选择以下方式：
            </p>
          </div>
        </Card>

        <div className="mt-4 space-y-3">
          <Card className="p-4 border-purple-200 bg-purple-50/50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌟</span>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">有劲365会员</h4>
                <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                  <li>• 全年无限次使用所有AI教练</li>
                  <li>• 每月课程学习额度</li>
                  <li>• 专属成长社区</li>
                </ul>
                <div className="mb-3">
                  <span className="text-lg font-bold text-purple-600">¥365/年</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleCTAClick('membership')}
                >
                  了解详情 →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 模式标签 + 阶段进度 */}
      <div className="px-4 py-2 border-b space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{isMidlife ? '🌅' : patternInfo.emoji}</span>
          <Badge variant="secondary" className="text-xs">
            {isMidlife ? displayName : patternInfo.name}
          </Badge>
          <span className="text-xs text-muted-foreground">
            · {isMidlife ? '觉醒对话' : '情绪四部曲'}
          </span>
        </div>
        
        {/* 四部曲进度（仅情绪教练显示） */}
        {!isMidlife && (
          <UnifiedStageProgress 
            coachType="emotion" 
            currentStage={currentStage}
            stages={emotionStages}
          />
        )}
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
                !message.content.startsWith('[系统：') && (
                  <Card className="p-3 bg-primary text-primary-foreground max-w-[80%]">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </Card>
                )
              )}
            </div>
          ))}

          {/* 加载状态 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <span className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      正在思考...
                    </span>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 简报展示 */}
          {briefing && (
            <div className="mt-6">
              {/* 分隔线 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">✨ 你的情绪简报</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              
              <ParentJourneySummary briefing={briefing} />

              {/* 购买推荐 */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">🎁 想要持续获得AI陪伴？</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Card className="p-3 border-purple-200 bg-purple-50/50">
                    <div className="text-center">
                      <span className="text-xl">🌟</span>
                      <h4 className="font-medium text-xs mt-1">有劲365</h4>
                      <p className="text-lg font-bold text-purple-600">¥365/年</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 text-xs h-7"
                        onClick={() => handleCTAClick('membership')}
                      >
                        了解详情
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 快捷选项（第一轮时显示） */}
          {messages.length === 1 && !isLoading && !briefing && (
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

      {/* 输入区域 - 生成简报后隐藏 */}
      {!briefing && (
        <div className="border-t p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            {isSpeechInputSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toggleListening(input)}
                disabled={isLoading}
                title={isListening ? "停止语音输入" : "开始语音输入"}
                className={cn(
                  "h-11 w-11 min-w-[44px] rounded-full flex-shrink-0 transition-all",
                  isListening
                    ? "bg-primary/15 text-primary ring-2 ring-primary/35 animate-pulse"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
            {!isSpeechInputSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toast.error("当前浏览器暂不支持语音转文字，请在微信/系统浏览器开启麦克风权限，或先使用文字输入")}
                disabled={isLoading}
                title="语音输入暂不可用"
                className="h-11 w-11 min-w-[44px] rounded-full flex-shrink-0 bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
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
      )}
    </div>
  );
}
