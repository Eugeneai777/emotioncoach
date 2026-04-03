import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, Sparkles, ChevronRight, Share2, RotateCcw, AlertTriangle, Target, Compass, Search, Brain, Bot, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  type EmotionHealthResult as EmotionHealthResultType,
  patternConfig,
  blockedDimensionConfig,
  getIndexLevel,
  getIndexLevelLabel,
  getIndexLevelColor,
  getIndexBarColor,
  resultPageFooterConfig,
  resultPageSectionTitles
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
    navigate('/assessment-coach', { 
      state: { 
        pattern: result.primaryPattern,
        blockedDimension: result.blockedDimension,
        fromAssessment: 'emotion_health'
      } 
    });
  };

  return (
    <div className="space-y-4">
      {/* 模块1：状态概览仪表盘 */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{resultPageSectionTitles.statusOverview.title}</CardTitle>
            <Badge 
              variant={overallLevel === 'high' ? 'destructive' : overallLevel === 'medium' ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {overallRisk}
            </Badge>
          </div>
          <CardDescription className="text-xs">{resultPageSectionTitles.statusOverview.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <IndexBar label="情绪能量" value={result.energyIndex} />
          <IndexBar label="焦虑张力" value={result.anxietyIndex} />
          <IndexBar label="压力负载" value={result.stressIndex} />
          <p className="text-[10px] text-muted-foreground mt-2">
            {resultPageSectionTitles.statusOverview.footnote}
          </p>
        </CardContent>
      </Card>

      {/* 模块2：反应模式 - 增强版 */}
      <Card className={cn("border-2", primaryPattern.bgColor)}>
        <CardHeader className="pb-3">
          <p className="text-xs text-muted-foreground mb-2">
            {resultPageSectionTitles.reactionPattern.title}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{primaryPattern.emoji}</span>
            <div>
              <Badge variant="secondary" className="text-xs mb-1">主要模式</Badge>
              <h3 className="text-xl font-bold">{primaryPattern.name}</h3>
              <p className="text-xs text-muted-foreground">{primaryPattern.targetAudience}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* 戳心总结 */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <Compass className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">🧭 一句话看懂你现在的状态</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  "{primaryPattern.headline}"
                </p>
              </div>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {/* 典型表现 */}
            <AccordionItem value="symptoms" className="border-b-0">
              <AccordionTrigger className="text-sm py-2 hover:no-underline">
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  🔍 你可能正在经历
                </span>
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

            {/* 内在机制 */}
            <AccordionItem value="mechanism" className="border-b-0">
              <AccordionTrigger className="text-sm py-2 hover:no-underline">
                <span className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5" />
                  🧠 这背后的真实原因
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{primaryPattern.mechanism}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* 当下需要 */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-medium">🎯 {primaryPattern.needsContext}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {primaryPattern.currentNeeds.map((need, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  {need}
                </span>
              ))}
            </div>
          </div>

          {/* AI陪伴说明 */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">🤖 AI教练下一步会这样陪你</p>
            </div>
            <div className="pl-6">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{primaryPattern.aiNextStep}"
              </p>
            </div>
          </div>

          {/* 推荐路径 */}
          <div className="flex items-center gap-2 text-xs p-2 rounded bg-primary/5">
            <ChevronRight className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">推荐路径：</span>
            <span className="font-medium text-foreground">{primaryPattern.recommendedCoachLabel} + {primaryPattern.recommendedCampLabel}</span>
          </div>
          
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
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            {resultPageSectionTitles.blockPoint.title}
          </CardTitle>
          <CardDescription className="text-xs">{resultPageSectionTitles.blockPoint.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-purple-500/10">
            <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 flex items-center justify-center text-white text-sm">
                !
              </span>
              {blockedDim.blockPointName}
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
            <CardTitle className="text-sm">{resultPageSectionTitles.firstStep.title}</CardTitle>
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

      {/* 模块5：统一承接区 */}
      <Card className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-rose-500/5 border-primary/20">
        <CardContent className="p-5 text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground leading-relaxed">
              {resultPageFooterConfig.message}
            </p>
            <p className="text-sm text-muted-foreground">
              {resultPageFooterConfig.subMessage}
            </p>
          </div>
          <div className="space-y-2">
            <Button 
              size="lg" 
              className="w-full h-12 text-base bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
              onClick={handleStartCoach}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {resultPageFooterConfig.ctaText}
            </Button>
            <p className="text-xs text-muted-foreground">
              {resultPageSectionTitles.cta.primarySubtext}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 其他操作按钮 */}
      <div className="space-y-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
        {/* 成长支持路径入口 */}
        <Button 
          variant="outline" 
          className="w-full bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-violet-200 dark:border-violet-800 hover:from-violet-500/10 hover:to-purple-500/10"
          onClick={() => navigate('/growth-path')}
        >
          <Map className="w-4 h-4 mr-2 text-violet-600 dark:text-violet-400" />
          查看完整成长支持路径
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/camp-intro/emotion_stress_7')}
        >
          {resultPageSectionTitles.cta.secondaryText}
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
        {resultPageSectionTitles.compliance}
      </p>
    </div>
  );
}

interface IndexBarProps {
  label: string;
  value: number;
}

function IndexBar({ label, value }: IndexBarProps) {
  const level = getIndexLevel(value);
  const levelLabel = getIndexLevelLabel(level);
  const levelColor = getIndexLevelColor(level);
  const barColor = getIndexBarColor(level);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}/100</span>
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
