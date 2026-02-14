import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronRight, Eye, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerLandingPageListProps {
  partnerId: string;
  level: string;
}

interface LandingPage {
  id: string;
  target_audience: string | null;
  selected_version: string | null;
  content_a: any;
  content_b: any;
  channel: string | null;
  status: string;
  created_at: string;
}

export function PartnerLandingPageList({ partnerId, level }: PartnerLandingPageListProps) {
  const navigate = useNavigate();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Record<string, { views: number; purchases: number }>>({});

  useEffect(() => {
    fetchPages();
  }, [partnerId, level]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_landing_pages" as any)
        .select("id, target_audience, selected_version, content_a, content_b, channel, status, created_at")
        .eq("partner_id", partnerId)
        .eq("level", level)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const pageList = (data as any) || [];
      setPages(pageList);

      // Fetch real metrics
      if (pageList.length > 0) {
        fetchMetrics(pageList.map((p: LandingPage) => p.id));
      }
    } catch (err) {
      console.error("Fetch landing pages error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async (pageIds: string[]) => {
    try {
      const { data: events } = await supabase
        .from("conversion_events" as any)
        .select("event_type, metadata")
        .eq("feature_key", "landing_page");

      if (!events) return;

      const result: Record<string, { views: number; purchases: number }> = {};
      pageIds.forEach(id => { result[id] = { views: 0, purchases: 0 }; });

      (events as any[]).forEach((e) => {
        const lpId = e.metadata?.landing_page_id;
        if (!lpId || !result[lpId]) return;
        if (e.event_type === "page_view" || e.event_type === "click") {
          result[lpId].views++;
        } else if (e.event_type === "payment") {
          result[lpId].purchases++;
        }
      });

      setMetrics(result);
    } catch (err) {
      console.error("Fetch metrics error:", err);
    }
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
        暂无推广活动
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">推广活动 ({pages.length})</p>
      {pages.map((page) => {
        const content = getSelectedContent(page);
        const m = metrics[page.id] || { views: 0, purchases: 0 };
        return (
          <div
            key={page.id}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate(`/partner/landing-page/${page.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{content?.title || "无标题"}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span className="truncate max-w-[80px]">{page.target_audience || "—"}</span>
                <span className="flex items-center gap-0.5 shrink-0">
                  <Eye className="w-3 h-3" />
                  <span>{m.views}</span>
                </span>
                <span className="flex items-center gap-0.5 shrink-0">
                  <ShoppingCart className="w-3 h-3" />
                  <span>{m.purchases}</span>
                </span>
                <span className="shrink-0">{new Date(page.created_at).toLocaleDateString("zh-CN")}</span>
              </div>
            </div>
            <div className={cn(
              "text-xs px-1.5 py-0.5 rounded shrink-0",
              page.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
            )}>
              {page.status === "published" ? "已发布" : "草稿"}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        );
      })}
    </div>
  );
}
