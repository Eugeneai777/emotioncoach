import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Award, Users, Star, Share2 } from "lucide-react";
import { Helmet } from "react-helmet";
import { toast } from "sonner";

interface LandingContent {
  title: string;
  subtitle: string;
  selling_points: string[];
  cta_text: string;
  cta_subtext?: string;
}

interface LandingDesign {
  theme?: string;
  bg_gradient?: string;
  accent_color?: string;
  card_style?: string;
  cta_gradient?: string;
  text_color?: string;
  layout?: string;
  decorative?: string;
}

// Default design fallback
const DEFAULT_DESIGN: LandingDesign = {
  theme: "cool",
  bg_gradient: "from-primary/5 via-background to-background",
  accent_color: "",
  card_style: "glass",
  cta_gradient: "from-primary to-primary/80",
  text_color: "dark",
  layout: "centered",
  decorative: "circles",
};

function getVisitorId() {
  let vid = localStorage.getItem("lp_visitor_id");
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem("lp_visitor_id", vid);
  }
  return vid;
}

// Helper to build card classes from design
function getCardClasses(design: LandingDesign) {
  switch (design.card_style) {
    case "glass":
      return "bg-card/80 backdrop-blur-sm border border-border/50 shadow-md";
    case "outline":
      return "bg-transparent border-2 border-border shadow-none";
    case "solid":
    default:
      return "bg-card border border-border/50 shadow-md";
  }
}

