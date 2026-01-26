import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Clock, Shield, ArrowLeft, Sparkles, Target, Lightbulb, Users, GraduationCap, Heart, Moon, HelpCircle } from "lucide-react";
import { scl90ScoreLabels } from "./scl90Data";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SCL90StartScreenProps {
  onStart: () => void;
  onBack?: () => void;
  onViewHistory?: () => void;
}

const targetAudience = [
  { icon: Users, label: "职场人群", desc: "焦虑、倦怠、人际困扰" },
  { icon: GraduationCap, label: "在校学生", desc: "学业压力、考试焦虑" },
  { icon: Heart, label: "情感困扰", desc: "关系问题、情绪波动" },
  { icon: Moon, label: "睡眠问题", desc: "失眠、多梦、睡眠差" },
  { icon: HelpCircle, label: "自我探索", desc: "想了解自己心理状态" },
];

const painPoints = [
  "怀疑自己是不是焦虑，又不太确定",
  "总纠结自己是否有情绪问题",
  "不知道是焦虑抑郁还是只是心情不好",
  "网上十几题的测试感觉不够专业",
];

const selfTestTips = [
  { emoji: "🔇", text: "找一个安静、不被打扰的环境" },
  { emoji: "⏱️", text: "预留10-15分钟完整作答" },
  { emoji: "✍️", text: "遇到纠结的题目，选择第一直觉" },
  { emoji: "📋", text: "按最近7天的真实感受作答" },
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

export function SCL90StartScreen({ onStart, onBack, onViewHistory }: SCL90StartScreenProps) {
  return (
    <motion.div 
      className="space-y-4 pb-6"
      initial={{ opacity: 0.01, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      {/* 返回按钮 */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-sm -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
      )}

      {/* 标题区域 - 整合附件内容 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium">
          <Brain className="w-4 h-4" />
          <span>SCL-90 心理健康自评</span>
        </div>
        <h2 className="text-xl font-bold">怎么判断是焦虑还是心情烦？</h2>
        <p className="text-sm text-muted-foreground">
          专业自测，清楚了解自己的情绪状态
        </p>
      </div>

      {/* 痛点共鸣卡片 */}
      <motion.div
        initial={{ opacity: 0.01, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">☀️</span>
              <span className="font-medium text-purple-800 dark:text-purple-200">你是否也有这样的困惑？</span>
            </div>
            <ul className="space-y-2 mb-3">
              {painPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 pt-2 border-t border-purple-100 dark:border-purple-800">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                通过专业的自我评估，就可以清楚知道自己的情绪状态！
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 权威性说明卡片 */}
      <motion.div
        initial={{ opacity: 0.01, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
      >
        <Card className="border-purple-200 dark:border-purple-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔥</span>
              <span className="font-medium text-foreground">全球著名的权威量表</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">90道题、10大维度，全面扫描心理状态</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">全球使用超40年的经典量表</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">比网上十几题的测试更专业可靠</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Shield className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">得分越高情绪问题可能性越明显（需结合各因子评估）</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* 10因子维度展示 */}
      <motion.div
        initial={{ opacity: 0.01, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <span className="font-medium text-foreground">从10个维度精准评估</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dimensions.map(f => (
                <span 
                  key={f.name}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-white/10 rounded-full text-xs"
                >
                  <span>{f.emoji}</span>
                  <span>{f.name}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-purple-100 dark:border-purple-800">
              每个维度独立评分，具有很好的鉴别能力
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 适合人群 */}
      <motion.div
        initial={{ opacity: 0.01, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
      >
        <Card className="border-0 shadow-sm bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <span className="font-medium text-foreground">适合这些人群</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {targetAudience.map((item, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <item.icon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 自测小提示 */}
      <motion.div
        initial={{ opacity: 0.01, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
      >
        <Card className="border-blue-200 dark:border-blue-800 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📝</span>
              <span className="font-medium text-blue-800 dark:text-blue-200">自测小提示</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selfTestTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-base flex-shrink-0">{tip.emoji}</span>
                  <span className="text-xs text-muted-foreground">{tip.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 评分说明 */}
      <motion.div
        initial={{ opacity: 0.01 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
        className="space-y-2"
      >
        <p className="text-xs text-muted-foreground text-center">
          请根据<strong className="text-foreground">最近一周</strong>的感受，选择符合程度：
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {scl90ScoreLabels.map(s => (
            <span 
              key={s.value} 
              className={cn(
                "px-2 py-1 rounded text-xs font-medium border",
                s.color
              )}
            >
              {s.value}={s.label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 免责声明 */}
      <p className="text-xs text-muted-foreground text-center px-4">
        ⚠️ 本量表仅供自我筛查参考，不能替代专业心理诊断
      </p>

      {/* 开始按钮 */}
      <motion.div 
        className="space-y-2 pt-2"
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
      >
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button 
            onClick={onStart} 
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Brain className="w-5 h-5 mr-2" />
            开始测评
          </Button>
        </motion.div>
        
        {onViewHistory && (
          <Button 
            variant="outline"
            onClick={onViewHistory} 
            className="w-full h-10"
          >
            查看历史记录
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
