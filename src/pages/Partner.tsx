import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { ArrowLeft, Copy, Share2, Users, TrendingUp, Wallet, Clock, Gift, Sparkles, Home } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { PartnerStats } from "@/components/partner/PartnerStats";
import { ReferralList } from "@/components/partner/ReferralList";
import { CommissionHistory } from "@/components/partner/CommissionHistory";
import { WithdrawalForm } from "@/components/partner/WithdrawalForm";
import { YoujinPartnerDashboard } from "@/components/partner/YoujinPartnerDashboard";
import { BloomYoujinBenefitsCard } from "@/components/partner/BloomYoujinBenefitsCard";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ResponsiveComparison } from "@/components/ui/responsive-comparison";
import { getPromotionDomain } from "@/utils/partnerQRUtils";

export default function Partner() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { partner, isPartner, loading: partnerLoading } = usePartner();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Removed forced redirect - allow non-partners to view benefits

  const handleCopyLink = () => {
    if (partner) {
      const link = `${getPromotionDomain()}/?ref=${partner.partner_code}`;
      navigator.clipboard.writeText(link);
      toast.success("推广链接已复制");
    }
  };

  const handleCopyCode = () => {
    if (partner) {
      navigator.clipboard.writeText(partner.partner_code);
      toast.success("推广码已复制");
    }
  };

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

  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="partner" />
      <PageHeader 
        title="合伙人中心"
        rightActions={
          isPartner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(partner?.partner_type === 'youjin' ? "/partner/youjin-plan" : "/partner/benefits")}
              className="gap-2"
            >
              <Gift className="w-4 h-4" />
              权益
            </Button>
          )
        }
      />
      
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Non-Partner View - 双合伙人介绍 */}
        {!isPartner && (
          <div className="space-y-8">
            {/* 标题区域 */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">选择适合您的合伙人计划</h2>
              <p className="text-muted-foreground">两种模式，各有优势，根据您的需求选择</p>
            </div>

            {/* 双卡片对比 */}
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

            {/* 对比表格 - 使用响应式组件 */}
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

        {/* Partner View */}
        {isPartner && partner && (
          <>
            {/* 根据合伙人类型显示不同面板 */}
            {partner.partner_type === 'youjin' ? (
              <YoujinPartnerDashboard partner={partner} />
            ) : (
              <>
                {/* 绽放合伙人面板（原有内容） */}
                <PartnerStats partner={partner} />
                
                {/* 绽放合伙人的有劲推广权益 */}
                <BloomYoujinBenefitsCard partner={partner} />

            {/* 推广码区域 */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  我的推广码
                </CardTitle>
                <CardDescription>
                  分享您的专属推广码或链接，邀请好友加入
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 px-4 py-3 bg-background rounded-lg border font-mono text-lg font-bold">
                    {partner.partner_code}
                  </div>
                  <Button onClick={handleCopyCode} variant="outline" className="gap-2">
                    <Copy className="w-4 h-4" />
                    复制
                  </Button>
                </div>
                <Button onClick={handleCopyLink} className="w-full gap-2">
                  <Share2 className="w-4 h-4" />
                  复制推广链接
                </Button>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <ResponsiveTabsTrigger value="referrals" label="推荐列表" shortLabel="推荐" icon={<Users className="w-4 h-4" />} />
            <ResponsiveTabsTrigger value="commissions" label="佣金明细" shortLabel="佣金" icon={<TrendingUp className="w-4 h-4" />} />
            <ResponsiveTabsTrigger value="withdrawal" label="提现申请" shortLabel="提现" icon={<Wallet className="w-4 h-4" />} />
          </TabsList>

          <TabsContent value="referrals">
            <ReferralList partnerId={partner.id} />
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionHistory partnerId={partner.id} />
          </TabsContent>

                <TabsContent value="withdrawal">
                  <WithdrawalForm partner={partner} />
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
