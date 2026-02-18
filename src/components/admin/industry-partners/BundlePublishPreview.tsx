import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { Sparkles, Loader2, ShoppingBag } from "lucide-react";

interface BundleProduct {
  source: "package" | "store";
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
  const [price, setPrice] = useState(bundle.total_price);
  const [originalPrice, setOriginalPrice] = useState<number | "">(
    Math.round(bundle.total_price * 1.3)
  );
  const [category, setCategory] = useState("健康套餐");
  const [tags, setTags] = useState("组合包");
  const [stock, setStock] = useState(-1);
  const [optimizing, setOptimizing] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const description = bundle.ai_content
    ? [
        `【目标人群】${bundle.ai_content.target_audience}`,
        `【解决痛点】${bundle.ai_content.pain_points}`,
        `【价值方案】${bundle.ai_content.solution}`,
        `【预期收获】${bundle.ai_content.expected_results}`,
      ].join("\n\n")
    : bundle.name;

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
      const tagsArr = tags
        .split(/[,，、]/)
        .map((t) => t.trim())
        .filter(Boolean);

      const { data, error } = await supabase
        .from("health_store_products" as any)
        .insert({
          product_name: productName.trim(),
          description,
          price,
          original_price: originalPrice || null,
          image_url: bundle.cover_image_url,
          category,
          tags: tagsArr,
          stock,
          partner_id: partnerId,
          is_available: true,
          detail_images: bundle.cover_image_url ? [bundle.cover_image_url] : [],
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>上架到健康商城 - 预览</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left: Card Preview */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">商城卡片预览</Label>
            <div className="border rounded-2xl overflow-hidden shadow-sm bg-card">
              <AspectRatio ratio={1}>
                {bundle.cover_image_url ? (
                  <img
                    src={bundle.cover_image_url}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
              </AspectRatio>
              <div className="p-3 space-y-1.5">
                <h3 className="font-semibold text-sm line-clamp-2">{productName || "产品名称"}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {bundle.ai_content?.target_audience?.slice(0, 40) || "产品描述"}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-destructive font-bold text-lg">¥{price}</span>
                  {originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      ¥{originalPrice}
                    </span>
                  )}
                </div>
                {tags && (
                  <div className="flex flex-wrap gap-1">
                    {tags.split(/[,，、]/).filter(Boolean).map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {t.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button size="sm" className="w-full mt-2" disabled>
                  立即购买
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Edit Form */}
          <div className="space-y-3">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>售价 (¥)</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>原价 (¥)</Label>
                <Input
                  type="number"
                  value={originalPrice}
                  onChange={(e) =>
                    setOriginalPrice(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="可选"
                />
              </div>
            </div>

            <div>
              <Label>分类</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例如：健康套餐"
              />
            </div>

            <div>
              <Label>标签（逗号分隔）</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例如：组合包、健康、热销"
              />
            </div>

            <div>
              <Label>库存（-1 = 无限）</Label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="font-medium mb-1">包含 {bundle.products.length} 个产品：</p>
              {bundle.products.map((p, i) => (
                <p key={i}>• {p.name}（¥{p.price}）</p>
              ))}
            </div>

            <Button
              onClick={handlePublish}
              disabled={publishing || !productName.trim()}
              className="w-full"
            >
              {publishing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              确认上架到商城
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
