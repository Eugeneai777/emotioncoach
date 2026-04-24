import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, RotateCcw, WifiOff, Inbox } from "lucide-react";
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
import { HistoryDrawer } from "@/components/customer-support/HistoryDrawer";
import { PointsRulesCard } from "@/components/PointsRulesCard";
import FeedbackFloatingButton from "@/components/FeedbackFloatingButton";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { PAGE_ROUTES } from "@/config/customerSupportRoutes";
import { isWeChatMiniProgram } from "@/utils/platform";
import { useUnreadTickets } from "@/hooks/useUnreadTickets";

interface Navigation {
  page_type: string;
  title: string;
  reason?: string;
}

interface TicketRef {
  ticket_no: string;
  subject?: string;
  ticket_id?: string;
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

// quick options：商业化精简至 6 项，按转化优先级排序
// 转化项前置（套餐/训练营/教练）→ 防流失（积分）→ 反馈合并 → 兜底人工
const quickOptions = [
  { id: 'packages', emoji: '🎯', title: '看看有什么套餐', prompt: '我想了解会员套餐的详情' },
  { id: 'camps', emoji: '🔥', title: '训练营怎么选', prompt: '介绍一下有劲的训练营，我该选哪个' },
  { id: 'gratitude_entry', emoji: '💝', title: '找教练入口', prompt: '我想找各类教练的入口在哪里' },
  { id: 'points', emoji: '💰', title: '积分/点数问题', prompt: '我的积分/点数是怎么扣的？' },
  { id: 'issue', emoji: '🐛', title: '报问题/提建议', prompt: '我遇到了一个问题或想给有劲提个建议' },
  { id: 'human', emoji: '👤', title: '联系人工', prompt: '我想联系人工客服' },
];

const CustomerSupport = () => {
  const navigate = useNavigate();
  const { unreadCount } = useUnreadTickets();
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

  // 支付成功庆祝气泡：监听独立 sessionStorage key（与支付主流程完全隔离）
  // 用一次即清，静默降级，不写任何业务状态
  useEffect(() => {
    const KEY = 'support_payment_celebration';
    let cancelled = false;
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return;
      sessionStorage.removeItem(KEY);
      const info = JSON.parse(raw) as { packageName?: string; route?: string; orderId?: string };
      if (!info?.packageName) return;
      // 延迟 600ms 让欢迎语先出，更自然
      const t = setTimeout(() => {
        if (cancelled) return;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ 已成功开通「${info.packageName}」，可以直接进入使用啦～`,
          recommendations: info.route
            ? { navigations: [{ page_type: '__celebration__', title: `进入「${info.packageName}」`, reason: '支付成功' }] }
            : undefined,
        }]);
        // 把 route 临时塞进 ref 给 safeNavigate 用
        celebrationRouteRef.current = info.route ?? null;
      }, 600);
      return () => { cancelled = true; clearTimeout(t); };
    } catch {
      // 损坏数据静默丢弃
    }
  }, []);

  // 支付庆祝跳转目的地（独立于 PAGE_ROUTES，避免污染既有路由表）
  const celebrationRouteRef = useRef<string | null>(null);

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

  // 从历史抽屉恢复会话
  const handleRestoreHistory = (restored: Array<{ role: 'user' | 'assistant'; content: string }>, restoredSessionId: string) => {
    setMessages([
      { role: 'assistant', content: '已恢复历史会话，可以接着聊 🌿' },
      ...restored,
    ]);
    sessionId.current = restoredSessionId;
  };

  return (
    <>
      <DynamicOGMeta pageKey="customerSupport" />
      <div
        className="min-h-[100vh] [min-height:100svh] bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50"
      >
        <PageHeader
          title="有劲AI客服"
          rightActions={
            <div className="flex items-center gap-1">
              <HistoryDrawer onRestore={handleRestoreHistory} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/my-tickets')}
                className="relative gap-1 px-2 text-xs"
                aria-label="我的工单"
              >
                <Inbox className="w-4 h-4" />
                <span className="hidden sm:inline">我的工单</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-white text-[10px] font-medium flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>
          }
        />

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
          {/* Quick Options：横向滚动，固定一行，不挤压聊天区；末尾留呼吸位避免被截断 */}
          <div className="mb-3 flex-shrink-0">
            <p className="text-xs text-muted-foreground mb-1.5">🎯 快速选项</p>
            <div
              className="flex gap-1.5 pb-1 overflow-x-auto md:overflow-x-visible md:flex-wrap -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-proximity md:snap-none [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
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
              {/* 末尾呼吸位：移动端保证最后一项「联系人工」可完整滑出；桌面端换行后无需 */}
              <div className="shrink-0 w-2 md:hidden" aria-hidden="true" />
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
                            ticket_id={message.recommendations.ticket.ticket_id}
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
                            // 支付庆祝伪 page_type：使用 ref 中暂存的目标路由
                            if (nav.page_type === '__celebration__') {
                              const route = celebrationRouteRef.current || '/my-page';
                              return (
                                <SupportNavigationCard
                                  key={idx}
                                  emoji="✨"
                                  title={nav.title}
                                  subtitle="点击进入"
                                  route={route}
                                  reason={nav.reason}
                                  onNavigate={() => safeNavigate(route)}
                                />
                              );
                            }
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
