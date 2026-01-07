import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Activity, Heart, Brain, User, Network, Sparkles, 
  CheckCircle2, ArrowRight, ClipboardCheck, Tent, Users, 
  ChevronRight, ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { WealthTrilogyCard } from "@/components/wealth-coach/WealthTrilogyCard";
import { CoachStepsCard } from "@/components/coach/CoachStepsCard";

const WealthCoachIntro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fiveLayersRef = useRef<HTMLElement>(null);

  const handleStartAssessment = () => {
    navigate("/wealth-block");
  };

  const handleJoinCamp = () => {
    navigate("/wealth-camp-intro");
  };

  const scrollToFiveLayers = () => {
    fiveLayersRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fiveLayers = [
    {
      level: 1,
      name: "行为层",
      subtitle: "改变你每天正在重复的动作",
      icon: "🎯",
      keyPoint: "不拼爆发力，只拼稳定可复制",
      solution: "把复杂的赚钱行为，简化为一个可持续动作：每天邀请1个人"
    },
    {
      level: 2,
      name: "情绪层",
      subtitle: "让你的能量，从焦虑回到流动",
      icon: "💛",
      keyPoint: "积极情绪状态，可提升决策质量",
      solution: "识别与松动情绪，把压力转化为帮助他人的动力"
    },
    {
      level: 3,
      name: "信念层",
      subtitle: "打破那些一直在控制你的想法",
      icon: "💡",
      keyPoint: "信念不是靠说服改变的，而是靠被现实证明更新的",
      solution: "通过小验证+真实反馈，让新信念自然成立"
    },
    {
      level: 4,
      name: "身份层",
      subtitle: "从努力者，走向价值角色",
      icon: "👤",
      keyPoint: "钱不是奖励努力，而是流向你正在扮演的角色",
      solution: "成为价值入口的连接者，而非销售或拯救者"
    },
    {
      level: 5,
      name: "结构层",
      subtitle: "让财富不再靠人品，而靠系统",
      icon: "🌐",
      keyPoint: "你只需要：真诚分享、持续连接、不控制结果",
      solution: "通过有劲合伙人分成计划，把价值写进系统规则"
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-amber-100/50 dark:border-border">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">突破财富卡点</h1>
        </div>
      </header>

      {/* Hero + 3部曲融合区 */}
      <section className="relative overflow-hidden">
        {/* 装饰元素 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/40 via-orange-50/20 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-orange-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-200/20 to-pink-200/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative container max-w-4xl mx-auto px-4 py-8 md:py-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100/80 dark:bg-amber-900/30 rounded-full text-amber-700 dark:text-amber-300 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              科学方法 · 系统陪伴 · 可复制路径
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2 leading-tight">
              财富不是靠努力，
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                而是靠在正确层面发力
              </span>
            </h1>
            
            <p className="text-sm text-muted-foreground mb-1">
              3步突破 · 5层同频 · 21天见效
            </p>
          </div>

          {/* 3部曲卡片组 */}
          <WealthTrilogyCard className="mb-4" />

          {/* 了解更多入口 */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToFiveLayers}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-100/50 dark:text-amber-400 text-xs"
            >
              了解「五层同频」系统
              <ChevronDown className="ml-1 h-3.5 w-3.5 animate-bounce" />
            </Button>
          </div>
        </div>
      </section>

      {/* 五层系统 - 使用 CoachStepsCard */}
      <section ref={fiveLayersRef} className="container max-w-4xl mx-auto px-4 py-6">
        <CoachStepsCard
          title="财富同频五层系统"
          titleEmoji="🌊"
          primaryColor="amber"
          showMoreInfo={false}
          steps={fiveLayers.map(layer => ({
            id: layer.level,
            emoji: layer.icon,
            name: layer.name,
            subtitle: layer.subtitle,
            description: layer.keyPoint,
            details: layer.solution
          }))}
        />
      </section>

      {/* 转化总结卡片 */}
      <section className="container max-w-4xl mx-auto px-4 py-4">
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-purple-50/30 dark:from-amber-950/20 dark:via-background dark:to-purple-950/10 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl p-4 md:p-5">
          <h2 className="text-sm md:text-base font-bold text-center text-foreground mb-3">
            五层同频，财富自然流动
          </h2>
          
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {transformations.map((t, idx) => (
              <div key={idx} className="text-center">
                <div className={`h-1 rounded-full bg-gradient-to-r ${t.color} mb-1.5`} />
                <p className="text-[9px] text-muted-foreground mb-0.5">{t.layer}</p>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground line-through">{t.from}</span>
                  <ArrowRight className="w-2 h-2 text-amber-500 rotate-90" />
                  <span className="text-[10px] font-medium text-foreground">{t.to}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-foreground/80 max-w-sm mx-auto">
            当这 5 个层面开始同频，财富不再是你追逐的目标，
            <span className="font-medium text-amber-600 dark:text-amber-400">而是自然出现的结果。</span>
          </p>
        </div>
      </section>

      {/* Spacer for sticky CTA */}
      <div className="h-20" />

      {/* Sticky Bottom CTA */}
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
            onClick={() => navigate("/share-invite")}
            variant="outline"
            className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 px-2"
          >
            <Users className="mr-1 h-4 w-4" />
            邀请
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WealthCoachIntro;
