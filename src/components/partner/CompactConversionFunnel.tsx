import { useState, useEffect } from "react";
import { Users, UserCheck, TrendingUp, Crown, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FunnelStats {
  total: number;
  joinedGroup: number;
  purchased365: number;
  becamePartner: number;
}

interface CompactConversionFunnelProps {
  partnerId: string;
  onClick?: () => void;
}

export function CompactConversionFunnel({ partnerId, onClick }: CompactConversionFunnelProps) {
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
    { label: "体验", value: stats.total, icon: Users, color: "text-blue-500", bg: "bg-blue-100" },
    { label: "入群", value: stats.joinedGroup, icon: UserCheck, color: "text-orange-500", bg: "bg-orange-100" },
    { label: "365", value: stats.purchased365, icon: TrendingUp, color: "text-green-500", bg: "bg-green-100" },
    { label: "合伙人", value: stats.becamePartner, icon: Crown, color: "text-purple-500", bg: "bg-purple-100" }
  ];

  const overallRate = stats.total > 0 ? Math.round((stats.purchased365 / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-pulse text-muted-foreground text-sm">加载中...</div>
      </div>
    );
  }

  return (
    <button 
      onClick={onClick}
      className="w-full p-3 rounded-xl bg-white/80 backdrop-blur-sm border hover:shadow-md transition-all text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-xs flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
          学员转化
        </h4>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          整体转化 <span className="font-bold text-green-600">{overallRate}%</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {funnelSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center">
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full ${step.bg} flex items-center justify-center mx-auto`}>
                  <span className={`text-sm font-bold ${step.color}`}>{step.value}</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">{step.label}</span>
              </div>
              {index < funnelSteps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/50 mx-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}
