import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, ChevronRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface TicketRow {
  id: string;
  ticket_no: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  last_message_at: string | null;
  unread_user_count: number;
}

const statusMeta = (status: string) => {
  switch (status) {
    case "open":
      return { label: "待处理", color: "bg-amber-100 text-amber-700", icon: Clock };
    case "in_progress":
      return { label: "处理中", color: "bg-blue-100 text-blue-700", icon: AlertCircle };
    case "resolved":
      return { label: "已解决", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
    case "closed":
      return { label: "已关闭", color: "bg-muted text-muted-foreground", icon: CheckCircle2 };
    default:
      return { label: status, color: "bg-muted text-muted-foreground", icon: Clock };
  }
};

const formatTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day && d.getDate() === now.getDate())
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (diff < 7 * day) return `${Math.max(1, Math.floor(diff / day))}天前`;
  return d.toLocaleDateString("zh-CN");
};

const MyTickets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("customer_tickets")
        .select("id, ticket_no, subject, status, priority, created_at, last_message_at, unread_user_count")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(50);
      setTickets((data as TicketRow[]) ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`my_tickets_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customer_tickets",
          filter: `user_id=eq.${user.id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <div className="min-h-[100vh] [min-height:100svh] bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50">
      <PageHeader title="我的工单" />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {!user && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            请先登录以查看您的工单
          </Card>
        )}
        {user && loading && (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        )}
        {user && !loading && tickets.length === 0 && (
          <Card className="p-8 text-center">
            <Ticket className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">暂无工单</p>
            <p className="text-xs text-muted-foreground mt-1">
              在客服里反馈问题后，会自动生成工单
            </p>
          </Card>
        )}
        {tickets.map((t) => {
          const meta = statusMeta(t.status);
          const StatusIcon = meta.icon;
          return (
            <Card
              key={t.id}
              onClick={() => navigate(`/my-tickets/${t.id}`)}
              className="p-4 cursor-pointer hover:shadow-md active:scale-[0.99] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-amber-600" />
                  {t.unread_user_count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-medium flex items-center justify-center">
                      {t.unread_user_count > 9 ? "9+" : t.unread_user_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate flex-1">{t.subject}</p>
                    <Badge className={`${meta.color} text-[10px] gap-1 border-0`}>
                      <StatusIcon className="w-3 h-3" />
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {t.ticket_no}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(t.last_message_at || t.created_at)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyTickets;
