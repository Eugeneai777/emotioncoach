import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, Activity, Heart, Brain, User, Network, Sparkles, 
  CheckCircle2, ArrowRight, ClipboardCheck, Tent, Handshake, 
  ChevronRight, ChevronDown, Layers, Home
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WealthCoachIntro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const threeStepsRef = useRef<HTMLElement>(null);
  const structureLayerRef = useRef<HTMLDivElement>(null);
  const fiveLayersRef = useRef<HTMLElement>(null);

  const handleGetStarted = () => {
    if (user) {
      navigate("/coach/wealth_coach_4_questions");
    } else {
      navigate("/auth", { state: { returnTo: "/coach/wealth_coach_4_questions" } });
    }
  };

  const handleJoinCamp = () => {
    navigate("/wealth-camp-intro");
  };

  const handleStartAssessment = () => {
    navigate("/wealth-block");
  };

  const scrollToThreeSteps = () => {
    threeStepsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToStructureLayer = () => {
    structureLayerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFiveLayers = () => {
    fiveLayersRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const threeSteps = [
    {
      step: 1,
      title: "财富卡点测评",
      subtitle: "30道题深度分析",
      description: "找出隐藏在潜意识里的财富障碍",
      icon: ClipboardCheck,
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-50/80 to-violet-50/80",
      borderColor: "border-purple-200/60",
      iconBg: "bg-purple-100",
      action: "开始测评",
      onClick: handleStartAssessment,
      badge: "推荐先做",
    },
    {
      step: 2,
      title: "财富觉醒训练营",
      subtitle: "五层同频突破",
      description: "AI教练 + 社群共振 + 每日实践",
      icon: Tent,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50/80 to-orange-50/80",
      borderColor: "border-amber-200/60",
      iconBg: "bg-amber-100",
      action: "加入训练营",
      onClick: handleJoinCamp,
    },
    {
      step: 3,
      title: "有劲合伙人",
      subtitle: "开启事业发展",
      description: "分发体验包，建立用户关系，获得持续分成",
      icon: Handshake,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50/80 to-teal-50/80",
      borderColor: "border-emerald-200/60",
      iconBg: "bg-emerald-100",
      action: "成为合伙人",
      onClick: () => navigate("/partner/youjin-intro"),
    },
  ];

  const fiveLayers = [
    {
      level: 1,
      name: "行为层",
      subtitle: "改变你每天正在重复的动作",
      icon: Activity,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-300",
      problems: [
        "抱怨、犹豫、逃避机会",
        "不敢分享、不敢要价、不敢行动",
        "忙但不产出，努力却不累积"
      ],
      solution: "把复杂的赚钱行为，简化为一个可持续动作：每天邀请1个人，进入《财富觉醒训练营》",
      science: {
        source: "BJ Fogg 行为模型，斯坦福大学",
        insight: "当一个行为足够简单，持续率可提高 2-3 倍"
      },
      keyPoint: "不拼爆发力，只拼稳定可复制"
    },
    {
      level: 2,
      name: "情绪层",
      subtitle: "让你的能量，从焦虑回到流动",
      icon: Heart,
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50",
      borderColor: "border-rose-300",
      problems: [
        "恐惧（怕失败、怕没钱）",
        "匮乏（永远不够）",
        "控制（一定要马上看到结果）"
      ],
      solution: "不是压抑情绪，而是识别与松动。把「我要赚钱」的压力转化为：我在帮助一个人变得更好",
      science: {
        source: "哈佛商学院研究",
        insight: "焦虑状态下，人更倾向短视决策，直接降低长期财富积累能力"
      },
      keyPoint: "积极情绪状态，可提升决策质量、社交信任度、行动力持续性"
    },
    {
      level: 3,
      name: "信念层",
      subtitle: "打破那些你从没怀疑过，但一直在控制你的想法",
      icon: Brain,
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-50 to-violet-50",
      borderColor: "border-purple-300",
      problems: [
        "钱花了就没了",
        "我不适合赚钱",
        "要先很成功，才配谈钱",
        "赚钱会破坏关系"
      ],
      solution: "不是强行正能量，而是通过小验证+真实反馈，让新信念自然成立",
      science: {
        source: "认知重塑（Cognitive Reframing）",
        insight: "被广泛应用于财富教练、企业高管决策训练、心理治疗实践"
      },
      keyPoint: "信念不是靠说服改变的，而是靠被现实证明更新的"
    },
    {
      level: 4,
      name: "身份层",
      subtitle: "从努力者，走向价值角色",
      icon: User,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
      borderColor: "border-emerald-300",
      problems: [
        "一直在学",
        "一直在准备",
        "一直在等我更厉害一点"
      ],
      solution: "成为「有劲合伙人」——不是销售、不是老师、不是拯救者，你是价值入口的连接者",
      science: {
        source: "社会心理学研究",
        insight: "当人拥有清晰且被认可的身份，行动力与自我效能感显著提升"
      },
      keyPoint: "钱不是奖励努力，而是流向你正在扮演的角色",
      isKey: true
    },
    {
      level: 5,
      name: "结构层",
      subtitle: "让财富不再靠人品，而靠系统",
      icon: Network,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-300",
      problems: [
        "钱不会因为你很好，就自动流向你",
        "钱只会通过结构流动"
      ],
      solution: "通过有劲合伙人分成计划，把价值、信任、分享、回馈写进系统规则",
      science: {
        source: "世界银行与经济学研究",
        insight: "可持续收入，来自结构性参与，而非单点努力"
      },
      keyPoint: "你只需要：真诚分享、持续连接、不控制结果",
      isStructure: true
    }
  ];

  const transformations = [
    { from: "混乱", to: "稳定", layer: "行为", color: "from-amber-400 to-orange-400" },
    { from: "焦虑", to: "流动", layer: "情绪", color: "from-rose-400 to-pink-400" },
    { from: "限制", to: "允许", layer: "信念", color: "from-purple-400 to-violet-400" },
    { from: "旁观", to: "参与", layer: "身份", color: "from-emerald-400 to-teal-400" },
    { from: "单点", to: "系统", layer: "结构", color: "from-blue-400 to-cyan-400" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30 dark:from-amber-950/10 dark:via-background dark:to-background">
      <DynamicOGMeta pageKey="wealthCoachIntro" />
      {/* Header - 使用统一的PageHeader */}
      <PageHeader 
        title="财富教练"
        className="bg-white/80 dark:bg-background/80 border-amber-100/50 dark:border-border"
      />

      {/* Hero Section - 更简洁 */}
      <section className="relative overflow-hidden">
        {/* 装饰元素 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/40 via-orange-50/20 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-orange-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-200/20 to-pink-200/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative container max-w-4xl mx-auto px-4 py-10 md:py-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100/80 dark:bg-amber-900/30 rounded-full text-amber-700 dark:text-amber-300 text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            科学方法 · 系统陪伴 · 可复制路径
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
            财富不是靠努力，
            <br className="md:hidden" />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              而是靠在正确层面发力
            </span>
          </h1>
          
          <p className="text-base text-muted-foreground max-w-lg mx-auto mb-6">
            3步突破 · 5层同频 · 21天见效
          </p>
          
          <Button 
            onClick={scrollToThreeSteps}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
            size="lg"
          >
            开始突破之旅
            <ChevronDown className="ml-1 h-4 w-4 animate-bounce" />
          </Button>
        </div>
      </section>

      {/* Three Steps Section - 优化卡片设计 */}
      <section ref={threeStepsRef} className="container max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-1.5">
            财富觉醒 3 部曲
          </h2>
          <p className="text-sm text-muted-foreground">
            觉察卡点 → 系统突破 → 事业发展
          </p>
        </div>

        {/* 移动端：垂直时间线布局 */}
        <div className="md:hidden space-y-3">
          {threeSteps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.step} className="relative">
                {/* 连接线 */}
                {index < threeSteps.length - 1 && (
                  <div className="absolute left-6 top-full w-0.5 h-3 bg-gradient-to-b from-amber-300 to-amber-200" />
                )}
                
                <Card 
                  onClick={step.onClick}
                  className={`relative bg-white/90 dark:bg-card/90 backdrop-blur border ${step.borderColor} overflow-hidden transition-all active:scale-[0.98] cursor-pointer hover:shadow-md`}
                >
                  {step.badge && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-[10px] font-medium rounded-bl-lg">
                      {step.badge}
                    </div>
                  )}
                  
                  <div className="p-4 flex items-center gap-4">
                    {/* Step 图标 */}
                    <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-md`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                          Step {step.step}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>

                    {/* Arrow indicator */}
                    <ChevronRight className={`shrink-0 w-5 h-5 bg-gradient-to-r ${step.gradient} bg-clip-text text-amber-400`} />
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* 桌面端：水平卡片布局 */}
        <div className="hidden md:grid grid-cols-3 gap-5">
          {threeSteps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.step} className="relative">
                <Card 
                  onClick={step.onClick}
                  className={`h-full bg-white/90 dark:bg-card/90 backdrop-blur border ${step.borderColor} overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer`}
                >
                  {step.badge && (
                    <div className="absolute top-0 right-0 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs font-medium rounded-bl-lg">
                      {step.badge}
                    </div>
                  )}
                  
                  <div className="p-5 flex flex-col h-full">
                    {/* Step 标签 + 图标 */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-sm font-bold bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                        Step {step.step}
                      </span>
                    </div>

                    {/* 内容 */}
                    <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-1">{step.subtitle}</p>
                    <p className="text-sm text-foreground/70 mb-4 flex-1">{step.description}</p>

                    {/* Action hint */}
                    <div className={`flex items-center justify-center gap-1.5 text-sm font-medium bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                      {step.action}
                      <ChevronRight className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                </Card>

                {/* 箭头连接 */}
                {index < threeSteps.length - 1 && (
                  <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-md">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 衔接区块：3部曲 → 5层系统 */}
      <section className="container max-w-4xl mx-auto px-4 py-6">
        <Card className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-purple-50/30 dark:from-amber-950/20 dark:via-background dark:to-purple-950/10 border-amber-200/50 dark:border-amber-800/30">
          <div className="p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground mb-1">
                  有劲AI财富教练如何帮你突破？
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  通过<span className="text-amber-600 dark:text-amber-400 font-medium">「五层同频」</span>方法，从行为到结构，全方位打通你的财富通道
                </p>
                
                {/* 五层预览小卡片 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {fiveLayers.map((layer) => (
                    <span 
                      key={layer.level}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${layer.gradient} text-white`}
                    >
                      {layer.name}
                    </span>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollToFiveLayers}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-100/50 dark:text-amber-400 -ml-2"
                >
                  了解五层系统详情
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Five Layers - 使用 Accordion */}
      <section ref={fiveLayersRef} className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-1.5">
            财富同频五层系统
          </h2>
          <p className="text-sm text-muted-foreground">
            点击展开了解每一层的运作原理
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {fiveLayers.map((layer) => {
            const IconComponent = layer.icon;
            return (
              <AccordionItem 
                key={layer.level}
                value={`layer-${layer.level}`}
                ref={layer.isStructure ? structureLayerRef : undefined}
                className={`border-0 rounded-xl overflow-hidden ${layer.isKey ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
              >
                <Card className={`border ${layer.borderColor} bg-white/80 dark:bg-card/80 backdrop-blur`}>
                  {layer.isKey && (
                    <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-medium rounded-bl-lg z-10">
                      关键层
                    </div>
                  )}
                  
                  <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>div>.icon-wrapper]:rotate-0">
                    <div className="flex items-center gap-3 w-full">
                      <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${layer.gradient} flex items-center justify-center shadow-md`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">第{layer.level}层</span>
                          <span className={`text-base font-bold bg-gradient-to-r ${layer.gradient} bg-clip-text text-transparent`}>
                            {layer.name}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 line-clamp-1">{layer.subtitle}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-3 pl-[52px]">
                      {/* Problems */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">解决什么问题？</p>
                        <ul className="space-y-0.5">
                          {layer.problems.map((problem, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-sm text-foreground/80">
                              <span className="text-amber-500 mt-0.5 text-xs">•</span>
                              {problem}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Solution */}
                      <div className="p-2.5 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">训练营做什么？</p>
                        <p className="text-sm text-foreground">{layer.solution}</p>
                      </div>

                      {/* Science */}
                      <div className="flex items-start gap-2 p-2.5 bg-white/60 dark:bg-white/5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{layer.science.source}</p>
                          <p className="text-sm text-foreground/80">{layer.science.insight}</p>
                        </div>
                      </div>

                      {/* Key Point */}
                      <p className="text-sm font-medium text-center text-muted-foreground py-1">
                        💡 {layer.keyPoint}
                      </p>

                      {/* Partner CTA for Identity Layer */}
                      {layer.isKey && (
                        <Button 
                          onClick={() => navigate("/partner/youjin-intro")}
                          className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
                        >
                          成为有劲合伙人
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      {/* Transformation Summary - 更紧凑 */}
      <section className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-purple-50/30 dark:from-amber-950/20 dark:via-background dark:to-purple-950/10 border-amber-200/50 dark:border-amber-800/30 overflow-hidden">
          <div className="p-5 md:p-6">
            <h2 className="text-base md:text-lg font-bold text-center text-foreground mb-4">
              五层同频，财富自然流动
            </h2>
            
            <div className="grid grid-cols-5 gap-2 mb-5">
              {transformations.map((t, idx) => (
                <div key={idx} className="text-center">
                  <div className={`h-1.5 rounded-full bg-gradient-to-r ${t.color} mb-2`} />
                  <p className="text-[10px] text-muted-foreground mb-0.5">{t.layer}</p>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-muted-foreground line-through">{t.from}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-amber-500 rotate-90" />
                    <span className="text-xs font-medium text-foreground">{t.to}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-foreground/80 max-w-lg mx-auto">
              当这 5 个层面开始同频，财富不再是你追逐的目标，
              <span className="font-medium text-amber-600 dark:text-amber-400">而是自然出现的结果。</span>
            </p>
          </div>
        </Card>
      </section>

      {/* Spacer for sticky CTA */}
      <div className="h-20" />

      {/* Sticky Bottom CTA - 三按钮：测评、训练营、邀请 */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-background/95 backdrop-blur-md border-t border-amber-100/50 dark:border-border z-40 shadow-lg shadow-black/5">
        <div className="container max-w-4xl mx-auto flex gap-2">
          <Button 
            onClick={handleStartAssessment}
            variant="outline"
            className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 px-2"
          >
            <ClipboardCheck className="mr-1 h-4 w-4" />
            测评
          </Button>
          <Button 
            onClick={handleJoinCamp}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 px-2"
          >
            <Tent className="mr-1 h-4 w-4" />
            训练营
          </Button>
          <Button 
            onClick={() => navigate("/partner/youjin-intro")}
            variant="outline"
            className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 px-2"
          >
            <Handshake className="mr-1 h-4 w-4" />
            合伙人
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WealthCoachIntro;
