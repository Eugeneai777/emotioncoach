import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopyPreview, type GeneratedCopy } from './CopyPreview';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PosterExpertChatProps {
  partnerId: string;
  entryType: 'free' | 'paid';
  onCopyConfirmed: (copy: GeneratedCopy) => void;
}

const quickOptions = {
  audience: [
    { label: '👩 职场女性', value: '职场女性，25-40岁，工作压力大，追求事业与生活平衡' },
    { label: '👨‍👩‍👧 年轻家长', value: '年轻家长，有3-15岁孩子，关心孩子成长和亲子关系' },
    { label: '🧑‍🎓 大学生', value: '大学生或刚毕业的年轻人，面临学业压力和就业焦虑' },
    { label: '👴 中年人群', value: '40-55岁中年人，面临人生转型、家庭和事业双重压力' },
  ],
  scene: [
    { label: '📱 朋友圈', value: '微信朋友圈' },
    { label: '👥 微信群', value: '微信群分享' },
    { label: '📕 小红书', value: '小红书发帖' },
    { label: '💬 一对一', value: '一对一私聊推荐' },
  ],
};

export function PosterExpertChat({ partnerId, entryType, onCopyConfirmed }: PosterExpertChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是你的AI推广专家 🎯\n\n让我帮你创建最吸引人的推广海报！\n\n首先，请告诉我你想推广给什么样的人群？'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [currentStep, setCurrentStep] = useState<'audience' | 'scene' | 'chat'>('audience');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Update step based on conversation progress
    if (currentStep === 'audience') {
      setCurrentStep('scene');
    } else if (currentStep === 'scene') {
      setCurrentStep('chat');
    }

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
      let toolCallData: any = null;

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
              setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
            }
            
            // Handle tool calls
            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                if (toolCall.function?.name === 'generate_poster_copy') {
                  if (!toolCallData) {
                    toolCallData = { arguments: '' };
                  }
                  if (toolCall.function.arguments) {
                    toolCallData.arguments += toolCall.function.arguments;
                  }
                }
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Process tool call result
      if (toolCallData?.arguments) {
        try {
          const copyData = JSON.parse(toolCallData.arguments);
          console.log('Generated copy:', copyData);
          setGeneratedCopy(copyData);
          
          // Add confirmation message
          if (!assistantContent) {
            assistantContent = '🎉 太棒了！我根据你的需求生成了定制文案，请查看下方预览并选择你喜欢的版本！';
            setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
          }
        } catch (e) {
          console.error('Failed to parse tool call:', e);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { 
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

  const renderQuickOptions = () => {
    if (generatedCopy) return null;
    
    if (currentStep === 'audience') {
      return (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {quickOptions.audience.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              className="justify-start h-auto py-2 px-3 text-left"
              onClick={() => handleQuickOption(opt.value)}
              disabled={isLoading}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      );
    }

    if (currentStep === 'scene') {
      return (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {quickOptions.scene.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              className="justify-start h-auto py-2 px-3 text-left"
              onClick={() => handleQuickOption(opt.value)}
              disabled={isLoading}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      );
    }

    return null;
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
        {!isLoading && renderQuickOptions()}
      </ScrollArea>

      {/* Generated Copy Preview */}
      {generatedCopy && (
        <CopyPreview
          copy={generatedCopy}
          onConfirm={onCopyConfirmed}
        />
      )}

      {/* Input */}
      {!generatedCopy && (
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
