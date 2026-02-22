import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { usePartnerLevels } from "@/hooks/usePartnerLevels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveComparison } from "@/components/ui/responsive-comparison";
import { Check } from "lucide-react";
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
  const youjinL1 = youjinPartnerLevels[0];

  // Try to get dynamic data from DB, fallback to config
  const bloomDb = levels.find(l => l.partner_type === 'bloom');
  const youjinDb = levels.find(l => l.partner_type === 'youjin' && l.level_name === 'L1');

  const bloomBenefits = bloomDb?.benefits?.length ? bloomDb.benefits : bloom.benefits;
  const youjinBenefits = youjinDb?.benefits?.length ? youjinDb.benefits : youjinL1.benefits;

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-slate-50 via-white to-slate-50" style={{ WebkitOverflowScrolling: 'touch' }}>
      <PageHeader title="我的合伙人权益" />
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 双列权益卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 绽放合伙人 */}
          <Card className="border-2 border-purple-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-purple-500 to-pink-500 text-white py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">🦋</span>
                绽放合伙人
              </CardTitle>
              <p className="text-white/80 text-sm mt-1">
                直推 {((bloomDb?.commission_rate_l1 ?? bloom.commissionRateL1) * 100).toFixed(0)}% + 二级 {((bloomDb?.commission_rate_l2 ?? bloom.commissionRateL2) * 100).toFixed(0)}%
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {bloomBenefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{String(b)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 有劲初级合伙人 */}
          <Card className="border-2 border-orange-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-orange-500 to-amber-500 text-white py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">💪</span>
                有劲初级合伙人
              </CardTitle>
              <p className="text-white/80 text-sm mt-1">
                全产品 {((youjinDb?.commission_rate_l1 ?? youjinL1.commissionRateL1) * 100).toFixed(0)}% 佣金
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {youjinBenefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{String(b)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Matrix 对比表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">权益对比</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ResponsiveComparison
              columns={[
                { header: "对比项" },
                { header: "🦋 绽放合伙人", highlight: true },
                { header: "💪 有劲初级合伙人" },
              ]}
              rows={[
                { label: "佣金比例", values: ["30% + 10%", "18%"] },
                { label: "适用产品", values: ["绽放+有劲产品", "有劲产品"] },
                { label: "体验包", values: ["含有劲体验包", "100份体验包"] },
                { label: "推广方式", values: ["推广码/链接", "兑换码/二维码"] },
                { label: "二级佣金", values: [true, false] },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
