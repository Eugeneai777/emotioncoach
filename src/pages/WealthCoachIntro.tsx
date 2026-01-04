import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Activity, Heart, Brain, User, Network, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const WealthCoachIntro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const fiveLayers = [
    {
      level: 1,
      name: "行为层",
      subtitle: "改变你每天正在重复的动作",
      icon: Activity,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-200",
      problems: [
        "抱怨、犹豫、逃避机会",
        "不敢分享、不敢要价、不敢行动",
        "忙但不产出，努力却不累积"
      ],
      solution: "把复杂的赚钱行为，简化为一个可持续动作：每天邀请1个人，进入《突破财富卡点训练营》",
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
      borderColor: "border-rose-200",
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
      borderColor: "border-purple-200",
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
      borderColor: "border-emerald-200",
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
      borderColor: "border-blue-200",
      problems: [
        "钱不会因为你很好，就自动流向你",
        "钱只会通过结构流动"
      ],
      solution: "通过有劲合伙人分成计划，把价值、信任、分享、回馈写进系统规则",
      science: {
        source: "世界银行与经济学研究",
        insight: "可持续收入，来自结构性参与，而非单点努力"
      },
      keyPoint: "你只需要：真诚分享、持续连接、不控制结果"
    }
  ];

  const transformations = [
    { from: "混乱", to: "稳定", layer: "行为" },
    { from: "焦虑", to: "流动", layer: "情绪" },
    { from: "限制", to: "允许", layer: "信念" },
    { from: "旁观", to: "参与", layer: "身份" },
    { from: "单打独斗", to: "系统共赢", layer: "结构" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white dark:from-amber-950/20 dark:via-background dark:to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-amber-100 dark:border-border">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">财富同频五层系统</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-orange-300/10 to-yellow-200/20" />
        <div className="absolute top-10 right-10 w-32 h-32 bg-amber-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-orange-300/20 rounded-full blur-3xl" />
        
        <div className="relative container max-w-4xl mx-auto px-4 py-12 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-700 dark:text-amber-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            心理学 · 行为科学 · 现实验证
          </div>
          
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            财富不是靠努力，
            <br />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              而是靠在正确的层面发力
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            真正的财富突破，必须在 5 个层面同时发生
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
              size="lg"
            >
              开始财富教练对话
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={handleJoinCamp}
              variant="outline"
              size="lg"
              className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300"
            >
              加入21天训练营
            </Button>
          </div>
        </div>
      </section>

      {/* Five Layers */}
      <section className="container max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {fiveLayers.map((layer) => {
            const IconComponent = layer.icon;
            return (
              <Card 
                key={layer.level}
                className={`relative overflow-hidden bg-gradient-to-br ${layer.bgGradient} dark:from-background dark:to-background ${layer.borderColor} dark:border-border ${layer.isKey ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
              >
                {layer.isKey && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-bl-lg">
                    最关键的一层
                  </div>
                )}
                
                <div className="p-6">
                  {/* Layer Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${layer.gradient} flex items-center justify-center shadow-lg`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">第{layer.level}层</span>
                        <span className={`text-lg font-bold bg-gradient-to-r ${layer.gradient} bg-clip-text text-transparent`}>
                          {layer.name}
                        </span>
                      </div>
                      <p className="text-foreground font-medium">{layer.subtitle}</p>
                    </div>
                  </div>

                  {/* Problems */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">我们在解决什么？</p>
                    <ul className="space-y-1">
                      {layer.problems.map((problem, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {problem}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Solution */}
                  <div className="mb-4 p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-1">训练营做什么？</p>
                    <p className="text-sm text-foreground">{layer.solution}</p>
                  </div>

                  {/* Science */}
                  <div className="flex items-start gap-2 p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{layer.science.source}</p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">{layer.science.insight}</p>
                    </div>
                  </div>

                  {/* Key Point */}
                  <p className="mt-4 text-sm font-medium text-center text-muted-foreground italic">
                    💡 {layer.keyPoint}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Transformation Summary */}
      <section className="container max-w-4xl mx-auto px-4 py-12">
        <Card className="bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-background dark:to-background border-amber-200 dark:border-amber-800 overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-center text-foreground mb-6">
              五层同频，财富自然流动
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-8">
              {transformations.map((t, idx) => (
                <div key={idx} className="text-center p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t.layer}</p>
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <span className="text-muted-foreground line-through">{t.from}</span>
                    <ArrowRight className="w-3 h-3 text-amber-500" />
                    <span className="font-medium text-amber-600 dark:text-amber-400">{t.to}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              当这 5 个层面开始同频，
              <br />
              财富不再是你追逐的目标，
              <br />
              <span className="font-medium text-amber-700 dark:text-amber-300">
                而是你正在走的路上，自然出现的结果。
              </span>
            </p>
          </div>
        </Card>
      </section>

      {/* Training Camp CTA */}
      <section className="container max-w-4xl mx-auto px-4 py-8 pb-32">
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white overflow-hidden">
          <div className="p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-2">突破财富卡点训练营</h3>
            <p className="text-white/80 mb-4">21天系统陪伴 · 财富冥想 · 教练梳理 · 社群共振</p>
            <Button 
              onClick={handleJoinCamp}
              variant="secondary"
              size="lg"
              className="bg-white text-amber-600 hover:bg-white/90"
            >
              了解训练营详情
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </section>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-background/90 backdrop-blur-md border-t border-amber-100 dark:border-border z-40">
        <div className="container max-w-4xl mx-auto flex gap-3">
          <Button 
            onClick={handleGetStarted}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            size="lg"
          >
            开始财富教练对话
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WealthCoachIntro;
