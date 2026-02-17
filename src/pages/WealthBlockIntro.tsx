import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { VoiceCoachSection } from "@/components/wealth-block/intro/VoiceCoachSection";
import { AdvisorValueSection } from "@/components/wealth-block/intro/AdvisorValueSection";
import { AssessmentFAQ } from "@/components/wealth-block/intro/AssessmentFAQ";
import {
  AlertTriangle, Zap, TrendingDown, Eye, HeartCrack, HandCoins,
  BrainCircuit, Heart, Footprints, Users, Layers,
  Sparkles, X, Check, Radar, Gauge, BookOpen, Lightbulb, Gift,
  FileQuestion, Brain, FileText, ChevronRight, Shield, Clock,
  CheckCircle2,
} from "lucide-react";

// ============= Section Components =============

function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="pt-10 pb-8 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <BrandLogo size="lg" showText className="justify-center mb-4" />
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2 leading-tight">
          财富卡点测评
        </h1>
        <p className="text-base text-slate-600 mb-1">
          赚钱好像被<span className="text-rose-500 font-semibold">隐形刹车</span>卡住了？
        </p>
        <p className="text-sm text-slate-400 mb-6">找到卡住你的那个"隐形开关"</p>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-5">
          <Users className="w-3.5 h-3.5 text-amber-500" />
          <span><span className="font-bold text-amber-600">12,847</span> 人已找到答案</span>
        </div>
        <Button
          size="lg"
          className="rounded-full px-8 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-rose-500/25"
          onClick={() => navigate("/wealth-block")}
        >
          立即开始测评
        </Button>
      </motion.div>
    </section>
  );
}

const painPoints = [
  { icon: TrendingDown, text: "工资月月见底，存不下钱" },
  { icon: Eye, text: "看到别人赚钱，又嫉妒又焦虑" },
  { icon: HandCoins, text: "不敢推销自己，觉得谈钱很丢人" },
  { icon: HeartCrack, text: "赚到钱就花掉，留不住财富" },
  { icon: AlertTriangle, text: "明明很努力，收入却不见增长" },
];

