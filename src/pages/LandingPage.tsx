import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LandingContent {
  title: string;
  subtitle: string;
  selling_points: string[];
  cta_text: string;
  cta_subtext?: string;
}

export default function LandingPage() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<LandingContent | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPage();
  }, [id]);

  const fetchPage = async () => {
    try {
      const { data, error } = await supabase
        .from("partner_landing_pages" as any)
        .select("content_a, content_b, selected_version, matched_product, target_audience")
        .eq("id", id)
        .limit(1);

      if (error) throw error;
      const page = (data as any)?.[0];
      if (!page) {
        setNotFound(true);
        return;
      }

      const selectedContent = page.selected_version === "a" ? page.content_a : page.content_b;
      setContent(selectedContent);
      setProduct(page.matched_product);
    } catch (err) {
      console.error("Fetch landing page error:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Hero Section */}
      <div className="px-6 pt-16 pb-10 text-center space-y-4 max-w-lg mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {content.title}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          {content.subtitle}
        </p>
      </div>

      {/* Selling Points */}
      <div className="px-6 pb-8 max-w-lg mx-auto">
        <div className="bg-card rounded-2xl p-6 shadow-sm space-y-4">
          {product && (
            <div className="text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 w-fit">
              {product}
            </div>
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

      {/* CTA Section */}
      <div className="px-6 pb-16 max-w-lg mx-auto space-y-3">
        <Button className="w-full h-12 text-base font-semibold rounded-xl shadow-lg" size="lg">
          {content.cta_text}
        </Button>
        {content.cta_subtext && (
          <p className="text-xs text-center text-muted-foreground">{content.cta_subtext}</p>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground">Powered by 有劲AI</p>
      </div>
    </div>
  );
}
