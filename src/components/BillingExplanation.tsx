import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Image, BarChart3, Clock, Shield, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const BillingExplanation = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          收费说明
        </CardTitle>
        <CardDescription>了解各项功能的消费规则</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 计费规则 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">💰 计费规则</h3>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-sm">AI对话</div>
                <div className="text-sm text-muted-foreground">每次消耗 1 次</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Image className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-sm">AI生成图片</div>
                <div className="text-sm text-muted-foreground">每张消耗 5 次</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-sm">AI分析/推荐</div>
                <div className="text-sm text-muted-foreground">每次消耗 1 次</div>
              </div>
            </div>
          </div>
        </div>

        {/* 套餐对比 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">📊 套餐对比</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">项目</th>
                  <th className="text-center py-2 font-medium">基础套餐</th>
                  <th className="text-center py-2 font-medium">365会员</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 text-muted-foreground">价格</td>
                  <td className="py-2 text-center">免费</td>
                  <td className="py-2 text-center font-semibold text-primary">¥365</td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">对话次数</td>
                  <td className="py-2 text-center">50次</td>
                  <td className="py-2 text-center font-semibold text-primary">1000次</td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">有效期</td>
                  <td className="py-2 text-center">永久</td>
                  <td className="py-2 text-center">365天</td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">功能</td>
                  <td className="py-2 text-center">基础功能</td>
                  <td className="py-2 text-center font-semibold text-primary">全部高级功能</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 重要提示 */}
        <Alert>
          <AlertDescription className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 text-amber-500" />
              <span>365会员自购买之日起365天有效，过期未使用次数作废</span>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 mt-0.5 text-primary" />
              <span>套餐购买后立即生效，对话次数累计计算</span>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 text-green-500" />
              <span>我们承诺保护您的隐私数据安全</span>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
