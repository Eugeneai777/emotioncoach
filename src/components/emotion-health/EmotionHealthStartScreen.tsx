import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Heart, Brain, TrendingUp, Clock, Shield, Sparkles, ChevronRight, 
  Zap, Bot, ChevronDown, Activity, Target, Check, ArrowRight,
  Flame, CheckCircle2, Users, Share2
} from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import { ThreeLayerDiagram } from "./ThreeLayerDiagram";
import { 
  introStatistics, 
  authorityData,
  upgradedPainPoints, 
  comparisonWithTraditional, 
  patternConfig, 
  assessmentOutcomes,
  pricingIncludes,
  scientificScalesMapping,
  patternTableMapping,
  blockageDimensionMapping,
  PatternType 
} from "./emotionHealthData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type LayerType = 'layer1' | 'layer2' | 'layer3';

// 动画包装组件 - WeChat兼容
function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

interface EmotionHealthStartScreenProps {
  onStart: () => void;
  onPayClick?: () => void;
  hasPurchased?: boolean;
  isLoading?: boolean;
  price?: number;
}

// Icon mapping for outcomes
const outcomeIcons = {
  Activity: Activity,
  Brain: Brain,
  Target: Target,
  Bot: Bot,
};

const outcomeColors = {
  cyan: { text: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-200 dark:border-cyan-800" },
  purple: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800" },
  rose: { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800" },
  emerald: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
};

// 四大模式精简预览（2x2紧凑版）
function PatternCompactPreview() {
  const patterns = Object.keys(patternConfig) as PatternType[];
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {patterns.map((key) => {
        const pattern = patternConfig[key];
        return (
          <div 
            key={key}
            className="flex flex-col items-center text-center p-2"
          >
            <span className="text-xl mb-1">{pattern.emoji}</span>
            <span className="text-[10px] font-medium text-foreground leading-tight">{pattern.name}</span>
          </div>
        );
      })}
    </div>
  );
}

// 与传统量表对比卡片（紧凑版）
function ComparisonCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">与传统量表的本质区别</h3>
        </div>
        
        <div className="space-y-2">
          {comparisonWithTraditional.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 text-right">
                <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">
                  {item.traditional}
                </span>
              </div>
              <div className="w-6 flex justify-center">
                <ChevronRight className="w-3 h-3 text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium text-primary">
                  {item.ours}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 倒计时 Hook
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 42 });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return timeLeft;
}

// 实时测评人数
function useLiveCount() {
  const [count, setCount] = useState(23);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        return Math.max(15, Math.min(50, newCount));
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  
  return count;
}

