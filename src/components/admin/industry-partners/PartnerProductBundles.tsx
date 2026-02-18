import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePackages } from "@/hooks/usePackages";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Sparkles, Loader2, Package, Trash2, X, Store, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { BundlePublishPreview } from "./BundlePublishPreview";

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

interface SelectableProduct {
  source: "package" | "store";
  key?: string;
  id?: string;
  name: string;
  price: number;
  description?: string;
  group: string;
}

// Package keys that belong to Bloom series
const BLOOM_PACKAGE_KEYS = new Set([
  "bloom_identity_camp", "bloom_emotion_camp", "bloom_life_camp",
  "bloom_coach_cert", "bloom_partner",
]);

export function PartnerProductBundles({ partnerId }: { partnerId: string }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectableProduct[]>([]);
  const [aiContent, setAiContent] = useState<ProductBundle["ai_content"]>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publishBundle, setPublishBundle] = useState<ProductBundle | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  // Load packages
  const { data: packages, isLoading: packagesLoading } = usePackages();

  // Load store products
  const { data: storeProducts, isLoading: storeLoading } = useQuery({
    queryKey: ["store-products", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_store_products" as any)
        .select("id, product_name, price, description")
        .eq("partner_id", partnerId)
        .eq("is_available", true);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Load existing bundles from partner
  const { data: partnerData, isLoading: partnerLoading } = useQuery({
    queryKey: ["partner-bundles", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("custom_product_packages")
        .eq("id", partnerId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const bundles: ProductBundle[] = useMemo(() => {
    const raw = partnerData?.custom_product_packages;
    if (!raw) return [];
    try {
      return Array.isArray(raw) ? (raw as any as ProductBundle[]) : JSON.parse(String(raw));
    } catch {
      return [];
    }
  }, [partnerData]);

  // Build selectable product list
  const allProducts: SelectableProduct[] = useMemo(() => {
    const items: SelectableProduct[] = [];
    (packages || []).forEach((p) => {
      const isBloom = BLOOM_PACKAGE_KEYS.has(p.package_key);
      items.push({
        source: "package",
        key: p.package_key,
        name: p.package_name,
        price: p.price,
        description: p.description || undefined,
        group: isBloom ? "绽放系列" : "有劲系列",
      });
    });
    (storeProducts || []).forEach((p: any) => {
      items.push({
        source: "store",
        id: p.id,
        name: p.product_name,
        price: p.price,
        description: p.description || undefined,
        group: "商城商品",
      });
    });
    return items;
  }, [packages, storeProducts]);

  const grouped = useMemo(() => {
    const map: Record<string, SelectableProduct[]> = {};
    allProducts.forEach((p) => {
      if (!map[p.group]) map[p.group] = [];
      map[p.group].push(p);
    });
    return map;
  }, [allProducts]);

  const isSelected = (p: SelectableProduct) =>
    selectedProducts.some((s) => (s.key && s.key === p.key) || (s.id && s.id === p.id));

  const toggleProduct = (p: SelectableProduct) => {
    if (isSelected(p)) {
      setSelectedProducts((prev) =>
        prev.filter((s) => !((s.key && s.key === p.key) || (s.id && s.id === p.id)))
      );
    } else {
      setSelectedProducts((prev) => [...prev, p]);
    }
  };

  const totalPrice = selectedProducts.reduce((s, p) => s + p.price, 0);

  const handleAISuggestName = async () => {
    if (selectedProducts.length === 0) { toast.error("请先选择产品"); return; }
    setSuggesting(true);
    setNameSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-bundle", {
        body: {
          type: "optimize_name",
          currentName: bundleName.trim() || "产品组合包",
          products: selectedProducts.map((p) => ({ name: p.name, price: p.price })),
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setNameSuggestions(data.suggestions || []);
      toast.success("AI 名称建议已生成");
    } catch (err: any) {
      toast.error("AI 建议失败: " + (err.message || "未知错误"));
    } finally {
      setSuggesting(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!bundleName.trim()) { toast.error("请先填写组合包名称"); return; }
    if (selectedProducts.length === 0) { toast.error("请至少选择一个产品"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-bundle", {
        body: {
          bundleName: bundleName.trim(),
          products: selectedProducts.map((p) => ({
            name: p.name, price: p.price, description: p.description || "",
          })),
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      if (data.ai_content) { setAiContent(data.ai_content); toast.success("AI 文案生成成功"); }
    } catch (err: any) {
      toast.error("AI 生成失败: " + (err.message || "未知错误"));
    } finally {
      setGenerating(false);
    }
  };

  const updateBundles = async (newBundles: ProductBundle[]) => {
    const { error } = await supabase
      .from("partners")
      .update({ custom_product_packages: newBundles as any })
      .eq("id", partnerId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["partner-bundles", partnerId] });
  };

  const handleSave = async () => {
    if (!bundleName.trim()) { toast.error("请填写组合包名称"); return; }
    if (selectedProducts.length === 0) { toast.error("请至少选择一个产品"); return; }
    setSaving(true);
    try {
      const bundle: ProductBundle = {
        id: editingId || crypto.randomUUID(),
        name: bundleName.trim(),
        products: selectedProducts.map((p) => ({
          source: p.source, key: p.key, id: p.id, name: p.name, price: p.price, description: p.description,
        })),
        total_price: totalPrice,
        ai_content: aiContent,
        cover_image_url: null,
        published_product_id: editingId ? bundles.find((b) => b.id === editingId)?.published_product_id : null,
        created_at: editingId
          ? bundles.find((b) => b.id === editingId)?.created_at || new Date().toISOString()
          : new Date().toISOString(),
      };
      const newBundles = editingId
        ? bundles.map((b) => (b.id === editingId ? bundle : b))
        : [...bundles, bundle];
      await updateBundles(newBundles);
      toast.success(editingId ? "组合包已更新" : "组合包已创建");
      resetForm();
      setDialogOpen(false);
    } catch (err: any) {
      toast.error("保存失败: " + (err.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bundleId: string) => {
    try {
      await updateBundles(bundles.filter((b) => b.id !== bundleId));
      toast.success("组合包已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleUnpublish = async (bundle: ProductBundle) => {
    if (!bundle.published_product_id) return;
    try {
      await supabase
        .from("health_store_products" as any)
        .update({ is_available: false } as any)
        .eq("id", bundle.published_product_id);
      const newBundles = bundles.map((b) =>
        b.id === bundle.id ? { ...b, published_product_id: null } : b
      );
      await updateBundles(newBundles);
      toast.success("商品已下架");
    } catch (err: any) {
      toast.error("下架失败: " + (err.message || "未知错误"));
    }
  };

  const handlePublished = async (productId: string) => {
    if (!publishBundle) return;
    const newBundles = bundles.map((b) =>
      b.id === publishBundle.id ? { ...b, published_product_id: productId } : b
    );
    await updateBundles(newBundles);
    setPublishBundle(null);
  };

  const handleEdit = (bundle: ProductBundle) => {
    setEditingId(bundle.id);
    setBundleName(bundle.name);
    setAiContent(bundle.ai_content);
    const restored: SelectableProduct[] = bundle.products.map((p) => ({
      ...p,
      group: p.source === "store" ? "商城商品" : "有劲系列",
    }));
    setSelectedProducts(restored);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setBundleName("");
    setSelectedProducts([]);
    setAiContent(null);
    setEditingId(null);
    setNameSuggestions([]);
  };

  const isLoading = packagesLoading || storeLoading || partnerLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">产品组合包</h3>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          创建组合包
        </Button>
      </div>

      {bundles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-50" />
            <p>暂无产品组合包</p>
            <p className="text-sm">点击"创建组合包"开始组合产品</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bundles.map((bundle) => (
            <Card key={bundle.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{bundle.name}</h4>
                      {bundle.published_product_id && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          <CheckCircle className="h-3 w-3 mr-0.5" />
                          已上架
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {bundle.products.length} 个产品 · ¥{bundle.total_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(bundle)}>
                      编辑
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(bundle.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {bundle.ai_content && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-medium">目标人群：</span>{bundle.ai_content.target_audience?.slice(0, 60)}…</p>
                    <p><span className="font-medium">痛点：</span>{bundle.ai_content.pain_points?.slice(0, 60)}…</p>
                  </div>
                )}
                {/* Publish / Unpublish buttons */}
                <div className="flex gap-2 pt-1">
                  {bundle.published_product_id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleUnpublish(bundle)}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      下架商品
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setPublishBundle(bundle)}
                      disabled={!bundle.ai_content}
                    >
                      <Store className="h-3 w-3 mr-1" />
                      上架到商城
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑组合包" : "创建产品组合包"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>组合包名称 *</Label>
              <div className="flex gap-2">
                <Input value={bundleName} onChange={(e) => setBundleName(e.target.value)} placeholder="例如：知乐身心健康套餐" className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAISuggestName}
                  disabled={suggesting || selectedProducts.length === 0}
                  className="whitespace-nowrap shrink-0"
                >
                  {suggesting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Lightbulb className="h-4 w-4 mr-1" />}
                  {suggesting ? "生成中…" : "AI 取名"}
                </Button>
              </div>
              {nameSuggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {nameSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setBundleName(s); setNameSuggestions([]); }}
                      className="block w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors border"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>选择产品（已选 {selectedProducts.length} 个，合计 ¥{totalPrice.toFixed(2)}）</Label>
              <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                {Object.entries(grouped).map(([group, items]) => (
                  <div key={group}>
                    <div className="sticky top-0 bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b">{group}</div>
                    {items.map((p, idx) => {
                      const selected = isSelected(p);
                      return (
                        <label key={p.key || p.id || idx} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selected ? "bg-primary/5" : ""}`}>
                          <input type="checkbox" checked={selected} onChange={() => toggleProduct(p)} className="rounded" />
                          <span className="flex-1 text-sm">{p.name}</span>
                          <span className="text-sm text-muted-foreground">¥{p.price}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedProducts.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                    {p.name}
                    <button onClick={() => toggleProduct(p)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <Button variant="outline" onClick={handleAIGenerate} disabled={generating || !bundleName.trim() || selectedProducts.length === 0} className="w-full">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {generating ? "AI 生成中…" : "AI 智能生成文案"}
            </Button>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">商品介绍文案（可编辑）</Label>

              <div className="rounded-lg border-l-4 border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                <Label className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 block">🎯 适合谁</Label>
                <Textarea
                  value={aiContent?.target_audience || ""}
                  onChange={(e) => setAiContent((prev) => ({ target_audience: e.target.value, pain_points: prev?.pain_points || "", solution: prev?.solution || "", expected_results: prev?.expected_results || "" }))}
                  placeholder="描述目标人群，如：职场压力大、睡眠质量差的白领人群"
                  rows={2}
                  className="border-blue-200 dark:border-blue-800 bg-transparent"
                />
              </div>

              <div className="rounded-lg border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-950/20 p-3">
                <Label className="text-xs font-bold text-red-700 dark:text-red-300 mb-1 block">💢 解决什么问题</Label>
                <Textarea
                  value={aiContent?.pain_points || ""}
                  onChange={(e) => setAiContent((prev) => ({ target_audience: prev?.target_audience || "", pain_points: e.target.value, solution: prev?.solution || "", expected_results: prev?.expected_results || "" }))}
                  placeholder="描述用户面临的痛点，如：长期失眠、焦虑情绪反复"
                  rows={2}
                  className="border-red-200 dark:border-red-800 bg-transparent"
                />
              </div>

              <div className="rounded-lg border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                <Label className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1 block">💡 我们如何帮你</Label>
                <Textarea
                  value={aiContent?.solution || ""}
                  onChange={(e) => setAiContent((prev) => ({ target_audience: prev?.target_audience || "", pain_points: prev?.pain_points || "", solution: e.target.value, expected_results: prev?.expected_results || "" }))}
                  placeholder="描述解决方案和价值，如：通过科学的情绪管理训练..."
                  rows={2}
                  className="border-amber-200 dark:border-amber-800 bg-transparent"
                />
              </div>

              <div className="rounded-lg border-l-4 border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1 block">🌟 你将收获</Label>
                <Textarea
                  value={aiContent?.expected_results || ""}
                  onChange={(e) => setAiContent((prev) => ({ target_audience: prev?.target_audience || "", pain_points: prev?.pain_points || "", solution: prev?.solution || "", expected_results: e.target.value }))}
                  placeholder="描述预期效果，如：情绪稳定、睡眠改善、自信提升"
                  rows={2}
                  className="border-emerald-200 dark:border-emerald-800 bg-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {editingId ? "更新组合包" : "保存组合包"}
              </Button>
              <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>取消</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Preview Dialog */}
      {publishBundle && (
        <BundlePublishPreview
          open={!!publishBundle}
          onOpenChange={(open) => { if (!open) setPublishBundle(null); }}
          bundle={publishBundle}
          partnerId={partnerId}
          onPublished={handlePublished}
        />
      )}
    </div>
  );
}
