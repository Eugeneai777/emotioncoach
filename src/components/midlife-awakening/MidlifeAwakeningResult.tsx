import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Share2, RotateCcw, Bot, ChevronRight, History, Star, AlertCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from "@/components/ui/accordion";
import {
  type MidlifeResult,
  personalityTypeConfig,
  dimensionConfig,
  resultSectionTitles,
  personalityRecommendations,
  getMidlifeScoreLevelLabel,
  getMidlifeScoreLevelColor,
  getMidlifeBarColor,
  type MidlifeDimension,
} from "./midlifeAwakeningData";
import { MidlifeAIAnalysis, type MidlifeAIAnalysisData } from "./MidlifeAIAnalysis";

interface MidlifeAwakeningResultProps {
  result: MidlifeResult;
  onShare?: () => void;
  onRetake?: () => void;
  onViewHistory?: () => void;
  aiAnalysis?: MidlifeAIAnalysisData | null;
  aiAnalysisLoading?: boolean;
  aiAnalysisError?: string | null;
}

// === 环形进度圈 + 计数动画 ===
function CoreMetricRing({ value, label, icon, delay = 0 }: { value: number; label: string; icon: string; delay?: number }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let raf: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [started, value]);

  const size = 88;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / 100) * circumference;
  const levelColor = getMidlifeScoreLevelColor(value);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
            className="stroke-primary"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 0.1s linear"
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg">{icon}</span>
          <span className={cn("text-xl font-bold tabular-nums", levelColor)}>{animatedValue}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

// === 维度进度条（带动画） ===
function AnimatedDimensionBar({ label, value, icon, description, tag }: {
  label: string; value: number; icon: string; description: string; tag?: 'highest' | 'lowest' | null;
}) {
  const [width, setWidth] = useState(0);
  const levelLabel = getMidlifeScoreLevelLabel(value);
  const levelColor = getMidlifeScoreLevelColor(value);
  const barColor = getMidlifeBarColor(value);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span className="font-medium">{label}</span>
          {tag === 'highest' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
              <Star className="w-3 h-3 mr-0.5" />最强项
            </Badge>
          )}
          {tag === 'lowest' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0">
              <AlertCircle className="w-3 h-3 mr-0.5" />需关注
            </Badge>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{value}</span>
          <span className={cn("text-xs", levelColor)}>{levelLabel}</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", barColor)}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground pl-6">{description}</p>
    </div>
  );
}

