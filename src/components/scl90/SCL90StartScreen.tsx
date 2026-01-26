import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Brain, Clock, Shield, Sparkles, Target, Lightbulb, Users, GraduationCap, Heart, Moon, HelpCircle, PlayCircle, ChevronRight } from "lucide-react";
import { scl90ScoreLabels } from "./scl90Data";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSCL90Progress } from "./useSCL90Progress";

interface SCL90StartScreenProps {
  onStart: () => void;
  onContinue?: () => void;
  onBack?: () => void;
  onViewHistory?: () => void;
}

const targetAudience = [
  { icon: Users, label: "职场人群", desc: "焦虑、倦怠" },
  { icon: GraduationCap, label: "在校学生", desc: "学业压力" },
  { icon: Heart, label: "情感困扰", desc: "关系问题" },
  { icon: Moon, label: "睡眠问题", desc: "失眠多梦" },
  { icon: HelpCircle, label: "自我探索", desc: "了解自己" },
];

const painPoints = [
  "怀疑自己是不是焦虑，又不太确定",
  "总纠结自己是否有情绪问题",
  "不知道是焦虑抑郁还是只是心情不好",
];

const selfTestTips = [
  { emoji: "🔇", text: "安静环境" },
  { emoji: "⏱️", text: "10-15分钟" },
  { emoji: "✍️", text: "第一直觉" },
  { emoji: "📋", text: "最近7天" },
];

const dimensions = [
  { emoji: '🫀', name: '躯体化' },
  { emoji: '🔄', name: '强迫' },
  { emoji: '👥', name: '人际敏感' },
  { emoji: '😢', name: '抑郁' },
  { emoji: '😰', name: '焦虑' },
  { emoji: '😤', name: '敌对' },
  { emoji: '😨', name: '恐怖' },
  { emoji: '🤔', name: '偏执' },
  { emoji: '🌀', name: '精神病性' },
  { emoji: '💤', name: '其他' },
];

const features = [
  { icon: Sparkles, text: "90题 · 10维度全面评估", color: "text-purple-500" },
  { icon: Clock, text: "全球使用超40年经典量表", color: "text-blue-500" },
  { icon: Target, text: "比十几题测试更专业可靠", color: "text-green-500" },
  { icon: Shield, text: "每个维度独立评分分析", color: "text-amber-500" },
];

export function SCL90StartScreen({ onStart, onContinue, onViewHistory }: SCL90StartScreenProps) {
  const { savedProgress, hasUnfinishedProgress, clearProgress, isLoaded } = useSCL90Progress();
  const answeredCount = savedProgress ? Object.keys(savedProgress.answers).length : 0;

  const handleStartNew = () => {
    clearProgress();
    onStart();
  };

  return (
    <motion.div 
      className="space-y-4 pb-6"
      initial={{ opacity: 0.01, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      {/* 标题区域 - 精简 */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full text-sm font-medium">
          <Brain className="w-4 h-4" />
          <span>SCL-90 心理健康自评</span>
        </div>
        <h2 className="text-lg font-bold">怎么判断是焦虑还是心情烦？</h2>
        <p className="text-sm text-muted-foreground">
          专业自测，清楚了解自己的情绪状态
        </p>
      </div>

      {/* 继续答题提示（如果有未完成的进度） */}
      {isLoaded && hasUnfinishedProgress && (
        <motion.div
          initial={{ opacity: 0.01, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      有未完成的测评
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      已完成 {answeredCount}/90 题
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={onContinue || onStart}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  继续答题
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 核心卖点 - 合并为紧凑列表 */}
      <Card className="border-purple-200/50 dark:border-purple-800/50 shadow-sm">
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {features.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <item.icon className={cn("w-4 h-4 flex-shrink-0", item.color)} />
                <span className="text-xs text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 10因子维度 - 紧凑展示 */}
      <div className="flex flex-wrap justify-center gap-1.5 px-2">
        {dimensions.map(f => (
          <span 
            key={f.name}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-muted/50 rounded-full text-xs"
          >
            <span>{f.emoji}</span>
            <span className="text-muted-foreground">{f.name}</span>
          </span>
        ))}
      </div>

      {/* 折叠详情区域 */}
      <Accordion type="single" collapsible className="w-full">
        {/* 痛点共鸣 */}
        <AccordionItem value="pain-points" className="border-b-0">
          <AccordionTrigger className="py-2 px-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 hover:no-underline">
            <div className="flex items-center gap-2 text-sm">
              <span>☀️</span>
              <span className="font-medium">你是否也有这样的困惑？</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <ul className="space-y-1.5 px-3">
              {painPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                通过专业自评，清楚知道自己的情绪状态！
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 适合人群 */}
        <AccordionItem value="audience" className="border-b-0 mt-2">
          <AccordionTrigger className="py-2 px-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 hover:no-underline">
            <div className="flex items-center gap-2 text-sm">
              <span>🎯</span>
              <span className="font-medium">适合哪些人群？</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="flex flex-wrap gap-1.5 px-3">
              {targetAudience.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-xs">
                  <item.icon className="w-3 h-3 text-purple-500" />
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">· {item.desc}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 自测提示 */}
        <AccordionItem value="tips" className="border-b-0 mt-2">
          <AccordionTrigger className="py-2 px-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 hover:no-underline">
            <div className="flex items-center gap-2 text-sm">
              <span>📝</span>
              <span className="font-medium">自测小提示</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="flex flex-wrap gap-2 px-3">
              {selfTestTips.map((tip, index) => (
                <div key={index} className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg text-xs">
                  <span>{tip.emoji}</span>
                  <span className="text-muted-foreground">{tip.text}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 评分说明 - 精简 */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          根据<strong className="text-foreground">最近一周</strong>感受选择：
        </p>
        <div className="flex justify-center gap-1">
          {scl90ScoreLabels.map(s => (
            <span 
              key={s.value} 
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                s.color
              )}
            >
              {s.value}={s.label}
            </span>
          ))}
        </div>
      </div>

      {/* 免责声明 */}
      <p className="text-[10px] text-muted-foreground text-center px-4">
        ⚠️ 本量表仅供自我筛查参考，不能替代专业心理诊断
      </p>

      {/* 开始按钮 */}
      <div className="space-y-2 pt-1">
        <motion.div
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button 
            onClick={hasUnfinishedProgress ? handleStartNew : onStart} 
            variant={hasUnfinishedProgress ? "outline" : "default"}
            className={cn(
              "w-full h-12 text-base font-medium",
              !hasUnfinishedProgress && "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            )}
          >
            <Brain className="w-5 h-5 mr-2" />
            {hasUnfinishedProgress ? "重新开始测评" : "开始测评"}
          </Button>
        </motion.div>
        
        {onViewHistory && (
          <Button 
            variant="ghost"
            size="sm"
            onClick={onViewHistory} 
            className="w-full text-muted-foreground"
          >
            查看历史记录
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
