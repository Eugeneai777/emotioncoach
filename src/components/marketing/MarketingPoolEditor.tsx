import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import type { MarketingGift, MarketingProduct } from '@/hooks/useMarketingPools';
import type { MiniAppSourceType } from '@/config/miniAppContentMap';

interface MarketingPoolEditorProps {
  type: 'product' | 'gift';
  products?: MarketingProduct[];
  gifts?: MarketingGift[];
  onSaved: () => void;
}

type ProductForm = {
  product_key: string;
  label: string;
  description: string;
  price: string;
  category: string;
  display_order: string;
  is_active: boolean;
};

type GiftForm = {
  gift_key: string;
  label: string;
  product_name: string;
  gift_display_name: string;
  description: string;
  source_type: MiniAppSourceType;
  route: string;
  topic_id: string;
  product_id: string;
  report_name: string;
  display_order: string;
  is_active: boolean;
};

const blankProduct: ProductForm = {
  product_key: '',
  label: '',
  description: '',
  price: '',
  category: '其他',
  display_order: '999',
  is_active: true,
};

const blankGift: GiftForm = {
  gift_key: '',
  label: '',
  product_name: '',
  gift_display_name: '',
  description: '',
  source_type: 'assessments',
  route: '',
  topic_id: '',
  product_id: '',
  report_name: '',
  display_order: '999',
  is_active: true,
};

const slugify = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
  .replace(/^-+|-+$/g, '');

