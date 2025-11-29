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

export default function Partner() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { partner, isPartner, loading: partnerLoading } = usePartner();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!partnerLoading && !isPartner) {
      toast.error("您还不是合伙人", {
        description: "请购买合伙人套餐或联系管理员开通"
      });
      navigate("/packages");
    }
  }, [isPartner, partnerLoading, navigate]);

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

  if (!partner) {
    return null;
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
            <p className="text-muted-foreground">管理您的推广业务和收益</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/partner/benefits")}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            查看权益
          </Button>
        </div>

        {/* Stats Overview */}
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
      </div>
    </div>
  );
}
