import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Truck } from "lucide-react";

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
}

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuy: (product: Product) => void;
}

export function ProductDetailDialog({ product, open, onOpenChange, onBuy }: ProductDetailDialogProps) {
  if (!product) return null;

  const outOfStock = product.stock === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
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

          {/* Shipping info */}
          {product.shipping_info && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
              <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{product.shipping_info}</span>
            </div>
          )}

          {/* Stock warning */}
          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-xs text-orange-600">仅剩 {product.stock} 件</p>
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
  );
}
