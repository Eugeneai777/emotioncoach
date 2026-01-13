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
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

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
      const link = `${window.location.origin}/?ref=${partner.partner_code}`;
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50">
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
                    <span className="text-sm">全产品20%-50%佣金</span>
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
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">绽放产品专属分成</span>
                  </div>
                  <Button className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Users className="w-4 h-4" />
                    了解绽放合伙人
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* 对比表格 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">两种合伙人有什么区别？</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto -mx-0">
                  <table className="w-full text-xs sm:text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 sm:px-4 whitespace-nowrap">对比项</th>
                        <th className="text-center py-2 px-2 sm:px-4 whitespace-nowrap">💪 有劲合伙人</th>
                        <th className="text-center py-2 px-2 sm:px-4 whitespace-nowrap">🦋 绽放合伙人</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-2 sm:px-4 whitespace-nowrap">加入方式</td>
                        <td className="text-center px-2 sm:px-4">预购体验包</td>
                        <td className="text-center px-2 sm:px-4">购买合伙人套餐</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-2 sm:px-4 whitespace-nowrap">佣金比例</td>
                        <td className="text-center px-2 sm:px-4">20%-50%</td>
                        <td className="text-center px-2 sm:px-4">30%+10%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-2 sm:px-4 whitespace-nowrap">可分成产品</td>
                        <td className="text-center px-2 sm:px-4">所有有劲产品</td>
                        <td className="text-center px-2 sm:px-4">绽放产品</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-2 sm:px-4 whitespace-nowrap">推广方式</td>
                        <td className="text-center px-2 sm:px-4">兑换码/二维码</td>
                        <td className="text-center px-2 sm:px-4">推广码/链接</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 sm:px-4 whitespace-nowrap">适合人群</td>
                        <td className="text-center px-2 sm:px-4">长期经营</td>
                        <td className="text-center px-2 sm:px-4">快速变现</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
