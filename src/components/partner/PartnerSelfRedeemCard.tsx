import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift, Check, Loader2, Sparkles } from "lucide-react";
import { useExperiencePackageItems } from "@/hooks/useExperiencePackageItems";

interface PartnerSelfRedeemCardProps {
  partnerId: string;
  prepurchaseCount: number;
}

export function PartnerSelfRedeemCard({ partnerId, prepurchaseCount }: PartnerSelfRedeemCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [redeeming, setRedeeming] = useState(false);
  const { items: experienceItems, allPackageKeys } = useExperiencePackageItems();

  // Derive assessment keys (non-basic packages)
  const assessmentKeys = allPackageKeys.filter(k => k !== 'basic');

  // Check which products the user already owns
  const { data: ownedProducts, isLoading } = useQuery({
    queryKey: ['self-redeem-status', user?.id, assessmentKeys],
    queryFn: async () => {
      if (!user) return { hasBasic: false, assessments: [] as string[] };

      const [subResult, ordersResult] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('subscription_type', 'basic')
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('orders')
          .select('package_key')
          .eq('user_id', user.id)
          .in('package_key', assessmentKeys)
          .eq('status', 'paid')
      ]);

      return {
        hasBasic: !!subResult.data,
        assessments: (ordersResult.data || []).map(o => o.package_key)
      };
    },
    enabled: !!user && assessmentKeys.length > 0
  });

  const allOwned = ownedProducts?.hasBasic && 
    assessmentKeys.every(k => ownedProducts.assessments.includes(k));

  const isOwned = (item: { item_key: string; package_key: string }) => {
    if (item.package_key === 'basic') return ownedProducts?.hasBasic;
    return ownedProducts?.assessments.includes(item.package_key);
  };

  const handleRedeem = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setRedeeming(true);
    try {
      const { data, error } = await supabase.functions.invoke('partner-self-redeem');

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message, {
          description: `已开通: ${data.granted_items?.join('、') || '全部产品'}`
        });
        queryClient.invalidateQueries({ queryKey: ['self-redeem-status'] });
        queryClient.invalidateQueries({ queryKey: ['partner'] });
      } else {
        toast.error(data?.message || '兑换失败');
      }
    } catch (error: any) {
      console.error('Self-redeem error:', error);
      toast.error(error.message || '兑换失败，请稍后重试');
    } finally {
      setRedeeming(false);
    }
  };

  if (isLoading) return null;

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-600" />
          自用兑换体验包
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          消耗 1 个体验包名额，为自己开通全部 {experienceItems.length} 种产品
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Product list */}
        <div className="grid grid-cols-2 gap-2">
          {experienceItems.map((item) => {
            const owned = isOwned(item);
            return (
              <div 
                key={item.item_key}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  owned 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-white/70 border border-amber-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-xs">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.value}</div>
                </div>
                {owned && (
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Action */}
        {allOwned ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200">
            <Sparkles className="w-4 h-4" />
            全部产品已开通
          </div>
        ) : (
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            onClick={handleRedeem}
            disabled={redeeming || prepurchaseCount < 1}
          >
            {redeeming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                兑换中...
              </>
            ) : prepurchaseCount < 1 ? (
              '名额不足'
            ) : (
              `立即兑换（剩余 ${prepurchaseCount} 个名额）`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
