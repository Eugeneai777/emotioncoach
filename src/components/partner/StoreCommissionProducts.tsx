import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag } from "lucide-react";

interface StoreCommissionProductsProps {
  partnerType: string;
}

export function StoreCommissionProducts({ partnerType }: StoreCommissionProductsProps) {
  const isYoujin = partnerType === 'youjin';
  const enabledField = isYoujin ? 'youjin_commission_enabled' : 'bloom_commission_enabled';

  const { data: products, isLoading } = useQuery({
    queryKey: ['commission-products', partnerType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_store_products')
        .select('id, product_name, price, image_url, youjin_commission_rate, bloom_commission_rate')
        .eq(enabledField, true)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const getRate = (product: any) => {
    const rate = isYoujin ? product.youjin_commission_rate : product.bloom_commission_rate;
    return `${((rate || 0) * 100).toFixed(0)}%`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">分成商品</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          分成商品
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!products || products.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto opacity-30 mb-2" />
            <p className="text-sm">暂无参与分成的商品</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.product_name}</p>
                  <p className="text-xs text-muted-foreground">¥{Number(product.price).toFixed(2)}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  分成 {getRate(product)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
