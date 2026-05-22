import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";

interface Row {
  id: string;
  name: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  user_id: string | null;
}

interface Props {
  userId: string;
  inviteToken: string | null;
}

const statusMeta: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export function MyApplicationsCard({ userId, inviteToken }: Props) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("human_coaches")
        .select("id, name, status, admin_note, created_at, user_id")
        .eq("submitted_by_user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      // 只展示代申请记录（user_id 为空）；自申请已由顶部 banner 提示
      const proxyOnly = (data || []).filter((r: any) => r.user_id === null);
      setRows(proxyOnly as Row[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading || rows.length === 0) return null;

  const handleEdit = (id: string) => {
    const params = new URLSearchParams();
    if (inviteToken) params.set("invite", inviteToken);
    params.set("mode", "proxy");
    params.set("edit", id);
    navigate(`/become-coach?${params.toString()}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="bg-white/70 border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-muted/40"
        >
          <span className="font-medium">
            我的代申请记录（{rows.length}）
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const meta = statusMeta[r.status] || { label: r.status, variant: "outline" as const };
              const canEdit = r.status === "pending" || r.status === "rejected";
              return (
                <li key={r.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        提交于 {new Date(r.created_at).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {canEdit && (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(r.id)}>
                          <Pencil className="w-3 h-3 mr-1" />
                          编辑
                        </Button>
                      )}
                    </div>
                  </div>
                  {r.status === "rejected" && r.admin_note && (
                    <div className="text-xs text-destructive bg-destructive/5 rounded px-2 py-1.5">
                      拒绝原因：{r.admin_note}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
