import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Send, Loader2, Ticket as TicketIcon, MessageSquare } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { QiWeiQRCard } from "@/components/customer-support/QiWeiQRCard";

interface TicketDetail {
  id: string;
  user_id: string;
  ticket_no: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "user" | "admin" | "system";
  sender_id: string | null;
  content: string;
  created_at: string;
}

const statusLabel = (s: string) =>
  ({ open: "待处理", in_progress: "处理中", resolved: "已解决", closed: "已关闭" } as any)[s] || s;

const MyTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // 滚到底
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 拉工单 + 消息 + 标记已读
  useEffect(() => {
    if (!id || !user) return;

    const load = async () => {
      const { data: t } = await supabase
        .from("customer_tickets")
        .select("id, user_id, ticket_no, subject, description, status, priority, created_at")
        .eq("id", id)
        .maybeSingle();
      if (!t || t.user_id !== user.id) {
        toast.error("工单不存在或无权查看");
        navigate("/my-tickets");
        return;
      }
      setTicket(t as TicketDetail);

      const { data: msgs } = await supabase
        .from("customer_ticket_messages")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });
      setMessages((msgs as TicketMessage[]) ?? []);
      setLoading(false);

      // 标记 admin 消息已读 + 清零工单 unread_user_count
      await supabase
        .from("customer_ticket_messages")
        .update({ read_by_user: true })
        .eq("ticket_id", id)
        .eq("sender_type", "admin")
        .eq("read_by_user", false);
      await supabase
        .from("customer_tickets")
        .update({ unread_user_count: 0 })
        .eq("id", id)
        .eq("user_id", user.id);
    };
    load();

    // realtime 新消息
    const channel = supabase
      .channel(`ticket_msgs_${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "customer_ticket_messages", filter: `ticket_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as TicketMessage]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user?.id]);

  const send = async () => {
    if (!input.trim() || !user || !ticket || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    const { error } = await supabase.from("customer_ticket_messages").insert({
      ticket_id: ticket.id,
      sender_type: "user",
      sender_id: user.id,
      content,
    });
    setSending(false);
    if (error) {
      toast.error("发送失败，请稍后重试");
      setInput(content);
    }
  };

  return (
    <div className="min-h-[100vh] [min-height:100svh] bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 flex flex-col">
      <PageHeader title="工单详情" />

      <div className="max-w-2xl mx-auto w-full px-4 py-3 flex-1 flex flex-col min-h-0">
        {/* 工单头部信息 */}
        {ticket && (
          <div className="bg-white/70 backdrop-blur-sm border border-border/50 rounded-xl p-3 mb-3 flex-shrink-0">
            <div className="flex items-start gap-2">
              <TicketIcon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate flex-1">{ticket.subject}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {statusLabel(ticket.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {ticket.ticket_no}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 消息流 */}
        <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-xl border border-border/50 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && ticket && (
              <div className="space-y-3">
                {/* 工单初始描述作为系统首条 */}
                <div className="flex justify-center">
                  <div className="text-[10px] bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleString("zh-CN")} 工单已创建
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-gradient-to-r from-teal-400 to-cyan-500 text-white text-sm whitespace-pre-wrap">
                    {ticket.description}
                  </div>
                </div>

                {messages.map((m) => {
                  if (m.sender_type === "system") {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="text-[10px] bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground">
                          {m.content}
                        </div>
                      </div>
                    );
                  }
                  const isUser = m.sender_type === "user";
                  return (
                    <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%]">
                        {!isUser && (
                          <div className="text-[10px] text-muted-foreground mb-0.5 ml-1">
                            👤 客服回复
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                            isUser
                              ? "bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
                              : "bg-amber-50 border border-amber-100 text-foreground"
                          }`}
                        >
                          {m.content}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 px-1">
                          {new Date(m.created_at).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 已关闭/已解决，附企微入口 */}
                {(ticket.status === "resolved" || ticket.status === "closed") && (
                  <div className="pt-2">
                    <div className="text-[11px] text-center text-muted-foreground mb-2">
                      工单已结束。如未解决，可联系企微人工客服
                    </div>
                    <QiWeiQRCard />
                  </div>
                )}

                <div ref={endRef} />
              </div>
            )}
          </ScrollArea>

          {/* 用户回复输入 */}
          <div
            className="border-t border-border/50 p-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="补充说明、追问或回复客服…"
                className="min-h-[44px] max-h-[120px] resize-none bg-background/50"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <Button
                onClick={send}
                disabled={!input.trim() || sending}
                className="shrink-0 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> 客服回复后会通过微信通知您
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTicketDetail;
