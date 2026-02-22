import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { Share2, Users, TrendingUp, Wallet, Gift, Sparkles, ImagePlus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getPartnerLevel } from "@/config/partnerLevels";
import { ReferralList } from "@/components/partner/ReferralList";
import { CommissionHistory } from "@/components/partner/CommissionHistory";
import { StoreCommissionProducts } from "@/components/partner/StoreCommissionProducts";
import { WithdrawalForm } from "@/components/partner/WithdrawalForm";
import { YoujinPartnerDashboard } from "@/components/partner/YoujinPartnerDashboard";
import { PromotionHub } from "@/components/partner/PromotionHub";
import { MyFlywheelOverview } from "@/components/partner/MyFlywheelOverview";
import { PartnerFlywheel } from "@/components/partner/PartnerFlywheel";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ResponsiveComparison } from "@/components/ui/responsive-comparison";


export default function Partner() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { partner, isPartner, loading: partnerLoading } = usePartner();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);


  if (authLoading || partnerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  const isBloom = partner?.partner_type === 'bloom';
  const pageTitle = "合伙人中心";

  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-slate-50 via-white to-slate-50"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="partner" />
      <PageHeader 
        title={pageTitle}
        rightActions={
          isPartner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(partner?.partner_type === 'youjin' ? "/partner/youjin-plan" : "/partner/benefits-all")}
              className="gap-2"
            >
              <Gift className="w-4 h-4" />
              我的权益
            </Button>
          )
        }
      />
      
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Non-Partner View - 双合伙人介绍 */}
        {!isPartner && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">选择适合您的合伙人计划</h2>
              <p className="text-muted-foreground">两种模式，各有优势，根据您的需求选择</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* 有劲合伙人卡片 */}
              <Card className="border-2 hover:border-orange-500/50 transition-all cursor-pointer"
                    onClick={() => navigate("/partner/youjin-intro")}>
                <CardHeader className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-t-lg">
                  <div className="text-4xl mb-2">💪</div>
                  <CardTitle className="text-xl">有劲合伙人</CardTitle>
                  <CardDescription className="text-white/90">预购体验包，长期分成</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">预购100-1000份体验包</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">全产品18%-50%佣金</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">用户终身绑定，持续收益</span>
                  </div>
                  <Button className="w-full gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                    <Sparkles className="w-4 h-4" />
                    了解有劲合伙人
                  </Button>
                </CardContent>
              </Card>

              {/* 绽放合伙人卡片 */}
              <Card className="border-2 hover:border-purple-500/50 transition-all cursor-pointer"
                    onClick={() => navigate("/partner-intro")}>
                <CardHeader className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-t-lg">
                  <div className="text-4xl mb-2">🦋</div>
                  <CardTitle className="text-xl">绽放合伙人</CardTitle>
                  <CardDescription className="text-white/90">无需预购，直接推广</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">分享推广码即可</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">直推30% + 二级10%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">含有劲初级合伙人权益</span>
                  </div>
                  <Button className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Users className="w-4 h-4" />
                    了解绽放合伙人
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">两种合伙人有什么区别？</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <ResponsiveComparison
                  columns={[
                    { header: "对比项" },
                    { header: "💪 有劲合伙人", highlight: true },
                    { header: "🦋 绽放合伙人" },
                  ]}
                  rows={[
                    { label: "加入方式", values: ["预购体验包", "购买合伙人套餐"] },
                    { label: "佣金比例", values: ["18%-50%", "30%+10%"] },
                    { label: "可分成产品", values: ["所有有劲产品", "绽放+有劲产品"] },
                    { label: "推广方式", values: ["兑换码/二维码", "推广码/链接"] },
                    { label: "适合人群", values: ["长期经营", "快速变现"] },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Partner View — Unified Layout */}
        {isPartner && partner && (
          <>
            {/* 根据合伙人类型显示不同面板 */}
            {partner.partner_type === 'youjin' ? (
              <YoujinPartnerDashboard partner={partner} />
            ) : (
              <>
                {/* 飞轮概览（含身份标识）— 置顶 */}
                <MyFlywheelOverview
                  partnerId={partner.id}
                  partnerType={partner.partner_type as 'bloom' | 'youjin'}
                  partnerLevel={partner.partner_level}
                />

                {/* 3. 统一 Tabs: 推广 | 学员 | 收益 */}
                <Tabs defaultValue="promote" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <ResponsiveTabsTrigger value="promote" label="推广" shortLabel="推广" icon={<Share2 className="w-4 h-4" />} />
                    <ResponsiveTabsTrigger value="students" label="学员" shortLabel="学员" icon={<Users className="w-4 h-4" />} />
                    <ResponsiveTabsTrigger value="earnings" label="收益" shortLabel="收益" icon={<Wallet className="w-4 h-4" />} />
                  </TabsList>

                  {/* 推广 Tab */}
                  <TabsContent value="promote" className="space-y-4">
                    <PromotionHub
                      partnerId={partner.id}
                      currentEntryType={partner.default_entry_type || 'free'}
                      prepurchaseCount={partner.prepurchase_count ?? 0}
                      currentSelectedPackages={partner.selected_experience_packages}
                    />
                    {/* AI 海报中心卡片 */}
                    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/poster-center')}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0">
                          <ImagePlus className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-orange-800 text-sm">AI 海报中心</h3>
                          <p className="text-xs text-orange-600/80 mt-0.5">一键生成精美推广海报，提升分享转化率</p>
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shrink-0">
                          生成海报
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 学员 Tab */}
                  <TabsContent value="students" className="space-y-4">
                    <ReferralList partnerId={partner.id} />
                  </TabsContent>

                  {/* 收益 Tab */}
                  <TabsContent value="earnings" className="space-y-4">
                    <StoreCommissionProducts partnerType={partner.partner_type} />
                    <CommissionHistory partnerId={partner.id} />
                    <WithdrawalForm partner={partner} />
                    <PartnerFlywheel partnerId={partner.id} />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
