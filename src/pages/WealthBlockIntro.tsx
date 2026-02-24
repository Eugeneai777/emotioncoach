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
  CheckCircle2, Flame,
} from "lucide-react";

// ============= Section Components =============

function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 -mx-3 sm:-mx-4 md:-mx-6 px-6 pt-14 pb-12 text-center">
      {/* Decorative orbs */}
      <div className="absolute top-[-40px] left-[-40px] w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-30px] right-[-30px] w-40 h-40 bg-rose-500/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-400/10 rounded-full blur-[80px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        <BrandLogo size="lg" showText className="justify-center mb-5 [&_*]:text-white" />
        <h1 className="text-2xl font-extrabold text-white mb-2.5 leading-tight tracking-tight">
          财富卡点测评
        </h1>
        <p className="text-base text-slate-300 mb-1.5">
          赚钱好像被<span className="text-rose-400 font-semibold">隐形刹车</span>卡住了？
        </p>
        <p className="text-sm text-slate-500 mb-6">找到卡住你的那个「隐形开关」</p>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6">
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span><span className="font-bold text-amber-400 text-sm">12,847</span> 人已找到答案</span>
        </div>

        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button
            size="lg"
            className="rounded-full px-10 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/30"
            onClick={() => navigate("/wealth-block")}
          >
            立即开始测评
          </Button>
        </motion.div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {[
            { icon: Shield, text: "隐私加密" },
            { icon: Clock, text: "8 分钟" },
            { icon: Sparkles, text: "AI 深度分析" },
          ].map((b, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] text-slate-500">
              <b.icon className="w-3 h-3 text-slate-500" />
              {b.text}
            </span>
          ))}
        </div>
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
    <section className="py-10">
      <motion.h2
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-lg font-bold text-slate-800 text-center mb-6"
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm relative overflow-hidden"
          >
            {/* Red accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 to-rose-500 rounded-l-xl" />
            <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0 ml-1">
              <span className="text-[10px] font-bold text-rose-500">{i + 1}</span>
            </div>
            <p.icon className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-sm text-slate-700">{p.text}</span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mt-5 p-3.5 rounded-xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-200"
      >
        <p className="text-xs text-rose-600 text-center font-semibold">
          ⚠️ 如果不解决，可能继续原地踏步 3-5 年
        </p>
      </motion.div>
    </section>
  );
}

function WhatIsBlockSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-slate-900 to-violet-950 -mx-3 sm:-mx-4 md:-mx-6 px-6 py-10">
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl" />

      <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10">
        <h2 className="text-lg font-bold text-white text-center mb-3">什么是「财富卡点」？</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-5 text-center">
          财富卡点是潜意识中的<span className="font-semibold text-violet-300">隐性财富障碍</span>——
          它们像看不见的刹车，在你不知不觉中限制了你的收入上限。
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          {[
            { src: "中科院心理所", stat: "78% 的财富困境源于心理卡点" },
            { src: "哈佛商学院", stat: "潜意识信念影响 95% 的财务决策" },
            { src: "2024 调研", stat: "解除卡点后平均收入提升 40%" },
          ].map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
            >
              <Shield className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <span className="text-[10px] text-violet-400">{d.src}</span>
                <p className="text-xs text-slate-200 font-medium">{d.stat}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

const dimensions = [
  { icon: BrainCircuit, title: "思维穷", desc: "限制性信念锁死收入天花板", gradient: "from-blue-500 to-cyan-500" },
  { icon: Heart, title: "情绪穷", desc: "恐惧、内疚、羞耻阻碍行动", gradient: "from-rose-500 to-pink-500" },
  { icon: Footprints, title: "行为穷", desc: "自我设限导致机会流失", gradient: "from-amber-500 to-orange-500" },
  { icon: Users, title: "关系穷", desc: "人际模式阻碍财富流入", gradient: "from-emerald-500 to-teal-500" },
];

function DimensionsSection() {
  return (
    <section className="py-10">
      <motion.h2
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-lg font-bold text-slate-800 text-center mb-6"
      >
        测评四大维度
      </motion.h2>
      <div className="grid grid-cols-2 gap-3">
        {dimensions.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${d.gradient} flex items-center justify-center mb-3 shadow-md`}>
              <d.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">{d.title}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">{d.desc}</p>
          </motion.div>
        ))}
      </div>
      {/* Connection hint */}
      <p className="text-center text-[10px] text-slate-400 mt-3">它们相互关联，共同影响你的财富状态</p>
    </section>
  );
}

const layers = [
  { icon: Footprints, title: "行为层", desc: "你做了什么（或没做什么）", gradient: "from-blue-500 to-cyan-500", label: "Layer 1" },
  { icon: Heart, title: "情绪层", desc: "你在害怕什么、回避什么", gradient: "from-rose-500 to-pink-500", label: "Layer 2" },
  { icon: BrainCircuit, title: "信念层", desc: "你内心深处相信什么", gradient: "from-violet-500 to-purple-500", label: "Layer 3" },
];

