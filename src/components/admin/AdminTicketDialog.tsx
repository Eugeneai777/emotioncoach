import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Send, UserCheck, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  ticket_no: string;
  ticket_type: string;
  category: string | null;
  subject: string;
  description: string;
  priority: string;
  status: string;
  resolution: string | null;
  created_at: string;
  user_id: string | null;
  unread_admin_count?: number | null;
  assigned_to?: string | null;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "user" | "admin" | "system";
  sender_id: string | null;
  content: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "待处理", color: "bg-amber-500" },
  in_progress: { label: "处理中", color: "bg-blue-500" },
  resolved: { label: "已解决", color: "bg-green-500" },
  closed: { label: "已关闭", color: "bg-gray-500" },
};

interface Props {
  ticket: Ticket | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AdminTicketDialog({ ticket, onClose, onUpdated }: Props) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!ticket) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("customer_ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setMessages((data as TicketMessage[]) ?? []);
      setLoading(false);

      // 标记 user 消息已读 + 清零 unread_admin_count
      await supabase
        .from("customer_ticket_messages")
        .update({ read_by_admin: true })
        .eq("ticket_id", ticket.id)
        .eq("sender_type", "user")
        .eq("read_by_admin", false);
      await supabase
        .from("customer_tickets")
        .update({ unread_admin_count: 0 })
        .eq("id", ticket.id);
    };
    load();

    const channel = supabase
      .channel(`admin_ticket_${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "customer_ticket_messages",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new as TicketMessage]),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [ticket?.id]);

  if (!ticket) return null;

  const reply = async (markStatus?: "in_progress" | "resolved" | "closed") => {
    if (!input.trim()) {
      toast.error("请输入回复内容");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("ticket-reply", {
        body: {
          ticket_id: ticket.id,
          content: input.trim(),
          mark_status: markStatus,
        },
      });
      if (error) throw error;
      setInput("");
      toast.success(markStatus ? "回复已发送，工单状态已更新" : "回复已发送");
      onUpdated();
    } catch (e: any) {
      toast.error(`发送失败：${e?.message ?? "未知错误"}`);
    } finally {
      setSending(false);
    }
  };

  const claim = async () => {
    if (!adminId) return;
    const { error } = await supabase
      .from("customer_tickets")
      .update({ assigned_to: adminId, status: ticket.status === "open" ? "in_progress" : ticket.status })
      .eq("id", ticket.id);
    if (error) {
      toast.error("指派失败");
    } else {
      toast.success("已指派给我");
      onUpdated();
    }
  };

  const updateStatus = async (status: string) => {
    const updates: Record<string, any> = { status };
    if (status === "resolved" || status === "closed") {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = adminId;
    }
    const { error } = await supabase.from("customer_tickets").update(updates).eq("id", ticket.id);
    if (error) {
      toast.error("更新失败");
    } else {
      toast.success("状态已更新");
      // 写一条系统消息
      const label =
        status === "in_progress" ? "客服已认领，处理中" :
        status === "resolved" ? "客服已标记解决" : "工单已关闭";
      await supabase.from("customer_ticket_messages").insert({
        ticket_id: ticket.id,
        sender_type: "system",
        content: label,
      });
      onUpdated();
    }
  };

  const sc = statusConfig[ticket.status] ?? statusConfig.open;

  return (
    <Dialog open={!!ticket} onOpenChange={onClose}>
      <DialogContent size="lg" className="max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_no}</span>
            <Badge className={sc.color}>{sc.label}</Badge>
            {ticket.assigned_to === adminId && (
              <Badge variant="outline" className="text-xs">已指派给我</Badge>
            )}
          </DialogTitle>
          <p className="text-sm font-medium mt-1">{ticket.subject}</p>
        </DialogHeader>

        {/* 工具栏 */}
        <div className="px-6 py-2 border-b bg-muted/30 flex flex-wrap gap-2">
          {ticket.assigned_to !== adminId && (
            <Button size="sm" variant="outline" onClick={claim} className="gap-1">
              <UserCheck className="w-3.5 h-3.5" /> 指派给我
            </Button>
          )}
          {ticket.status === "open" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("in_progress")}>
              开始处理
            </Button>
          )}
          {(ticket.status === "open" || ticket.status === "in_progress") && (
            <>
              <Button size="sm" variant="outline" onClick={() => updateStatus("resolved")} className="gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 标记已解决
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus("closed")} className="gap-1">
                <XCircle className="w-3.5 h-3.5" /> 关闭工单
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 ml-auto"
            onClick={() => window.open("https://work.weixin.qq.com", "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5" /> 转交企微
          </Button>
        </div>

        {/* 对话流 */}
        <ScrollArea className="flex-1 min-h-[300px] max-h-[50vh] px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* 工单初始描述 */}
              <div className="flex justify-center">
                <div className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleString("zh-CN")} 用户提交
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="text-[10px] text-muted-foreground mb-0.5 ml-1">用户</div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap">
                    {ticket.description}
                  </div>
                </div>
              </div>

              {messages.map((m) => {
                if (m.sender_type === "system") {
                  return (
                    <div key={m.id} className="flex justify-center">
                      <div className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {m.content}
                      </div>
                    </div>
                  );
                }
                const isAdmin = m.sender_type === "admin";
                return (
                  <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%]">
                      <div className={`text-[10px] text-muted-foreground mb-0.5 ${isAdmin ? "text-right mr-1" : "ml-1"}`}>
                        {isAdmin ? "客服" : "用户"}
                      </div>
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                          isAdmin
                            ? "bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
                            : "bg-blue-50 border border-blue-100"
                        }`}
                      >
                        {m.content}
                      </div>
                      <div className={`text-[10px] text-muted-foreground mt-0.5 ${isAdmin ? "text-right mr-1" : "ml-1"}`}>
                        {new Date(m.created_at).toLocaleString("zh-CN", {
                          month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          )}
        </ScrollArea>

        {/* 回复输入 */}
        <div className="border-t p-4 space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入回复内容…用户会通过微信模板消息收到通知"
            rows={3}
            className="resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={!input.trim() || sending}
              onClick={() => reply()}
              className="gap-1"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              仅回复
            </Button>
            <Button
              size="sm"
              disabled={!input.trim() || sending}
              onClick={() => reply("resolved")}
              className="gap-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              回复并标记解决
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
