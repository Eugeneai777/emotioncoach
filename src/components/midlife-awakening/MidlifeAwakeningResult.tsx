import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Share2, RotateCcw, Bot, ChevronRight, History, Star, AlertCircle, Target } from "lucide-react";
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
  getMidlifeScoreLevelLabel,
  getMidlifeScoreLevelColor,
  getMidlifeBarColor,
  type MidlifeDimension,
} from "./midlifeAwakeningData";
import { MidlifeAIAnalysis, type MidlifeAIAnalysisData } from "./MidlifeAIAnalysis";
import { MidlifeAwakeningClaimReportCard } from "./MidlifeAwakeningClaimReportCard";
import { MidlifeAwakeningPdfClaimSheet } from "./MidlifeAwakeningPdfClaimSheet";
import { useMidlifeAwakeningClaimCode } from "@/hooks/useMidlifeAwakeningClaimCode";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { getProxiedAvatarUrl } from "@/utils/avatarUtils";

interface MidlifeAwakeningResultProps {
  result: MidlifeResult;
  onShare?: () => void;
  onRetake?: () => void;
  onViewHistory?: () => void;
  aiAnalysis?: MidlifeAIAnalysisData | null;
  aiAnalysisLoading?: boolean;
  aiAnalysisError?: string | null;
  assessmentId?: string | null;
}

// === 核心指标配置（含目标值） ===
const coreMetrics: Record<string, {
  direction: string;
  targetLabel: string;
  isLowerBetter: boolean;
  targetValue: number;
  getStatus: (v: number) => 'good' | 'ok' | 'bad';
  getInsight: (v: number) => string;
}> = {
  internalFrictionRisk: {
    direction: '越低越好',
    targetLabel: '目标: < 30',
    isLowerBetter: true,
    targetValue: 30,
    getStatus: (v) => v <= 30 ? 'good' : v <= 55 ? 'ok' : 'bad',
    getInsight: (v) => v >= 70 ? '内耗严重，大量能量被思维反刍消耗' : v >= 50 ? '存在一定内耗，需要学习情绪调节' : v >= 30 ? '内耗可控，偶有焦虑属正常范围' : '内心状态稳定，情绪管理良好',
  },
  actionPower: {
    direction: '越高越好',
    targetLabel: '目标: > 70',
    isLowerBetter: false,
    targetValue: 70,
    getStatus: (v) => v >= 70 ? 'good' : v >= 45 ? 'ok' : 'bad',
    getInsight: (v) => v >= 70 ? '行动力强劲，善于将想法变为现实' : v >= 50 ? '行动力尚可，但容易被犹豫拖慢' : v >= 30 ? '行动力偏低，常陷入想但不做的循环' : '行动严重受阻，需要微行动重建信心',
  },
  missionClarity: {
    direction: '越高越好',
    targetLabel: '目标: > 70',
    isLowerBetter: false,
    targetValue: 70,
    getStatus: (v) => v >= 70 ? 'good' : v >= 45 ? 'ok' : 'bad',
    getInsight: (v) => v >= 70 ? '方向感清晰，知道自己真正想要什么' : v >= 50 ? '有模糊方向，但需要进一步探索' : v >= 30 ? '方向感偏弱，容易随波逐流' : '急需使命探索，找回人生方向感',
  },
};

