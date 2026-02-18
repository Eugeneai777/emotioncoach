import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Loader2, Package, Pencil, Trash2, ImagePlus, Sparkles, Link, Image } from "lucide-react";
import { toast } from "sonner";

interface PartnerStoreProductsProps {
  partnerId: string;
}

interface ProductForm {
  product_name: string;
  description: string;
  price: string;
  original_price: string;
  category: string;
  tags: string;
  stock: string;
  shipping_info: string;
  contact_info: string;
  is_available: boolean;
}

const emptyForm: ProductForm = {
  product_name: "",
  description: "",
  price: "",
  original_price: "",
  category: "",
  tags: "",
  stock: "-1",
  shipping_info: "",
  contact_info: "",
  is_available: true,
};

export function PartnerStoreProducts({ partnerId }: PartnerStoreProductsProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [detailImageFiles, setDetailImageFiles] = useState<File[]>([]);

  // AI smart fill state
  const [aiMode, setAiMode] = useState<"image" | "link">("image");
  const [aiLink, setAiLink] = useState("");
  const [aiImageFile, setAiImageFile] = useState<File | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["partner-store-products", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_store_products" as any)
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `store/${partnerId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("partner-assets")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("partner-assets")
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Upload new detail images
      const newDetailUrls: string[] = [];
      for (const file of detailImageFiles) {
        const url = await uploadImage(file);
        newDetailUrls.push(url);
      }
      const allDetailImages = [...detailImages, ...newDetailUrls];

      const payload: any = {
        partner_id: partnerId,
        product_name: form.product_name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        category: form.category.trim() || null,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
        stock: parseInt(form.stock) || -1,
        shipping_info: form.shipping_info.trim() || null,
        contact_info: form.contact_info.trim() || null,
        is_available: form.is_available,
        detail_images: allDetailImages.length > 0 ? allDetailImages : null,
      };
      if (imageUrl) payload.image_url = imageUrl;

      if (editingId) {
        const { error } = await supabase
          .from("health_store_products" as any)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("health_store_products" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "商品已更新" : "商品已上架");
      queryClient.invalidateQueries({ queryKey: ["partner-store-products", partnerId] });
      closeDialog();
    },
    onError: (err: any) => {
      toast.error("保存失败: " + (err.message || "未知错误"));
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("health_store_products" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("商品已删除");
      queryClient.invalidateQueries({ queryKey: ["partner-store-products", partnerId] });
    },
    onError: (err: any) => toast.error("删除失败: " + err.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setDetailImages([]);
    setDetailImageFiles([]);
    setAiImageFile(null);
    setAiLink("");
    setAiMode("image");
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      product_name: p.product_name || "",
      description: p.description || "",
      price: String(p.price || ""),
      original_price: p.original_price ? String(p.original_price) : "",
      category: p.category || "",
      tags: (p.tags || []).join(", "),
      stock: String(p.stock ?? -1),
      shipping_info: p.shipping_info || "",
      contact_info: p.contact_info || "",
      is_available: p.is_available ?? true,
    });
    setImageFile(null);
    setDetailImages(p.detail_images || []);
    setDetailImageFiles([]);
    setAiImageFile(null);
    setAiLink("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setDetailImages([]);
    setDetailImageFiles([]);
    setAiImageFile(null);
    setAiLink("");
  };

  // AI smart fill handler
  const handleAiExtract = async () => {
    if (aiMode === "image" && !aiImageFile) {
      toast.error("请先选择商品图片");
      return;
    }
    if (aiMode === "link" && !aiLink.trim()) {
      toast.error("请输入商品链接");
      return;
    }

    setAiLoading(true);
    try {
      let requestBody: any = {};

      if (aiMode === "image" && aiImageFile) {
        // Upload image first to get URL
        const ext = aiImageFile.name.split(".").pop() || "jpg";
        const path = `store/${partnerId}/ai-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("partner-assets")
          .upload(path, aiImageFile, { upsert: true });
        if (uploadErr) throw uploadErr;

        // Generate signed URL for AI to read (bucket is private)
        const { data: signedData, error: signedErr } = await supabase.storage
          .from("partner-assets")
          .createSignedUrl(path, 600);
        if (signedErr) throw signedErr;

        requestBody.image_url = signedData.signedUrl;

        // Also set the file as the product image
        const { data: pubData } = supabase.storage
          .from("partner-assets")
          .getPublicUrl(path);
        // Store the path for later use as product image
        setImageFile(aiImageFile);
      } else {
        requestBody.link = aiLink.trim();
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-extract-product`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (resp.status === 429) {
        toast.error("AI 服务繁忙，请稍后再试");
        return;
      }
      if (resp.status === 402) {
        toast.error("AI 额度不足");
        return;
      }

      const result = await resp.json();
      if (!resp.ok || !result.success) {
        throw new Error(result.error || "AI 识别失败");
      }

      const d = result.data;
      setForm(f => ({
        ...f,
        product_name: d.product_name || f.product_name,
        description: d.description || f.description,
        price: d.price ? String(d.price) : f.price,
        original_price: d.original_price ? String(d.original_price) : f.original_price,
        category: d.category || f.category,
        tags: d.tags?.length ? d.tags.join(", ") : f.tags,
        shipping_info: d.shipping_info || f.shipping_info,
      }));

      toast.success("AI 识别完成，已自动填充表单");
    } catch (err: any) {
      console.error("AI extract error:", err);
      toast.error("AI 识别失败: " + (err.message || "未知错误"));
    } finally {
      setAiLoading(false);
    }
  };

  const canSave = form.product_name.trim() && form.price && parseFloat(form.price) > 0;

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {products.length} 件商品</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          上架商品
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">暂无商品，点击"上架商品"添加</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map((p: any) => (
            <Card key={p.id} className={!p.is_available ? "opacity-60" : ""}>
              <CardContent className="p-3 flex gap-3">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.product_name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium truncate">{p.product_name}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.is_available ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {p.is_available ? "上架" : "下架"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-destructive">¥{p.price}</p>
                  <p className="text-[11px] text-muted-foreground">销量 {p.sales_count || 0}</p>
                  <div className="flex gap-1 mt-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(p)}>
                      <Pencil className="w-3 h-3 mr-1" /> 编辑
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> 删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑商品" : "上架新商品"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* AI Smart Fill Section - only for new products */}
            {!editingId && (
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="w-4 h-4" />
                  AI 智能填充（可选）
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={aiMode === "image" ? "default" : "outline"}
                    onClick={() => setAiMode("image")}
                    className="text-xs h-7"
                  >
                    <Image className="w-3 h-3 mr-1" />
                    上传图片
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={aiMode === "link" ? "default" : "outline"}
                    onClick={() => setAiMode("link")}
                    className="text-xs h-7"
                  >
                    <Link className="w-3 h-3 mr-1" />
                    粘贴链接
                  </Button>
                </div>

                {aiMode === "image" ? (
                  <div>
                    <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 text-sm bg-background">
                      <ImagePlus className="w-4 h-4" />
                      {aiImageFile ? aiImageFile.name : "选择商品图片"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => setAiImageFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                ) : (
                  <Input
                    value={aiLink}
                    onChange={e => setAiLink(e.target.value)}
                    placeholder="输入商品页面链接，如 https://..."
                    className="text-sm"
                  />
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={handleAiExtract}
                  disabled={aiLoading || (aiMode === "image" ? !aiImageFile : !aiLink.trim())}
                  className="w-full"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      AI 识别中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      AI 识别
                    </>
                  )}
                </Button>
              </div>
            )}

            <div>
              <Label>商品名称 *</Label>
              <Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} placeholder="例如: 有机养生茶" />
            </div>
            <div>
              <Label>商品主图</Label>
              <div className="mt-1">
                {/* Preview existing or selected image */}
                {(imageFile || (editingId && products.find((p: any) => p.id === editingId)?.image_url)) && (
                  <div className="mb-2 relative w-20 h-20">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : products.find((p: any) => p.id === editingId)?.image_url}
                      alt="主图预览"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 text-sm">
                  <ImagePlus className="w-4 h-4" />
                  {imageFile ? imageFile.name : "选择主图"}
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <div>
              <Label>详情图片（最多9张）</Label>
              <div className="mt-1 space-y-2">
                {/* Preview existing detail images */}
                {(detailImages.length > 0 || detailImageFiles.length > 0) && (
                  <div className="grid grid-cols-3 gap-2">
                    {detailImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative group aspect-square">
                        <img src={url} alt={`详情图 ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setDetailImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {detailImageFiles.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative group aspect-square">
                        <img src={URL.createObjectURL(file)} alt={`新图 ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setDetailImageFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {(detailImages.length + detailImageFiles.length) < 9 && (
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 text-sm">
                    <ImagePlus className="w-4 h-4" />
                    添加详情图（{detailImages.length + detailImageFiles.length}/9）
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        const remaining = 9 - detailImages.length - detailImageFiles.length;
                        setDetailImageFiles(prev => [...prev, ...files.slice(0, remaining)]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>售价 (¥) *</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <Label>原价 (¥)</Label>
                <Input type="number" step="0.01" min="0" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="商品简介" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>分类</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="例如: 养生食品" />
              </div>
              <div>
                <Label>库存</Label>
                <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="-1 为不限" />
              </div>
            </div>
            <div>
              <Label>标签（逗号分隔）</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="热销, 推荐" />
            </div>
            <div>
              <Label>配送说明</Label>
              <Input value={form.shipping_info} onChange={e => setForm(f => ({ ...f, shipping_info: e.target.value }))} placeholder="例如: 全国包邮，3天内发货" />
            </div>
            <div>
              <Label>联系方式（用于发货联络）</Label>
              <Input value={form.contact_info} onChange={e => setForm(f => ({ ...f, contact_info: e.target.value }))} placeholder="手机号或微信号" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_available} onCheckedChange={v => setForm(f => ({ ...f, is_available: v }))} />
              <Label>上架状态</Label>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending || uploading} className="w-full">
              {(saveMutation.isPending || uploading) ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editingId ? "保存修改" : "确认上架"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
