import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Handshake,
  AlertCircle,
  Flag,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";

export default function AdminDashboard() {
  // 获取用户统计
  const { data: userStats, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: todayUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      
      const { count: yesterdayUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday)
        .lt('created_at', today);
      
      return { 
        total: totalUsers || 0, 
        today: todayUsers || 0,
        yesterday: yesterdayUsers || 0
      };
    }
  });

  // 获取订单统计
  const { data: orderStats, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-order-stats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      
      const { count: todayOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paid')
        .gte('paid_at', today);
      
      const { data: monthlyRevenue } = await supabase
        .from('orders')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', monthStart);
      
      const totalRevenue = monthlyRevenue?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
      
      return { 
        todayOrders: todayOrders || 0,
        monthlyRevenue: totalRevenue
      };
    }
  });

  // 获取合伙人统计
  const { data: partnerStats, isLoading: loadingPartners } = useQuery({
    queryKey: ['admin-partner-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('partners' as any)
        .select('id')
        .eq('partner_type', 'youjin')
        .eq('is_active', true);
      
      return { active: (data as any[])?.length || 0 };
    }
  });

  // 获取待处理事项
  const { data: pendingItems, isLoading: loadingPending } = useQuery({
    queryKey: ['admin-pending-items'],
    queryFn: async () => {
      const { count: pendingReports } = await supabase
        .from('post_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      const { count: costAlerts } = await supabase
        .from('cost_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_acknowledged', false);
      
      return {
        reports: pendingReports || 0,
        costAlerts: costAlerts || 0
      };
    }
  });

  interface StatCardProps {
    title: string;
    value: number | string;
    change?: number;
    changeLabel?: string;
    icon: React.ElementType;
    loading: boolean;
    href?: string;
  }

  const StatCard = ({ title, value, change, changeLabel, icon: Icon, loading, href }: StatCardProps) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {change !== undefined && (
              <div className={`flex items-center text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{Math.abs(change)} {changeLabel}</span>
              </div>
            )}
            {href && (
              <Link to={href} className="text-xs text-primary hover:underline mt-2 inline-block">
                查看详情 →
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">概览仪表板</h1>
        <p className="text-muted-foreground">查看平台关键数据和待处理事项</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总用户数"
          value={userStats?.total || 0}
          change={userStats?.today}
          changeLabel="今日新增"
          icon={Users}
          loading={loadingUsers}
          href="/admin/users"
        />
        <StatCard
          title="今日订单"
          value={orderStats?.todayOrders || 0}
          icon={ShoppingCart}
          loading={loadingOrders}
          href="/admin/orders"
        />
        <StatCard
          title="本月收入"
          value={`¥${(orderStats?.monthlyRevenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          loading={loadingOrders}
          href="/admin/orders"
        />
        <StatCard
          title="活跃合伙人"
          value={partnerStats?.active || 0}
          icon={Handshake}
          loading={loadingPartners}
          href="/admin/partners"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 待处理事项 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              待处理事项
            </CardTitle>
            <CardDescription>需要您关注的事项</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <Link 
                  to="/admin/reports" 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Flag className="h-4 w-4 text-red-500" />
                    <span>待审核举报</span>
                  </div>
                  <span className="font-semibold text-red-500">{pendingItems?.reports || 0}</span>
                </Link>
                <Link 
                  to="/admin/cost-monitor" 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span>成本预警</span>
                  </div>
                  <span className="font-semibold text-orange-500">{pendingItems?.costAlerts || 0}</span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              快速操作
            </CardTitle>
            <CardDescription>常用管理操作入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
                <Link to="/admin/users">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">用户充值</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
                <Link to="/admin/partners">
                  <Handshake className="h-4 w-4" />
                  <span className="text-xs">添加合伙人</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
                <Link to="/admin/videos">
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">新增课程</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
                <Link to="/admin/sync">
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-xs">同步状态</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
