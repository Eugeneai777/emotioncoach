import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Award, Users } from "lucide-react";

interface LandingContent {
  title: string;
  subtitle: string;
  selling_points: string[];
  cta_text: string;
  cta_subtext?: string;
}

function getVisitorId() {
  let vid = localStorage.getItem("lp_visitor_id");
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem("lp_visitor_id", vid);
  }
  return vid;
}

export default function LandingPage() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<LandingContent | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (!id) return;
    fetchPage();
  }, [id]);

  const trackEvent = useCallback(async (eventType: string) => {
    if (!id) return;
    try {
      await supabase.from("conversion_events" as any).insert({
        event_type: eventType,
        feature_key: "landing_page",
        visitor_id: getVisitorId(),
        metadata: { landing_page_id: id, partner_id: partnerId },
      });
    } catch {}
  }, [id, partnerId]);

  const fetchPage = async () => {
    try {
      const { data, error } = await supabase
        .from("partner_landing_pages" as any)
        .select("content_a, content_b, selected_version, matched_product, target_audience, partner_id")
        .eq("id", id)
        .limit(1);

      if (error) throw error;
      const page = (data as any)?.[0];
      if (!page) { setNotFound(true); return; }

      const selectedContent = page.selected_version === "a" ? page.content_a : page.content_b;
      setContent(selectedContent);
      setProduct(page.matched_product);
      setPartnerId(page.partner_id);
    } catch (err) {
      console.error("Fetch landing page error:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Track page view once after data loads
  useEffect(() => {
    if (!loading && content && !tracked.current) {
      tracked.current = true;
      trackEvent("page_view");
    }
  }, [loading, content, trackEvent]);

  const handleCTA = () => {
    trackEvent("click");
    const refParam = partnerId ? `?ref=${partnerId}` : '';
    const productRoutes: [string[], string][] = [
      [['情绪健康'], '/emotion-health-lite'],
      [['SCL-90', '心理'], '/scl90-lite'],
      [['死了吗'], '/alive-check-lite'],
      [['觉察日记', '觉察'], '/awakening-lite'],
      [['情绪按钮', '情绪SOS'], '/emotion-button-lite'],
      [['财富'], '/wealth-assessment-lite'],
    ];
    const matched = productRoutes.find(([keywords]) =>
      keywords.some(k => product?.includes(k))
    );
    const path = matched ? matched[1] : '/introduction';
    window.location.href = `https://wechat.eugenewe.net${path}${refParam}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">页面不存在</p>
          <p className="text-sm text-muted-foreground">该落地页已被删除或链接无效</p>
        </div>
      </div>
    );
  }

  // Generate a pseudo participant count based on page id
  const participantCount = 1200 + (id ? id.charCodeAt(0) * 13 + id.charCodeAt(1) * 7 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background relative overflow-hidden">
      {/* Decorative glow elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-40 right-0 w-[200px] h-[200px] bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Hero Section */}
      <div className="relative px-6 pt-16 pb-10 text-center space-y-4 max-w-lg mx-auto animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
          {content.title}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          {content.subtitle}
        </p>
      </div>

      {/* Selling Points */}
      <div className="relative px-6 pb-6 max-w-lg mx-auto">
        <div className="bg-card rounded-2xl p-6 shadow-sm space-y-4 border border-border">
          {product && (
            <Badge variant="secondary" className="text-xs font-medium">
              {product}
            </Badge>
          )}
          <ul className="space-y-3">
            {content.selling_points?.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </span>
                <span className="text-sm text-foreground leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Social Proof */}
      <div className="relative px-6 pb-6 max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="w-4 h-4 text-primary" />
            <span>已有 <strong className="text-foreground">{participantCount.toLocaleString()}</strong> 人参与</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Shield className="w-4 h-4 text-primary" />
            <span>安全保障</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Award className="w-4 h-4 text-primary" />
            <span>专业认证</span>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative px-6 pb-16 max-w-lg mx-auto space-y-3">
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl shadow-lg animate-pulse-slow"
          size="lg"
          onClick={handleCTA}
        >
          {content.cta_text}
        </Button>
        {content.cta_subtext && (
          <p className="text-xs text-center text-muted-foreground">{content.cta_subtext}</p>
        )}
        <p className="text-xs text-center text-primary/70 font-medium">🔥 限时优惠中，立即行动</p>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground">Powered by 有劲AI</p>
      </div>
    </div>
  );
}
