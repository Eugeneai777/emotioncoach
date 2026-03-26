import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LaogeToolCard } from "@/components/laoge/LaogeToolCard";
import { Home, Share2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";

export interface RoundConfig {
  fields: { key: string; label: string; placeholder: string; type?: "text" | "select"; options?: string[] }[];
  buttonText: string;
}

export interface ToolConfig {
  tool: string;
  title: string;
  description: string;
  icon: string;
  rounds: RoundConfig[];
}

const TOOLS: ToolConfig[] = [
  {
    tool: "opportunity",
    title: "老哥，今年怎么赚钱",
    description: "今年还有什么赚钱机会？",
    icon: "💰",
    rounds: [
      { fields: [{ key: "industry", label: "你的行业", placeholder: "比如：互联网、制造业、教育..." }], buttonText: "问老哥" },
      { fields: [{ key: "city", label: "所在城市", placeholder: "比如：北京、深圳、成都..." }, { key: "resources", label: "你现在拥有的资源", placeholder: "比如：人脉、资金、技术..." }], buttonText: "继续聊" },
      { fields: [{ key: "budget", label: "能投入的时间和资金", placeholder: "比如：每天2小时、可以投5万..." }], buttonText: "让老哥给方案" },
    ],
  },
  {
    tool: "career",
    title: "老哥，我事业卡住了",
    description: "为什么事业越来越难？",
    icon: "🏔️",
    rounds: [
      { fields: [{ key: "industry", label: "你现在做什么行业？", placeholder: "行业和具体职位..." }], buttonText: "问老哥" },
      { fields: [{ key: "income", label: "目前收入区间？", type: "select" as const, placeholder: "选择", options: ["月薪1万以下", "月薪1-2万", "月薪2-3万", "月薪3-5万", "月薪5万以上", "创业中"] }, { key: "painPoint", label: "最近最大的卡点？", placeholder: "你觉得最困扰你的是什么..." }], buttonText: "继续聊" },
      { fields: [{ key: "duration", label: "这个问题持续多久了？", type: "select" as const, placeholder: "选择", options: ["刚开始", "半年以内", "半年到1年", "1-2年", "2年以上"] }, { key: "tried", label: "试过什么方法？", placeholder: "比如：看书、找朋友聊、报课..." }], buttonText: "让老哥给方案" },
    ],
  },
  {
    tool: "stress",
    title: "老哥，我压力有点大",
    description: "中年男人压力指数测试",
    icon: "😤",
    rounds: [
      { fields: [{ key: "work", label: "工作压力（1-10）", type: "select" as const, placeholder: "选择", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }, { key: "family", label: "家庭责任（1-10）", type: "select" as const, placeholder: "选择", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }], buttonText: "问老哥" },
      { fields: [{ key: "sleep", label: "睡眠质量差（1-10）", type: "select" as const, placeholder: "选择", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }, { key: "money", label: "经济压力（1-10）", type: "select" as const, placeholder: "选择", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }], buttonText: "继续聊" },
      { fields: [{ key: "emotion", label: "情绪释放（1-10）", type: "select" as const, placeholder: "1=有很好的出口，10=完全没有", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }, { key: "wantChange", label: "最想改变的一件事？", placeholder: "比如：睡眠、情绪、收入..." }], buttonText: "让老哥给方案" },
    ],
  },
  {
    tool: "health",
    title: "老哥，我身体有点不对",
    description: "40岁健康风险扫描",
    icon: "🏥",
    rounds: [
      { fields: [{ key: "age", label: "年龄", type: "select" as const, placeholder: "选择", options: ["35-39岁", "40-44岁", "45-49岁", "50-55岁", "55岁以上"] }, { key: "weight", label: "体重情况", type: "select" as const, placeholder: "选择", options: ["偏瘦", "正常", "微胖（肚子有点大）", "明显超重"] }], buttonText: "问老哥" },
      { fields: [{ key: "sleepHours", label: "每天睡眠时间", type: "select" as const, placeholder: "选择", options: ["不到5小时", "5-6小时", "6-7小时", "7-8小时", "8小时以上"] }, { key: "exercise", label: "运动频率", type: "select" as const, placeholder: "选择", options: ["基本不运动", "每周1-2次", "每周3-4次", "每天都运动"] }], buttonText: "继续聊" },
      { fields: [{ key: "concern", label: "最担心的健康问题？", placeholder: "比如：三高、腰椎、脱发、精力..." }], buttonText: "让老哥给方案" },
    ],
  },
];

export default function LaogeAI() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--laoge-bg))] pb-20">
      {/* Sticky Conversion Bar */}
      <div className="sticky top-0 z-50 bg-[#EF6A20] px-4 py-2.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-white font-bold text-sm">
            🔥 中年男人职场突围方案
          </span>
          <button
            onClick={() => navigate("/promo/synergy?source=laoge")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/60 text-white text-xs font-medium hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
          >
            了解详情
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top bar */}
      <div className="max-w-lg mx-auto px-5 pt-4">
        <div className="flex items-center justify-between mb-2">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { sessionStorage.setItem('skip_preferred_redirect', '1'); navigate("/mini-app"); }}
            className="flex items-center gap-1 text-xs text-[hsl(var(--laoge-text-muted))] hover:text-[hsl(var(--laoge-text))] transition-colors touch-manipulation"
          >
            <Home className="w-3.5 h-3.5" />
            <span>主页</span>
          </motion.button>

          <IntroShareDialog
            config={introShareConfigs.laoge}
            trigger={
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs text-[hsl(var(--laoge-text-muted))] hover:text-[hsl(var(--laoge-text))] transition-colors touch-manipulation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享给兄弟</span>
              </motion.button>
            }
          />
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--laoge-bg))] via-[hsl(var(--laoge-card))] to-[hsl(var(--laoge-bg))]" />
        <div className="relative px-5 pt-8 pb-4 text-center">
          <h1 className="text-4xl font-black text-[hsl(var(--laoge-text))] tracking-tight">
            老哥AI
          </h1>
          <p className="text-lg text-[hsl(var(--laoge-accent))] font-bold mt-2">
            有事问老哥
          </p>
          <p className="text-sm text-[hsl(var(--laoge-text-muted))] mt-2">
            男人的AI参谋
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {["赚钱", "事业", "压力", "健康"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[hsl(var(--laoge-accent)/0.15)] text-[hsl(var(--laoge-accent))] text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Assessment Entry */}
      <div className="px-4 pt-5 pb-2 max-w-lg mx-auto">
        <p className="text-sm font-bold text-[hsl(var(--laoge-text))] mb-3">
          🩺 老哥建议：先做个体检
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/wealth-block")}
            className="flex flex-col items-start gap-1.5 p-4 rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] hover:border-[hsl(var(--laoge-accent))] transition-all text-left"
          >
            <span className="text-2xl">💰</span>
            <span className="font-bold text-sm text-[hsl(var(--laoge-text))]">财富卡点测评</span>
            <span className="text-[10px] text-[hsl(var(--laoge-text-muted))]">20题 · 6分钟</span>
            <span className="text-[10px] font-bold text-[hsl(var(--laoge-accent))]">限时 ¥9.9</span>
          </button>
          <button
            onClick={() => navigate("/midlife-awakening")}
            className="flex flex-col items-start gap-1.5 p-4 rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] hover:border-[hsl(var(--laoge-accent))] transition-all text-left"
          >
            <span className="text-2xl">🧭</span>
            <span className="font-bold text-sm text-[hsl(var(--laoge-text))]">中场觉醒力测评</span>
            <span className="text-[10px] text-[hsl(var(--laoge-text-muted))]">30题 · 8分钟</span>
            <span className="text-[10px] font-bold text-[hsl(var(--laoge-accent))]">专业版</span>
          </button>
        </div>
      </div>

      {/* Tools */}
      <div className="px-4 py-6 space-y-3 max-w-lg mx-auto">
        {TOOLS.map(t => (
          <LaogeToolCard key={t.tool} {...t} />
        ))}
      </div>

      <AwakeningBottomNav />
    </div>
  );
}
