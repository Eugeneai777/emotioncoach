import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * 监听当前用户工单未读总数（unread_user_count）
 * - 初次拉取
 * - realtime 订阅 customer_tickets 行变化
 */
export function useUnreadTickets() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const fetchCount = async () => {
      const { data } = await supabase
        .from("customer_tickets")
        .select("unread_user_count")
        .eq("user_id", user.id);
      if (cancelled) return;
      const total = (data ?? []).reduce(
        (sum, t: any) => sum + (t.unread_user_count ?? 0),
        0,
      );
      setUnreadCount(total);
    };

    fetchCount();

    const channel = supabase
      .channel(`unread_tickets_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customer_tickets",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchCount(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { unreadCount };
}
