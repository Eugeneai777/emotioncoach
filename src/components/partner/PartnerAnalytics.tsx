import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar, Share2, MousePointerClick } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";

interface PartnerAnalyticsProps {
  partnerId: string;
}

interface DailyData {
  date: string;
  newStudents: number;
  groupJoins: number;
  purchases: number;
}

interface ConversionStats {
  totalStudents: number;
  joinedGroup: number;
  purchased365: number;
  becamePartner: number;
  avgConversionDays: number;
  monthlyNewStudents: number;
  monthlyRevenue: number;
}

interface ShareStats {
  scanLanded: number;
  scanConverted: number;
  conversionRate: string;
  topLandingPage: string;
}

export function PartnerAnalytics({ partnerId }: PartnerAnalyticsProps) {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [shareStats, setShareStats] = useState<ShareStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    loadShareStats();
  }, [partnerId]);

  const loadAnalytics = async () => {
    try {
      const { data: referrals, error } = await supabase
        .from('partner_referrals')
        .select('created_at, has_joined_group, joined_group_at, conversion_status')
        .eq('partner_id', partnerId)
        .eq('level', 1);

      if (error) throw error;

      // 计算每日数据
      const dailyMap = new Map<string, DailyData>();
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'MM-dd');
        dailyMap.set(date, { date, newStudents: 0, groupJoins: 0, purchases: 0 });
      }

      referrals?.forEach(ref => {
        const regDate = format(new Date(ref.created_at), 'MM-dd');
        if (dailyMap.has(regDate)) {
          const d = dailyMap.get(regDate)!;
          d.newStudents++;
        }

        if (ref.joined_group_at) {
          const joinDate = format(new Date(ref.joined_group_at), 'MM-dd');
          if (dailyMap.has(joinDate)) {
            dailyMap.get(joinDate)!.groupJoins++;
          }
        }

        if (ref.conversion_status === 'purchased_365' || ref.conversion_status === 'became_partner') {
          // 使用 joined_group_at 作为近似转化时间（没有 converted_at 字段）
          const convDate = ref.joined_group_at 
            ? format(new Date(ref.joined_group_at), 'MM-dd')
            : format(new Date(ref.created_at), 'MM-dd');
          if (dailyMap.has(convDate)) {
            dailyMap.get(convDate)!.purchases++;
          }
        }
      });

      setDailyData(Array.from(dailyMap.values()));

      // 计算统计数据
      const totalStudents = referrals?.length || 0;
      const joinedGroup = referrals?.filter(r => r.has_joined_group).length || 0;
      const purchased365 = referrals?.filter(r => r.conversion_status === 'purchased_365').length || 0;
      const becamePartner = referrals?.filter(r => r.conversion_status === 'became_partner').length || 0;

      // 计算平均转化天数（使用已转化的记录）
      const convertedRefs = referrals?.filter(r => 
        r.conversion_status === 'purchased_365' || r.conversion_status === 'became_partner'
      ) || [];
      let avgDays = 0;
      if (convertedRefs.length > 0) {
        const totalDays = convertedRefs.reduce((sum, r) => {
          const regDate = new Date(r.created_at);
          const convDate = r.joined_group_at ? new Date(r.joined_group_at) : new Date();
          return sum + Math.floor((convDate.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        avgDays = Math.round(totalDays / convertedRefs.length);
      }

      // 本月数据
      const monthStart = startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).toISOString();
      const monthlyNew = referrals?.filter(r => r.created_at >= monthStart).length || 0;

      // 获取本月佣金（从 orders 表获取）
      const { data: orders } = await supabase
        .from('orders')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', monthStart);

      // 计算佣金（假设20%佣金率）
      const monthlyRevenue = (orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0) * 0.2;

      setStats({
        totalStudents,
        joinedGroup,
        purchased365,
        becamePartner,
        avgConversionDays: avgDays,
        monthlyNewStudents: monthlyNew,
        monthlyRevenue
      });

    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载分享效果统计
  const loadShareStats = async () => {
    try {
      // 获取合伙人的 partner_code
      const { data: partner } = await supabase
        .from('partners')
        .select('partner_code')
        .eq('id', partnerId)
        .single();
      
      if (!partner?.partner_code) return;
      
      const partnerCode = partner.partner_code;
      
      // 查询扫码落地事件
      const { data: landedEvents } = await supabase
        .from('conversion_events')
        .select('metadata')
        .eq('event_type', 'share_scan_landed')
        .eq('feature_key', 'wealth_camp');
      
      // 查询扫码转化事件
      const { data: convertedEvents } = await supabase
        .from('conversion_events')
        .select('metadata')
        .eq('event_type', 'share_scan_converted')
        .eq('feature_key', 'wealth_camp');
      
      // 过滤出当前合伙人的事件
      const myLanded = landedEvents?.filter(e => 
        (e.metadata as any)?.ref_code === partnerCode
      ) || [];
      
      const myConverted = convertedEvents?.filter(e => 
        (e.metadata as any)?.ref_code === partnerCode
      ) || [];
      
      // 统计最热门落地页
      const landingPages: Record<string, number> = {};
      myLanded.forEach(e => {
        const page = (e.metadata as any)?.landing_page || 'unknown';
        landingPages[page] = (landingPages[page] || 0) + 1;
      });
      
      const topLandingPage = Object.entries(landingPages)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      
      const conversionRate = myLanded.length > 0 
        ? ((myConverted.length / myLanded.length) * 100).toFixed(1)
        : '0';
      
      setShareStats({
        scanLanded: myLanded.length,
        scanConverted: myConverted.length,
        conversionRate: `${conversionRate}%`,
        topLandingPage: topLandingPage.replace('/wealth-block', '测评页').replace('/wealth-camp-intro', '训练营'),
      });
    } catch (error) {
      console.error('Load share stats error:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupJoinRate = stats && stats.totalStudents > 0 
    ? ((stats.joinedGroup / stats.totalStudents) * 100).toFixed(1)
    : '0';
  const purchaseRate = stats && stats.totalStudents > 0 
    ? (((stats.purchased365 + stats.becamePartner) / stats.totalStudents) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      {/* 关键指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              本月新增
            </div>
            <div className="text-2xl font-bold">{stats?.monthlyNewStudents || 0}</div>
            <p className="text-xs text-muted-foreground">位学员</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              本月收益
            </div>
            <div className="text-2xl font-bold text-green-600">
              ¥{stats?.monthlyRevenue.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">预估佣金</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              入群率
            </div>
            <div className="text-2xl font-bold">{groupJoinRate}%</div>
            <p className="text-xs text-muted-foreground">{stats?.joinedGroup}/{stats?.totalStudents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              平均转化
            </div>
            <div className="text-2xl font-bold">{stats?.avgConversionDays || '-'}</div>
            <p className="text-xs text-muted-foreground">天</p>
          </CardContent>
        </Card>
      </div>

      {/* 分享效果统计 */}
      {shareStats && (shareStats.scanLanded > 0 || shareStats.scanConverted > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-500" />
              分享效果
            </CardTitle>
            <CardDescription>扫码访问与转化数据</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                  <MousePointerClick className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-purple-700">{shareStats.scanLanded}</div>
                <div className="text-xs text-muted-foreground">扫码访问</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-700">{shareStats.scanConverted}</div>
                <div className="text-xs text-muted-foreground">转化人数</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-700">{shareStats.conversionRate}</div>
                <div className="text-xs text-muted-foreground">转化率</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-sm font-medium text-amber-700 truncate">{shareStats.topLandingPage}</div>
                <div className="text-xs text-muted-foreground">热门入口</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 趋势图 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            30天趋势
          </CardTitle>
          <CardDescription>新增学员、入群和转化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="newStudents" 
                  name="新学员"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="groupJoins" 
                  name="入群"
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="purchases" 
                  name="购买"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 转化漏斗概览 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">转化率分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">总学员</span>
              <Badge variant="secondary">{stats?.totalStudents || 0}</Badge>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                style={{ width: '100%' }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">已入群</span>
              <Badge variant="secondary">{stats?.joinedGroup || 0} ({groupJoinRate}%)</Badge>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-teal-500 rounded-full"
                style={{ width: `${groupJoinRate}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">已购买</span>
              <Badge variant="secondary">
                {(stats?.purchased365 || 0) + (stats?.becamePartner || 0)} ({purchaseRate}%)
              </Badge>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                style={{ width: `${purchaseRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}