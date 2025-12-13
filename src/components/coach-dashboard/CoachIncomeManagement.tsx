import { useState } from "react";
import { useCoachAppointments, useCoachStats } from "@/hooks/useCoachDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Download
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { zhCN } from "date-fns/locale";

interface CoachIncomeManagementProps {
  coachId: string;
}

export function CoachIncomeManagement({ coachId }: CoachIncomeManagementProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: stats } = useCoachStats(coachId);
  const { data: allAppointments } = useCoachAppointments(coachId);

  const completedAppointments = allAppointments?.filter(apt => apt.status === 'completed') || [];
  const pendingAppointments = allAppointments?.filter(apt => 
    ['confirmed', 'in_progress'].includes(apt.status || '')
  ) || [];

  // Monthly breakdown
  const monthlyData = () => {
    const months = [];
    for (let i = 0; i < 6; i++) {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthAppointments = completedAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });
      
      const income = monthAppointments.reduce((sum, apt) => sum + Number(apt.amount_paid || 0), 0);
      
      months.push({
        month: format(month, 'yyyy年MM月', { locale: zhCN }),
        appointments: monthAppointments.length,
        income,
      });
    }
    return months;
  };

  const incomeCards = [
    {
      title: "总收入",
      value: `¥${stats?.totalIncome?.toFixed(2) || '0.00'}`,
      icon: Wallet,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      description: "累计已结算收入",
    },
    {
      title: "待结算",
      value: `¥${stats?.pendingIncome?.toFixed(2) || '0.00'}`,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: "预约完成后结算",
    },
    {
      title: "本月收入",
      value: `¥${stats?.thisMonthIncome?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: `本月 ${stats?.thisMonthAppointments || 0} 次咨询`,
    },
    {
      title: "已完成咨询",
      value: stats?.completedAppointments || 0,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      description: "累计完成次数",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">收入管理</h1>
          <p className="text-muted-foreground">查看您的收入明细</p>
        </div>
      </div>

      {/* Income Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {incomeCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">月度统计</TabsTrigger>
          <TabsTrigger value="completed">已结算</TabsTrigger>
          <TabsTrigger value="pending">待结算</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>近6个月收入</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>月份</TableHead>
                    <TableHead className="text-right">咨询次数</TableHead>
                    <TableHead className="text-right">收入</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData().map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">{row.appointments} 次</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        ¥{row.income.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>已结算记录</CardTitle>
            </CardHeader>
            <CardContent>
              {completedAppointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>服务</TableHead>
                      <TableHead>时长</TableHead>
                      <TableHead className="text-right">金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          {format(new Date(apt.appointment_date), 'MM/dd', { locale: zhCN })}
                        </TableCell>
                        <TableCell>{apt.profiles?.display_name || '用户'}</TableCell>
                        <TableCell>{apt.service_name || '咨询'}</TableCell>
                        <TableCell>{apt.duration_minutes}分钟</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          ¥{Number(apt.amount_paid || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  暂无已结算记录
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>待结算记录</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAppointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>服务</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          {format(new Date(apt.appointment_date), 'MM/dd', { locale: zhCN })}
                        </TableCell>
                        <TableCell>{apt.profiles?.display_name || '用户'}</TableCell>
                        <TableCell>{apt.service_name || '咨询'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {apt.status === 'confirmed' ? '待进行' : '进行中'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-600">
                          ¥{Number(apt.amount_paid || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  暂无待结算记录
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