export function MarketingPoolEditor({ type, products = [], gifts = [], onSaved }: MarketingPoolEditorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(blankProduct);
  const [giftForm, setGiftForm] = useState<GiftForm>(blankGift);

  const isProduct = type === 'product';
  const title = isProduct ? '编辑转化产品池' : '编辑标准赠品池';
  const rows = useMemo(() => isProduct ? products : gifts, [isProduct, products, gifts]);

  useEffect(() => {
    if (!giftForm.product_name || giftForm.gift_display_name) return;
    setGiftForm(form => ({ ...form, gift_display_name: `限时赠送「${form.product_name}」` }));
  }, [giftForm.product_name, giftForm.gift_display_name]);

  const resetForm = () => {
    setEditingKey(null);
    setProductForm(blankProduct);
    setGiftForm(blankGift);
  };

  const editProduct = (product: MarketingProduct) => {
    setEditingKey(product.product_key);
    setProductForm({
      product_key: product.product_key,
      label: product.label,
      description: product.description,
      price: product.price === undefined ? '' : String(product.price),
      category: product.category,
      display_order: String(product.display_order),
      is_active: product.is_active,
    });
  };

  const editGift = (gift: MarketingGift) => {
    setEditingKey(gift.gift_key);
    setGiftForm({
      gift_key: gift.gift_key,
      label: gift.label,
      product_name: gift.productName || gift.label,
      gift_display_name: gift.giftDisplayName || `限时赠送「${gift.productName || gift.label}」`,
      description: gift.description,
      source_type: gift.sourceType,
      route: gift.route || '',
      topic_id: gift.topicId || '',
      product_id: gift.productId || '',
      report_name: gift.reportName || '',
      display_order: String(gift.display_order),
      is_active: gift.is_active,
    });
  };

  const nextProductOrder = () => String((products.reduce((max, item) => Math.max(max, item.display_order || 0), 0) || 0) + 10);
  const nextGiftOrder = () => String((gifts.reduce((max, item) => Math.max(max, item.display_order || 0), 0) || 0) + 10);

  const saveProduct = async () => {
    if (!productForm.label.trim()) {
      toast.error('请填写产品名称');
      return;
    }

    const productKey = editingKey || productForm.product_key.trim() || `cv-${slugify(productForm.label)}`;
    setSaving(true);
    const { error } = await supabase.from('marketing_product_pool' as any).upsert({
      product_key: productKey,
      label: productForm.label.trim(),
      description: productForm.description.trim(),
      price: productForm.price.trim() ? Number(productForm.price) : null,
      category: productForm.category.trim() || '其他',
      display_order: Number(productForm.display_order) || Number(nextProductOrder()),
      is_active: productForm.is_active,
    }, { onConflict: 'product_key' });
    setSaving(false);

    if (error) {
      toast.error(`保存失败：${error.message}`);
      return;
    }

    toast.success('产品池已同步');
    resetForm();
    onSaved();
  };

  const saveGift = async () => {
    const productName = giftForm.product_name.trim() || giftForm.label.trim();
    if (!productName) {
      toast.error('请填写赠品标准名称');
      return;
    }

    const giftKey = editingKey || giftForm.gift_key.trim() || `gift-${slugify(productName)}`;
    const giftDisplayName = giftForm.gift_display_name.trim() || `限时赠送「${productName}」`;
    setSaving(true);
    const { error } = await supabase.from('marketing_gift_pool' as any).upsert({
      gift_key: giftKey,
      label: giftForm.label.trim() || productName,
      product_name: productName,
      gift_display_name: giftDisplayName,
      description: giftForm.description.trim(),
      source_type: giftForm.source_type,
      route: giftForm.route.trim() || null,
      topic_id: giftForm.topic_id.trim() || null,
      product_id: giftForm.product_id.trim() || null,
      report_name: giftForm.report_name.trim() || null,
      display_order: Number(giftForm.display_order) || Number(nextGiftOrder()),
      is_active: giftForm.is_active,
    }, { onConflict: 'gift_key' });
    setSaving(false);

    if (error) {
      toast.error(`保存失败：${error.message}`);
      return;
    }

    toast.success('赠品池已同步');
    resetForm();
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Edit3 className="mr-2 h-4 w-4" />编辑</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editingKey ? '编辑当前项' : '新增配置'}</h3>
              <Button variant="ghost" size="sm" onClick={resetForm}><Plus className="mr-2 h-4 w-4" />新增</Button>
            </div>

            {isProduct ? (
              <div className="grid gap-3">
                <div className="space-y-1"><Label>产品名称</Label><Input value={productForm.label} onChange={e => setProductForm({ ...productForm, label: e.target.value })} /></div>
                <div className="space-y-1"><Label>描述</Label><Textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>价格</Label><Input value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="可为空" /></div>
                  <div className="space-y-1"><Label>分类</Label><Input value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} /></div>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>启用</Label><Switch checked={productForm.is_active} onCheckedChange={checked => setProductForm({ ...productForm, is_active: checked })} /></div>
                <Button onClick={saveProduct} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}保存并同步</Button>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="space-y-1"><Label>标准名称</Label><Input value={giftForm.product_name} onChange={e => setGiftForm({ ...giftForm, product_name: e.target.value, label: e.target.value, gift_display_name: `限时赠送「${e.target.value}」` })} /></div>
                <div className="space-y-1"><Label>展示文案</Label><Input value={giftForm.gift_display_name} onChange={e => setGiftForm({ ...giftForm, gift_display_name: e.target.value })} /></div>
                <div className="space-y-1"><Label>描述</Label><Textarea value={giftForm.description} onChange={e => setGiftForm({ ...giftForm, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>类型</Label><Select value={giftForm.source_type} onValueChange={value => setGiftForm({ ...giftForm, source_type: value as MiniAppSourceType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="assessments">专业测评</SelectItem><SelectItem value="daily-tools">日常工具</SelectItem></SelectContent></Select></div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>启用</Label><Switch checked={giftForm.is_active} onCheckedChange={checked => setGiftForm({ ...giftForm, is_active: checked })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>入口</Label><Input value={giftForm.route} onChange={e => setGiftForm({ ...giftForm, route: e.target.value })} /></div>
                  <div className="space-y-1"><Label>报告名称</Label><Input value={giftForm.report_name} onChange={e => setGiftForm({ ...giftForm, report_name: e.target.value })} /></div>
                </div>
                <Button onClick={saveGift} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}保存并同步</Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>分类/类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row: any) => (
                  <TableRow key={isProduct ? row.product_key : row.gift_key}>
                    <TableCell className="font-medium">{isProduct ? row.label : row.productName}</TableCell>
                    <TableCell>{isProduct ? row.category : row.sourceType}</TableCell>
                    <TableCell>{row.is_active ? '启用' : '停用'}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => isProduct ? editProduct(row) : editGift(row)}>编辑</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
