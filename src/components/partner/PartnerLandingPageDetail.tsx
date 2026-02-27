import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy, ExternalLink, Trash2, Loader2, Pencil, Check, X, Plus, Eye, ShoppingCart, TrendingUp, Megaphone, RotateCw, Sparkles, Send, MessageSquare, Palette } from "lucide-react";
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
  design: any;
}

const DESIGN_PRESETS = [
  { label: "🌸 暖色温馨", prompt: "请将设计风格改为暖色温馨风格，使用 rose/amber 色系，毛玻璃卡片，适合女性情感类产品" },
  { label: "🧊 冷色专业", prompt: "请将设计风格改为冷色专业风格，使用 blue/indigo 色系，实心卡片，适合职场/商务类产品" },
  { label: "⚡ 活力明亮", prompt: "请将设计风格改为活力明亮风格，使用 yellow/orange 色系，描边卡片，适合限时活动推广" },
  { label: "🖤 简约高级", prompt: "请将设计风格改为简约高级风格，使用 slate/gray 色系，实心卡片，去除装饰元素，突出文字" },
  { label: "🌿 自然放松", prompt: "请将设计风格改为自然放松风格，使用 green/teal 色系，毛玻璃卡片，波浪装饰，适合冥想放松类" },
];

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

  // AI Optimization
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [previewDesign, setPreviewDesign] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetchPage();
    fetchMetrics();
  }, [id]);

  // Press Enter to go back when not editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !editing && !aiOpen) {
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
  }, [editing, aiOpen, navigate]);

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

  // === AI Optimization ===
  const handleAiOpen = () => {
    const content = getContent();
    setPreviewContent(content);
    setPreviewDesign(page?.design || content?.design || null);
    setAiMessages([]);
    setAiInput("");
    setAiOpen(true);
  };

  const handleAiSend = async (message?: string) => {
    const userMsg = (message || aiInput).trim();
    if (!userMsg) return;
    if (!message) setAiInput("");

    const newMessages = [...aiMessages, { role: "user", content: userMsg }];
    setAiMessages(newMessages);
    setAiLoading(true);

    try {
      const currentContent = previewContent || getContent();
      const contentWithDesign = { ...currentContent, design: previewDesign || page?.design || {} };

      const { data, error } = await supabase.functions.invoke("flywheel-landing-page-ai", {
        body: {
          mode: "optimize",
          current_content: contentWithDesign,
          user_message: userMsg,
          conversation_history: newMessages,
          target_audience: page?.target_audience,
          channel: page?.channel,
        },
      });

      if (error) throw error;

      const result = data?.result;
      if (result && typeof result === "object" && result.title) {
        const { design: newDesign, ...textContent } = result;
        setPreviewContent(textContent);
        if (newDesign) setPreviewDesign(newDesign);
        setAiMessages([...newMessages, { role: "assistant", content: "✅ 已优化，请查看预览效果。满意请点击"应用修改"。" }]);
      } else {
        setAiMessages([...newMessages, { role: "assistant", content: data?.raw || "优化完成" }]);
      }
    } catch (err: any) {
      setAiMessages([...newMessages, { role: "assistant", content: "❌ 优化失败: " + (err.message || "未知错误") }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiApply = async () => {
    if (!page || !id || !previewContent) return;
    setAiLoading(true);
    try {
      const contentField = page.selected_version === "a" ? "content_a" : "content_b";
      const updateData: any = {
        [contentField]: previewContent,
      };
      if (previewDesign) {
        updateData.design = previewDesign;
      }
      const { error } = await supabase
        .from("partner_landing_pages" as any)
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
      toast.success("AI 优化已应用");
      setAiOpen(false);
      fetchPage();
    } catch (err: any) {
      toast.error("应用失败: " + (err.message || "未知错误"));
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiCancel = () => {
    setAiOpen(false);
    setPreviewContent(null);
    setPreviewDesign(null);
    setAiMessages([]);
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
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs rounded-full font-medium",
              page.status === "published"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                : "border-muted bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
            )}
            onClick={async () => {
              const newStatus = page.status === "published" ? "draft" : "published";
              try {
                const { error } = await supabase
                  .from("partner_landing_pages" as any)
                  .update({ status: newStatus, ...(newStatus === "published" ? { published_at: new Date().toISOString() } : {}) })
                  .eq("id", id);
                if (error) throw error;
                setPage({ ...page, status: newStatus });
                toast.success(newStatus === "published" ? "已发布" : "已转为草稿");
              } catch (err: any) {
                toast.error("状态更新失败: " + (err.message || "未知错误"));
              }
            }}
          >
            {page.status === "published" ? "已发布 ✓" : "草稿 → 发布"}
          </Button>
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

            {/* Design badge */}
            {!editing && page.design && (
              <div className="px-4 pb-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">设计风格</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{page.design.theme || "默认"}</span>
                  {page.design.accent_color && (
                    <span className="flex items-center gap-1 text-xs">
                      <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: page.design.accent_color }} />
                      {page.design.accent_color}
                    </span>
                  )}
                  {page.design.card_style && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{page.design.card_style}</span>}
                </div>
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
        {!editing && !aiOpen && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-10" onClick={handleCopyLink}>
                <Copy className="w-4 h-4 mr-1.5" /> 复制链接
              </Button>
              <Button variant="outline" className="h-10" onClick={handlePreview}>
                <ExternalLink className="w-4 h-4 mr-1.5" /> 预览
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full h-10 border-primary/30 text-primary hover:bg-primary/5"
              onClick={handleAiOpen}
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> AI 优化文案 & 设计
            </Button>
          </div>
        )}

        {/* AI Optimization Panel */}
        {aiOpen && (
          <Card className="border-primary/30 overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-primary/5">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium flex-1">AI 优化</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleAiCancel}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Design Presets */}
              <div className="px-4 py-3 border-b border-border/50">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Palette className="w-3 h-3" /> 快捷设计风格
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DESIGN_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2.5 rounded-full"
                      disabled={aiLoading}
                      onClick={() => handleAiSend(preset.prompt)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-48 overflow-y-auto p-3 space-y-2 bg-muted/20">
                {aiMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-6">
                    输入指令优化文案或设计<br />
                    如"标题更有紧迫感"、"换成蓝色科技风"
                  </p>
                )}
                {aiMessages.map((m, i) => (
                  <div key={i} className={cn("text-xs p-2 rounded-lg max-w-[85%]", m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                    {m.content}
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> AI 思考中...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2 p-3 border-t border-border/50">
                <Input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="如：换成暖色调、标题更有冲击力"
                  className="h-9 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && !aiLoading && handleAiSend()}
                />
                <Button size="sm" className="h-9 w-9 p-0" onClick={() => handleAiSend()} disabled={aiLoading || !aiInput.trim()}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>

              {/* Preview Changes & Actions */}
              {previewContent && (
                <div className="px-4 pb-3 space-y-2 border-t border-border/50 pt-3">
                  <p className="text-xs font-medium text-muted-foreground">预览变更</p>
                  <div className="rounded-lg border p-3 space-y-1.5 bg-background">
                    <p className="text-sm font-semibold">{previewContent.title}</p>
                    <p className="text-xs text-muted-foreground">{previewContent.subtitle}</p>
                    {previewContent.selling_points?.slice(0, 2).map((p: string, i: number) => (
                      <p key={i} className="text-xs flex items-start gap-1">
                        <span className="text-primary">✓</span> {p}
                      </p>
                    ))}
                    {previewContent.selling_points?.length > 2 && (
                      <p className="text-xs text-muted-foreground">...还有 {previewContent.selling_points.length - 2} 条卖点</p>
                    )}
                    {previewDesign && (
                      <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/30">
                        <span className="text-xs text-muted-foreground">设计：</span>
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{previewDesign.theme}</span>
                        {previewDesign.accent_color && (
                          <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: previewDesign.accent_color }} />
                        )}
                        {previewDesign.card_style && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{previewDesign.card_style}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleAiCancel} disabled={aiLoading}>
                      取消
                    </Button>
                    <Button size="sm" className="flex-1" onClick={handleAiApply} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                      应用修改
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete */}
        {!editing && !aiOpen && (
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> 删除此活动
          </Button>
        )}
      </div>
    </div>
  );
}
