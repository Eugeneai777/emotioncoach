import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, RotateCcw, WifiOff } from "lucide-react";
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
import { SupportTicketCard } from "@/components/customer-support/SupportTicketCard";
import { QiWeiQRCard } from "@/components/customer-support/QiWeiQRCard";
import { PointsRulesCard } from "@/components/PointsRulesCard";
import FeedbackFloatingButton from "@/components/FeedbackFloatingButton";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { PAGE_ROUTES } from "@/config/customerSupportRoutes";
import { isWeChatMiniProgram } from "@/utils/platform";

interface Navigation {
  page_type: string;
  title: string;
  reason?: string;
}

interface TicketRef {
  ticket_no: string;
  subject?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  failed?: boolean;
  recommendations?: {
    coaches?: Array<{ coach_key: string; reason: string }>;
    packages?: { package_ids?: string[]; package_names?: string[]; highlight_reason?: string };
    camps?: Array<{ camp_type: string; reason: string }>;
    points_rules?: { show_balance: boolean };
    navigations?: Navigation[];
    ticket?: TicketRef;
  };
}

// 兼容 [QIWEI_QR] / 【QIWEI_QR】 / (QIWEI-QR) 等多种 AI 写法
const QIWEI_QR_REGEX = /[【[(（]\s*QIWEI[_-]?QR\s*[\])）】]/i;

// quick options：贴近用户真实问法，提升首轮命中率
const quickOptions = [
  { id: 'gratitude_entry', emoji: '💖', title: '感恩教练入口', prompt: '感恩教练入口在哪？' },
  { id: 'orders', emoji: '📋', title: '我的订单', prompt: '我的订单在哪里查看？' },
  { id: 'points', emoji: '🎯', title: '积分扣费', prompt: '我的积分/点数是怎么扣的？' },
  { id: 'packages', emoji: '📦', title: '查套餐', prompt: '我想了解会员套餐的详情' },
  { id: 'camps', emoji: '🏕️', title: '训练营', prompt: '介绍一下有劲的训练营' },
  { id: 'page_broken', emoji: '🔧', title: '点不开页面', prompt: '我点某个页面打不开，请帮我处理' },
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
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session_${Date.now()}`);
  const inMiniProgram = typeof window !== 'undefined' && isWeChatMiniProgram();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 关键：剥离首条 UI 欢迎语，避免 AI 误以为已寒暄过、要继续寒暄
      // 同时剥离失败的占位消息，避免污染上下文
      const realHistory = messages
        .filter((m, idx) => !(idx === 0 && m.role === 'assistant'))
        .filter(m => !m.failed)
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
      // 失败也插入一条带 retry 标记的 assistant 消息，并自动暴露企微入口
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，服务暂时不可用。你可以点下方按钮重试，或扫码联系企微人工客服。',
        failed: true,
        recommendations: { } // 保留对象以便后续扩展
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    // 找到最后一条 user 消息重发，并移除失败的 assistant 占位
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === 'user');
      if (idx === -1) return prev;
      const lastUserIdx = prev.length - 1 - idx;
      const lastUserMsg = prev[lastUserIdx];
      // 移除最后一条 user 之后的所有 failed assistant
      const trimmed = prev.slice(0, lastUserIdx);
      // 用 setTimeout 确保 state 更新顺序
      setTimeout(() => sendMessage(lastUserMsg.content), 0);
      return trimmed;
    });
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

  // 三端兼容跳转：小程序 WebView 内 react-router 偶发白屏，失败回退 location
  const safeNavigate = (route: string) => {
    try {
      navigate(route);
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = route;
      }
    }
  };

  return (
    <>
      <DynamicOGMeta pageKey="customerSupport" />
      <div
        className="min-h-[100vh] [min-height:100svh] bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50"
      >
        <PageHeader title="有劲AI客服" />

        {/* 网络断开提示 */}
        {!isOnline && (
          <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs text-amber-800">
            <WifiOff className="w-3.5 h-3.5" />
            网络已断开，发送消息可能失败，请检查网络
          </div>
        )}

        <div
          className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-60px)] [height:calc(100dvh-60px)]"
        >
          {/* Quick Options：横向滚动，固定一行，不挤压聊天区 */}
          <div className="mb-3 flex-shrink-0">
            <p className="text-xs text-muted-foreground mb-1.5">🎯 快速选项</p>
            <div
              className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none' }}
            >
              {quickOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleQuickOption(option.prompt)}
                  disabled={isLoading}
                  className="snap-start shrink-0 inline-flex items-center gap-1 bg-white/70 backdrop-blur-sm border border-border/50 rounded-full px-2.5 py-1 text-xs hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                >
                  <span>{option.emoji}</span>
                  <span className="font-medium whitespace-nowrap">{option.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-xl border border-border/50 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const hasQrMarker = message.role === 'assistant' && QIWEI_QR_REGEX.test(message.content);
                  const cleanContent = hasQrMarker
                    ? message.content.replace(QIWEI_QR_REGEX, '').trim()
                    : message.content;
                  const showQrCard = hasQrMarker || (message.failed === true);

                  return (
                    <div key={index}>
                      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white'
                              : message.failed
                                ? 'bg-destructive/10 border border-destructive/30'
                                : 'bg-muted/50'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{cleanContent}</p>
                          {message.failed && (
                            <button
                              onClick={handleRetry}
                              className="mt-2 inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                            >
                              <RotateCcw className="w-3 h-3" />
                              重新发送
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 工单卡片 */}
                      {message.recommendations?.ticket && (
                        <div className="mt-3">
                          <SupportTicketCard
                            ticket_no={message.recommendations.ticket.ticket_no}
                            subject={message.recommendations.ticket.subject}
                          />
                        </div>
                      )}

                      {/* 企微二维码卡片：标记或失败时展示 */}
                      {showQrCard && <QiWeiQRCard defaultOpen={message.failed === true} />}

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
                                onNavigate={() => safeNavigate(pageInfo.route)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
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

            {/* Input Area：底部预留 safe-area，避免 iOS Home 指示条遮挡 */}
            <div
              className="border-t border-border/50 p-3"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={inMiniProgram ? "输入您的问题（小程序版）..." : "输入您的问题..."}
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

        <FeedbackFloatingButton className="bottom-24 right-4" />
      </div>
    </>
  );
};

export default CustomerSupport;
