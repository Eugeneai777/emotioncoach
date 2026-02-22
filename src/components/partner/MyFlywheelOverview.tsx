import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { getPartnerLevel } from "@/config/partnerLevels";

interface MyFlywheelOverviewProps {
  partnerId: string;
  partnerType?: 'bloom' | 'youjin';
  partnerLevel?: string;
}

interface LevelData {
  label: string;
  emoji: string;
  count: number;
  revenue: number;
  gradient: string;
  textColor: string;
}

// Package keys mapped to flywheel levels
const LEVEL_1_KEYS = ['basic', 'trial', 'wealth_block_assessment', 'emotion_health_assessment'];
const LEVEL_2_KEYS = ['member365', 'emotion_button', 'camp-wealth_block_7', 'wealth_camp_7day'];
const LEVEL_3_KEYS = ['bloom_identity_camp', 'awakening_system'];
const LEVEL_4_KEYS = ['youjin_partner_l1', 'youjin_partner_l2'];

export function MyFlywheelOverview({ partnerId, partnerType, partnerLevel }: MyFlywheelOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    fetchFlywheelData();
  }, [partnerId]);

  const fetchFlywheelData = async () => {
    setLoading(true);
    try {
      // 1. Get all referred user IDs
      const { data: referrals } = await supabase
        .from("partner_referrals")
        .select("referred_user_id, conversion_status")
        .eq("partner_id", partnerId);

      const refs = referrals || [];
      const userIds = refs.map(r => r.referred_user_id).filter(Boolean);

      // 2. Count by conversion_status for level distribution
      // Level 1: all referrals (registered / tool users)
      const level1Count = refs.length;
      
      // For revenue, query orders by referred user IDs
      let ordersByPackage: Record<string, number> = {};
      if (userIds.length > 0) {
        const { data: orders } = await supabase
          .from("orders")
          .select("package_key, amount")
          .in("user_id", userIds)
          .eq("status", "paid");

        (orders || []).forEach((o: any) => {
          const key = o.package_key || '';
          ordersByPackage[key] = (ordersByPackage[key] || 0) + Number(o.amount || 0);
        });
      }

      // Count users who have orders in each level
      let userOrderKeys: Record<string, Set<string>> = {};
      if (userIds.length > 0) {
        const { data: orders } = await supabase
          .from("orders")
          .select("user_id, package_key")
          .in("user_id", userIds)
          .eq("status", "paid");

        (orders || []).forEach((o: any) => {
          const uid = o.user_id;
          const key = o.package_key || '';
          if (!userOrderKeys[uid]) userOrderKeys[uid] = new Set();
          userOrderKeys[uid].add(key);
        });
      }

      const countUsersWithKeys = (keys: string[]) => {
        let count = 0;
        Object.values(userOrderKeys).forEach(keySet => {
          if (keys.some(k => keySet.has(k))) count++;
        });
        return count;
      };

      const revenueForKeys = (keys: string[]) => {
        return keys.reduce((sum, k) => sum + (ordersByPackage[k] || 0), 0);
      };

      const level2Count = countUsersWithKeys(LEVEL_2_KEYS);
      const level3Count = countUsersWithKeys(LEVEL_3_KEYS);
      const level4Count = countUsersWithKeys(LEVEL_4_KEYS);

      const levelsData: LevelData[] = [
        {
          label: "测评/工具",
          emoji: "🔍",
          count: level1Count,
          revenue: revenueForKeys(LEVEL_1_KEYS),
          gradient: "from-blue-500 to-cyan-500",
          textColor: "text-blue-600",
        },
        {
          label: "有劲训练营",
          emoji: "💪",
          count: level2Count,
          revenue: revenueForKeys(LEVEL_2_KEYS),
          gradient: "from-orange-500 to-amber-500",
          textColor: "text-orange-600",
        },
        {
          label: "绽放训练营",
          emoji: "🦋",
          count: level3Count,
          revenue: revenueForKeys(LEVEL_3_KEYS),
          gradient: "from-purple-500 to-pink-500",
          textColor: "text-purple-600",
        },
        {
          label: "合伙人",
          emoji: "🌟",
          count: level4Count,
          revenue: revenueForKeys(LEVEL_4_KEYS),
          gradient: "from-amber-500 to-yellow-500",
          textColor: "text-amber-600",
        },
      ];

      setLevels(levelsData);
      setTotalEarnings(levelsData.reduce((s, l) => s + l.revenue, 0));

      // Get partner balance
      const { data: partnerData } = await supabase
        .from("partners")
        .select("available_balance")
        .eq("id", partnerId)
        .single();
      setAvailableBalance(partnerData?.available_balance || 0);
    } catch (err) {
      console.error("MyFlywheelOverview fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Title with identity badge */}
        <div className="flex items-center justify-between">
        {partnerType && (() => {
            const level = getPartnerLevel(partnerType, partnerLevel || '');
            if (!level) return null;
            const isBloom = partnerType === 'bloom';
            const commissionLabel = isBloom
              ? `${(level.commissionRateL1 * 100).toFixed(0)}%+${(level.commissionRateL2 * 100).toFixed(0)}%`
              : `${(level.commissionRateL1 * 100).toFixed(0)}%${level.commissionRateL2 > 0 ? `+${(level.commissionRateL2 * 100).toFixed(0)}%` : ''}`;
            return (
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${level.gradient}`}>
                  <span>{level.icon}</span>
                  <span>{level.name}</span>
                  <span className="opacity-80">·</span>
                  <span>{commissionLabel}</span>
                </div>
                {isBloom && (() => {
                  const youjinL1 = getPartnerLevel('youjin', 'L1');
                  if (!youjinL1) return null;
                  return (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${youjinL1.gradient}`}>
                      <span>{youjinL1.icon}</span>
                      <span>{youjinL1.name}</span>
                      <span className="opacity-80">·</span>
                      <span>{(youjinL1.commissionRateL1 * 100).toFixed(0)}%</span>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🎯</span>
            <h3 className="font-bold text-base">我的飞轮</h3>
          </div>
        </div>

        {/* 4-Level Funnel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {levels.map((level, idx) => (
            <div key={level.label} className="relative">
              <div className="rounded-xl border bg-card p-3 space-y-2 h-full">
                {/* Level number badge */}
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${level.gradient} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{idx + 1}</span>
                  </div>
                  <span className="text-xs font-medium truncate">{level.emoji} {level.label}</span>
                </div>

                {/* Count */}
                <div className={`text-2xl font-bold ${level.textColor}`}>
                  {level.count}
                  <span className="text-xs font-normal text-muted-foreground ml-1">人</span>
                </div>

                {/* Revenue */}
                <div className="text-sm text-muted-foreground">
                  ¥{level.revenue.toLocaleString()}
                </div>
              </div>

              {/* Conversion arrow between levels (desktop only) */}
              {idx < levels.length - 1 && levels[idx].count > 0 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex-col items-center">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {((levels[idx + 1].count / levels[idx].count) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile conversion rates */}
        <div className="flex md:hidden justify-around text-[10px] text-muted-foreground">
          {levels.slice(0, -1).map((level, idx) => (
            <span key={idx}>
              {level.count > 0
                ? `${((levels[idx + 1].count / level.count) * 100).toFixed(0)}%`
                : "-"
              } →
            </span>
          ))}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <span className="text-sm">
              总收益 <span className="font-bold text-foreground">¥{totalEarnings.toLocaleString()}</span>
            </span>
            <span className="text-sm">
              可提现 <span className="font-bold text-green-600">¥{availableBalance.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
