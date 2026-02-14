import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Trash2, Loader2, Copy, FileText } from "lucide-react";
import { toast } from "sonner";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
import { cn } from "@/lib/utils";

interface PartnerLandingPageListProps {
  partnerId: string;
  level: string;
}

interface LandingPage {
  id: string;
  target_audience: string | null;
  matched_product: string | null;
  selected_version: string | null;
  content_a: any;
  content_b: any;
  channel: string | null;
  status: string;
  created_at: string;
}

export function PartnerLandingPageList({ partnerId, level }: PartnerLandingPageListProps) {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, [partnerId, level]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_landing_pages" as any)
        .select("id, target_audience, matched_product, selected_version, content_a, content_b, channel, status, created_at")
        .eq("partner_id", partnerId)
        .eq("level", level)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPages((data as any) || []);
    } catch (err) {
      console.error("Fetch landing pages error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此落地页？")) return;
    try {
      const { error } = await supabase.from("partner_landing_pages" as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("已删除");
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error("删除失败: " + (err.message || "未知错误"));
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${getPromotionDomain()}/lp/${id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("链接已复制"));
  };

  const handleOpenPreview = (id: string) => {
    const url = `${window.location.origin}/lp/${id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getSelectedContent = (page: LandingPage) => {
    return page.selected_version === "a" ? page.content_a : page.content_b;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        暂无已保存的落地页
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">已保存落地页 ({pages.length})</p>
      {pages.map((page) => {
        const content = getSelectedContent(page);
        return (
          <Card key={page.id} className="border-dashed">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{content?.title || "无标题"}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{page.target_audience || "—"}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{page.channel || "—"}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(page.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "text-xs px-1.5 py-0.5 rounded shrink-0",
                  page.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                )}>
                  {page.status === "published" ? "已发布" : "草稿"}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => handleCopyLink(page.id)}>
                  <Copy className="w-3 h-3 mr-1" /> 复制链接
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => handleOpenPreview(page.id)}>
                  <ExternalLink className="w-3 h-3 mr-1" /> 预览
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(page.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
