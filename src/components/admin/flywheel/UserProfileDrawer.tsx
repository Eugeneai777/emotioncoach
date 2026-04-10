import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

interface UserProfileDrawerProps {
  userId: string | null;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserDetail {
  orders: { package_key: string; package_name: string; amount: number; created_at: string }[];
  camps: { camp_name: string; camp_type: string; status: string; completed_days: number; duration_days: number; check_in_dates: string[] }[];
  posts: { id: string; title: string; created_at: string }[];
  conversations: { coach_type: string; count: number; latest: string }[];
}

export function UserProfileDrawer({ userId, displayName, open, onOpenChange }: UserProfileDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  useEffect(() => {
    if (open && userId) {
      loadDetail(userId);
    }
  }, [open, userId]);

  const loadDetail = async (uid: string) => {
    setLoading(true);
    try {
      const [ordersRes, campsRes, postsRes, convsRes] = await Promise.all([
        supabase.from("orders").select("package_key, package_name, amount, created_at")
          .eq("user_id", uid).eq("status", "paid").order("created_at", { ascending: false }).limit(20),
        supabase.from("training_camps").select("camp_name, camp_type, status, completed_days, duration_days, check_in_dates")
          .eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
        supabase.from("community_posts").select("id, title, created_at")
          .eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
        supabase.from("conversations").select("coach_type, created_at")
          .eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
      ]);

      // Aggregate conversations by coach_type
      const convMap = new Map<string, { count: number; latest: string }>();
      (convsRes.data || []).forEach((c: any) => {
        const existing = convMap.get(c.coach_type);
        if (existing) {
          existing.count++;
        } else {
          convMap.set(c.coach_type, { count: 1, latest: c.created_at });
        }
      });

      setDetail({
        orders: (ordersRes.data || []) as any[],
        camps: (campsRes.data || []) as any[],
        posts: (postsRes.data || []) as any[],
        conversations: Array.from(convMap.entries()).map(([coach_type, v]) => ({
          coach_type, count: v.count, latest: v.latest,
        })),
      });
    } catch (err) {
      console.error("Failed to load user detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d: string) => {
    try { return format(new Date(d), "MM-dd HH:mm"); } catch { return d; }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{displayName || "用户"} — 行为详情</DrawerTitle>
          <DrawerDescription>近期测评、学习、社区、AI交互记录</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-5 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detail ? (
            <>
              {/* Orders / Assessments */}
              <Section title="📋 测评/购买记录">
                {detail.orders.length === 0 ? <Empty /> : (
                  <div className="space-y-1.5">
                    {detail.orders.map((o, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b border-border/50 pb-1.5">
                        <span className="truncate flex-1">{o.package_name}</span>
                        <span className="text-muted-foreground ml-2 shrink-0">¥{o.amount}</span>
                        <span className="text-muted-foreground ml-2 shrink-0 text-xs">{fmtDate(o.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Training Camps */}
              <Section title="🏕️ 训练营学习">
                {detail.camps.length === 0 ? <Empty /> : (
                  <div className="space-y-2">
                    {detail.camps.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="truncate flex-1">{c.camp_name}</span>
                        <Badge variant={c.status === "completed" ? "default" : c.status === "active" ? "secondary" : "outline"}>
                          {c.status === "completed" ? "已完营" : c.status === "active" ? `Day ${c.completed_days}/${c.duration_days}` : c.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground shrink-0">
                          打卡{(c.check_in_dates || []).length}天
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Community */}
              <Section title="📝 社区互动">
                {detail.posts.length === 0 ? <Empty /> : (
                  <div className="space-y-1.5">
                    {detail.posts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <a href={`/community/post/${p.id}`} target="_blank" rel="noopener" className="truncate flex-1 text-primary hover:underline flex items-center gap-1">
                          {p.title || "无标题"}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">{fmtDate(p.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* AI Conversations */}
              <Section title="🤖 AI 交互">
                {detail.conversations.length === 0 ? <Empty /> : (
                  <div className="space-y-1.5">
                    {detail.conversations.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{c.coach_type || "通用"}</span>
                        <span className="text-muted-foreground">{c.count}轮</span>
                        <span className="text-xs text-muted-foreground">{fmtDate(c.latest)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-muted-foreground">暂无记录</p>;
}
