import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ConvRow {
  id: string;
  session_id: string | null;
  title: string | null;
  last_user_message: string | null;
  last_message_at: string | null;
  created_at: string;
  messages: any;
}

interface Props {
  onRestore: (messages: Array<{ role: "user" | "assistant"; content: string }>, sessionId: string) => void;
}

export function HistoryDrawer({ onRestore }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ConvRow[]>([]);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from("support_conversations")
      .select("id, session_id, title, last_user_message, last_message_at, created_at, messages")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(10)
      .then(({ data }) => {
        setRows((data as ConvRow[]) ?? []);
        setLoading(false);
      });
  }, [open, user?.id]);

  const restore = (row: ConvRow) => {
    const msgs = Array.isArray(row.messages) ? row.messages : [];
    const filtered = msgs.filter(
      (m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    );
    if (filtered.length === 0) return;
    onRestore(filtered, row.session_id ?? `session_${Date.now()}`);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2 text-xs" aria-label="历史会话">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">历史</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>近 7 天会话</SheetTitle>
          <SheetDescription className="text-xs">点击恢复继续对话，最多展示 10 条</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              暂无历史会话
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((row) => {
                const preview =
                  row.last_user_message ||
                  row.title ||
                  (Array.isArray(row.messages)
                    ? row.messages.find((m: any) => m?.role === "user")?.content
                    : null) ||
                  "（空会话）";
                const ts = row.last_message_at || row.created_at;
                return (
                  <button
                    key={row.id}
                    onClick={() => restore(row)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 break-words">{preview}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
