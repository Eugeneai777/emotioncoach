import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, Home } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SupportCoachCard } from "@/components/customer-support/SupportCoachCard";
import { SupportPackageCard } from "@/components/customer-support/SupportPackageCard";
import { SupportCampCard } from "@/components/customer-support/SupportCampCard";
import { SupportNavigationCard } from "@/components/customer-support/SupportNavigationCard";
import { QiWeiQRCard } from "@/components/customer-support/QiWeiQRCard";
import { PointsRulesCard } from "@/components/PointsRulesCard";
import FeedbackFloatingButton from "@/components/FeedbackFloatingButton";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

interface Navigation {
  page_type: string;
  title: string;
  reason?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: {
    coaches?: Array<{ coach_key: string; reason: string }>;
    packages?: { package_ids?: string[]; package_names?: string[]; highlight_reason?: string };
    camps?: Array<{ camp_type: string; reason: string }>;
    points_rules?: { show_balance: boolean };
    navigations?: Navigation[];
  };
}

// 单一真相路由源：所有页面入口必须指向真实存在的前端路由
const PAGE_ROUTES: Record<string, { route: string; emoji: string; title: string; subtitle: string }> = {
  orders: { route: '/settings?tab=account', emoji: '📋', title: '我的订单', subtitle: '查看购买记录和订单状态' },
  profile: { route: '/settings?tab=profile', emoji: '⚙️', title: '个人设置', subtitle: '修改个人信息和偏好' },
  emotion_button: { route: '/energy-studio', emoji: '🎯', title: '情绪按钮', subtitle: '9种情绪场景，即时疗愈' },
  gratitude: { route: '/gratitude-journal', emoji: '📝', title: '感恩日记', subtitle: '记录日常感恩，生成幸福报告' },
  emotion_coach: { route: '/coach/vibrant_life_sage', emoji: '💙', title: '情绪教练', subtitle: '深度梳理情绪' },
  parent_coach: { route: '/parent-coach', emoji: '💜', title: '亲子教练', subtitle: '亲子情绪沟通' },
  communication_coach: { route: '/communication-coach', emoji: '💬', title: '沟通教练', subtitle: '改善人际沟通' },
  gratitude_coach: { route: '/coach/gratitude_coach', emoji: '💖', title: '感恩教练', subtitle: '日常感恩练习' },
  story_coach: { route: '/story-coach', emoji: '📖', title: '故事教练', subtitle: '英雄之旅创作' },
  vibrant_life: { route: '/coach/vibrant_life_sage', emoji: '❤️', title: '有劲生活教练', subtitle: '智能总入口' },
  training_camps: { route: '/camps', emoji: '🏕️', title: '训练营', subtitle: '21天系统化训练' },
  community: { route: '/community', emoji: '🌈', title: '社区', subtitle: '分享与交流' },
  packages: { route: '/packages', emoji: '📦', title: '会员套餐', subtitle: '查看所有套餐' },
};

// quick options：贴近用户真实问法，提升首轮命中率
const quickOptions = [
  { id: 'gratitude_entry', emoji: '💖', title: '感恩教练入口', prompt: '感恩教练入口在哪？' },
  { id: 'orders', emoji: '📋', title: '我的订单在哪看', prompt: '我的订单在哪里查看？' },
  { id: 'points', emoji: '🎯', title: '积分为什么扣了', prompt: '我的积分/点数是怎么扣的？' },
  { id: 'packages', emoji: '📦', title: '查套餐', prompt: '我想了解会员套餐的详情' },
  { id: 'camps', emoji: '🏕️', title: '训练营', prompt: '介绍一下有劲的训练营' },
  { id: 'page_broken', emoji: '🔧', title: '我点不开页面', prompt: '我点某个页面打不开，请帮我处理' },
  { id: 'issue', emoji: '🐛', title: '报问题', prompt: '我遇到了一个具体问题需要反馈' },
  { id: 'suggestion', emoji: '💡', title: '提建议', prompt: '我想给有劲提一个建议' },
  { id: 'human', emoji: '👤', title: '联系人工', prompt: '我想联系人工客服' },
];

const CustomerSupport = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '直接说你想解决的问题就行 🌿\n\n比如「感恩教练入口在哪」、「我的订单在哪看」、「积分为什么扣了」。\n你也可以点上方快速选项，我会第一时间给你答案和入口卡片。' }
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
      // 关键：剥离首条 UI 欢迎语，避免 AI 误把它当成"已经打过招呼了，现在该寒暄"
      // 只把"真实的用户消息 + AI 回复"传给后端
      const realHistory = messages
        .filter((m, idx) => !(idx === 0 && m.role === 'assistant'))
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('customer-support', {
        body: {
          messages: [...realHistory, { role: userMessage.role, content: userMessage.content }],
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
    <>
      <DynamicOGMeta pageKey="customerSupport" />
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Header - 使用统一的PageHeader */}
      <PageHeader title="有劲AI客服" />

      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-[calc(100dvh-60px)]">
        {/* Quick Options */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">🎯 快速选项</p>
          <div className="flex flex-wrap gap-1.5">
            {quickOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleQuickOption(option.prompt)}
                disabled={isLoading}
                className="inline-flex items-center gap-1 bg-white/70 backdrop-blur-sm border border-border/50 rounded-full px-2.5 py-1 text-xs hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
              >
                <span>{option.emoji}</span>
                <span className="font-medium">{option.title}</span>
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
                      <p className="text-sm whitespace-pre-wrap">{message.content.replace(/\[QIWEI_QR\]/g, '')}</p>
                    </div>
                  </div>
                  
                  {/* 企微二维码卡片 */}
                  {message.role === 'assistant' && message.content.includes('[QIWEI_QR]') && (
                    <QiWeiQRCard />
                  )}
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
                          package_names={message.recommendations.packages.package_names} 
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
                      {message.recommendations.points_rules && (
                        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              🎯 积分规则
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <PointsRulesCard mode="detailed" />
                          </CardContent>
                        </Card>
                      )}
                      {message.recommendations.navigations?.map((nav, idx) => {
                        const pageInfo = PAGE_ROUTES[nav.page_type];
                        if (!pageInfo) return null;
                        return (
                          <SupportNavigationCard
                            key={idx}
                            emoji={pageInfo.emoji}
                            title={nav.title || pageInfo.title}
                            subtitle={pageInfo.subtitle}
                            route={pageInfo.route}
                            reason={nav.reason}
                          />
                        );
                      })}
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
      
      {/* Floating Feedback Button */}
      <FeedbackFloatingButton className="bottom-24 right-4" />
    </div>
    </>
  );
};

export default CustomerSupport;
