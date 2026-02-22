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
    { label: "体验", value: stats.total, bg: "bg-orange-100", color: "text-orange-600" },
    { label: "入群", value: stats.joinedGroup, bg: "bg-orange-200", color: "text-orange-700" },
    { label: "365", value: stats.purchased365, bg: "bg-orange-300", color: "text-orange-800" },
    { label: "合伙人", value: stats.becamePartner, bg: "bg-amber-400", color: "text-amber-900" }
  ];

  const overallRate = stats.total > 0 ? Math.round((stats.purchased365 / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16">
        <div className="animate-pulse text-muted-foreground text-xs">加载中...</div>
      </div>
    );
  }

  return (
    <button 
      onClick={onClick}
      className="w-full p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all text-left"
    >
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="font-medium text-xs flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-orange-500" />
          学员转化
        </h4>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          转化率 <span className="font-bold text-orange-600">{overallRate}%</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {funnelSteps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <div className="text-center">
              <div className={`w-7 h-7 rounded-full ${step.bg} flex items-center justify-center mx-auto`}>
                <span className={`text-xs font-bold ${step.color}`}>{step.value}</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">{step.label}</span>
            </div>
            {index < funnelSteps.length - 1 && (
              <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/40 mx-0.5" />
            )}
          </div>
        ))}
      </div>
    </button>
  );
}
