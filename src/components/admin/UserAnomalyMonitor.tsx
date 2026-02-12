import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Bug, Wifi, Activity, BarChart3, CreditCard } from "lucide-react";
import FrontendErrorMonitor from "./FrontendErrorMonitor";
import ApiErrorMonitor from "./ApiErrorMonitor";
import UxAnomalyMonitor from "./UxAnomalyMonitor";
import AnomalyAggregation from "./AnomalyAggregation";
import PaymentMonitor from "./PaymentMonitor";

export default function UserAnomalyMonitor() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6" />
          用户异常监控
        </h1>
        <p className="text-muted-foreground mt-1">监控异常用户行为、前端运行异常、接口异常等</p>
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
