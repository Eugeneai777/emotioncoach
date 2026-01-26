import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SCL90Factor, scl90FactorInfo, getFactorLevel } from "./scl90Data";
import { cn } from "@/lib/utils";
import { ChevronDown, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";

// 因子详细建议数据
const factorAdvice: Record<SCL90Factor, {
  symptoms: string[];
  causes: string[];
  suggestions: string[];
}> = {
  somatization: {
    symptoms: ["头痛、头晕", "胸闷、心悸", "肌肉酸痛、疲劳", "胃肠不适"],
    causes: ["长期压力积累", "情绪未被表达", "焦虑转化为身体症状"],
    suggestions: ["尝试渐进式肌肉放松", "定期运动释放压力", "关注身体信号，及时休息", "必要时进行体检排除器质问题"]
  },
  obsessive: {
    symptoms: ["反复检查门锁/电器", "脑海中不断重复某些想法", "追求完美、难以满意", "做事犹豫不决"],
    causes: ["对不确定性的恐惧", "完美主义倾向", "控制感的需求"],
    suggestions: ["练习「够好就行」的心态", "设定时间限制做决定", "允许自己犯小错", "正念练习减少反刍思维"]
  },
  interpersonal: {
    symptoms: ["过分在意他人评价", "害怕被拒绝或批评", "社交场合感到不自在", "容易感到被误解"],
    causes: ["自我价值感不稳定", "过往被否定的经历", "害怕暴露真实自我"],
    suggestions: ["练习自我肯定与接纳", "小步尝试表达真实想法", "区分事实与想象中的评价", "培养1-2个安全的社交关系"]
  },
  depression: {
    symptoms: ["情绪低落、提不起劲", "兴趣减退、不想做事", "自我否定、觉得无望", "睡眠/食欲变化"],
    causes: ["重大生活事件", "长期压力耗竭", "消极思维模式", "社会支持不足"],
    suggestions: ["每天做一件小小的愉快活动", "与信任的人保持联系", "记录3件感恩的小事", "如持续2周以上请寻求专业帮助"]
  },
  anxiety: {
    symptoms: ["紧张、坐立不安", "担心未来会出问题", "难以放松、肌肉紧绷", "睡眠困难"],
    causes: ["对未知的恐惧", "过度预期坏结果", "自我要求过高", "缺乏安全感"],
    suggestions: ["练习4-7-8呼吸法", "区分可控与不可控的事", "减少咖啡因摄入", "每天留出「担忧时间」集中处理"]
  },
  hostility: {
    symptoms: ["容易发火、不耐烦", "想摔东西、打人", "言语冲突增多", "内心充满愤怒"],
    causes: ["需求长期未被满足", "感到不公平或被侵犯", "压力发泄出口不足", "边界被突破"],
    suggestions: ["运动释放攻击性能量", "学习表达愤怒的健康方式", "识别愤怒背后的真实需求", "在冲动行动前暂停10秒"]
  },
  phobic: {
    symptoms: ["对特定事物极度害怕", "回避某些场所或情境", "想到害怕的事就焦虑", "知道不合理但无法控制"],
    causes: ["过去的创伤经历", "习得性恐惧反应", "对失控的恐惧"],
    suggestions: ["逐步暴露，从小挑战开始", "学习放松技术应对恐惧", "了解恐惧的生理机制", "严重时考虑认知行为治疗"]
  },
  paranoid: {
    symptoms: ["觉得别人在针对自己", "难以信任他人", "过度解读他人言行", "防备心很重"],
    causes: ["过去被背叛的经历", "安全感缺失", "对人际关系的不确定"],
    suggestions: ["检验自己的假设是否有证据", "小步建立信任关系", "区分想象与事实", "练习给他人善意解读"]
  },
  psychoticism: {
    symptoms: ["感觉与现实脱节", "觉得思想被控制", "听到不存在的声音", "感到孤独、不被理解"],
    causes: ["极度压力", "睡眠严重不足", "可能的生理因素"],
    suggestions: ["保证充足睡眠", "减少独处时间", "与信任的人保持联系", "如症状持续请尽快就医"]
  },
  other: {
    symptoms: ["入睡困难或早醒", "食欲明显变化", "对性的兴趣下降", "莫名的负罪感"],
    causes: ["生活节奏紊乱", "情绪问题的躯体表现", "生理周期影响"],
    suggestions: ["建立规律的作息时间", "睡前1小时放下电子设备", "均衡饮食、适量运动", "记录睡眠和情绪变化"]
  }
};

interface SCL90FactorRadarProps {
  factorScores: Record<SCL90Factor, number>;
  primarySymptom: SCL90Factor | null;
  secondarySymptom: SCL90Factor | null;
}

export function SCL90FactorRadar({ 
  factorScores, 
  primarySymptom, 
  secondarySymptom 
}: SCL90FactorRadarProps) {
  const [expandedFactor, setExpandedFactor] = useState<SCL90Factor | null>(null);

  // Prepare radar data
  const radarData = Object.entries(scl90FactorInfo).map(([key, info]) => ({
    subject: `${info.emoji} ${info.name}`,
    score: factorScores[key as SCL90Factor] || 0,
    fullMark: 5,
    factor: key,
  }));

  // Sort factors by score for the bar list
  const sortedFactors = Object.entries(factorScores)
    .sort(([, a], [, b]) => b - a)
    .map(([key, score]) => ({
      key: key as SCL90Factor,
      score,
      info: scl90FactorInfo[key as SCL90Factor],
      level: getFactorLevel(score),
      isPrimary: key === primarySymptom,
      isSecondary: key === secondarySymptom,
      advice: factorAdvice[key as SCL90Factor],
    }));

  const handleFactorClick = (factorKey: SCL90Factor) => {
    setExpandedFactor(prev => prev === factorKey ? null : factorKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0.01, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">📊</span>
            10因子雷达图
            <span className="text-xs font-normal text-white/70 ml-auto">点击查看详情</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Radar Chart */}
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 5]} 
                  tick={{ fontSize: 9 }}
                  tickCount={6}
                />
                <Radar 
                  name="因子得分" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  formatter={(value: number) => [value.toFixed(2), "得分"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Factor Score List - Interactive */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              因子均分 ≥2.0 表示该维度需要关注 · 点击展开详情
            </p>
            {sortedFactors.map((factor, idx) => (
              <motion.div
                key={factor.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.03 }}
              >
                {/* Factor Header - Clickable */}
                <button
                  onClick={() => handleFactorClick(factor.key)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all",
                    "touch-manipulation active:scale-[0.98]",
                    factor.isPrimary && "bg-red-50 dark:bg-red-950/30 ring-1 ring-red-200 dark:ring-red-800",
                    factor.isSecondary && "bg-orange-50 dark:bg-orange-950/30 ring-1 ring-orange-200 dark:ring-orange-800",
                    !factor.isPrimary && !factor.isSecondary && "bg-muted/30 hover:bg-muted/50",
                    expandedFactor === factor.key && "ring-2 ring-primary"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0",
                    factor.info.color
                  )}>
                    <span className="text-sm">{factor.info.emoji}</span>
                  </div>
                  
                  {/* Name + Tags */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{factor.info.name}</span>
                      {factor.isPrimary && (
                        <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">主要</span>
                      )}
                      {factor.isSecondary && (
                        <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full">次要</span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(factor.score / 5) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.4 + idx * 0.03 }}
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r",
                          factor.score >= 3 ? "from-red-500 to-rose-500" :
                          factor.score >= 2 ? "from-orange-500 to-amber-500" :
                          factor.score >= 1.5 ? "from-yellow-500 to-amber-400" :
                          "from-green-500 to-emerald-500"
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Score + Expand Icon */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={cn("text-sm font-bold tabular-nums", factor.level.color)}>
                        {factor.score.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{factor.level.level}</p>
                    </div>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      expandedFactor === factor.key && "rotate-180"
                    )} />
                  </div>
                </button>

                {/* Expanded Detail Panel */}
                <AnimatePresence>
                  {expandedFactor === factor.key && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 mt-1 rounded-lg bg-muted/20 border border-border/50 space-y-3">
                        {/* Description */}
                        <p className="text-sm text-muted-foreground">
                          {factor.info.description}
                        </p>

                        {/* Symptoms */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-medium">常见表现</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {factor.advice.symptoms.map((s, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Suggestions */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-medium">调适建议</span>
                          </div>
                          <ul className="space-y-1">
                            {factor.advice.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Normal Range */}
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-[10px] text-muted-foreground">
                            参考范围：{factor.info.normalRange}分 · 
                            您的得分：<span className={cn("font-medium", factor.level.color)}>{factor.score.toFixed(2)}</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
