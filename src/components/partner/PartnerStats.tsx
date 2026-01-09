import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Clock, Users, UserPlus } from "lucide-react";
import { Partner } from "@/hooks/usePartner";

interface PartnerStatsProps {
  partner: Partner;
}

export function PartnerStats({ partner }: PartnerStatsProps) {
  const stats = [
    {
      title: "总收益",
      value: `¥${partner.total_earnings.toFixed(2)}`,
      description: "累计获得的佣金",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "待确认",
      value: `¥${partner.pending_balance.toFixed(2)}`,
      description: "7天后可提现",
      icon: Clock,
      color: "text-amber-600"
    },
    {
      title: "可提现",
      value: `¥${partner.available_balance.toFixed(2)}`,
      description: "可立即申请提现",
      icon: Wallet,
      color: "text-blue-600"
    },
    {
      title: "已提现",
      value: `¥${partner.withdrawn_amount.toFixed(2)}`,
      description: "已成功提现金额",
      icon: Wallet,
      color: "text-gray-600"
    },
    {
      title: "直推人数",
      value: partner.total_referrals,
      description: "一级推荐用户",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "二级人数",
      value: partner.total_l2_referrals,
      description: "二级推荐用户",
      icon: UserPlus,
      color: "text-primary"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="transition-all hover:shadow-lg">
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
  );
}