export function EmotionHealthStartScreen({ 
  onStart, 
  onPayClick,
  hasPurchased = false,
  isLoading,
  price = 9.9
}: EmotionHealthStartScreenProps) {
  const [activeLayer, setActiveLayer] = useState<LayerType>('layer1');
  const [openAccordion, setOpenAccordion] = useState<string>('');
  const countdown = useCountdown();
  const liveCount = useLiveCount();

  // 按钮点击处理
  const handleButtonClick = () => {
    if (hasPurchased) {
      onStart();
    } else {
      onPayClick?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* ===== 模块1：品牌 + 痛点开场 ===== */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              <h1 className="text-lg font-bold">情绪健康测评</h1>
            </div>
            <div className="flex items-center gap-2">
              <IntroShareDialog 
                config={introShareConfigs.emotionHealth}
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10">
                    <Share2 className="w-4 h-4" />
                  </Button>
                }
              />
              <p className="text-[10px] text-white/70">Powered by 有劲AI</p>
            </div>
          </div>
          
          {/* 社交证明 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-4"
          >
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Flame className="w-3 h-3 mr-1" />
              {introStatistics.totalAssessments.toLocaleString()} 人已找到答案
            </Badge>
          </motion.div>

          {/* 共鸣式提问 - 精简版 */}
          <motion.div 
            className="text-center space-y-1.5 mb-4"
            initial={{ opacity: 0.01 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
          >
            <p className="text-lg">明明没什么大事</p>
            <p className="text-xl font-bold">
              就是 <span className="text-amber-200 animate-pulse">「怎么都提不起劲」</span>
            </p>
            <p className="text-sm text-white/90 mt-2">是什么在暗中消耗你？</p>
          </motion.div>
        </div>
      </Card>

      {/* ===== 顶部快捷 CTA ===== */}
      <motion.div
        initial={{ opacity: 0.01, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 border-violet-300 dark:border-violet-800 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">32题 · 约5分钟</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">基于国际权威心理量表 · AI深度解读</p>
              </div>
              {!hasPurchased && (
                <div className="flex items-baseline gap-1 flex-shrink-0">
                  <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">¥{price}</span>
                  <span className="text-[10px] text-amber-600 font-medium">限时</span>
                </div>
              )}
            </div>
            <Button
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-base"
              onClick={handleButtonClick}
              disabled={isLoading}
            >
              {isLoading ? "加载中..." : hasPurchased ? "立即开始测评" : `¥${price} 立即开始测评`}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 模块2：痛点共鸣区 ===== */}
      <AnimatedSection>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              这些感受是不是很熟悉？
            </h3>
            <div className="space-y-2">
              {upgradedPainPoints.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0.01, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50"
                  style={{ transform: "translateZ(0)" }}
                >
                  <span className="text-lg flex-shrink-0">{item.emoji}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{item.text}</p>
                </motion.div>
              ))}
            </div>

            {/* 损失警告 */}
            <motion.div 
              initial={{ opacity: 0.01 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
              style={{ transform: "translateZ(0)" }}
            >
              <p className="text-xs text-amber-700 dark:text-amber-400 text-center leading-relaxed">
                如果不解决这些卡点，你可能会继续这样 <span className="font-bold">3-5年</span><br />
                反复陷入「内耗→自责→更内耗」的死循环
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* ===== 模块3：权威背书区 ===== */}
      <AnimatedSection delay={0.1}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">研究数据显示</h3>
            <div className="grid gap-3">
              {authorityData.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0.01, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3"
                  style={{ transform: "translateZ(0)" }}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        {item.stat}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.source}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* ===== 模块4：AI对比传统 ===== */}
      <AnimatedSection delay={0.1}>
        <ComparisonCard />
      </AnimatedSection>

      {/* ===== 模块5：四大人格类型预览 ===== */}
      <AnimatedSection delay={0.1}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              找到你的情绪反应模式
            </h3>
            <PatternCompactPreview />
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* ===== 模块6：三层洋葱模型 ===== */}
      <AnimatedSection delay={0.1}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              三层诊断 · 层层深入
            </h3>
            <div className="flex flex-col items-center py-2">
              <ThreeLayerDiagram 
                size={160} 
                activeLayer={activeLayer}
                onLayerClick={(layer) => setActiveLayer(layer)}
              />
              <p className="text-xs text-muted-foreground text-center mt-3">
                点击圆圈查看对应诊断维度
              </p>
            </div>
            
            {/* 三层诊断表格 - 使用 Accordion 折叠，与洋葱图联动 */}
            <Accordion 
              type="single" 
              value={activeLayer} 
              onValueChange={(val) => val && setActiveLayer(val as LayerType)} 
              className="mt-4 space-y-3"
            >
              {/* 第一层：科学量表对照表 */}
              <AccordionItem value="layer1" className="border-0">
                <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                  <AccordionTrigger className="px-3 py-3 hover:no-underline [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        第一层：状态筛查（科学背书层）
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <p className="text-[10px] text-muted-foreground mb-3">
                      目的：建立专业信任 + 判断情绪风险等级
                    </p>
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-white/50 dark:bg-white/5 border-0">
                          <TableHead className="py-2 px-2 font-semibold h-auto text-foreground">指数</TableHead>
                          <TableHead className="py-2 px-2 font-semibold h-auto text-foreground">对标量表</TableHead>
                          <TableHead className="py-2 px-2 font-semibold h-auto text-foreground">本测评命名</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scientificScalesMapping.map((item, index) => (
                          <TableRow key={index} className="border-0">
                            <TableCell className="py-1.5 px-2">{item.indexName}</TableCell>
                            <TableCell className="py-1.5 px-2">
                              <Badge variant="outline" className="font-mono text-[10px] h-5">
                                {item.scale}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-1.5 px-2 text-primary font-medium">
                              {item.displayName}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                      💡 以上量表均为国际权威心理健康筛查工具
                    </p>
                  </AccordionContent>
                </div>
              </AccordionItem>

              {/* 第二层：反应模式对照表 */}
              <AccordionItem value="layer2" className="border-0">
                <div className="rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 overflow-hidden">
                  <AccordionTrigger className="px-3 py-3 hover:no-underline [&>svg]:text-purple-600 dark:[&>svg]:text-purple-400">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                        第二层：反应模式（卡点诊断层）
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <p className="text-[10px] text-muted-foreground mb-3">
                      目的：识别你的情绪自动反应模式
                    </p>
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-white/50 dark:bg-white/5 border-0">
                          <TableHead className="py-2 px-2 font-semibold h-auto text-foreground">模式</TableHead>
                          <TableHead className="py-2 px-2 font-semibold h-auto text-foreground">本质</TableHead>
                          <TableHead className="py-2 px-2 font-semibold h-auto text-foreground">对应人群</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patternTableMapping.map((item, index) => (
                          <TableRow key={index} className="border-0">
                            <TableCell className="py-1.5 px-2 font-medium">{item.pattern}</TableCell>
                            <TableCell className="py-1.5 px-2 text-muted-foreground">{item.essence}</TableCell>
                            <TableCell className="py-1.5 px-2 text-muted-foreground">{item.audience}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </div>
              </AccordionItem>

              {/* 第三层：行动阻滞维度对照表 */}
              <AccordionItem value="layer3" className="border-0">
                <div className="rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800 overflow-hidden">
                  <AccordionTrigger className="px-3 py-3 hover:no-underline [&>svg]:text-rose-600 dark:[&>svg]:text-rose-400">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                        第三层：行动路径（转化承接层）
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <p className="text-[10px] text-muted-foreground mb-3">
                      目的：精准定位你当前最需要突破的阻滞点
                    </p>
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-white/50 dark:bg-white/5 border-0">
                          <TableHead className="py-2 px-2 font-semibold h-auto text-foreground">维度</TableHead>
                          <TableHead className="py-2 px-2 font-semibold h-auto text-foreground">问什么</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blockageDimensionMapping.map((item, index) => (
                          <TableRow key={index} className="border-0">
                            <TableCell className="py-1.5 px-2">
                              <span className="inline-flex items-center gap-1.5">
                                <span>{item.emoji}</span>
                                <span className="font-medium">{item.dimension}</span>
                              </span>
                            </TableCell>
                            <TableCell className="py-1.5 px-2 text-muted-foreground">{item.question}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </div>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* ===== 模块7：价值交付区（精简列表版） ===== */}
      <AnimatedSection delay={0.1}>
        <Card className="bg-gradient-to-br from-indigo-50 via-violet-50 to-white dark:from-indigo-900/20 dark:via-violet-900/20 dark:to-background border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              测评完成后，你将获得
            </h3>
            <div className="space-y-2">
              {assessmentOutcomes.map((item, idx) => {
                const IconComponent = outcomeIcons[item.icon as keyof typeof outcomeIcons];
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/60 dark:bg-white/5"
                  >
                    <IconComponent className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-foreground">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{item.desc}</span>
                    </div>
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* ===== 模块8：定价模块（增加紧迫感） ===== */}
      <AnimatedSection delay={0.1}>
        <Card className="bg-gradient-to-br from-violet-50 via-indigo-50 to-white dark:from-violet-900/20 dark:via-indigo-900/20 dark:to-background border-violet-300 dark:border-violet-800">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-center mb-3">开启你的情绪修复之旅</h3>
            
            {/* 倒计时 - 仅未购买用户显示 */}
            {!hasPurchased && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  限时优惠还剩 {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                </span>
              </div>
            )}
            
            {/* 价格显示 */}
            {!hasPurchased ? (
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-4xl font-bold text-violet-600 dark:text-violet-400">¥{price}</span>
                <span className="px-2 py-0.5 bg-amber-500 rounded text-xs text-white font-medium animate-pulse">限时</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-3">
                <Check className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">已购买，可直接开始</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              {pricingIncludes.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* CTA 按钮 */}
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Button 
                size="lg" 
                className="w-full h-14 text-base bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                onClick={handleButtonClick}
                disabled={isLoading}
              >
                {isLoading ? "加载中..." : hasPurchased ? "开始测评" : `¥${price} 开始测评`}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {/* 实时测评人数 */}
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-[10px] text-center text-muted-foreground mt-3 flex items-center justify-center gap-1"
            >
              <Users className="w-3 h-3" />
              <span>🔥 此刻有 <span className="font-medium text-foreground">{liveCount}</span> 人正在测评</span>
            </motion.p>

            <p className="text-[10px] text-center text-muted-foreground mt-2">
              共32道题目，请根据最近两周的真实感受作答
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* ===== 模块9：合规声明 ===== */}
      <p className="text-[10px] text-muted-foreground text-center px-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
        本测评为情绪状态与成长卡点觉察工具，不用于任何医学诊断或治疗判断。
        如你感到持续严重不适，建议联系专业心理机构。
      </p>
    </div>
  );
}
