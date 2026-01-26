import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, Sparkles, ChevronRight, Share2, RotateCcw, AlertTriangle, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  type EmotionHealthResult as EmotionHealthResultType,
  patternConfig,
  blockedDimensionConfig,
  getIndexLevel,
  getIndexLevelLabel,
  getIndexLevelColor,
  getIndexBarColor
} from "./emotionHealthData";

interface EmotionHealthResultProps {
  result: EmotionHealthResultType;
  onShare?: () => void;
  onRetake?: () => void;
}

export function EmotionHealthResult({ result, onShare, onRetake }: EmotionHealthResultProps) {
  const navigate = useNavigate();
  const primaryPattern = patternConfig[result.primaryPattern];
  const secondaryPattern = result.secondaryPattern ? patternConfig[result.secondaryPattern] : null;
  const blockedDim = blockedDimensionConfig[result.blockedDimension];

  // 计算整体风险等级
  const avgIndex = Math.round((result.energyIndex + result.anxietyIndex + result.stressIndex) / 3);
  const overallLevel = getIndexLevel(avgIndex);
  const overallRisk = overallLevel === 'high' ? '需要关注' : overallLevel === 'medium' ? '适度留意' : '状态良好';

  const handleStartCoach = () => {
    navigate('/coach-space', { 
      state: { 
        fromAssessment: 'emotion_health',
        pattern: result.primaryPattern 
      } 
    });
  };

  return (
    <div className="space-y-4">
      {/* 模块1：状态概览仪表盘 */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">第一层：状态筛查结果</CardTitle>
            <Badge 
              variant={overallLevel === 'high' ? 'destructive' : overallLevel === 'medium' ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {overallRisk}
            </Badge>
          </div>
          <CardDescription className="text-xs">基于你的作答生成的三大指数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <IndexBar label="情绪能量" value={result.energyIndex} description="对标PHQ-9简化" />
          <IndexBar label="焦虑张力" value={result.anxietyIndex} description="对标GAD-7简化" />
          <IndexBar label="压力负载" value={result.stressIndex} description="对标PSS-10简化" />
          <p className="text-[10px] text-muted-foreground mt-2">
            指数反映的是你最近的主观感受强度，不是诊断结果，只用于帮助你更好了解自己。
          </p>
        </CardContent>
      </Card>

      {/* 模块2：反应模式 */}
      <Card className={cn("border-2", primaryPattern.bgColor)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Target className="w-3.5 h-3.5" />
            第二层：反应模式识别
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{primaryPattern.emoji}</span>
            <div>
              <Badge variant="secondary" className="text-xs mb-1">主要模式</Badge>
              <h3 className="text-xl font-bold">{primaryPattern.name}</h3>
              <p className="text-xs text-muted-foreground">{primaryPattern.targetAudience}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{primaryPattern.description}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="symptoms" className="border-b-0">
              <AccordionTrigger className="text-sm py-2 hover:no-underline">
                你可能正在经历
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {primaryPattern.symptoms.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="mechanism" className="border-b-0">
              <AccordionTrigger className="text-sm py-2 hover:no-underline">
                这背后的真实原因
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">{primaryPattern.mechanism}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {secondaryPattern && (
            <Badge variant="outline" className="mt-3">
              次要模式：{secondaryPattern.emoji} {secondaryPattern.name}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* 模块3：行动阻滞点 */}
      <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            第三层：行动阻滞点
          </div>
          <CardTitle className="text-sm">你目前最需要优先修复的是</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-purple-500/10">
            <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 flex items-center justify-center text-white text-sm">
                !
              </span>
              {blockedDim.name}
            </h4>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {blockedDim.description}
            </p>
            <div className="mt-3 pt-3 border-t border-rose-200/50 dark:border-rose-700/50">
              <p className="text-xs text-muted-foreground">
                推荐路径：<span className="text-foreground font-medium">{blockedDim.recommendedCoach} + {blockedDim.recommendedCamp}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 模块4：今日第一步 */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-sm">今天你可以先从这一步开始</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-white/60 dark:bg-black/20">
            <h4 className="font-medium text-sm">{primaryPattern.firstStepTitle}</h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {primaryPattern.firstStepDescription}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 模块5：行动按钮 */}
      <div className="space-y-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <Button 
          size="lg" 
          className="w-full h-12 text-base bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
          onClick={handleStartCoach}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          开始我的 AI 陪伴对话
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          根据你的状态，我会陪你一步步调整节奏
        </p>
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/camps')}
        >
          查看完整成长支持路径
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

        <div className="flex gap-3 pt-2">
          {onShare && (
            <Button variant="ghost" size="sm" onClick={onShare} className="flex-1">
              <Share2 className="w-4 h-4 mr-1" />
              分享结果
            </Button>
          )}
          {onRetake && (
            <Button variant="ghost" size="sm" onClick={onRetake} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-1" />
              重新测评
            </Button>
          )}
        </div>
      </div>

      {/* 合规声明 */}
      <p className="text-[10px] text-muted-foreground text-center px-4 py-3 border-t">
        本测评为情绪状态与成长觉察工具，不构成任何医学诊断或治疗建议。
        若你感到持续严重不适，请及时联系专业心理支持机构。
      </p>
    </div>
  );
}

interface IndexBarProps {
  label: string;
  value: number;
  description?: string;
}

function IndexBar({ label, value, description }: IndexBarProps) {
  const level = getIndexLevel(value);
  const levelLabel = getIndexLevelLabel(level);
  const levelColor = getIndexLevelColor(level);
  const barColor = getIndexBarColor(level);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{label}</span>
          {description && (
            <span className="text-[10px] text-muted-foreground/60">({description})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
          <span className={cn("text-xs", levelColor)}>({levelLabel})</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
