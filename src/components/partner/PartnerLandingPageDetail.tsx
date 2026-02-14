import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Copy, ExternalLink, Trash2, Loader2 } from "lucide-react";
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
}

export default function PartnerLandingPageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchPage();
  }, [id]);

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

  const handleCopyLink = () => {
    if (!id) return;
    const url = `${getPromotionDomain()}/lp/${id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("链接已复制"));
  };

  const handlePreview = () => {
    if (!id) return;
    navigate(`/lp/${id}`);
  };

  const handleDelete = async () => {
    if (!id || !confirm("确认删除此推广活动？")) return;
    try {
      const { error } = await supabase.from("partner_landing_pages" as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("已删除");
      navigate(-1);
    } catch (err: any) {
      toast.error("删除失败: " + (err.message || "未知错误"));
    }
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
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回
        </Button>
      </div>
    );
  }

  const content = page.selected_version === "a" ? page.content_a : page.content_b;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold flex-1 truncate">推广活动详情</h1>
          <div className={cn(
            "text-xs px-2 py-0.5 rounded",
            page.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
          )}>
            {page.status === "published" ? "已发布" : "草稿"}
          </div>
        </div>

        {/* Meta Info */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="text-base font-semibold">{content?.title || "无标题"}</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">受众：</span>
                <span>{page.target_audience || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">渠道：</span>
                <span>{page.channel || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">创建时间：</span>
                <span>{new Date(page.created_at).toLocaleDateString("zh-CN")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Preview */}
        {content && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">内容预览</p>
              {content.subtitle && (
                <p className="text-sm text-muted-foreground">{content.subtitle}</p>
              )}
              {content.selling_points && Array.isArray(content.selling_points) && (
                <ul className="space-y-1">
                  {content.selling_points.map((point: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
              {content.cta_text && (
                <div className="pt-1">
                  <span className="text-xs text-muted-foreground">CTA：</span>
                  <span className="text-sm font-medium ml-1">{content.cta_text}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" /> 复制推广链接
          </Button>
          <Button variant="outline" className="w-full" onClick={handlePreview}>
            <ExternalLink className="w-4 h-4 mr-2" /> 预览落地页
          </Button>
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> 删除
          </Button>
        </div>
      </div>
    </div>
  );
}