import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Image, BarChart3, Clock, Shield, Zap } from "lucide-react";

export const BillingExplanation = () => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-4 h-4 text-primary" />
          收费说明
        </CardTitle>
        <CardDescription className="text-xs">了解各项功能的消费规则</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 计费规则 - 更紧凑 */}
        <div className="space-y-2">
          <h3 className="font-semibold text-xs text-muted-foreground">计费规则</h3>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-xs">
              <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium">AI对话</span>
              <span className="text-muted-foreground ml-auto">1次/条</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Image className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium">AI生成图片</span>
              <span className="text-muted-foreground ml-auto">5次/张</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <BarChart3 className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium">AI分析/推荐</span>
              <span className="text-muted-foreground ml-auto">1次/条</span>
            </div>
          </div>
        </div>

        {/* 套餐对比 - 更紧凑的表格 */}
        <div className="space-y-2">
          <h3 className="font-semibold text-xs text-muted-foreground">套餐对比</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 font-medium text-muted-foreground">项目</th>
                  <th className="text-center py-1.5 font-medium text-muted-foreground">尝鲜会员</th>
                  <th className="text-center py-1.5 font-medium text-muted-foreground">365会员</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-1.5 text-muted-foreground">价格</td>
                  <td className="py-1.5 text-center">¥9.9</td>
                  <td className="py-1.5 text-center font-semibold text-primary">¥365</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-muted-foreground">次数</td>
                  <td className="py-1.5 text-center">50次</td>
                  <td className="py-1.5 text-center font-semibold text-primary">1000次</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-muted-foreground">有效期</td>
                  <td className="py-1.5 text-center">365天</td>
                  <td className="py-1.5 text-center">365天</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-muted-foreground">限制</td>
                  <td className="py-1.5 text-center text-amber-600 dark:text-amber-500">限购一次</td>
                  <td className="py-1.5 text-center">不限</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 重要提示 - 更紧凑 */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
          <div className="flex items-start gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
            <span className="text-muted-foreground">所有套餐365天有效，过期作废</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">次数立即生效，累计计算</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 mt-0.5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <span className="text-muted-foreground font-medium">尝鲜会员限购一次</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <Shield className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
            <span className="text-muted-foreground">保护隐私数据安全</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
