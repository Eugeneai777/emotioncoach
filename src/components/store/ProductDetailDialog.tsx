import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Truck, X } from "lucide-react";

interface Product {
  id: string;
  product_name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category: string | null;
  tags: string[] | null;
  shipping_info: string | null;
  stock: number;
  sales_count: number;
  detail_images?: string[] | null;
  [key: string]: any;
}

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuy: (product: Product) => void;
}

export function ProductDetailDialog({ product, open, onOpenChange, onBuy }: ProductDetailDialogProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!product) return null;

  const outOfStock = product.stock === 0;
  const detailImages = product.detail_images || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Product image */}
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="w-full aspect-square object-cover"
            />
          ) : (
            <div className="w-full aspect-square bg-muted flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          <div className="p-4 space-y-3">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg leading-tight">{product.product_name}</DialogTitle>
            </DialogHeader>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-destructive">¥{product.price}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-muted-foreground line-through">¥{product.original_price}</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">已售 {product.sales_count || 0}</span>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {product.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            )}

            {/* Detail images */}
            {detailImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">商品详情</p>
                <div className="space-y-1">
                  {detailImages.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`详情图 ${idx + 1}`}
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setPreviewImage(url)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shipping info */}
            {product.shipping_info && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{product.shipping_info}</span>
              </div>
            )}

            {/* Stock warning */}
            {product.stock > 0 && product.stock <= 10 && (
              <p className="text-xs text-destructive">仅剩 {product.stock} 件</p>
            )}

            <Button
              onClick={() => onBuy(product)}
              disabled={outOfStock}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {outOfStock ? "已售罄" : "立即购买"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen image preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img src={previewImage} alt="大图预览" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}
