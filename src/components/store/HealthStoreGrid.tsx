import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isWeChatMiniProgram, isWeChatBrowser, waitForWxMiniProgramReady } from "@/utils/platform";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ExternalLink, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MINI_PROGRAM_LINK = "#小程序://知乐荟商城/2yvmnaZMamGx1gf";

interface Product {
  id: string;
  product_name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  mini_program_path: string | null;
  category: string | null;
  tags: string[] | null;
}

export function HealthStoreGrid() {
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["health-store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_store_products" as any)
        .select("*")
        .eq("is_available", true)
        .order("display_order");
      if (error) throw error;
      return (data as any[]) as Product[];
    },
  });

  const handleProductClick = async (product: Product) => {
    if (isWeChatMiniProgram() && product.mini_program_path) {
      const ready = await waitForWxMiniProgramReady();
      if (ready && window.wx?.miniProgram?.navigateTo) {
        window.wx.miniProgram.navigateTo({ url: product.mini_program_path });
        return;
      }
    }
    // Non-miniprogram: show dialog
    setShowDialog(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(MINI_PROGRAM_LINK);
      setCopied(true);
      toast.success("已复制小程序链接");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card overflow-hidden">
            <Skeleton className="w-full aspect-square" />
            <div className="p-2.5 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">商品即将上架，敬请期待</p>
      </div>
    );
  }

  // Group by category
  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || "其他";
    (acc[cat] ||= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            {Object.keys(grouped).length > 1 && (
              <h3 className="text-xs font-medium text-muted-foreground mb-2">{category}</h3>
            )}
            <div className="grid grid-cols-2 gap-3">
              {items.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border bg-card overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => handleProductClick(product)}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-2.5 space-y-1">
                    <h4 className="text-sm font-medium line-clamp-2 leading-tight">{product.product_name}</h4>
                    {product.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{product.description}</p>
                    )}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-destructive">¥{product.price}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-[11px] text-muted-foreground line-through">¥{product.original_price}</span>
                      )}
                    </div>
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {product.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              前往知乐荟商城
            </DialogTitle>
            <DialogDescription>
              请在微信中打开小程序购买商品
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              复制以下链接，在微信聊天中发送并点击即可打开小程序：
            </p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm break-all">
              <span className="flex-1 font-mono text-xs">{MINI_PROGRAM_LINK}</span>
            </div>
            <Button onClick={handleCopyLink} className="w-full gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "已复制" : "复制链接"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
