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
import { buildBundleDescription } from "./bundleDescriptionUtils";

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

interface SelectableProduct {
  source: "package" | "store" | "coach";
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
  const [editingCopyField, setEditingCopyField] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publishBundle, setPublishBundle] = useState<ProductBundle | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [polishingField, setPolishingField] = useState<string | null>(null);

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
          currentName: bundleName.trim() || "组合产品",
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
        cover_image_url: coverImageUrl,
        published_product_id: editingId ? bundles.find((b) => b.id === editingId)?.published_product_id : null,
        created_at: editingId
          ? bundles.find((b) => b.id === editingId)?.created_at || new Date().toISOString()
          : new Date().toISOString(),
      };
      const newBundles = editingId
        ? bundles.map((b) => (b.id === editingId ? bundle : b))
        : [...bundles, bundle];
      await updateBundles(newBundles);

      // 如果已上架，同步更新商城商品的 description、名称和价格
      if (bundle.published_product_id && aiContent) {
        const description = buildBundleDescription(aiContent);
        await supabase
          .from("health_store_products" as any)
          .update({
            product_name: bundleName.trim(),
            description,
            price: totalPrice,
            original_price: Math.round(totalPrice * 1.3),
          } as any)
          .eq("id", bundle.published_product_id);
      }

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

  const handleGenerateCoverImage = async () => {
    if (!bundleName.trim()) { toast.error("请先填写组合包名称"); return; }
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-bundle", {
        body: {
          type: "generate_cover_image",
          bundleName: bundleName.trim(),
          products: selectedProducts.map((p) => ({ name: p.name, price: p.price })),
          aiContent,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      if (data.cover_image_url) {
        setCoverImageUrl(data.cover_image_url);
        toast.success("主图生成成功！");
      }
    } catch (err: any) {
      toast.error("主图生成失败: " + (err.message || "未知错误"));
    } finally {
      setGeneratingImage(false);
    }
  };

  const handlePolishCopy = async (field: string) => {
    const currentText = aiContent?.[field as keyof typeof aiContent] || "";
    if (!currentText.trim()) { toast.error("该板块暂无文案，请先生成或手动输入"); return; }
    setPolishingField(field);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-bundle", {
        body: {
          type: "polish_copy",
          field,
          currentText,
          bundleName: bundleName.trim(),
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      if (data.refinedText) {
        setAiContent((prev) => ({
          target_audience: prev?.target_audience || "",
          pain_points: prev?.pain_points || "",
          solution: prev?.solution || "",
          expected_results: prev?.expected_results || "",
          [field]: data.refinedText,
        }));
        setEditingCopyField(null);
        toast.success("AI 润色完成");
      }
    } catch (err: any) {
      toast.error("AI 润色失败: " + (err.message || "未知错误"));
    } finally {
      setPolishingField(null);
    }
  };

  const handleEdit = (bundle: ProductBundle) => {
    setEditingId(bundle.id);
    setBundleName(bundle.name);
    setAiContent(bundle.ai_content);
    setCoverImageUrl(bundle.cover_image_url || null);
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
    setCoverImageUrl(null);
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
        <h3 className="text-lg font-semibold">组合产品</h3>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          创建组合产品
        </Button>
      </div>

      {bundles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-50" />
            <p>暂无组合产品</p>
            <p className="text-sm">点击"创建组合产品"开始组合产品</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className={`rounded-lg border bg-card overflow-hidden border-l-[3px] ${
                bundle.published_product_id ? "border-l-green-500" : "border-l-primary"
              }`}
            >
              <div className="px-3 py-2.5 space-y-2">
                {/* Header: name + price + status */}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold flex-1 truncate">{bundle.name}</h4>
                  <span className="text-sm font-bold text-foreground shrink-0">¥{bundle.total_price.toFixed(2)}</span>
                  {bundle.published_product_id && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-500 hover:bg-green-600 shrink-0">
                      已上架
                    </Badge>
                  )}
                </div>

                {/* Meta: product count + AI preview in one line */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">{bundle.products.length} 个产品</span>
                  {bundle.ai_content?.target_audience && (
                    <>
                      <span>·</span>
                      <span className="truncate">🎯 {bundle.ai_content.target_audience.slice(0, 30)}…</span>
                    </>
                  )}
                </div>

                {/* Compact action row */}
                <div className="flex items-center gap-1 pt-1.5 border-t">
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => handleEdit(bundle)}>
                    编辑
                  </Button>
                  {bundle.published_product_id ? (
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => handleUnpublish(bundle)}>
                      <XCircle className="h-3 w-3 mr-1" />
                      下架
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setPublishBundle(bundle)} disabled={!bundle.ai_content}>
                      <Store className="h-3 w-3 mr-1" />
                      上架
                    </Button>
                  )}
                  <div className="flex-1" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(bundle.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑组合产品" : "创建组合产品"}</DialogTitle>
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
              <Label className="text-sm font-semibold">商品介绍文案（点击可编辑）</Label>

              {([
                { key: "target_audience" as const, label: "🎯 适合谁", color: "blue", placeholder: "描述目标人群，如：职场压力大、睡眠质量差的白领人群" },
                { key: "pain_points" as const, label: "💢 解决什么问题", color: "red", placeholder: "描述用户面临的痛点，如：长期失眠、焦虑情绪反复" },
                { key: "solution" as const, label: "💡 我们如何帮你", color: "amber", placeholder: "描述解决方案和价值，如：通过科学的情绪管理训练..." },
                { key: "expected_results" as const, label: "🌟 你将收获", color: "emerald", placeholder: "描述预期效果，如：情绪稳定、睡眠改善、自信提升" },
              ] as const).map(({ key, label, color, placeholder }) => {
                const value = aiContent?.[key] || "";
                const isEditing = editingCopyField === key;
                const colorMap = {
                  blue: "border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                  red: "border-l-red-400 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
                  amber: "border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                  emerald: "border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
                };
                const c = colorMap[color];
                const borderClass = c.split(" ").slice(0, 2).join(" ");
                const labelClass = c.split(" ").slice(2, 4).join(" ");
                const inputBorderClass = c.split(" ").slice(4).join(" ");

                return (
                  <div key={key} className={`rounded-lg border-l-4 ${borderClass} p-3`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className={`text-xs font-bold ${labelClass} block`}>{label}</Label>
                      {value && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setEditingCopyField(isEditing ? null : key)}
                          >
                            {isEditing ? "完成" : "✏️ 编辑"}
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                            onClick={() => handlePolishCopy(key)}
                            disabled={polishingField === key}
                          >
                            <Sparkles className={`h-3 w-3 ${polishingField === key ? "animate-spin" : ""}`} />
                            {polishingField === key ? "润色中…" : "AI 润色"}
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing || !value ? (
                      <Textarea
                        value={value}
                        onChange={(e) => setAiContent((prev) => ({
                          target_audience: prev?.target_audience || "",
                          pain_points: prev?.pain_points || "",
                          solution: prev?.solution || "",
                          expected_results: prev?.expected_results || "",
                          [key]: e.target.value,
                        }))}
                        placeholder={placeholder}
                        rows={4}
                        className={`${inputBorderClass} bg-transparent min-h-[100px]`}
                        autoFocus={isEditing}
                        onBlur={() => { if (value) setEditingCopyField(null); }}
                      />
                    ) : (
                      <div
                        className="text-sm leading-relaxed whitespace-pre-wrap cursor-pointer hover:opacity-80 transition-opacity p-2 rounded"
                        onClick={() => setEditingCopyField(key)}
                      >
                        {value}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cover Image Section */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">商品主图</Label>
              {coverImageUrl && (
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={coverImageUrl} alt="组合包主图" className="w-full aspect-square object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl(null)}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleGenerateCoverImage}
                disabled={generatingImage || !bundleName.trim()}
                className="w-full"
              >
                {generatingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {generatingImage ? "AI 生成主图中…" : coverImageUrl ? "重新生成主图" : "AI 生成主图"}
              </Button>
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
