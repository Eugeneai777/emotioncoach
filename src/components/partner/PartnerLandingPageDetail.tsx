import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy, ExternalLink, Trash2, Loader2, Pencil, Check, X, Plus, Eye, ShoppingCart, TrendingUp, Megaphone, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
import { cn } from "@/lib/utils";

interface LandingPageData {
  id: string;
  target_audience: string | null;
  matched_product: string | null;
  selected_version: string | null;
  content_a: any;
  content_b: any;
  channel: string | null;
  status: string;
  created_at: string;
  level: string | null;
  volume: string | null;
  partner_id: string | null;
}

export default function PartnerLandingPageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin";
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<{ views: number; purchases: number }>({ views: 0, purchases: 0 });

  // Editable fields
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editPoints, setEditPoints] = useState<string[]>([]);
  const [editCta, setEditCta] = useState("");
  const [editAudience, setEditAudience] = useState("");
  const [editChannel, setEditChannel] = useState("");
  const [editVolume, setEditVolume] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchPage();
    fetchMetrics();
  }, [id]);

  // Press Enter to go back when not editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !editing) {
        e.preventDefault();
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate("/partner");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editing, navigate]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_landing_pages" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setPage(data as any);
    } catch (err) {
      console.error("Fetch landing page error:", err);
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    if (!id) return;
    try {
      const { data: events } = await supabase
        .from("conversion_events" as any)
        .select("event_type, metadata")
        .eq("feature_key", "landing_page");

      if (!events) return;

      let views = 0;
      let purchases = 0;
      (events as any[]).forEach((e) => {
        const lpId = e.metadata?.landing_page_id;
        if (lpId !== id) return;
        if (e.event_type === "page_view" || e.event_type === "click") {
          views++;
        } else if (e.event_type === "payment") {
          purchases++;
        }
      });
      setMetrics({ views, purchases });
    } catch (err) {
      console.error("Fetch metrics error:", err);
    }
  };

  const getContent = () => {
    if (!page) return null;
    return page.selected_version === "a" ? page.content_a : page.content_b;
  };

  const startEditing = () => {
    const content = getContent();
    setEditTitle(content?.title || "");
    setEditSubtitle(content?.subtitle || "");
    setEditPoints(content?.selling_points || []);
    setEditCta(content?.cta_text || "");
    setEditAudience(page?.target_audience || "");
    setEditChannel(page?.channel || "");
    setEditVolume(page?.volume || "");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveEditing = async () => {
    if (!page || !id) return;
    setSaving(true);
    try {
      const content = getContent();
      const updatedContent = {
        ...content,
        title: editTitle,
        subtitle: editSubtitle,
        selling_points: editPoints.filter(p => p.trim()),
        cta_text: editCta,
      };
      const contentField = page.selected_version === "a" ? "content_a" : "content_b";
      const { error } = await supabase
        .from("partner_landing_pages" as any)
        .update({
          [contentField]: updatedContent,
          target_audience: editAudience || null,
          channel: editChannel || null,
          volume: editVolume || null,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("已保存");
      setEditing(false);
      fetchPage();
    } catch (err: any) {
      toast.error("保存失败: " + (err.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!id) return;
    const url = `${getPromotionDomain()}/lp/${id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("链接已复制"));
  };

  const handlePreview = () => {
    if (!id) return;
    navigate(`/lp/${id}`);
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!id || !confirm("确认删除此推广活动？")) return;
    try {
      const { error } = await supabase.from("partner_landing_pages" as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("已删除");
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate("/partner");
      }
    } catch (err: any) {
      toast.error("删除失败: " + (err.message || "未知错误"));
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/partner");
    }
  };

  const addPoint = () => {
    setEditPoints([...editPoints, ""]);
  };

  const removePoint = (index: number) => {
    setEditPoints(editPoints.filter((_, i) => i !== index));
  };

  const updatePoint = (index: number, value: string) => {
    const updated = [...editPoints];
    updated[index] = value;
    setEditPoints(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <p className="text-muted-foreground">未找到该推广活动</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回
        </Button>
      </div>
    );
  }

  const content = getContent();
  const conversionRate = metrics.views > 0
    ? ((metrics.purchases / metrics.views) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold flex-1 truncate">推广活动详情</h1>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => {
            if (fromAdmin && page?.partner_id) {
              navigate(`/admin/industry-partners?partner=${page.partner_id}`);
            } else {
              navigate("/partner");
            }
          }}>
            <RotateCw className="w-3.5 h-3.5" />
            飞轮页
          </Button>
          <div className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            page.status === "published"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}>
            {page.status === "published" ? "已发布" : "草稿"}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "投放量", value: page.volume || "—", icon: Megaphone, color: "text-blue-600" },
            { label: "观看", value: String(metrics.views), icon: Eye, color: "text-amber-600" },
            { label: "购买", value: String(metrics.purchases), icon: ShoppingCart, color: "text-emerald-600" },
            { label: "转化率", value: `${conversionRate}%`, icon: TrendingUp, color: "text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-muted/30 border border-border/50 p-3 text-center space-y-1">
              <stat.icon className={cn("w-4 h-4 mx-auto", stat.color)} />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-semibold truncate">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Channel & Date Info Bar */}
        {editing ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">渠道</label>
              <Input value={editChannel} onChange={(e) => setEditChannel(e.target.value)} placeholder="投放渠道" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">投放量</label>
              <Input value={editVolume} onChange={(e) => setEditVolume(e.target.value)} placeholder="如：1000人以下" className="h-8 text-xs" />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            渠道：{page.channel || "—"}  ·  创建于 {new Date(page.created_at).toLocaleDateString("zh-CN")}
          </p>
        )}

        {/* Content Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Title Section */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="标题"
                      className="text-base font-semibold h-9"
                    />
                  ) : (
                    <h2 className="text-base font-semibold">{content?.title || "无标题"}</h2>
                  )}
                  {editing ? (
                    <Input
                      value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                      placeholder="副标题"
                      className="mt-2 text-sm h-9"
                    />
                  ) : (
                    content?.subtitle && (
                      <p className="text-sm text-muted-foreground mt-1">{content.subtitle}</p>
                    )
                  )}
                </div>
                {!editing && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={startEditing}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Selling Points */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">卖点</p>
              {editing ? (
                <div className="space-y-2">
                  {editPoints.map((point, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                      <Input
                        value={point}
                        onChange={(e) => updatePoint(i, e.target.value)}
                        placeholder={`卖点 ${i + 1}`}
                        className="h-8 text-sm flex-1"
                      />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removePoint(i)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={addPoint}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> 添加卖点
                  </Button>
                </div>
              ) : (
                content?.selling_points && Array.isArray(content.selling_points) && (
                  <ul className="space-y-1.5">
                    {content.selling_points.map((point: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5 shrink-0">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>

            {/* CTA */}
            {(editing || content?.cta_text) && (
              <div className="px-4 pb-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">行动按钮</p>
                {editing ? (
                  <Input value={editCta} onChange={(e) => setEditCta(e.target.value)} placeholder="CTA 文案" className="h-8 text-sm" />
                ) : (
                  <p className="text-sm font-medium text-primary">{content.cta_text}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Actions */}
        {editing && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={cancelEditing} disabled={saving}>
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button className="flex-1" onClick={saveEditing} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              保存
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        {!editing && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-10" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-1.5" /> 复制链接
            </Button>
            <Button variant="outline" className="h-10" onClick={handlePreview}>
              <ExternalLink className="w-4 h-4 mr-1.5" /> 预览
            </Button>
          </div>
        )}

        {/* Delete */}
        {!editing && (
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> 删除此活动
          </Button>
        )}
      </div>
    </div>
  );
}