// === 六维度详细解读 ===
const dimensionInterpretations: Record<MidlifeDimension, {
  whatItMeasures: string;
  scoreDirection: string;
  getInterpretation: (score: number) => string;
  getSuggestion: (score: number) => string;
}> = {
  internalFriction: {
    whatItMeasures: '衡量你的心理消耗程度——包括反复思虑、决策焦虑和无名疲惫感',
    scoreDirection: '分数越高，内耗越严重',
    getInterpretation: (s) => s >= 70 ? '你的大脑长期处于高负荷运转状态，大量能量被"想太多"消耗掉了。' : s >= 45 ? '你有一定的思维反刍倾向，偶尔会陷入纠结。整体还在可控范围内。' : '你的内心相对平静，不容易被焦虑和过度思考困扰。',
    getSuggestion: (s) => s >= 70 ? '尝试每天5分钟正念呼吸，打断思维反刍循环' : s >= 45 ? '当发现自己反复纠结时，给自己设定"决策截止时间"' : '保持现有的情绪调节能力，可以帮助更多人',
  },
  selfWorth: {
    whatItMeasures: '衡量你的自我认同稳定度——是否总觉得自己不够好',
    scoreDirection: '分数越高，价值感越不稳定',
    getInterpretation: (s) => s >= 70 ? '你的自我价值感在剧烈波动。别人的否定可能让你难过很久。' : s >= 45 ? '你大体上自我接纳，但在某些时刻仍会怀疑自己。' : '你有较稳定的自我认同，不太受外界评价影响。',
    getSuggestion: (s) => s >= 70 ? '每天写下3件自己做得好的小事，重建内在价值锚点' : s >= 45 ? '分辨"事实性反馈"和"评价性攻击"' : '你的稳定感是宝贵的，试着将这份力量传递给身边的人',
  },
  actionStagnation: {
    whatItMeasures: '衡量你的行动执行力——能否将想法落地',
    scoreDirection: '分数越高，行动越受阻',
    getInterpretation: (s) => s >= 70 ? '你有很多好想法，但它们大多停留在脑海里。害怕失败让你选择了"不开始"。' : s >= 45 ? '你能行动，但速度偏慢。在关键决策面前容易犹豫。' : '你的执行力很强，能够果断地将计划变为行动。',
    getSuggestion: (s) => s >= 70 ? '用"2分钟规则"：任何事只要2分钟内能开始，就立刻做' : s >= 45 ? '把大目标拆成小步骤，每天只需完成一个最小单元' : '保持行动力，同时确保方向正确比速度更重要',
  },
  supportSystem: {
    whatItMeasures: '衡量你的社会支持网络——身边是否有人理解你',
    scoreDirection: '分数越高，越缺乏支持',
    getInterpretation: (s) => s >= 70 ? '你习惯了独自扛一切，很少表达真实感受。' : s >= 45 ? '你有一定的社会联结，但深层情感上可能还觉得"没人真正懂我"。' : '你有比较好的支持网络，身边有能倾诉和依靠的人。',
    getSuggestion: (s) => s >= 70 ? '试着向一个信任的人分享一件小事，重建联结的第一步' : s >= 45 ? '主动约一次朋友聊天，不聊工作，只聊感受' : '珍惜身边的支持者，定期表达感恩',
  },
  regretRisk: {
    whatItMeasures: '衡量你的人生遗憾风险——是否活在别人的期待中',
    scoreDirection: '分数越高，后悔风险越大',
    getInterpretation: (s) => s >= 70 ? '你的人生很可能更多在满足他人期待，真实的你被压在了"应该"的下面。' : s >= 45 ? '你在责任和自我之间有一定的挣扎，但还没完全迷失。' : '你较好地平衡了责任与自我表达，活出了相当真实的自己。',
    getSuggestion: (s) => s >= 70 ? '写一封"不寄出的信"给自己，说出所有不敢说的话' : s >= 45 ? '每周给自己留出2小时"只为自己"的时间' : '继续坚持做真实的自己，这比任何成就都重要',
  },
  missionClarity: {
    whatItMeasures: '衡量你的人生方向感——是否知道自己想成为什么样的人',
    scoreDirection: '分数越高，方向越模糊',
    getInterpretation: (s) => s >= 70 ? '你正处在"不知道自己要什么"的迷雾中。这其实是转变的前兆。' : s >= 45 ? '你有模糊的方向感，但还没有形成清晰的人生愿景。' : '你对自己的人生方向有比较清晰的认知。',
    getSuggestion: (s) => s >= 70 ? '不要急于找到"正确答案"，先做10件小尝试，看哪个让你有活力' : s >= 45 ? '回想让你废寝忘食的时刻，那里藏着你的使命线索' : '把你的愿景写下来，让它成为每天行动的指南针',
  },
};

// === 环形进度圈 ===
function CoreMetricRing({ value, label, icon, delay = 0, direction, targetLabel, status }: {
  value: number; label: string; icon: string; delay?: number; direction: string; targetLabel: string; status: 'good' | 'ok' | 'bad';
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [started, setStarted] = useState(false);

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

  const size = 80;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / 100) * circumference;

  const statusColors = {
    good: 'text-emerald-600 dark:text-emerald-400',
    ok: 'text-amber-600 dark:text-amber-400',
    bad: 'text-rose-600 dark:text-rose-400',
  };
  const strokeColors = {
    good: 'stroke-emerald-500',
    ok: 'stroke-amber-500',
    bad: 'stroke-rose-500',
  };

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-muted" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
            className={strokeColors[status]}
            style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: "stroke-dashoffset 0.1s linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base">{icon}</span>
          <span className={cn("text-lg font-bold tabular-nums", statusColors[status])}>{animatedValue}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground">{direction}</span>
      <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4",
        status === 'good' ? 'border-emerald-300 text-emerald-600' :
        status === 'ok' ? 'border-amber-300 text-amber-600' :
        'border-rose-300 text-rose-600'
      )}>
        <Target className="w-2.5 h-2.5 mr-0.5" />{targetLabel}
      </Badge>
    </div>
  );
}

