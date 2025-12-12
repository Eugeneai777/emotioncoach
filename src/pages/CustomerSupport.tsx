import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { SupportCoachCard } from "@/components/customer-support/SupportCoachCard";
import { SupportPackageCard } from "@/components/customer-support/SupportPackageCard";
import { SupportCampCard } from "@/components/customer-support/SupportCampCard";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: {
    coaches?: Array<{ coach_key: string; reason: string }>;
    packages?: { package_ids: string[]; highlight_reason?: string };
    camps?: Array<{ camp_type: string; reason: string }>;
  };
}

const quickOptions = [
  {
    id: 'suggestion',
    emoji: '💡',
    title: '提建议',
    prompt: '我想给有劲提一个建议',
    description: '提交产品改进意见'
  },
  {
    id: 'issue',
    emoji: '🔧',
    title: '报问题',
    prompt: '我遇到了一个问题需要帮助',
    description: '反馈遇到的问题'
  },
  {
    id: 'packages',
    emoji: '📦',
    title: '查套餐',
    prompt: '我想了解会员套餐的详情',
    description: '查看套餐和价格'
  },
  {
    id: 'help',
    emoji: '❓',
    title: '求帮助',
    prompt: '我不太会用这个App，需要帮助',
    description: '获取使用指导'
  },
  {
    id: 'guide',
    emoji: '🎓',
    title: '新手指引',
    prompt: '我是新用户，请介绍一下有劲的主要功能',
    description: '了解产品功能'
  },
  {
    id: 'human',
    emoji: '👤',
    title: '联系人工',
    prompt: '我想联系人工客服',
    description: '转接人工服务'
  }
];

const CustomerSupport = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '您好！我是有劲AI客服 🌿\n\n请问有什么可以帮您的？您可以直接输入问题，或点击上方的快速选项。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-support', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          sessionId: sessionId.current
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply || '抱歉，我暂时无法回答这个问题。',
        recommendations: data.recommendations
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Customer support error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，服务暂时不可用，请稍后再试。'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickOption = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">有劲AI客服</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-60px)]">
        {/* Quick Options */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-3">🎯 快速选项</p>
          <div className="grid grid-cols-3 gap-2">
            {quickOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleQuickOption(option.prompt)}
                disabled={isLoading}
                className="bg-white/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 text-left hover:bg-white/80 hover:shadow-sm transition-all disabled:opacity-50"
              >
                <span className="text-xl mb-1 block">{option.emoji}</span>
                <span className="text-sm font-medium block">{option.title}</span>
                <span className="text-xs text-muted-foreground block mt-0.5">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl border border-border/50 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index}>
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white'
                          : 'bg-muted/50'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                  
                  {/* 推荐卡片 */}
                  {message.recommendations && (
                    <div className="mt-3 space-y-2">
                      {message.recommendations.coaches?.map(coach => (
                        <SupportCoachCard 
                          key={coach.coach_key} 
                          coach_key={coach.coach_key} 
                          reason={coach.reason} 
                        />
                      ))}
                      {message.recommendations.packages && (
                        <SupportPackageCard 
                          package_ids={message.recommendations.packages.package_ids} 
                          highlight_reason={message.recommendations.packages.highlight_reason} 
                        />
                      )}
                      {message.recommendations.camps?.map(camp => (
                        <SupportCampCard 
                          key={camp.camp_type} 
                          camp_type={camp.camp_type} 
                          reason={camp.reason} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 rounded-2xl px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border/50 p-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入您的问题..."
                className="min-h-[44px] max-h-[120px] resize-none bg-background/50"
                rows={1}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="shrink-0 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;
