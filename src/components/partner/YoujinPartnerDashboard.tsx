import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Partner } from "@/hooks/usePartner";
import { TrendingUp, Users, Wallet, Gift, QrCode, List } from "lucide-react";
import { useState } from "react";
import { PartnerQRGenerator } from "./PartnerQRGenerator";
import { RedemptionCodeManager } from "./RedemptionCodeManager";
import { PartnerLevelProgress } from "./PartnerLevelProgress";
import { youjinPartnerLevels, getPartnerLevel } from "@/config/partnerLevels";

interface YoujinPartnerDashboardProps {
  partner: Partner;
}

export function YoujinPartnerDashboard({ partner }: YoujinPartnerDashboardProps) {
  const [showQR, setShowQR] = useState(false);
  const [showCodes, setShowCodes] = useState(false);

  const currentLevel = getPartnerLevel('youjin', partner.partner_level);

  return (
    <div className="space-y-6">
      {/* 等级进度 */}
      <PartnerLevelProgress partner={partner} />

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计收益</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{partner.total_earnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可提现</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{partner.available_balance.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">直推用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partner.total_referrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">预购数量</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partner.prepurchase_count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {partner.prepurchase_expires_at 
                ? `有效期至 ${new Date(partner.prepurchase_expires_at).toLocaleDateString()}`
                : '暂无预购'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 当前等级信息 */}
      {currentLevel && (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{currentLevel.icon}</span>
              {currentLevel.name}
            </CardTitle>
            <CardDescription>{currentLevel.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                一级佣金 {(currentLevel.commissionRateL1 * 100).toFixed(0)}%
              </span>
              {currentLevel.commissionRateL2 > 0 && (
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                  二级佣金 {(currentLevel.commissionRateL2 * 100).toFixed(0)}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {currentLevel.benefits.map((benefit, idx) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  • {benefit}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 推广工具 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            推广工具
          </CardTitle>
          <CardDescription>生成二维码或查看兑换码列表</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button 
            onClick={() => setShowQR(true)} 
            className="flex-1 gap-2 bg-gradient-to-r from-orange-500 to-amber-500"
          >
            <QrCode className="w-4 h-4" />
            生成推广二维码
          </Button>
          <Button 
            onClick={() => setShowCodes(true)}
            variant="outline"
            className="flex-1 gap-2"
          >
            <List className="w-4 h-4" />
            查看兑换码
          </Button>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PartnerQRGenerator 
        open={showQR} 
        onOpenChange={setShowQR} 
        partnerId={partner.id} 
      />

      <RedemptionCodeManager 
        open={showCodes} 
        onOpenChange={setShowCodes} 
        partnerId={partner.id} 
      />
    </div>
  );
}