// 维度中文名映射（用于突破建议）
const dimensionNames: Record<MidlifeDimension, string> = {
  internalFriction: '内耗',
  selfWorth: '自我价值',
  actionStagnation: '行动停滞',
  supportSystem: '支持系统',
  regretRisk: '后悔风险',
  missionClarity: '使命方向',
};

export function MidlifeAwakeningResult({ result, onShare, onRetake, onViewHistory, aiAnalysis, aiAnalysisLoading = false, aiAnalysisError, assessmentId }: MidlifeAwakeningResultProps) {
  const navigate = useNavigate();
  const personality = personalityTypeConfig[result.personalityType];
  const { user } = useAuth();
  const { profile } = useProfileCompletion();
  const { claimCode, loading: loadingCode } = useMidlifeAwakeningClaimCode(assessmentId || null);
  const [claimSheetOpen, setClaimSheetOpen] = useState(false);
  const claimDisplayName = profile?.display_name || user?.user_metadata?.name || user?.user_metadata?.display_name || undefined;
  const claimAvatarUrl = getProxiedAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url);

  // === 雷达图数据：语义翻转为"觉醒度" ===
  const awakenedData = result.dimensions.map(d => ({
    dimension: dimensionConfig[d.dimension].shortName,
    awakened: 100 - d.score,
    baseline: 60,
    fullMark: 100,
  }));

  // 找觉醒度最低（最需突破）和最高的维度
  const sortedByAwakening = [...result.dimensions].sort((a, b) => (100 - a.score) - (100 - b.score));
  const weakest2 = sortedByAwakening.slice(0, 2);
  const strongest = sortedByAwakening[sortedByAwakening.length - 1];

  // 找最高分和最低分维度（原始分）
  const sortedDims = [...result.dimensions].sort((a, b) => b.score - a.score);
  const highestDim = sortedDims[0]?.dimension;
  const lowestDim = sortedDims[sortedDims.length - 1]?.dimension;

  const handleStartCoach = () => {
    navigate('/assessment-coach', {
      state: {
        pattern: result.personalityType,
        blockedDimension: result.personalityType,
        fromAssessment: 'midlife_awakening',
        personalityType: result.personalityType,
        dimensions: result.dimensions,
        aiAnalysis,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. 人格类型揭晓 */}
      <Card className={cn("border-2 overflow-hidden animate-scale-in", personality.bgColor)}>
        <div className={cn("p-6 text-white text-center", personality.gradient)}>
          <span className="text-5xl block mb-2 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">{personality.emoji}</span>
          <h2 className="text-xl font-bold">{personality.name}</h2>
          <p className="text-base mt-1 font-medium opacity-95">{personality.tagline}</p>
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

      {/* 2. 核心指标 + 目标值 */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">核心指标</CardTitle>
          <CardDescription className="text-xs">综合六维数据计算，颜色标注与目标的距离</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-around">
            <CoreMetricRing value={result.internalFrictionRisk} label="内耗风险" icon="🌀" delay={200}
              direction={coreMetrics.internalFrictionRisk.direction}
              targetLabel={coreMetrics.internalFrictionRisk.targetLabel}
              status={coreMetrics.internalFrictionRisk.getStatus(result.internalFrictionRisk)} />
            <CoreMetricRing value={result.actionPower} label="行动力" icon="⚡" delay={400}
              direction={coreMetrics.actionPower.direction}
              targetLabel={coreMetrics.actionPower.targetLabel}
              status={coreMetrics.actionPower.getStatus(result.actionPower)} />
            <CoreMetricRing value={result.missionClarity} label="使命清晰度" icon="🧭" delay={600}
              direction={coreMetrics.missionClarity.direction}
              targetLabel={coreMetrics.missionClarity.targetLabel}
              status={coreMetrics.missionClarity.getStatus(result.missionClarity)} />
          </div>
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              📊 {coreMetrics.internalFrictionRisk.getInsight(result.internalFrictionRisk)}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ⚡ {coreMetrics.actionPower.getInsight(result.actionPower)}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              🧭 {coreMetrics.missionClarity.getInsight(result.missionClarity)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. 觉醒地图（翻转雷达图 + 优先突破建议） */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">🗺️ 你的觉醒地图</CardTitle>
          <CardDescription className="text-xs">图形越饱满，觉醒度越高。虚线为平均水平（60分）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={awakenedData} cx="50%" cy="50%" outerRadius="70%">
                <defs>
                  <linearGradient id="awakenedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(150, 80%, 45%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(170, 80%, 50%)" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                {/* 基准线（60分平均） */}
                <Radar name="平均" dataKey="baseline" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4"
                  fill="none" strokeWidth={1.5} strokeOpacity={0.4} />
                {/* 用户觉醒度 */}
                <Radar name="觉醒度" dataKey="awakened" stroke="hsl(150, 80%, 45%)" fill="url(#awakenedFill)"
                  fillOpacity={1} strokeWidth={2} dot={{ r: 4, fill: "hsl(150, 80%, 45%)", strokeWidth: 0 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 优先突破建议 */}
          <div className="bg-gradient-to-br from-pink-50/80 to-purple-50/80 dark:from-pink-900/10 dark:to-purple-900/10 rounded-xl p-4 space-y-3 border border-pink-200/50 dark:border-pink-800/30">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-pink-600" />
              <h4 className="text-sm font-semibold">优先突破方向</h4>
            </div>
            {weakest2.map((d, i) => {
              const interp = dimensionInterpretations[d.dimension];
              return (
                <div key={d.dimension} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-medium">
                      {dimensionConfig[d.dimension].icon} {dimensionNames[d.dimension]}
                      <span className="text-muted-foreground ml-1">（觉醒度 {100 - d.score}）</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{interp.getSuggestion(d.score)}</p>
                  </div>
                </div>
              );
            })}
            {strongest && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                ✨ 你的优势：{dimensionConfig[strongest.dimension].icon} {dimensionNames[strongest.dimension]}（觉醒度 {100 - strongest.score}）— 这是你突破的支撑力量
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. AI 深度分析 */}
      <div className="animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        <MidlifeAIAnalysis
          analysis={aiAnalysis || null}
          isLoading={aiAnalysisLoading}
          error={aiAnalysisError || null}
          personalityType={result.personalityType}
          dimensions={result.dimensions}
        />
      </div>

      {/* 5. 维度深度解读（默认展开最需关注的维度） */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">维度深度解读</CardTitle>
          <CardDescription className="text-xs">点击展开查看每个维度的含义、你的状态和改善建议</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue={highestDim}>
            {result.dimensions.map(d => {
              const config = dimensionConfig[d.dimension];
              const interp = dimensionInterpretations[d.dimension];
              const levelLabel = getMidlifeScoreLevelLabel(d.score);
              const levelColor = getMidlifeScoreLevelColor(d.score);
              const barColor = getMidlifeBarColor(d.score);
              const tag = d.dimension === highestDim ? 'highest' as const
                : d.dimension === lowestDim ? 'lowest' as const
                : null;

              return (
                <AccordionItem key={d.dimension} value={d.dimension} className="border-b last:border-b-0">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm w-full pr-2">
                      <span>{config.icon}</span>
                      <span className="font-medium">{config.shortName}</span>
                      {tag === 'highest' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0">
                          <AlertCircle className="w-3 h-3 mr-0.5" />最需关注
                        </Badge>
                      )}
                      {tag === 'lowest' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                          <Star className="w-3 h-3 mr-0.5" />状态最好
                        </Badge>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        <span className="font-bold">{d.score}</span>
                        <span className={cn("text-xs", levelColor)}>{levelLabel}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${d.score}%` }} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-muted-foreground">📐 这个维度测什么？</p>
                        <p className="text-sm text-foreground leading-relaxed">{interp.whatItMeasures}</p>
                        <p className="text-[10px] text-muted-foreground">（{interp.scoreDirection}）</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-muted-foreground">🔍 你的状态</p>
                        <p className="text-sm text-foreground leading-relaxed">{interp.getInterpretation(d.score)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground mb-1">💡 小建议</p>
                        <p className="text-xs text-foreground leading-relaxed">{interp.getSuggestion(d.score)}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* 6. "你的下一步" CTA */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800 animate-fade-in"
        style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">你的下一步</h3>
              <p className="text-xs text-muted-foreground">根据你的「{personality.name}」特征，AI 觉醒教练会为你定制突破方案</p>
            </div>
          </div>
          <Button onClick={handleStartCoach} className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
            <MessageCircle className="w-4 h-4 mr-2" />
            和 AI 觉醒教练深聊
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">已有 2,000+ 人通过觉醒对话实现突破</p>
        </CardContent>
      </Card>

      {/* 7. 操作按钮 */}
      <div className="space-y-3 pb-[calc(20px+env(safe-area-inset-bottom))] animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
        <Button onClick={onShare} className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
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
