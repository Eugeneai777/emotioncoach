import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { ProductDetailDialog } from "./ProductDetailDialog";
import { CheckoutForm, type CheckoutInfo } from "./CheckoutForm";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { useWechatOpenId } from "@/hooks/useWechatOpenId";

const STORE_CHECKOUT_CACHE_KEY = 'store_pending_checkout';
const STORE_PACKAGE_CACHE_KEY = 'store_pending_package';
const STORE_PRODUCT_CACHE_KEY = 'store_pending_product_id';

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
  shipping_info: string | null;
  stock: number;
  sales_count: number;
  partner_id: string | null;
  detail_images: string[] | null;
}

function needsIdCard(product: Product): boolean {
  const info = (product.shipping_info || '') + (product.product_name || '');
  return /跨境|清关|香港|直邮|海关/.test(info);
}

export function HealthStoreGrid() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wechatOpenId = useWechatOpenId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payPackage, setPayPackage] = useState<{ key: string; name: string; price: number } | null>(null);
  const [pendingCheckoutInfo, setPendingCheckoutInfo] = useState<CheckoutInfo | null>(null);

  // 缓存结账信息（OAuth 跳转前保存，回来后恢复）
  const cacheCheckoutState = useCallback((info: CheckoutInfo, pkg: { key: string; name: string; price: number }, productId: string) => {
    try {
      sessionStorage.setItem(STORE_CHECKOUT_CACHE_KEY, JSON.stringify(info));
      sessionStorage.setItem(STORE_PACKAGE_CACHE_KEY, JSON.stringify(pkg));
      sessionStorage.setItem(STORE_PRODUCT_CACHE_KEY, productId);
    } catch (e) {
      console.error('[HealthStore] Failed to cache checkout state:', e);
    }
  }, []);

  const clearCheckoutCache = useCallback(() => {
    sessionStorage.removeItem(STORE_CHECKOUT_CACHE_KEY);
    sessionStorage.removeItem(STORE_PACKAGE_CACHE_KEY);
    sessionStorage.removeItem(STORE_PRODUCT_CACHE_KEY);
  }, []);

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

  // 🆕 payment_resume 恢复：微信 OAuth 授权回跳后自动恢复支付弹窗
  useEffect(() => {
    const isPaymentResume = searchParams.get('payment_resume') === '1';
    if (!isPaymentResume) return;
    if (!products.length) return; // 等产品列表加载完

    try {
      const cachedCheckout = sessionStorage.getItem(STORE_CHECKOUT_CACHE_KEY);
      const cachedPackage = sessionStorage.getItem(STORE_PACKAGE_CACHE_KEY);
      const cachedProductId = sessionStorage.getItem(STORE_PRODUCT_CACHE_KEY);

      if (cachedCheckout && cachedPackage && cachedProductId) {
        const info = JSON.parse(cachedCheckout) as CheckoutInfo;
        const pkg = JSON.parse(cachedPackage) as { key: string; name: string; price: number };
        const product = products.find(p => p.id === cachedProductId);

        console.log('[HealthStore] Restoring payment state after OAuth redirect');
        setPendingCheckoutInfo(info);
        setPayPackage(pkg);
        if (product) setSelectedProduct(product);
        setPayOpen(true);

        // 清理 URL 中的 payment_resume（保留 payment_openid 给支付组件）
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('payment_resume');
        setSearchParams(newParams, { replace: true });
      }
    } catch (e) {
      console.error('[HealthStore] Failed to restore payment state:', e);
    }
  }, [searchParams, products]);

  const requireLogin = useCallback(() => {
    if (!user) {
      setPostAuthRedirect('/health-store');
      navigate('/auth');
      return true;
    }
    return false;
  }, [user, navigate]);

  const handleProductClick = (product: Product) => {
    if (requireLogin()) return;
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  const handleBuy = (product: Product) => {
    if (requireLogin()) return;
    setDetailOpen(false);
    setSelectedProduct(product);
    setCheckoutOpen(true);
  };

  const handleCheckoutConfirm = async (info: CheckoutInfo) => {
    if (!selectedProduct) return;
    setCheckoutLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("请先登录后再购买");
        setCheckoutLoading(false);
        return;
      }

      setPendingCheckoutInfo(info);

      const pkg = {
        key: `store_product_${selectedProduct.id}`,
        name: selectedProduct.product_name,
        price: selectedProduct.price,
      };
      setPayPackage(pkg);

      // 🆕 缓存结账信息，微信 OAuth 跳转后可恢复
      cacheCheckoutState(info, pkg, selectedProduct.id);

      setCheckoutOpen(false);
      setPayOpen(true);
    } catch (err: any) {
      toast.error("操作失败: " + (err.message || "未知错误"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePaySuccess = async () => {
    if (!selectedProduct || !pendingCheckoutInfo) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const orderNo = `SO${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const insertData: Record<string, any> = {
        order_no: orderNo,
        buyer_id: user.id,
        product_id: selectedProduct.id,
        partner_id: selectedProduct.partner_id,
        product_name: selectedProduct.product_name,
        price: selectedProduct.price,
        quantity: 1,
        status: "paid",
        buyer_name: pendingCheckoutInfo.buyerName,
        buyer_phone: pendingCheckoutInfo.buyerPhone,
        buyer_address: pendingCheckoutInfo.buyerAddress,
        paid_at: new Date().toISOString(),
      };

      // Add ID card info if provided
      if (pendingCheckoutInfo.idCardName) {
        insertData.id_card_name = pendingCheckoutInfo.idCardName;
      }
      if (pendingCheckoutInfo.idCardNumber) {
        insertData.id_card_number = pendingCheckoutInfo.idCardNumber;
      }

      const { error } = await supabase
        .from("store_orders" as any)
        .insert(insertData);

      if (error) {
        console.error("Create store order error:", error);
      }

      // Backfill shipping info to orders table for dashboard sync
      try {
        const { data: latestOrder } = await supabase
          .from("orders")
          .select("order_no")
          .eq("user_id", user.id)
          .eq("package_key", `store_product_${selectedProduct.id}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestOrder?.order_no) {
          await supabase.functions.invoke("update-order-shipping", {
            body: {
              orderNo: latestOrder.order_no,
              shippingInfo: {
                buyerName: pendingCheckoutInfo.buyerName,
                buyerPhone: pendingCheckoutInfo.buyerPhone,
                buyerAddress: pendingCheckoutInfo.buyerAddress,
                idCardName: pendingCheckoutInfo.idCardName,
                idCardNumber: pendingCheckoutInfo.idCardNumber,
              },
            },
          });
        }
      } catch (backfillErr) {
        console.error("Backfill orders shipping error:", backfillErr);
      }

      // Notify partner via edge function
      try {
        await supabase.functions.invoke("notify-store-order", {
          body: {
            orderNo,
            productName: selectedProduct.product_name,
            price: selectedProduct.price,
            partnerId: selectedProduct.partner_id,
            buyerName: pendingCheckoutInfo.buyerName,
            buyerPhone: pendingCheckoutInfo.buyerPhone,
            buyerAddress: pendingCheckoutInfo.buyerAddress,
          },
        });
      } catch {
        // Non-blocking
      }

      // Settle commissions
      try {
        await supabase.functions.invoke("settle-store-commission", {
          body: {
            order_no: orderNo,
            product_id: selectedProduct.id,
            order_amount: selectedProduct.price,
            buyer_id: user.id,
          },
        });
      } catch {
        // Non-blocking
      }

      toast.success("购买成功！卖家将尽快发货");
    } catch (err) {
      console.error("Post-payment error:", err);
    } finally {
      setPayOpen(false);
      setSelectedProduct(null);
      setPendingCheckoutInfo(null);
      setPayPackage(null);
      clearCheckoutCache(); // 🆕 支付完成后清理缓存
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

  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || "其他";
    (acc[cat] ||= []).push(p);
    return acc;
  }, {});

  const shippingInfo = pendingCheckoutInfo ? {
    buyerName: pendingCheckoutInfo.buyerName,
    buyerPhone: pendingCheckoutInfo.buyerPhone,
    buyerAddress: pendingCheckoutInfo.buyerAddress,
    idCardName: pendingCheckoutInfo.idCardName,
    idCardNumber: pendingCheckoutInfo.idCardNumber,
  } : undefined;

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

      <ProductDetailDialog
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onBuy={handleBuy}
      />

      {selectedProduct && (
        <CheckoutForm
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          productName={selectedProduct.product_name}
          price={selectedProduct.price}
          onConfirm={handleCheckoutConfirm}
          loading={checkoutLoading}
          shippingNote={selectedProduct.shipping_info || undefined}
          needIdCard={needsIdCard(selectedProduct)}
        />
      )}

      {/* 统一支付对话框：自动根据环境选择微信/支付宝 */}
      <UnifiedPayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        packageInfo={payPackage}
        onSuccess={handlePaySuccess}
        openId={wechatOpenId}
        shippingInfo={shippingInfo}
      />
    </>
  );
}
