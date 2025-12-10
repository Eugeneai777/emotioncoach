import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, Loader2, Users, MapPin, Heart, Shield, Wand2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SchemePreview, type GeneratedSchemes, type PosterScheme } from './SchemePreview';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickOption {
  emoji: string;
  label: string;
  value: string;
}

interface PosterExpertChatProps {
  partnerId: string;
  entryType: 'free' | 'paid';
  onSchemeConfirmed: (scheme: PosterScheme & { target_audience: string; promotion_scene: string }) => void;
}

const STEPS = [
  { id: 1, label: '目标人群', icon: Users, keywords: ['职场', '家长', '宝妈', '学生', '中年', '女性', '男性', '年轻人', '老年'] },
  { id: 2, label: '推广场景', icon: MapPin, keywords: ['朋友圈', '微信群', '小红书', '私聊', '线下', '一对一'] },
  { id: 3, label: '用户痛点', icon: Heart, keywords: ['焦虑', '压力', '情绪', '孩子', '沟通', '困扰', '问题', '需求', '痛点'] },
  { id: 4, label: '信任元素', icon: Shield, keywords: ['数据', '研究', '权威', '机构', '用户', '证明', '背书', '不需要'] },
  { id: 5, label: '生成方案', icon: Wand2, keywords: [] },
];