// Helper to render decorative elements
function DecorativeElements({ design }: { design: LandingDesign }) {
  const color = design.accent_color || undefined;
  const style = color ? { backgroundColor: `${color}15` } : undefined;

  switch (design.decorative) {
    case "waves":
      return (
        <>
          <div className="absolute top-0 left-0 right-0 h-[300px] rounded-b-[100%] opacity-20 pointer-events-none" style={style || { backgroundColor: "hsl(var(--primary) / 0.1)" }} />
          <div className="absolute bottom-20 left-0 right-0 h-[200px] rounded-t-[100%] opacity-10 pointer-events-none" style={style || { backgroundColor: "hsl(var(--primary) / 0.05)" }} />
        </>
      );
    case "dots":
      return (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `radial-gradient(${color || 'hsl(var(--primary))'} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
      );
    case "none":
      return null;
    case "circles":
    default:
      return (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl -translate-y-1/2 pointer-events-none" style={style || { backgroundColor: "hsl(var(--primary) / 0.1)" }} />
          <div className="absolute top-40 right-0 w-[200px] h-[200px] rounded-full blur-2xl pointer-events-none" style={style || { backgroundColor: "hsl(var(--primary) / 0.05)" }} />
          <div className="absolute bottom-20 left-0 w-[150px] h-[150px] rounded-full blur-2xl pointer-events-none" style={style || { backgroundColor: "hsl(var(--primary) / 0.05)" }} />
        </>
      );
  }
}

export default function LandingPage() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<LandingContent | null>(null);
  const [design, setDesign] = useState<LandingDesign>(DEFAULT_DESIGN);
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
        .select("content_a, content_b, selected_version, matched_product, target_audience, partner_id, design")
        .eq("id", id)
        .limit(1);

      if (error) throw error;
      const page = (data as any)?.[0];
      if (!page) { setNotFound(true); return; }

      const selectedContent = page.selected_version === "a" ? page.content_a : page.content_b;
      setContent(selectedContent);
      setProduct(page.matched_product);
      setPartnerId(page.partner_id);

      // Load design from page-level design field, or from content's embedded design
      const pageDesign = page.design || selectedContent?.design || {};
      setDesign({ ...DEFAULT_DESIGN, ...pageDesign });
    } catch (err) {
      console.error("Fetch landing page error:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

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

  const participantCount = 1200 + (id ? id.charCodeAt(0) * 13 + id.charCodeAt(1) * 7 : 0);
  const ogTitle = content.title.slice(0, 58);
  const ogDescription = content.subtitle.slice(0, 155);

  const accentColor = design.accent_color || undefined;
  const accentStyle = accentColor ? { color: accentColor } : undefined;
  const accentBgStyle = accentColor ? { backgroundColor: `${accentColor}15`, color: accentColor } : undefined;
  const ctaGradientClass = design.cta_gradient ? `bg-gradient-to-r ${design.cta_gradient}` : "bg-gradient-to-r from-primary to-primary/80";
  const bgGradientClass = design.bg_gradient ? `bg-gradient-to-b ${design.bg_gradient}` : "bg-gradient-to-b from-primary/5 via-background to-background";
  const textAlignClass = design.layout === "left-aligned" ? "text-left" : "text-center";
  const cardClasses = getCardClasses(design);

  return (
    <div className={`h-screen overflow-y-auto overscroll-contain ${bgGradientClass} relative`} style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* SEO & OG Meta */}
      <Helmet>
        <title>{ogTitle} - 有劲AI</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://wechat.eugenewe.net/lp/${id}`} />
        <meta property="og:image" content="https://wechat.eugenewe.net/logo-youjin-ai.png" />
        <meta property="og:site_name" content="有劲AI" />
        <link rel="canonical" href={`https://wechat.eugenewe.net/lp/${id}`} />
      </Helmet>

      {/* Decorative elements */}
      <DecorativeElements design={design} />

      {/* Hero Section */}
      <header className={`relative px-6 pt-16 pb-10 ${textAlignClass} space-y-4 max-w-lg mx-auto animate-fade-in`}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
          {content.title}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          {content.subtitle}
        </p>
      </header>

      {/* Selling Points */}
      <main className="relative px-6 pb-6 max-w-lg mx-auto">
        <div className={`rounded-2xl p-6 space-y-4 ${cardClasses}`}>
          {product && (
            <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
              {product}
            </Badge>
          )}
          <ul className="space-y-4">
            {content.selling_points?.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-3 animate-fade-in"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span
                  className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
                  style={accentBgStyle || { backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
                >
                  ✓
                </span>
                <span className="text-sm text-foreground leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Social Proof */}
      <section className="relative px-6 pb-6 max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-5 text-muted-foreground py-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="w-4 h-4" style={accentStyle || { color: "hsl(var(--primary))" }} />
            <span>已有 <strong className="text-foreground font-semibold">{participantCount.toLocaleString()}</strong> 人参与</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-xs">
            <Shield className="w-4 h-4" style={accentStyle || { color: "hsl(var(--primary))" }} />
            <span>安全保障</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-xs">
            <Award className="w-4 h-4" style={accentStyle || { color: "hsl(var(--primary))" }} />
            <span>专业认证</span>
          </div>
        </div>
        {/* Star rating */}
        <div className="flex items-center justify-center gap-1 mt-1">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-xs text-muted-foreground ml-1">4.9 / 5.0</span>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 pb-8 max-w-lg mx-auto space-y-3">
        <Button
          className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg ${ctaGradientClass} hover:opacity-90 transition-all duration-300 animate-pulse-slow text-white`}
          size="lg"
          onClick={handleCTA}
        >
          {content.cta_text}
        </Button>
        {content.cta_subtext && (
          <p className="text-xs text-center text-muted-foreground">{content.cta_subtext}</p>
        )}
        <p className="text-xs text-center font-medium" style={accentStyle ? { color: `${accentColor}B3` } : { color: "hsl(var(--primary) / 0.7)" }}>🔥 限时优惠中，立即行动</p>
      </section>

      {/* Share Section */}
      <section className="relative px-6 pb-16 max-w-lg mx-auto">
        <Button
          variant="outline"
          className="w-full h-10 text-sm rounded-xl"
          onClick={async () => {
            trackEvent("share");
            const url = `https://wechat.eugenewe.net/lp/${id}`;
            if (navigator.share) {
              try {
                await navigator.share({ title: content.title, text: content.subtitle, url });
              } catch {}
            } else {
              await navigator.clipboard.writeText(url);
              toast.success("链接已复制，快去分享吧！");
            }
          }}
        >
          <Share2 className="w-4 h-4 mr-2" />
          分享给朋友
        </Button>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8">
        <p className="text-xs text-muted-foreground">Powered by 有劲AI</p>
      </footer>
    </div>
  );
}
