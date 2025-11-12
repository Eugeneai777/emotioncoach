import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const EmotionIntensityGuide = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary/80">
          <Info className="w-4 h-4" />
          <span className="text-xs">了解情绪强度</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">💡 情绪强度是什么？</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            帮助你理解和管理情绪的重要指标
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* 什么是情绪强度 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <span className="text-primary">📊</span>
              什么是情绪强度？
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
              情绪强度是指你体验某种情绪的<span className="font-medium text-foreground">激烈程度</span>。
              它反映了情绪对你当下状态的影响力，从1-10分由低到高。
            </p>
          </div>

          {/* 不同强度的意义 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <span className="text-primary">🎯</span>
              不同强度代表什么？
            </h3>
            <div className="space-y-3 pl-6">
              <Card className="p-3 border-green-200 bg-green-50/50">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white font-medium">1-3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">轻微 · 平和状态</p>
                    <p className="text-xs text-green-700 mt-1">
                      情绪温和可控，心境平稳，这是理想的日常状态
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 border-blue-200 bg-blue-50/50">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white font-medium">4-5</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">中等 · 有感觉的</p>
                    <p className="text-xs text-blue-700 mt-1">
                      情绪有明显感受但仍可管理，正常的情绪波动范围
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 border-orange-200 bg-orange-50/50">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white font-medium">6-7</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-900">较强 · 需要关注</p>
                    <p className="text-xs text-orange-700 mt-1">
                      情绪开始影响日常，建议及时觉察和调整
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 border-red-200 bg-red-50/50">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white font-medium">8-10</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-900">强烈 · 优先处理</p>
                    <p className="text-xs text-red-700 mt-1">
                      情绪非常激烈，可能难以自控，需要优先关注和处理
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* 什么是好的情绪强度 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-green-600" />
              什么样的强度是健康的？
            </h3>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">没有绝对的"好"或"坏"</span>，
                关键是情绪强度是否与<span className="text-foreground">情境匹配</span>：
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>适度的情绪起伏是正常的，说明你在真实感受生活</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>重要事件引发的强烈情绪（如失去、成功）是合理的</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">⚠</span>
                  <span>持续7分以上的高强度情绪需要关注和调整</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">⚠</span>
                  <span>小事引发过度反应，可能需要探索更深层原因</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 如何改善情绪强度 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              如何改善情绪强度？
            </h3>
            <div className="pl-6 space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">🌿 即刻可做</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="font-medium">深呼吸</span>：腹式呼吸5次，每次吸气4秒-屏息4秒-呼气6秒</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="font-medium">身体扫描</span>：注意情绪在身体哪里，允许它存在而不评判</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="font-medium">改变环境</span>：离开当前空间，走动或看向窗外</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">🧘 长期实践</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="font-medium">每日梳理</span>：坚持使用劲老师记录情绪，培养觉察习惯</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="font-medium">识别触发点</span>：观察什么事件容易引发高强度情绪</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="font-medium">建立支持系统</span>：与信任的人分享，寻求陪伴</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="font-medium">规律生活</span>：充足睡眠、适度运动、健康饮食</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 何时需要帮助 */}
          <Card className="p-4 border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-900">何时需要专业帮助？</p>
                <ul className="space-y-1.5 text-xs text-amber-800">
                  <li className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>情绪持续高强度（7分以上）超过2周</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>严重影响工作、学习或人际关系</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>出现自我伤害或伤害他人的想法</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>感到无法自己应对，需要额外支持</span>
                  </li>
                </ul>
                <p className="text-xs text-amber-700 italic pt-1">
                  💫 寻求专业帮助是勇敢和负责的表现
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};