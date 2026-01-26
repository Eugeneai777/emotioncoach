import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, TrendingUp, Clock, Shield, Sparkles, ChevronRight, Zap } from "lucide-react";
import { ThreeLayerDiagram } from "./ThreeLayerDiagram";
import { scientificStats, painPoints } from "./emotionHealthData";

interface EmotionHealthStartScreenProps {
  onStart: () => void;
  isLoading?: boolean;
}

export function EmotionHealthStartScreen({ onStart, isLoading }: EmotionHealthStartScreenProps) {
  return (
    <div className="space-y-4">
      {/* 头部介绍卡片 */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500 p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-6 h-6" />
            <h1 className="text-xl font-bold">情绪健康组合测评</h1>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">
            基于心理学专业量表设计，通过三层诊断系统帮助你深入了解当前的情绪状态与反应模式，找到最适合你的成长路径。
          </p>
        </div>
        <CardContent className="p-4 space-y-4">
          {/* 三层诊断系统可视化 */}
          <div className="flex flex-col items-center py-4">
            <ThreeLayerDiagram size={180} />
          </div>

          {/* 三层诊断系统说明 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              三层诊断系统
            </h3>
            <div className="grid gap-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    第一层：状态筛查
                    <Badge variant="outline" className="text-[10px] h-4 bg-blue-50 dark:bg-blue-900/30">12题</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">情绪能量 · 焦虑张力 · 压力负载</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    第二层：反应模式
                    <Badge variant="outline" className="text-[10px] h-4 bg-purple-50 dark:bg-purple-900/30">16题</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">识别你的情绪自动反应模式</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    第三层：行动路径
                    <Badge variant="outline" className="text-[10px] h-4 bg-rose-50 dark:bg-rose-900/30">4题</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">匹配最适合你的成长支持</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 测评信息 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>约5-8分钟</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>结果仅自己可见</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 为什么需要三层诊断 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            为什么需要三层诊断？
          </h3>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              改变的关键不在于知道，而在于<span className="text-foreground font-medium">找到卡住的那一层</span>。
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">表面症状</span>
              <ChevronRight className="w-3 h-3" />
              <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">反应模式</span>
              <ChevronRight className="w-3 h-3" />
              <span className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">根本阻滞</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              只看表面症状，容易头痛医头。只有层层深入，才能找到真正卡住你的那个点，给出对症的成长路径。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 科学数据背书 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">科学研究支持</h3>
          <div className="grid gap-3">
            {scientificStats.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  {item.stat}
                </span>
                <div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{item.source}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 痛点共鸣 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">你是否也有这样的感受？</h3>
          <div className="grid grid-cols-2 gap-2">
            {painPoints.map((item, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50 text-center">
                <span className="text-xl mb-1 block">{item.emoji}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 四大反应模式预览 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">将帮你识别的四大反应模式</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <span className="text-lg">🔋</span>
              <div className="text-xs font-medium mt-1">能量耗竭型</div>
              <div className="text-[10px] text-muted-foreground">长期付出无恢复</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <span className="text-lg">🎯</span>
              <div className="text-xs font-medium mt-1">高度紧绷型</div>
              <div className="text-[10px] text-muted-foreground">完美主义+控制</div>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <span className="text-lg">🤐</span>
              <div className="text-xs font-medium mt-1">情绪压抑型</div>
              <div className="text-[10px] text-muted-foreground">不敢表达需要</div>
            </div>
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
              <span className="text-lg">🐢</span>
              <div className="text-xs font-medium mt-1">逃避延迟型</div>
              <div className="text-[10px] text-muted-foreground">一来就拖延</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 开始按钮 */}
      <div className="pb-[calc(20px+env(safe-area-inset-bottom))]">
        <Button 
          size="lg" 
          className="w-full h-12 text-base bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
          onClick={onStart}
          disabled={isLoading}
        >
          {isLoading ? "加载中..." : "开始三层诊断"}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          共32道题目，请根据最近两周的真实感受作答
        </p>
      </div>

      {/* 合规声明 */}
      <p className="text-[10px] text-muted-foreground text-center px-4">
        本测评为情绪状态与成长觉察工具，不构成任何医学诊断或治疗建议。
        若你感到持续严重不适，请及时联系专业心理支持机构。
      </p>
    </div>
  );
}