export function PosterExpertChat({ partnerId, entryType, onSchemeConfirmed }: PosterExpertChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是你的AI推广专家 🎯\n\n让我帮你创建最吸引人的推广海报！\n\n首先，请告诉我你想推广给什么样的人群？'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickOptions, setQuickOptions] = useState<QuickOption[]>([]);
  const [generatedSchemes, setGeneratedSchemes] = useState<GeneratedSchemes | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate current step based on conversation
  const currentStep = useMemo(() => {
    if (generatedSchemes) return 5;
    
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
    const allText = userMessages.join(' ');
    
    let completedSteps = 0;
    for (let i = 0; i < 4; i++) {
      const step = STEPS[i];
      const hasKeyword = step.keywords.some(kw => allText.includes(kw.toLowerCase()));
      if (hasKeyword) completedSteps = i + 1;
    }
    
    return Math.min(completedSteps + 1, 4);
  }, [messages, generatedSchemes]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, generatedSchemes]);

  const sendMessage = async (content: string, isRegenerate = false) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    let newMessages = [...messages];
    
    if (!isRegenerate) {
      newMessages = [...messages, userMessage];
      setMessages(newMessages);
    } else {
      // For regeneration, add a hidden message to trigger new schemes
      newMessages = [...messages, { role: 'user', content: '请重新生成2个不同的方案' }];
    }
    
    setInput('');
    setIsLoading(true);
    setQuickOptions([]);

    // Timeout protection - 30 seconds max
    const timeoutId = setTimeout(() => {
      console.log('Request timeout - 30s reached');
      setIsLoading(false);
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant') return prev;
        return [...prev, { role: 'assistant', content: 'AI思考超时了，请重新发送消息试试 🤔' }];
      });
    }, 30000);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poster-promotion-expert`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('AI服务暂时不可用');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';
      let toolCallsData: Record<string, { name: string; arguments: string }> = {};
      let sseBuffer = ''; // Buffer for handling partial JSON across chunks

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk; // Accumulate chunks in buffer
        
        // Process complete lines only
        const lines = sseBuffer.split('\n');
        // Keep the last potentially incomplete line in buffer
        sseBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            
            if (delta?.content) {
              assistantContent += delta.content;
              if (!isRegenerate) {
                setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
              }
            }
            
            // Handle tool calls
            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                const index = toolCall.index ?? 0;
                if (!toolCallsData[index]) {
                  toolCallsData[index] = { name: '', arguments: '' };
                }
                if (toolCall.function?.name) {
                  toolCallsData[index].name = toolCall.function.name;
                }
                if (toolCall.function?.arguments) {
                  toolCallsData[index].arguments += toolCall.function.arguments;
                }
              }
            }
          } catch (e) {
            // JSON parse failed - might be split across chunks, skip this line
            console.log('SSE parse skip:', jsonStr.substring(0, 50));
          }
        }
      }
      
      // Process any remaining buffer content
      if (sseBuffer.trim() && sseBuffer.startsWith('data: ')) {
        const jsonStr = sseBuffer.slice(6).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              assistantContent += delta.content;
            }
          } catch (e) {
            console.log('Final buffer parse skip');
          }
        }
      }

      // Process tool call results
      console.log('Tool calls collected:', Object.keys(toolCallsData).length);
      let hasSchemes = false;
      let hasQuickOptions = false;
      
      for (const key in toolCallsData) {
        const toolCall = toolCallsData[key];
        console.log(`Processing tool: ${toolCall.name}`);
        
        if (toolCall.name === 'provide_quick_options' && toolCall.arguments) {
          try {
            const optionsData = JSON.parse(toolCall.arguments);
            if (optionsData.options && Array.isArray(optionsData.options)) {
              setQuickOptions(optionsData.options);
              hasQuickOptions = true;
              console.log('Quick options set:', optionsData.options.length);
            }
          } catch (e) {
            console.error('Failed to parse quick options:', e);
          }
        }
        
        if (toolCall.name === 'generate_poster_schemes' && toolCall.arguments) {
          try {
            const schemesData = JSON.parse(toolCall.arguments) as GeneratedSchemes;
            console.log('Generated schemes set');
            setGeneratedSchemes(schemesData);
            hasSchemes = true;
            
            if (!assistantContent) {
              assistantContent = '🎉 根据你的需求，我为你生成了2个差异化的推广方案！\n\n请选择最适合你的方案，然后我们就可以开始设计海报了！';
            }
          } catch (e) {
            console.error('Failed to parse schemes:', e);
          }
        }
      }

      // Enhanced fallback logic - ensure we always have interactive content
      if ((!assistantContent || !assistantContent.trim())) {
        if (hasQuickOptions) {
          assistantContent = '请从下方选项中选择，或者直接输入你的想法 👇';
        } else if (hasSchemes) {
          // Schemes are shown, message already set above
        } else if (Object.keys(toolCallsData).length > 0) {
          // Had tool calls but nothing parsed successfully - provide retry options
          assistantContent = '让我重新整理一下思路...';
          setQuickOptions([
            { emoji: '🔄', label: '重新开始', value: '请重新开始询问我的推广需求' },
            { emoji: '💡', label: '继续', value: '请继续' }
          ]);
          hasQuickOptions = true;
        } else {
          assistantContent = '请告诉我更多信息，帮我更好地了解你的推广需求 💡';
        }
      }

      // Always update messages when we have content
      if (assistantContent && assistantContent.trim() && !isRegenerate) {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant' && lastMsg?.content === assistantContent) {
            return prev;
          }
          if (lastMsg?.role === 'assistant') {
            return [...prev.slice(0, -1), { role: 'assistant', content: assistantContent }];
          }
          return [...newMessages, { role: 'assistant', content: assistantContent }];
        });
      }
      
      console.log('Final state - content:', assistantContent?.substring(0, 30) || '(empty)', 'options:', hasQuickOptions, 'schemes:', hasSchemes);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，出了点问题，请重试一下 🙏' 
      }]);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleQuickOption = (value: string) => {
    sendMessage(value);
  };

  const handleSchemeSelect = (scheme: PosterScheme) => {
    if (generatedSchemes) {
      onSchemeConfirmed({
        ...scheme,
        target_audience: generatedSchemes.target_audience,
        promotion_scene: generatedSchemes.promotion_scene,
      });
    }
  };

  const handleRegenerate = () => {
    setGeneratedSchemes(null);
    sendMessage('请基于相同的用户画像和场景，重新生成2个完全不同风格的方案', true);
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Header with Progress */}
      <div className="pb-3 border-b space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-sm">AI推广专家</h3>
            <p className="text-xs text-muted-foreground">帮你创建高转化海报文案</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                      isCompleted && "bg-green-500 text-white",
                      isCurrent && "bg-amber-500 text-white ring-2 ring-amber-200",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] mt-1 whitespace-nowrap",
                    isCurrent && "text-amber-600 font-medium",
                    isCompleted && "text-green-600",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-full -mt-4",
                    currentStep > step.id ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Quick Options */}
        {!isLoading && quickOptions.length > 0 && !generatedSchemes && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {quickOptions.map((opt, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="justify-start h-auto py-2 px-3 text-left"
                onClick={() => handleQuickOption(opt.value)}
                disabled={isLoading}
              >
                {opt.emoji} {opt.label}
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Generated Schemes Preview */}
      {generatedSchemes && (
        <SchemePreview
          data={generatedSchemes}
          onSelectScheme={handleSchemeSelect}
          onRegenerate={handleRegenerate}
          isRegenerating={isLoading}
        />
      )}

      {/* Input */}
      {!generatedSchemes && (
        <div className="flex gap-2 pt-3 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的想法..."
            onKeyDown={(e) => {
              console.log('Key pressed:', e.key, 'Input:', input, 'isLoading:', isLoading);
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                if (input.trim() && !isLoading) {
                  console.log('Sending message via Enter key');
                  sendMessage(input);
                }
              }
            }}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
