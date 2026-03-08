import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Clock, Users, UserPlus } from "lucide-react";
import { Partner } from "@/hooks/usePartner";
import { EarningsDetailDialog, type DetailType } from "@/components/partner/EarningsDetailDialog";

interface PartnerStatsProps {
  partner: Partner;
}

export function PartnerStats({ partner }: PartnerStatsProps) {
  const [detailType, setDetailType] = useState<DetailType>("earnings");
  const [dialogOpen, setDialogOpen] = useState(false);

  const openDetail = (type: DetailType) => {
    setDetailType(type);
    setDialogOpen(true);
  };

  const stats: {
    title: string;
    value: string | number;
    description: string;
    icon: typeof TrendingUp;
    color: string;
    detailType: DetailType;
  }[] = [
    {
      title: "总收益",
      value: `¥${partner.total_earnings.toFixed(2)}`,
      description: "点击查看明细 ›",
      icon: TrendingUp,
      color: "text-green-600",
      detailType: "earnings",
    },
    {
      title: "待确认",
      value: `¥${partner.pending_balance.toFixed(2)}`,
      description: "点击查看明细 ›",
      icon: Clock,
      color: "text-amber-600",
      detailType: "pending",
    },
    {
      title: "可提现",
      value: `¥${partner.available_balance.toFixed(2)}`,
      description: "点击查看明细 ›",
      icon: Wallet,
      color: "text-blue-600",
      detailType: "available",
    },
    {
      title: "已提现",
      value: `¥${partner.withdrawn_amount.toFixed(2)}`,
      description: "点击查看明细 ›",
      icon: Wallet,
      color: "text-muted-foreground",
      detailType: "withdrawn",
    },
    {
      title: "直推人数",
      value: partner.total_referrals,
      description: "点击查看明细 ›",
      icon: Users,
      color: "text-primary",
      detailType: "referrals_l1",
    },
    {
      title: "二级人数",
      value: partner.total_l2_referrals,
      description: "点击查看明细 ›",
      icon: UserPlus,
      color: "text-primary",
      detailType: "referrals_l2",
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="transition-all hover:shadow-lg cursor-pointer hover:border-primary/30"
              onClick={() => openDetail(stat.detailType)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EarningsDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partnerId={partner.id}
        type={detailType}
      />
    </>
  );
}