export function MidlifeAwakeningResult({ result, onShare, onRetake, onViewHistory, aiAnalysis, aiAnalysisLoading = false, aiAnalysisError }: MidlifeAwakeningResultProps) {
  const navigate = useNavigate();
  const personality = personalityTypeConfig[result.personalityType];
  const recommendation = personalityRecommendations[result.personalityType];

  // 雷达图数据
  const radarData = result.dimensions.map(d => ({
    dimension: dimensionConfig[d.dimension].shortName,
    value: d.score,
    fullMark: 100,
  }));

  // 找最高分和最低分维度
  const sortedDims = [...result.dimensions].sort((a, b) => b.score - a.score);
  const highestDim = sortedDims[0]?.dimension;
  const lowestDim = sortedDims[sortedDims.length - 1]?.dimension;

  const handleStartCoach = () => {
    navigate('/assessment-coach', {
      state: {
        pattern: result.personalityType,
        blockedDimension: result.personalityType,
        fromAssessment: 'midlife_awakening',
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. 人格类型揭晓 — 仪式感入场 */}
      <Card className={cn("border-2 overflow-hidden animate-scale-in", personality.bgColor)}>
        <div className={cn("p-6 text-white text-center", personality.gradient)}>
          <span className="text-5xl block mb-2 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">{personality.emoji}</span>
          <h2 className="text-xl font-bold">{personality.name}</h2>
          <p className="text-base mt-1 font-medium opacity-95 bg-gradient-to-r from-white to-white/80 bg-clip-text">{personality.tagline}</p>
        </div>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{personality.description}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground">特征</p>
              <p className="text-xs font-medium mt-0.5">{personality.feature}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground">核心困境</p>
              <p className="text-xs font-medium mt-0.5">{personality.coreDilemma}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground">突破口</p>
              <p className="text-xs font-medium mt-0.5">{personality.breakthrough}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 核心指标概览 — 3个环形进度圈 */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">核心指标</CardTitle>
          <CardDescription className="text-xs">基于六维数据整合的三大关键指标</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around">
            <CoreMetricRing value={result.internalFrictionRisk} label="内耗风险" icon="🌀" delay={200} />
            <CoreMetricRing value={result.actionPower} label="行动力" icon="⚡" delay={400} />
            <CoreMetricRing value={result.missionClarity} label="使命清晰度" icon="🧭" delay={600} />
          </div>
        </CardContent>
      </Card>

      {/* 3. AI 深度分析 */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <MidlifeAIAnalysis
          analysis={aiAnalysis || null}
          isLoading={aiAnalysisLoading}
          error={aiAnalysisError || null}
          personalityType={result.personalityType}
        />
      </div>

      {/* 4. 六维雷达图 */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{resultSectionTitles.radarChart.title}</CardTitle>
          <CardDescription className="text-xs">{resultSectionTitles.radarChart.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <defs>
                  <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(35, 95%, 60%)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  name="得分" dataKey="value"
                  stroke="hsl(25, 95%, 53%)" fill="url(#radarFill)"
                  fillOpacity={1} strokeWidth={2}
                  dot={{ r: 4, fill: "hsl(25, 95%, 53%)", strokeWidth: 0 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 5. 维度详情（可折叠 Accordion） */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{resultSectionTitles.dimensions.title}</CardTitle>
          <CardDescription className="text-xs">{resultSectionTitles.dimensions.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {result.dimensions.map(d => {
              const config = dimensionConfig[d.dimension];
              const tag = d.dimension === highestDim ? 'highest' as const
                : d.dimension === lowestDim ? 'lowest' as const
                : null;
              return (
                <AccordionItem key={d.dimension} value={d.dimension} className="border-b-0">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{config.icon}</span>
                      <span className="font-medium">{config.name}</span>
                      {tag === 'highest' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                          最强项
                        </Badge>
                      )}
                      {tag === 'lowest' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0">
                          需关注
                        </Badge>
                      )}
                      <span className="ml-auto mr-2 font-bold">{d.score}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <AnimatedDimensionBar
                      label={config.name}
                      value={d.score}
                      icon={config.icon}
                      description={config.description}
                      tag={tag}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* 6. "你的下一步" — 整合 CTA */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 animate-fade-in"
        style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">你的下一步</h3>
              <p className="text-xs text-muted-foreground">根据你的「{personality.name}」特征，为你定制的突破路径</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/60 dark:bg-white/10">
              <span className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                推荐教练：{recommendation.coach}
              </span>
              <Badge variant="secondary" className="text-[10px]">适合你</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/60 dark:bg-white/10">
              <span className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600" />
                推荐工具：{recommendation.tool}
              </span>
              <Badge variant="secondary" className="text-[10px]">突破口</Badge>
            </div>
          </div>

          <Button onClick={handleStartCoach} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <MessageCircle className="w-4 h-4 mr-2" />
            和 AI 觉醒教练深聊
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">已有 2,000+ 人通过觉醒对话实现突破</p>
        </CardContent>
      </Card>

      {/* 7. 操作按钮 */}
      <div className="space-y-3 pb-[calc(20px+env(safe-area-inset-bottom))] animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
        <Button onClick={onShare} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Share2 className="w-4 h-4 mr-1" />
          分享结果
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onRetake} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-1" />
            重新测评
          </Button>
          <Button variant="outline" onClick={onViewHistory} className="flex-1">
            <History className="w-4 h-4 mr-1" />
            历史记录
          </Button>
        </div>
      </div>
    </div>
  );
}
