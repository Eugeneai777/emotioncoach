import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { usePartnerLevels } from "@/hooks/usePartnerLevels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveComparison } from "@/components/ui/responsive-comparison";
import PageHeader from "@/components/PageHeader";
import { useEffect } from "react";
import { totalCommissionableCount, commissionableProducts } from "@/config/youjinPartnerProducts";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";

export default function PartnerBenefitsUnified() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { partner, loading: partnerLoading } = usePartner();
  const { levels, loading: levelsLoading, getYoujinLevels, getBloomLevels } = usePartnerLevels();
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ key: string; name: string; price: number } | null>(null);

  usePaymentCallback({
    onSuccess: () => navigate('/partner'),
    showToast: true,
    showConfetti: true,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || partnerLoading || levelsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <PageHeader title="我的合伙人权益" />
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  const bloomLevels = getBloomLevels();
  const youjinLevels = getYoujinLevels();
  const bloom = bloomLevels[0];
  const yL1 = youjinLevels.find(l => l.level_name === 'L1');
  const yL2 = youjinLevels.find(l => l.level_name === 'L2');
  const yL3 = youjinLevels.find(l => l.level_name === 'L3');

  if (!bloom || !yL1 || !yL2 || !yL3) return null;

  if (!partner) {
    return (
      <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-slate-50 via-white to-slate-50" style={{ WebkitOverflowScrolling: 'touch' }}>
        <PageHeader title="我的合伙人权益" />
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">暂未开通合伙人权益</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">成为合伙人后，这里会展示你的权益、等级和可升级方案。</p>
              <Button onClick={() => navigate('/partner')}>了解合伙人计划</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isBloom = partner?.partner_type === 'bloom';
  const partnerLevel = partner?.partner_level || 'L1';
  const currentYoujinLevel = isBloom ? 'L1' : partnerLevel;

  const canUpgradeToL2 = currentYoujinLevel === 'L1';
  const canUpgradeToL3 = currentYoujinLevel === 'L1' || currentYoujinLevel === 'L2';

  const currentTag = (
    <span className="inline-block text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-medium">
      当前
    </span>
  );

  const bloomHeader = (
    <div className="flex flex-col items-center gap-1">
      <span>🦋 绽放</span>
      {isBloom && currentTag}
    </div>
  );

  const makeYoujinHeader = (level: string, label: string, icon: string) => (
    <div className="flex flex-col items-center gap-1">
      <span>{icon} 有劲{label}</span>
      {((isBloom && level === 'L1') || (!isBloom && partnerLevel === level)) && currentTag}
    </div>
  );

  const handleUpgrade = (level: 'L2' | 'L3') => {
    const target = level === 'L2' ? yL2 : yL3;
    setSelectedPackage({
      key: `youjin_partner_${level.toLowerCase()}`,
      name: target.level_name,
      price: target.price,
    });
    setPayDialogOpen(true);
  };

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-slate-50 via-white to-slate-50" style={{ WebkitOverflowScrolling: 'touch' }}>
      <PageHeader title="我的合伙人权益" />
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Matrix 对比表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">权益对比</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ResponsiveComparison
              columns={[
                { header: "对比项" },
                { header: bloomHeader as any, highlight: isBloom },
                { header: makeYoujinHeader('L1', '初级', '💪') as any, highlight: isBloom || partnerLevel === 'L1' },
                { header: makeYoujinHeader('L2', '高级', '🔥') as any, highlight: !isBloom && partnerLevel === 'L2' },
                { header: makeYoujinHeader('L3', '钻石', '💎') as any, highlight: !isBloom && partnerLevel === 'L3' },
              ]}
              rows={[
                { label: "一级佣金", values: [`${(bloom.commission_rate_l1 * 100)}%`, `${(yL1.commission_rate_l1 * 100)}%`, `${(yL2.commission_rate_l1 * 100)}%`, `${(yL3.commission_rate_l1 * 100)}%`] },
                { label: "二级佣金", values: [`${(bloom.commission_rate_l2 * 100)}%`, false, `${(yL2.commission_rate_l2 * 100)}%`, `${(yL3.commission_rate_l2 * 100)}%`] },
                { label: `── 分成产品（${totalCommissionableCount}款） ──`, values: ["", "", "", ""] },
                ...commissionableProducts.map(p => ({
                  label: `${p.name} ¥${p.price.toLocaleString()}`,
                  values: [true, true, true, true] as (string | boolean | React.ReactNode)[],
                })),
                { label: "绽放系列产品", values: [true, false, false, false] },
                { label: "体验包", values: ["含有劲体验包", `${yL1.min_prepurchase}份`, `${yL2.min_prepurchase}份`, `${yL3.min_prepurchase}份`] },
                { label: "推广方式", values: ["推广码/链接", "兑换码/二维码", "兑换码/二维码", "兑换码/二维码"] },
                { label: "专属服务", values: ["社群+培训", "合伙人社群", "优先活动+运营支持", "VIP活动+客户经理"] },
                ...((canUpgradeToL2 || canUpgradeToL3) ? [{
                  label: "升级",
                  values: [
                    "—",
                    "—",
                    canUpgradeToL2 ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-primary">¥{yL2.price.toLocaleString()}</span>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                          onClick={() => handleUpgrade('L2')}
                        >
                          立即升级
                        </Button>
                      </div>
                    ) : "—",
                    canUpgradeToL3 ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-primary">¥{yL3.price.toLocaleString()}</span>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                          onClick={() => handleUpgrade('L3')}
                        >
                          立即升级
                        </Button>
                      </div>
                    ) : "—",
                  ] as (string | boolean | React.ReactNode)[],
                }] : []),
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* 支付弹窗 */}
      <UnifiedPayDialog
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        packageInfo={selectedPackage}
        onSuccess={() => {
          setPayDialogOpen(false);
          navigate('/partner');
        }}
        returnUrl="/partner/benefits-all"
      />
    </div>
  );
}
