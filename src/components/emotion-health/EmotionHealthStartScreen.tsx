import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heart, Brain, TrendingUp, Clock, Shield, Sparkles, ChevronRight, Zap, FlaskConical, Bot, Star, ChevronDown, Compass, Search, Target, MessageCircle } from "lucide-react";
import { ThreeLayerDiagram } from "./ThreeLayerDiagram";
import { scientificStats, painPoints, scoringMechanismConfig, aiCoachOpeningExamples, comparisonWithTraditional, patternConfig, PatternType } from "./emotionHealthData";

interface EmotionHealthStartScreenProps {
  onStart: () => void;
  isLoading?: boolean;
}

// 技术与评分机制卡片组件
function TechnicalScoringCard() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold">技术与评分机制</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
                  核心技术
                </Badge>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              三组分数 → 一个主类型 + 两个副标签
            </p>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* 第一层 */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{scoringMechanismConfig.layer1.icon}</span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  第一层：{scoringMechanismConfig.layer1.name}
                </span>
                <Badge variant="outline" className="text-[10px] h-4">{scoringMechanismConfig.layer1.type}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1.5">
                  {scoringMechanismConfig.layer1.dimensions.map((d, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300">
                      {d}：0-100
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  用于：{scoringMechanismConfig.layer1.usage.join(' + ')}
                </p>
              </div>
            </div>

            {/* 第二层 */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{scoringMechanismConfig.layer2.icon}</span>
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                  第二层：{scoringMechanismConfig.layer2.name}
                </span>
                <Badge variant="outline" className="text-[10px] h-4">{scoringMechanismConfig.layer2.type}</Badge>
              </div>
              <div className="space-y-1 text-[10px]">
                <p className="text-muted-foreground">{scoringMechanismConfig.layer2.description}</p>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 font-medium">
                    输出：{scoringMechanismConfig.layer2.output}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  用于：{scoringMechanismConfig.layer2.usage.join(' + ')}
                </p>
              </div>
            </div>

            {/* 第三层 */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{scoringMechanismConfig.layer3.icon}</span>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  第三层：{scoringMechanismConfig.layer3.name}
                </span>
                <Badge variant="outline" className="text-[10px] h-4">{scoringMechanismConfig.layer3.type}</Badge>
              </div>
              <div className="space-y-1 text-[10px]">
                <p className="text-muted-foreground">
                  根据：{scoringMechanismConfig.layer3.logic}
                </p>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-800/50 text-rose-700 dark:text-rose-300 font-medium">
                    {scoringMechanismConfig.layer3.output}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  用于：{scoringMechanismConfig.layer3.usage.join(' + ')}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// AI教练联动卡片组件
function AICoachLinkageCard() {
  const [currentExample, setCurrentExample] = useState(0);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">测评 × AI教练 深度联动</h3>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3">
          测评不是终点，而是<span className="text-foreground font-medium">AI教练的第一句输入</span>
        </p>

        {/* AI对话示例 */}
        <div className="relative p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Brain className="w-3 h-3 text-white" />
            </div>
            <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              AI教练开场
            </div>
          </div>
          <div className="pl-8">
            <div className="text-xs leading-relaxed text-foreground whitespace-pre-line">
              {aiCoachOpeningExamples[currentExample].message}
            </div>
          </div>
        </div>

        {/* 示例切换 */}
        <div className="flex justify-center gap-1.5 mt-3">
          {aiCoachOpeningExamples.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentExample(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentExample 
                  ? 'bg-emerald-500' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        {/* 流程说明 */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">后续对话自动走</span>
            <span>情绪教练路径</span>
            <ChevronRight className="w-3 h-3" />
            <span>训练营推荐</span>
          </div>
        </div>

        {/* 差异化强调 */}
        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
            这是传统量表完全做不到的
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// 与传统量表对比卡片组件
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

// 四大反应模式预览卡片组件
function PatternPreviewCard({ pattern }: { pattern: typeof patternConfig[PatternType] }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`rounded-lg border ${pattern.bgColor} overflow-hidden`}>
        <CollapsibleTrigger asChild>
          <div className="p-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{pattern.emoji}</span>
                <div>
                  <div className="text-xs font-medium">{pattern.name}</div>
                  <div className="text-[10px] text-muted-foreground">{pattern.tagline}</div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-black/10 dark:border-white/10 pt-3">
            {/* 戳心总结 */}
            <div className="flex items-start gap-2">
              <Compass className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed text-foreground font-medium">
                "{pattern.headline}"
              </p>
            </div>
            
            {/* 典型表现 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Search className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">你可能正在经历</span>
              </div>
              <ul className="space-y-1 pl-4">
                {pattern.symptoms.map((symptom, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground leading-relaxed list-disc">
                    {symptom}
                  </li>
                ))}
              </ul>
            </div>

            {/* 内在机制 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Brain className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">这背后的真实原因</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed pl-4">
                {pattern.mechanism}
              </p>
            </div>

            {/* AI陪伴说明 */}
            <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Bot className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">AI教练下一步会这样陪你</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed pl-4">
                {pattern.aiNextStep}
              </p>
            </div>

            {/* 推荐路径 */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <ChevronRight className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">推荐路径：</span>
              <span className="text-foreground font-medium">{pattern.recommendedCoachLabel} + {pattern.recommendedCampLabel}</span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
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

      {/* 四大反应模式预览 - 可折叠详情卡片 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            将帮你识别的四大反应模式
          </h3>
          <div className="space-y-2">
            {(Object.keys(patternConfig) as PatternType[]).map((key) => {
              const pattern = patternConfig[key];
              return (
                <PatternPreviewCard key={key} pattern={pattern} />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 技术与评分机制卡片 */}
      <TechnicalScoringCard />

      {/* AI教练联动卡片 */}
      <AICoachLinkageCard />

      {/* 与传统量表对比卡片 */}
      <ComparisonCard />

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
