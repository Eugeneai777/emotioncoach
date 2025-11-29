import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Share2, Users, TrendingUp, Wallet, Clock } from "lucide-react";
import { toast } from "sonner";
import { PartnerStats } from "@/components/partner/PartnerStats";
import { ReferralList } from "@/components/partner/ReferralList";
import { CommissionHistory } from "@/components/partner/CommissionHistory";
import { WithdrawalForm } from "@/components/partner/WithdrawalForm";
import { YoujinPartnerDashboard } from "@/components/partner/YoujinPartnerDashboard";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Button>
            </div>
            <h1 className="text-3xl font-bold">合伙人中心</h1>
            <p className="text-muted-foreground">
              {isPartner ? "管理您的推广业务和收益" : "了解合伙人计划，开启收益之旅"}
            </p>
          </div>
          {isPartner && (
            <Button
              variant="outline"
              onClick={() => navigate("/partner/benefits")}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              查看权益
            </Button>
          )}
        </div>

        {/* Non-Partner View */}
        {!isPartner && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                您还不是合伙人
              </CardTitle>
              <CardDescription>
                加入合伙人计划，享受丰厚佣金和专属权益
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold">直推佣金 30%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    推荐好友购买任何套餐，立即获得30%佣金
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">二级佣金 10%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    您推荐的用户再推荐，您也能获得10%佣金
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Wallet className="w-5 h-5" />
                    <span className="font-semibold">快速提现</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    佣金确认后即可申请提现，支持多种支付方式
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">长期收益</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    推荐关系永久有效，持续获得被动收入
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/partner/benefits")}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Users className="w-4 h-4" />
                  查看完整权益
                </Button>
                <Button
                  onClick={() => navigate("/packages")}
                  variant="outline"
                  className="flex-1 gap-2"
                  size="lg"
                >
                  立即加入
                </Button>
              </div>
            </CardContent>
          </Card>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="referrals" className="gap-2">
              <Users className="w-4 h-4" />
              推荐列表
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              佣金明细
            </TabsTrigger>
            <TabsTrigger value="withdrawal" className="gap-2">
              <Wallet className="w-4 h-4" />
              提现申请
            </TabsTrigger>
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
