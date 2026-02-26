import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, Bug, Wifi, Activity, BarChart3, CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import FrontendErrorMonitor from "./FrontendErrorMonitor";
import ApiErrorMonitor from "./ApiErrorMonitor";
import UxAnomalyMonitor from "./UxAnomalyMonitor";
import AnomalyAggregation from "./AnomalyAggregation";
import PaymentMonitor from "./PaymentMonitor";
import { injectMonitorMockData } from "@/lib/monitorMockData";

export default function UserAnomalyMonitor() {
  const [injecting, setInjecting] = useState(false);
  const queryClient = useQueryClient();

  const handleSimulate = async () => {
    setInjecting(true);
    try {
      const result = await injectMonitorMockData();
      const total = result.frontendErrors + result.apiErrors + result.uxAnomalies;
      toast.success(`模拟预警数据已注入 ${total} 条`, {
        description: `前端 ${result.frontendErrors} · 接口 ${result.apiErrors} · 体验 ${result.uxAnomalies}`,
      });
      // 刷新所有监控查询
      queryClient.invalidateQueries({ queryKey: ['monitor-frontend-errors'] });
      queryClient.invalidateQueries({ queryKey: ['monitor-api-errors'] });
      queryClient.invalidateQueries({ queryKey: ['monitor-ux-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['monitor-stability-records'] });
    } catch (e) {
      toast.error('模拟数据注入失败');
      console.error(e);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            用户异常监控
          </h1>
          <p className="text-muted-foreground mt-1">监控异常用户行为、前端运行异常、接口异常等 · 数据持久化 · 覆盖 Web/移动端/微信/小程序</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSimulate} disabled={injecting}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          {injecting ? '注入中...' : '模拟预警'}
        </Button>
      </div>

      <Tabs defaultValue="aggregation" className="w-full">
        <TabsList>
          <TabsTrigger value="aggregation" className="text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">聚合分析</span>
            <span className="sm:hidden">聚合</span>
          </TabsTrigger>
          <TabsTrigger value="user" className="text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">用户异常</span>
            <span className="sm:hidden">用户</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">支付监控</span>
            <span className="sm:hidden">支付</span>
          </TabsTrigger>
          <TabsTrigger value="frontend" className="text-xs sm:text-sm">
            <Bug className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">前端异常监控</span>
            <span className="sm:hidden">前端</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="text-xs sm:text-sm">
            <Wifi className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">接口异常监控</span>
            <span className="sm:hidden">接口</span>
          </TabsTrigger>
          <TabsTrigger value="ux" className="text-xs sm:text-sm">
            <Activity className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">体验异常监控</span>
            <span className="sm:hidden">体验</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">异常登录</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="!p-6">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">今日检测</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">高频调用用户</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="!p-6">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">超过阈值</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">可疑操作</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="!p-6">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">待审查</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>异常事件列表</CardTitle>
            </CardHeader>
            <CardContent className="!p-6">
              <p className="text-muted-foreground text-sm">暂无异常事件</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <PaymentMonitor />
        </TabsContent>

        <TabsContent value="frontend">
          <FrontendErrorMonitor />
        </TabsContent>

        <TabsContent value="api">
          <ApiErrorMonitor />
        </TabsContent>

        <TabsContent value="ux">
          <UxAnomalyMonitor />
        </TabsContent>

        <TabsContent value="aggregation">
          <AnomalyAggregation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
