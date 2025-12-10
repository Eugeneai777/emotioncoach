import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, Loader2 } from 'lucide-react';
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

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
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Process tool call results
      for (const key in toolCallsData) {
        const toolCall = toolCallsData[key];
        
        if (toolCall.name === 'provide_quick_options' && toolCall.arguments) {
          try {
            const optionsData = JSON.parse(toolCall.arguments);
            if (optionsData.options) {
              setQuickOptions(optionsData.options);
            }
          } catch (e) {
            console.error('Failed to parse quick options:', e);
          }
        }
        
        if (toolCall.name === 'generate_poster_schemes' && toolCall.arguments) {
          try {
            const schemesData = JSON.parse(toolCall.arguments) as GeneratedSchemes;
            console.log('Generated schemes:', schemesData);
            setGeneratedSchemes(schemesData);
            
            // Add confirmation message
            if (!assistantContent) {
              assistantContent = '🎉 根据你的需求，我为你生成了2个差异化的推广方案！\n\n请选择最适合你的方案，然后我们就可以开始设计海报了！';
              if (!isRegenerate) {
                setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
              }
            }
          } catch (e) {
            console.error('Failed to parse schemes:', e);
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...messages, { 
        role: 'assistant', 
        content: '抱歉，出了点问题，请重试一下 🙏' 
      }]);
    } finally {
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
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-sm">AI推广专家</h3>
          <p className="text-xs text-muted-foreground">帮你创建高转化海报文案</p>
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
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
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
