import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { Sparkles, Loader2, ShoppingBag } from "lucide-react";
import { normalizeContent } from "./bundleDescriptionUtils";

interface BundleProduct {
  source: "package" | "store" | "coach";
  key?: string;
  id?: string;
  name: string;
  price: number;
  description?: string;
}

interface ProductBundle {
  id: string;
  name: string;
  products: BundleProduct[];
  total_price: number;
  ai_content: {
    target_audience: string;
    pain_points: string;
    solution: string;
    expected_results: string;
  } | null;
  cover_image_url: string | null;
  published_product_id?: string | null;
  created_at: string;
}

interface BundlePublishPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: ProductBundle;
  partnerId: string;
  onPublished: (productId: string) => void;
}

export function BundlePublishPreview({
  open,
  onOpenChange,
  bundle,
  partnerId,
  onPublished,
}: BundlePublishPreviewProps) {
  const [productName, setProductName] = useState(bundle.name);
  const [optimizing, setOptimizing] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Editable e-commerce copy sections
  const [audience, setAudience] = useState(bundle.ai_content?.target_audience || "");
  const [painPoints, setPainPoints] = useState(bundle.ai_content?.pain_points || "");
  const [solution, setSolution] = useState(bundle.ai_content?.solution || "");
  const [results, setResults] = useState(bundle.ai_content?.expected_results || "");

  // Auto defaults (not exposed to user)
  const price = bundle.total_price;
  const originalPrice = Math.round(bundle.total_price * 1.3);

  const buildDescription = () => {
    const sections = [
      audience && `### 适合谁\n${normalizeContent(audience)}`,
      painPoints && `### 解决什么问题\n${normalizeContent(painPoints)}`,
      solution && `### 我们如何帮你\n${normalizeContent(solution)}`,
      results && `### 你将收获\n${normalizeContent(results)}`,
    ].filter(Boolean);
    return sections.join("\n\n");
  };

  const handleOptimizeName = async () => {
    setOptimizing(true);
    setNameSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-bundle", {
        body: {
          type: "optimize_name",
          currentName: productName,
          products: bundle.products.map((p) => ({ name: p.name, price: p.price })),
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setNameSuggestions(data.suggestions || []);
    } catch (err: any) {
      toast.error("名称优化失败: " + (err.message || "未知错误"));
    } finally {
      setOptimizing(false);
    }
  };

  const handlePublish = async () => {
    if (!productName.trim()) {
      toast.error("请填写产品名称");
      return;
    }
    setPublishing(true);
    try {
      const description = buildDescription();

      const { data, error } = await supabase
        .from("health_store_products" as any)
        .insert({
          product_name: productName.trim(),
          description,
          price,
          original_price: originalPrice,
          image_url: bundle.cover_image_url || null,
          category: "健康套餐",
          tags: ["组合包"],
          stock: -1,
          partner_id: partnerId,
          is_available: true,
          detail_images: [],
        } as any)
        .select("id")
        .single();

      if (error) throw error;
      toast.success("商品已上架到健康商城！");
      onPublished((data as any).id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error("上架失败: " + (err.message || "未知错误"));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>上架到健康商城</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Card Preview */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">商城卡片预览</Label>
            <div className="border rounded-2xl overflow-hidden shadow-sm bg-card">
              <AspectRatio ratio={1}>
                {bundle.cover_image_url ? (
                  <img src={bundle.cover_image_url} alt={productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center p-6">
                    <span className="text-white font-bold text-lg text-center leading-relaxed drop-shadow">{productName || "产品名称"}</span>
                  </div>
                )}
              </AspectRatio>
              <div className="p-3 space-y-1.5">
                <h3 className="font-semibold text-sm line-clamp-2">{productName || "产品名称"}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {audience?.slice(0, 40) || "产品描述"}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-destructive font-bold text-lg">¥{price}</span>
                  <span className="text-xs text-muted-foreground line-through">
                    ¥{originalPrice}
                  </span>
                </div>
                <Button size="sm" className="w-full mt-2" disabled>
                  立即购买
                </Button>
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <Label>产品名称</Label>
            <div className="flex gap-2">
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleOptimizeName}
                disabled={optimizing}
                className="shrink-0"
              >
                {optimizing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span className="ml-1 text-xs">AI 优化</span>
              </Button>
            </div>
            {nameSuggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                {nameSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setProductName(s);
                      setNameSuggestions([]);
                    }}
                    className="block w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors border"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* E-commerce Style Copy Editor */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">商品介绍文案（可编辑）</Label>

            <div>
              <Label className="text-xs text-muted-foreground">🎯 适合谁</Label>
              <Textarea
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="描述目标人群..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">💢 解决什么问题</Label>
              <Textarea
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder="描述用户面临的痛点..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">💡 我们如何帮你</Label>
              <Textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="描述解决方案和价值..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">🌟 你将收获</Label>
              <Textarea
                value={results}
                onChange={(e) => setResults(e.target.value)}
                placeholder="描述预期效果和收获..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            disabled={publishing || !productName.trim()}
            className="w-full"
          >
            {publishing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            确认上架到商城
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
