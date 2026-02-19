import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "date" | "views" | "purchases" | "spend" | "shares";

interface PartnerLandingPageListProps {
  partnerId: string;
  level: string;
  fromAdmin?: boolean;
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
  published_at: string | null;
  volume: string | null;
}

export function PartnerLandingPageList({ partnerId, level, fromAdmin }: PartnerLandingPageListProps) {
  const navigate = useNavigate();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Record<string, { views: number; purchases: number; shares: number }>>({});
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchPages();
  }, [partnerId, level]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_landing_pages" as any)
        .select("id, target_audience, selected_version, content_a, content_b, channel, status, created_at, published_at, volume")
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

      const result: Record<string, { views: number; purchases: number; shares: number }> = {};
      pageIds.forEach(id => { result[id] = { views: 0, purchases: 0, shares: 0 }; });

      (events as any[]).forEach((e) => {
        const lpId = e.metadata?.landing_page_id;
        if (!lpId || !result[lpId]) return;
        if (e.event_type === "page_view" || e.event_type === "click") {
          result[lpId].views++;
        } else if (e.event_type === "payment") {
          result[lpId].purchases++;
        } else if (e.event_type === "share") {
          result[lpId].shares++;
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

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => {
      let valA: number, valB: number;
      const mA = metrics[a.id] || { views: 0, purchases: 0, shares: 0 };
      const mB = metrics[b.id] || { views: 0, purchases: 0, shares: 0 };
      switch (sortKey) {
        case "views": valA = mA.views; valB = mB.views; break;
        case "purchases": valA = mA.purchases; valB = mB.purchases; break;
        case "spend": valA = 0; valB = 0; break;
        case "shares": valA = mA.shares; valB = mB.shares; break;
        default: valA = new Date(a.created_at).getTime(); valB = new Date(b.created_at).getTime();
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [pages, metrics, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortAsc ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />;
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
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">推广活动 ({pages.length})</p>
      {/* Sortable header */}
      <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-muted-foreground select-none">
        <span className="shrink-0 w-10 cursor-pointer hover:text-foreground" onClick={() => toggleSort("date")}>日期 <SortIcon k="date" /></span>
        <span className="flex-1">标题</span>
        <span className="shrink-0 w-14 text-center">投放</span>
        <span className="shrink-0 w-10 text-center">天数</span>
        <span className="shrink-0 w-10 cursor-pointer hover:text-foreground text-center" onClick={() => toggleSort("shares")}>转发 <SortIcon k="shares" /></span>
        <span className="shrink-0 w-10 cursor-pointer hover:text-foreground text-center" onClick={() => toggleSort("views")}>观看 <SortIcon k="views" /></span>
        <span className="shrink-0 w-10 cursor-pointer hover:text-foreground text-center" onClick={() => toggleSort("purchases")}>购买 <SortIcon k="purchases" /></span>
        <span className="shrink-0 w-10 cursor-pointer hover:text-foreground text-center" onClick={() => toggleSort("spend")}>金额 <SortIcon k="spend" /></span>
        <span className="shrink-0 w-10"></span>
        <span className="shrink-0 w-3.5"></span>
      </div>
      {sortedPages.map((page) => {
        const content = getSelectedContent(page);
        const m = metrics[page.id] || { views: 0, purchases: 0, shares: 0 };
        const d = new Date(page.created_at);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
        const publishDate = page.published_at ? new Date(page.published_at) : null;
        const daysSince = page.status === "published" && publishDate ? Math.max(1, Math.floor((Date.now() - publishDate.getTime()) / 86400000)) : 0;
        return (
          <div
            key={page.id}
            className="flex items-center gap-2 p-2 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors text-xs"
            onClick={() => navigate(`/partner/landing-page/${page.id}${fromAdmin ? '?from=admin' : ''}`)}
          >
            <span className="text-muted-foreground shrink-0 w-10">{dateStr}</span>
            <span className="font-medium truncate min-w-0 flex-1">{content?.title || "无标题"}</span>
            <span className="text-muted-foreground shrink-0 w-14 text-center truncate" title={page.volume || "—"}>{page.volume || "—"}</span>
            <span className={cn("shrink-0 w-10 text-center", daysSince > 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>{daysSince > 0 ? `${daysSince}天` : "—"}</span>
            <span className={cn("shrink-0 w-10 text-center", m.shares > 0 ? "font-semibold text-purple-600" : "text-muted-foreground")}>{m.shares}</span>
            <span className={cn("shrink-0 w-10 text-center", m.views > 0 ? "font-semibold text-blue-600" : "text-muted-foreground")}>{m.views}</span>
            <span className={cn("shrink-0 w-10 text-center", m.purchases > 0 ? "font-semibold text-emerald-600" : "text-muted-foreground")}>{m.purchases}</span>
            <span className="text-muted-foreground shrink-0 w-10 text-center">¥0</span>
            <div className={cn(
              "px-1.5 py-0.5 rounded shrink-0 w-10 text-center text-[10px]",
              page.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
            )}>
              {page.status === "published" ? "已发布" : "草稿"}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </div>
        );
      })}
    </div>
  );
}
