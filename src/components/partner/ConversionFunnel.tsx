import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck, Crown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FunnelStats {
  total: number;
  joinedGroup: number;
  purchased365: number;
  becamePartner: number;
}

interface ConversionFunnelProps {
  partnerId: string;
}

export function ConversionFunnel({ partnerId }: ConversionFunnelProps) {
  const [stats, setStats] = useState<FunnelStats>({
    total: 0,
    joinedGroup: 0,
    purchased365: 0,
    becamePartner: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [partnerId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_referrals')
        .select('has_joined_group, conversion_status')
        .eq('partner_id', partnerId)
        .eq('level', 1);

      if (error) throw error;

      const referrals = data || [];
      setStats({
        total: referrals.length,
        joinedGroup: referrals.filter(r => r.has_joined_group).length,
        purchased365: referrals.filter(r => r.conversion_status === 'purchased_365' || r.conversion_status === 'became_partner').length,
        becamePartner: referrals.filter(r => r.conversion_status === 'became_partner').length
      });
    } catch (error) {
      console.error("Load funnel stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  const funnelSteps = [
    {
      label: "兑换体验",
      value: stats.total,
      icon: Users,
      color: "bg-blue-500",
      description: "通过兑换码加入"
    },
    {
      label: "加入群聊",
      value: stats.joinedGroup,
      icon: UserCheck,
      color: "bg-orange-500",
      description: "加入学员群",
      rate: stats.total > 0 ? Math.round((stats.joinedGroup / stats.total) * 100) : 0
    },
    {
      label: "购买365",
      value: stats.purchased365,
      icon: TrendingUp,
      color: "bg-green-500",
      description: "升级365会员",
      rate: stats.joinedGroup > 0 ? Math.round((stats.purchased365 / stats.joinedGroup) * 100) : 0
    },
    {
      label: "成为合伙人",
      value: stats.becamePartner,
      icon: Crown,
      color: "bg-purple-500",
      description: "成为有劲合伙人",
      rate: stats.purchased365 > 0 ? Math.round((stats.becamePartner / stats.purchased365) * 100) : 0
    }
  ];

  const maxValue = Math.max(stats.total, 1);
  const overallRate = stats.total > 0 ? Math.round((stats.purchased365 / stats.total) * 100) : 0;

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            转化漏斗
          </CardTitle>
          {stats.total > 0 && (
            <span className="text-sm">
              整体转化 <span className="font-bold text-green-600">{overallRate}%</span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {funnelSteps.map((step, index) => {
          const Icon = step.icon;
          const widthPercent = (step.value / maxValue) * 100;
          
          return (
            <div key={step.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${step.color} flex items-center justify-center`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{step.value}</span>
                  {step.rate !== undefined && step.rate > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({step.rate}%)
                    </span>
                  )}
                </div>
              </div>
              
              {/* 漏斗条 */}
              <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full ${step.color} rounded-full transition-all duration-500`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              
              {index < funnelSteps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-muted-foreground/20" />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
