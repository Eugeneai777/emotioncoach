import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { usePartnerLevels } from "@/hooks/usePartnerLevels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveComparison } from "@/components/ui/responsive-comparison";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useEffect } from "react";
import { bloomPartnerLevel, youjinPartnerLevels } from "@/config/partnerLevels";

export default function PartnerBenefitsUnified() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { partner, loading: partnerLoading } = usePartner();
  const { levels } = usePartnerLevels();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || partnerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  const bloom = bloomPartnerLevel;
  const yL1 = youjinPartnerLevels[0];
  const yL2 = youjinPartnerLevels[1];
  const yL3 = youjinPartnerLevels[2];

  // Determine current level highlights
  const isBloom = partner?.partner_type === 'bloom';
  const partnerLevel = partner?.partner_level || 'L1';

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
      <span>{icon} {label}</span>
      {((isBloom && level === 'L1') || (!isBloom && partnerLevel === level)) && currentTag}
    </div>
  );

  // Check if user can upgrade
  const currentYoujinLevel = isBloom ? 'L1' : partnerLevel;
  const canUpgrade = currentYoujinLevel !== 'L3';

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
                { label: "一级佣金", values: [`${(bloom.commissionRateL1 * 100)}%`, `${(yL1.commissionRateL1 * 100)}%`, `${(yL2.commissionRateL1 * 100)}%`, `${(yL3.commissionRateL1 * 100)}%`] },
                { label: "二级佣金", values: [`${(bloom.commissionRateL2 * 100)}%`, false, `${(yL2.commissionRateL2 * 100)}%`, `${(yL3.commissionRateL2 * 100)}%`] },
                { label: "适用产品", values: ["绽放+有劲", "有劲产品", "有劲产品", "有劲产品"] },
                { label: "体验包", values: ["含有劲体验包", "100份", "500份", "1000份"] },
                { label: "推广方式", values: ["推广码/链接", "兑换码/二维码", "兑换码/二维码", "兑换码/二维码"] },
                { label: "专属服务", values: ["社群+培训", "合伙人社群", "优先活动+运营支持", "VIP活动+客户经理"] },
              ]}
            />
          </CardContent>
        </Card>

        {/* 升级引导 */}
        {canUpgrade && (
          <Card className="border-2 border-amber-200 overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">💎 升级有劲合伙人，解锁更高收益</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentYoujinLevel === 'L1' ? '升级到高级/钻石，享受更高佣金和二级分润' : '升级到钻石合伙人，享受50%佣金+专属客户经理'}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                onClick={() => navigate('/partner/youjin-intro')}
              >
                查看升级 <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