function PainPointSection() {
  return (
    <section className="py-8">
      <motion.h2
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-lg font-bold text-slate-800 text-center mb-5"
      >
        你是不是也有这些困扰？
      </motion.h2>
      <div className="space-y-2.5">
        {painPoints.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm"
          >
            <p.icon className="w-4.5 h-4.5 text-rose-400 shrink-0" />
            <span className="text-sm text-slate-700">{p.text}</span>
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-xs text-rose-500 text-center mt-4 font-medium"
      >
        ⚠️ 如果不解决，可能继续原地踏步 3-5 年
      </motion.p>
    </section>
  );
}

function WhatIsBlockSection() {
  return (
    <section className="py-8">
      <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-lg font-bold text-slate-800 text-center mb-3">什么是"财富卡点"？</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4 text-center">
          财富卡点是潜意识中的<span className="font-semibold text-violet-600">隐性财富障碍</span>——
          它们像看不见的刹车，在你不知不觉中限制了你的收入上限。
        </p>
        <div className="grid grid-cols-1 gap-2">
          {[
            { src: "中科院心理所", stat: "78% 的财富困境源于心理卡点" },
            { src: "哈佛商学院", stat: "潜意识信念影响 95% 的财务决策" },
            { src: "2024 调研", stat: "解除卡点后平均收入提升 40%" },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-violet-50 border border-violet-100">
              <Shield className="w-4 h-4 text-violet-500 shrink-0" />
              <div>
                <span className="text-[10px] text-violet-400">{d.src}</span>
                <p className="text-xs text-slate-700 font-medium">{d.stat}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

const dimensions = [
  { icon: BrainCircuit, title: "思维穷", desc: "限制性信念锁死收入天花板", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { icon: Heart, title: "情绪穷", desc: "恐惧、内疚、羞耻阻碍行动", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  { icon: Footprints, title: "行为穷", desc: "自我设限导致机会流失", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { icon: Users, title: "关系穷", desc: "人际模式阻碍财富流入", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
];

function DimensionsSection() {
  return (
    <section className="py-8">
      <motion.h2
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-lg font-bold text-slate-800 text-center mb-5"
      >
        测评四大维度
      </motion.h2>
      <div className="grid grid-cols-2 gap-3">
        {dimensions.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`p-4 rounded-2xl ${d.bg} border ${d.border}`}
          >
            <d.icon className={`w-6 h-6 ${d.color} mb-2`} />
            <p className="text-sm font-bold text-slate-800 mb-1">{d.title}</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">{d.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const layers = [
  { icon: Footprints, title: "行为层", desc: "你做了什么（或没做什么）", color: "from-blue-500 to-cyan-500" },
  { icon: Heart, title: "情绪层", desc: "你在害怕什么、回避什么", color: "from-rose-500 to-pink-500" },
  { icon: BrainCircuit, title: "信念层", desc: "你内心深处相信什么", color: "from-violet-500 to-purple-500" },
];

function ThreeLayerSection() {
  return (
    <section className="py-8">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <h2 className="text-lg font-bold text-slate-800 text-center mb-1">三层剥离法</h2>
        <p className="text-xs text-slate-500 text-center mb-5">从表面到根源，逐层揭开卡点</p>
      </motion.div>
      <div className="flex gap-2.5">
        {layers.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex-1 text-center p-3 rounded-2xl bg-white border border-slate-100 shadow-sm"
          >
            <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${l.color} flex items-center justify-center mb-2`}>
              <l.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-1">{l.title}</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">{l.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const comparisonItems = [
  { traditional: "固定题目，机械作答", ai: "AI 智能追问，深挖隐藏盲点" },
  { traditional: "一次性 PDF 报告", ai: "四穷雷达图 + 可视化诊断" },
  { traditional: "泛泛建议，不针对个人", ai: "个性化突破方案" },
  { traditional: "冷冰冰的分数标签", ai: "人格故事化解读" },
];

function AIComparisonSection() {
  return (
    <section className="py-8">
      <motion.h2
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-lg font-bold text-slate-800 text-center mb-5"
      >
        为什么选择 AI 测评？
      </motion.h2>
      <div className="space-y-2.5">
        {comparisonItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="grid grid-cols-2 gap-2"
          >
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <div className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-500 line-through leading-relaxed">{item.traditional}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-amber-50 border border-violet-200">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 font-medium leading-relaxed">{item.ai}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const outcomes = [
  { icon: Radar, title: "四穷人格雷达图", desc: "可视化诊断你的财富卡点分布", color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  { icon: Gauge, title: "觉醒指数仪表盘", desc: "0-100 分量化你的财富能量", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { icon: BookOpen, title: "卡点故事化解读", desc: "用你的经历讲述卡点成因", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  { icon: Lightbulb, title: "个性化突破建议", desc: "针对你的卡点定制行动方案", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { icon: Brain, title: "AI 智能追问分析", desc: "深层挖掘你未意识到的盲点", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
];

function OutcomesSection() {
  return (
    <section className="py-8">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium mb-2">
          <Gift className="w-3.5 h-3.5" />
          测评成果
        </div>
        <h2 className="text-lg font-bold text-slate-800">你将获得</h2>
      </motion.div>
      <div className="space-y-2.5">
        {outcomes.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={`flex items-start gap-3 p-3.5 rounded-xl ${item.bg} border ${item.border}`}
          >
            <item.icon className={`w-5 h-5 ${item.color} shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm font-medium text-slate-800 mb-0.5">{item.title}</p>
              <p className="text-xs text-slate-600">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FlowSection() {
  const steps = [
    { icon: FileQuestion, title: "30 道场景题", time: "5 分钟", color: "from-blue-500 to-cyan-500" },
    { icon: Brain, title: "AI 智能追问", time: "2-3 分钟", color: "from-violet-500 to-purple-500" },
    { icon: FileText, title: "生成专属报告", time: "即时", color: "from-amber-500 to-orange-500" },
  ];
  return (
    <section className="py-8">
      <motion.h2
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-lg font-bold text-slate-800 text-center mb-5"
      >测评流程</motion.h2>
      <div className="flex items-center justify-between gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex-1 text-center">
              <div className={`w-11 h-11 mx-auto rounded-xl bg-gradient-to-br ${s.color} p-2.5 mb-2 shadow-md`}>
                <s.icon className="w-full h-full text-white" />
              </div>
              <p className="text-xs font-medium text-slate-700">{s.title}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.time}</p>
            </div>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mx-1" />}
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  const navigate = useNavigate();
  const includes = [
    "30 道场景化测评题",
    "AI 智能追问深度分析",
    "四穷人格雷达图",
    "觉醒指数评估",
    "个性化卡点故事解读",
    "突破建议行动方案",
    "AI 语音教练免费体验",
    "觉醒顾问 7 天服务",
  ];
  return (
    <section className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 p-6 text-center"
      >
        <p className="text-xs text-slate-500 mb-1">限时特惠</p>
        <div className="flex items-baseline justify-center gap-1 mb-1">
          <span className="text-3xl font-extrabold text-rose-600">¥9.9</span>
          <span className="text-sm text-slate-400 line-through">¥99</span>
        </div>
        <p className="text-[10px] text-slate-400 mb-5">超过 200 元价值的深度测评</p>

        <div className="text-left space-y-2 mb-6">
          {includes.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs text-slate-700">{item}</span>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-rose-500/25"
          onClick={() => navigate("/wealth-block")}
        >
          立即开始测评 ¥9.9
        </Button>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Shield className="w-3 h-3" /> 隐私保护
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" /> 8-10 分钟
          </span>
        </div>
      </motion.div>
    </section>
  );
}

// ============= Main Page =============

export default function WealthBlockIntro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <ResponsiveContainer size="sm" className="pb-24">
        <HeroSection />
        <PainPointSection />
        <WhatIsBlockSection />
        <DimensionsSection />
        <ThreeLayerSection />
        <FlowSection />
        <AIComparisonSection />
        <OutcomesSection />
        <VoiceCoachSection />
        <AdvisorValueSection />
        <PricingSection />
        <AssessmentFAQ />
      </ResponsiveContainer>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <ResponsiveContainer size="sm" padded={false}>
          <Button
            size="lg"
            className="w-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-rose-500/25"
            onClick={() => navigate("/wealth-block")}
          >
            立即开始测评 ¥9.9
          </Button>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
