import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Crown, 
  Handshake,
  ArrowRight,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

interface FunnelStage {
  name: string;
  key: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  trend?: 'up' | 'down' | 'stable';
}

export function ConversionFunnelDashboard() {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [conversionRates, setConversionRates] = useState<ConversionRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFunnelData = async () => {
    setIsLoading(true);
    try {
      // 1. 测评完成数
      const { count: assessmentCount } = await supabase
        .from('conversion_events')
        .select('*', { count: 'exact', head: true })
        .eq('feature_key', 'wealth_camp')
        .eq('event_type', 'assessment_completed');

      // 2. 训练营加入数
      const { count: campJoinedCount } = await supabase
        .from('user_camp_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('camp_type', 'wealth_block_21');

      // 3. 365会员数（从orders表查询）
      const { count: memberCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('package_key', ['yearly', 'yearly_365', 'package_365'])
        .eq('status', 'paid');

      // 4. 合伙人数
      const { count: partnerCount } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'approved']);

      const stagesData: FunnelStage[] = [
        {
          name: '测评完成',
          key: 'assessment',
          count: assessmentCount || 0,
          icon: <Target className="w-5 h-5" />,
          color: '#3b82f6',
          gradient: 'from-blue-500 to-blue-600'
        },
        {
          name: '训练营学员',
          key: 'camp',
          count: campJoinedCount || 0,
          icon: <Users className="w-5 h-5" />,
          color: '#f59e0b',
          gradient: 'from-amber-500 to-orange-500'
        },
        {
          name: '365会员',
          key: 'member',
          count: memberCount || 0,
          icon: <Crown className="w-5 h-5" />,
          color: '#8b5cf6',
          gradient: 'from-purple-500 to-violet-600'
        },
        {
          name: '有劲合伙人',
          key: 'partner',
          count: partnerCount || 0,
          icon: <Handshake className="w-5 h-5" />,
          color: '#10b981',
          gradient: 'from-emerald-500 to-teal-600'
        }
      ];

      setStages(stagesData);

      // 计算转化率
      const rates: ConversionRate[] = [];
      
      if (stagesData[0].count > 0) {
        rates.push({
          from: '测评',
          to: '训练营',
          rate: Math.round((stagesData[1].count / stagesData[0].count) * 100)
        });
      }
      
      if (stagesData[1].count > 0) {
        rates.push({
          from: '训练营',
          to: '365会员',
          rate: Math.round((stagesData[2].count / stagesData[1].count) * 100)
        });
      }
      
      if (stagesData[2].count > 0) {
        rates.push({
          from: '365会员',
          to: '合伙人',
          rate: Math.round((stagesData[3].count / stagesData[2].count) * 100)
        });
      }

      setConversionRates(rates);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const chartData = stages.map(stage => ({
    name: stage.name,
    value: stage.count,
    color: stage.color
  }));

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">转化漏斗看板</CardTitle>
              <p className="text-sm text-white/70 mt-0.5">
                测评 → 训练营 → 365会员 → 合伙人
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchFunnelData}
            disabled={isLoading}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* 漏斗可视化 */}
            <div className="space-y-3">
              {stages.map((stage, index) => {
                const maxCount = Math.max(...stages.map(s => s.count), 1);
                const widthPercent = Math.max((stage.count / maxCount) * 100, 20);
                
                return (
                  <div key={stage.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-r ${stage.gradient} text-white`}>
                          {stage.icon}
                        </div>
                        <span className="font-medium">{stage.name}</span>
                      </div>
                      <span className="font-bold text-lg">{stage.count.toLocaleString()}</span>
                    </div>
                    <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${stage.gradient} rounded-lg transition-all duration-500`}
                        style={{ width: `${widthPercent}%` }}
                      />
                      {index < stages.length - 1 && conversionRates[index] && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
                          <ArrowRight className="w-3 h-3" />
                          <span className="font-medium">{conversionRates[index].rate}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 转化率卡片 */}
            <div className="grid grid-cols-3 gap-3">
              {conversionRates.map((rate, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-br from-muted/50 to-muted rounded-xl text-center"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {rate.from} → {rate.to}
                  </p>
                  <p className={`text-2xl font-bold ${
                    rate.rate >= 30 ? 'text-emerald-600' :
                    rate.rate >= 15 ? 'text-amber-600' :
                    'text-rose-600'
                  }`}>
                    {rate.rate}%
                  </p>
                </div>
              ))}
            </div>

            {/* 柱状图 */}
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), '人数']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 更新时间 */}
            {lastUpdated && (
              <p className="text-xs text-center text-muted-foreground">
                最后更新：{lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