function ThreeLayerSection() {
  return (
    <section className="py-10">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <h2 className="text-lg font-bold text-slate-800 text-center mb-1">三层剥离法</h2>
        <p className="text-xs text-slate-500 text-center mb-6">从表面到根源，逐层揭开卡点</p>
      </motion.div>
      {/* Vertical timeline */}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-300 via-rose-300 to-violet-400 rounded-full" />
        <div className="space-y-4">
          {layers.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className={`absolute -left-8 top-3 w-6 h-6 rounded-full bg-gradient-to-br ${l.gradient} flex items-center justify-center shadow-md ring-2 ring-white`}>
                <span className="text-[8px] font-bold text-white">{i + 1}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <span className="text-[10px] text-slate-400 font-medium">{l.label}</span>
                <div className="flex items-center gap-2 mt-1 mb-1">
                  <l.icon className="w-4 h-4 text-slate-600" />
                  <p className="text-sm font-bold text-slate-800">{l.title}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{l.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
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
    <section className="py-10">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">为什么选择 AI 测评？</h2>
        {/* VS badge */}
        <div className="inline-flex items-center gap-2 mt-2">
          <span className="text-[10px] text-slate-400">传统测评</span>
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-[10px] font-extrabold text-white shadow-md">VS</span>
          <span className="text-[10px] text-violet-600 font-semibold">AI 测评</span>
        </div>
      </motion.div>
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
            {/* Traditional - dimmed */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 opacity-70">
              <div className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-400 line-through leading-relaxed">{item.traditional}</span>
              </div>
            </div>
            {/* AI - glowing */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-amber-50 border border-violet-300 shadow-sm shadow-violet-200/50 relative overflow-hidden">
              <div className="absolute top-1 right-1">
                <Sparkles className="w-3 h-3 text-amber-400/70 animate-pulse" />
              </div>
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
  { icon: Radar, title: "四穷人格雷达图", desc: "可视化诊断你的财富卡点分布", gradient: "from-cyan-500 to-blue-500" },
  { icon: Gauge, title: "觉醒指数仪表盘", desc: "0-100 分量化你的财富能量", gradient: "from-amber-500 to-orange-500" },
  { icon: BookOpen, title: "卡点故事化解读", desc: "用你的经历讲述卡点成因", gradient: "from-violet-500 to-purple-500" },
  { icon: Lightbulb, title: "个性化突破建议", desc: "针对你的卡点定制行动方案", gradient: "from-emerald-500 to-teal-500" },
];

function OutcomesSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 -mx-3 sm:-mx-4 md:-mx-6 px-6 py-10">
      <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="relative z-10 text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-amber-300 text-xs font-medium mb-2">
          <Gift className="w-3.5 h-3.5" />
          测评成果
        </div>
        <h2 className="text-lg font-bold text-white">你将获得</h2>
      </motion.div>

      {/* 2x2 grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 mb-3">
        {outcomes.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10"
          >
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2 shadow-md`}>
              <item.icon className="w-4.5 h-4.5 text-white" />
            </div>
            <p className="text-xs font-semibold text-white mb-0.5">{item.title}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* 5th item spanning full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="relative z-10 p-4 rounded-2xl bg-gradient-to-r from-rose-500/20 to-violet-500/20 backdrop-blur-sm border border-rose-400/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center shadow-md shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-0.5">AI 智能追问分析</p>
            <p className="text-[10px] text-slate-400">深层挖掘你未意识到的盲点，其他测评做不到</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FlowSection() {
  const steps = [
    { icon: FileQuestion, title: "30 道场景题", time: "5 分钟", gradient: "from-blue-500 to-cyan-500" },
    { icon: Brain, title: "AI 智能追问", time: "2-3 分钟", gradient: "from-violet-500 to-purple-500" },
    { icon: FileText, title: "生成专属报告", time: "即时", gradient: "from-amber-500 to-orange-500" },
  ];
  return (
    <section className="py-10">
      <motion.h2
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-lg font-bold text-slate-800 text-center mb-6"
      >测评流程</motion.h2>
      <div className="flex items-center justify-between gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex-1 text-center">
              <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${s.gradient} p-2.5 mb-2 shadow-lg`}>
                <s.icon className="w-full h-full text-white" />
              </div>
              <p className="text-xs font-semibold text-slate-700">{s.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.time}</p>
            </div>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-1" />}
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  const navigate = useNavigate();
  const includes = [
    ["30 道场景化测评题", "AI 智能追问深度分析"],
    ["四穷人格雷达图", "觉醒指数评估"],
    ["个性化卡点故事解读", "突破建议行动方案"],
    ["AI 语音教练免费体验", "觉醒顾问 7 天服务"],
  ];
  return (
    <section className="py-10">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 border-2 border-amber-300 p-6 text-center relative overflow-hidden"
      >
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold mb-2">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            限时特惠
            <Flame className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="flex items-baseline justify-center gap-2 mb-1">
            <span className="text-4xl font-black text-rose-600">¥9.9</span>
            <span className="text-base text-slate-400 line-through decoration-2">¥99</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-5">超过 200 元价值的深度测评</p>

          {/* Two-column value list */}
          <div className="space-y-2 mb-5">
            {includes.map((row, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                {row.map((item, j) => (
                  <div key={j} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="text-[11px] text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Button
              size="lg"
              className="w-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/20"
              onClick={() => navigate("/wealth-block")}
            >
              立即开始测评 ¥9.9
            </Button>
          </motion.div>

          <p className="text-[10px] text-slate-400 mt-3">
            少喝一杯奶茶，找到卡住你的根源 ☕️
          </p>

          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Shield className="w-3 h-3" /> 隐私保护
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" /> 8-10 分钟
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ============= Main Page =============

export default function WealthBlockIntro() {
  const navigate = useNavigate();

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50 via-white to-slate-50" style={{ WebkitOverflowScrolling: 'touch' }}>
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

      {/* Fixed Bottom CTA - Enhanced */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <ResponsiveContainer size="sm" padded={false}>
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <span className="text-[10px] text-slate-400 line-through">¥99</span>
              <span className="text-lg font-black text-rose-600 ml-1">¥9.9</span>
            </div>
            <Button
              size="lg"
              className="flex-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-rose-500/25 relative overflow-hidden"
              onClick={() => navigate("/wealth-block")}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
              <span className="relative z-10">立即开始测评</span>
            </Button>
          </div>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
