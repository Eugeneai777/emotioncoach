import { useCoachStats, useCoachAppointments } from "@/hooks/useCoachDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Star, 
  TrendingUp,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface CoachDashboardOverviewProps {
  coachId: string;
}

export function CoachDashboardOverview({ coachId }: CoachDashboardOverviewProps) {
  const { data: stats, isLoading: statsLoading } = useCoachStats(coachId);
  const { data: upcomingAppointments } = useCoachAppointments(coachId, 'confirmed');

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "总预约数",
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "已完成",
      value: stats?.completedAppointments || 0,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "待处理",
      value: stats?.pendingAppointments || 0,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "总收入",
      value: `¥${stats?.totalIncome?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "平均评分",
      value: stats?.averageRating?.toFixed(1) || '5.0',
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "评价数量",
      value: stats?.totalReviews || 0,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">数据概览</h1>
        <p className="text-muted-foreground">查看您的教练业务数据</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              本月业绩
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">本月预约</span>
              <span className="font-bold text-lg">{stats?.thisMonthAppointments || 0} 次</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">本月收入</span>
              <span className="font-bold text-lg text-emerald-500">
                ¥{stats?.thisMonthIncome?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">待结算收入</span>
              <span className="font-bold text-lg text-orange-500">
                ¥{stats?.pendingIncome?.toFixed(2) || '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              即将开始的预约
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 3).map((apt) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(apt.appointment_date), 'MM/dd', { locale: zhCN })}
                        </p>
                        <p className="font-medium">{apt.start_time?.slice(0, 5)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {apt.profiles?.display_name || '用户'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {apt.service_name || '咨询服务'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {apt.duration_minutes}分钟
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                暂无即将开始的预约
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
