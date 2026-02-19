import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ChevronDown, Sparkles, Settings, 
  Eye, Heart, Lightbulb, RefreshCw, Target, Users, Calendar,
  Brain, AlertCircle, CheckCircle, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import { awakeningDimensions } from "@/config/awakeningConfig";
import IntroSectionCard from "@/components/awakening/intro/IntroSectionCard";
import ProblemMappingTable from "@/components/awakening/intro/ProblemMappingTable";
import AwarenessLoopDiagram from "@/components/awakening/intro/AwarenessLoopDiagram";
import InterventionLevelTable from "@/components/awakening/intro/InterventionLevelTable";

// 四层支持系统
const fourLayers = [
  {
    id: 'layer1',
    emoji: '📝',
    title: '轻记录入口',
    subtitle: '睡前5分钟，写一个困境+一个顺境',
    color: 'amber',
    description: '不需要想清楚，真实就好。你可以只点一下，也可以只写半句话。',
    features: ['6个入口分两类', '困境（情绪/选择/关系）', '顺境（感恩/行动/方向）'],
    highlight: '你可以只点一下，也可以只写半句话。'
  },
  {
    id: 'layer2',
    emoji: '🪞',
    title: '智能看见（生命卡片）',
    subtitle: '帮你看见你自己',
    color: 'blue',
    things: [
      { icon: Eye, text: '看见状态' },
      { icon: Heart, text: '告诉正常' },
      { icon: Lightbulb, text: '指出盲点' },
      { icon: RefreshCw, text: '新角度' },
      { icon: Target, text: '微行动' },
    ],
    highlight: '不是分析你，是陪你站在你身边。'
  },
  {
    id: 'layer3',
    emoji: '🤍',
    title: 'AI 教练陪你深入',
    subtitle: '当你想多聊一点时',
    color: 'purple',
    triggers: ['这个问题反复出现', '你想更深入理一理', '你不想一个人想了'],
    highlight: '你只负责说真实的话，理清是教练的工作。'
  },
  {
    id: 'layer4',
    emoji: '🤝',
    title: '真人教练支持',
    subtitle: '当你需要被真正陪一段路',
    color: 'teal',
    options: [
      { icon: Calendar, title: '加入训练营', desc: '21 天建立新习惯' },
      { icon: Users, title: '预约真人教练', desc: '一次把关键问题理清' },
    ],
    highlight: '没有强迫，只在你真的需要的时候出现。'
  },
];

const colorStyles: Record<string, { bg: string; text: string; border: string }> = {
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200/50' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200/50' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200/50' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200/50' },
};

// 自动驾驶状态列表
const autopilotBehaviors = [
  "差不多的起床方式",
  "差不多的工作节奏",
  "差不多的刷手机、娱乐、放空",
  "差不多的情绪反应与决定",
];

// 每天都值得记录的原因
const dailyWorthRecording = [
  { emoji: "🔥", title: "情绪", reason: "每天都有，很少停下来识别" },
  { emoji: "💛", title: "感恩", reason: "每天都在消耗，很少滋养" },
  { emoji: "⚡", title: "行动", reason: "每天都在忙，不清楚为什么" },
  { emoji: "🧩", title: "选择", reason: "每天都在决定，以为自己是理性的" },
  { emoji: "🤝", title: "关系", reason: "每天都在互动，很少真正沟通" },
  { emoji: "🌟", title: "方向", reason: "每天都在向前，不知道往哪走" },
];

const AwakeningSystemIntro: React.FC = () => {
  const navigate = useNavigate();
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [showPainPoints, setShowPainPoints] = useState(false);

  const challengeEntries = awakeningDimensions.filter(d => d.category === 'challenge');
  const blessingEntries = awakeningDimensions.filter(d => d.category === 'blessing');

  return (
    <>
      <DynamicOGMeta pageKey="awakeningIntro" />

      <div 
        className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <PageHeader title="觉察日记" showBack rightActions={<IntroShareDialog config={introShareConfigs.awakening} />} />

        {/* Main Content */}
        <main className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
          
          {/* ═══════ 模块1：为什么记录能改命 ═══════ */}
          <motion.div
            initial={{ opacity: 0.01, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="text-center space-y-3"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🌱</span>
              <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                为什么"记录"真的能改变命运
              </h2>
            </div>
          </motion.div>

          <IntroSectionCard delay={0.05}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              很多人以为，<br />
              频繁记录自己，是一种玄学。
            </p>
            <p className="text-sm text-foreground mt-3 font-medium">
              但事实恰恰相反。
            </p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">神经科学研究发现</span>
              </div>
              <p className="text-sm text-muted-foreground">
                人在"无意识自动驾驶"状态下，<br />
                每天会遗忘 <strong className="text-foreground">70% 以上</strong>的精力与思考痕迹。
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                如果不记录，大脑会默认沿用前一天的模式继续生活。
              </p>
            </div>
          </IntroSectionCard>

          {/* ═══════ 模块2：自动驾驶状态 ═══════ */}
          <IntroSectionCard delay={0.1}>
            <p className="text-sm text-muted-foreground mb-3">于是我们每天都在重复：</p>
            <ul className="space-y-2">
              {autopilotBehaviors.map((behavior, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-amber-500">•</span>
                  {behavior}
                </motion.li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t">
              <p className="text-sm text-foreground font-medium">
                久而久之，人就会进入一种状态：<br />
                <span className="text-muted-foreground">忙、却不清楚自己在忙什么；</span><br />
                <span className="text-muted-foreground">活着，却对时间没有记忆。</span>
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 font-medium">
                这不是你不努力，<br />
                而是你一直在"自动驾驶"。
              </p>
            </div>
          </IntroSectionCard>

          {/* ═══════ 模块3：记录的科学价值 ═══════ */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">🪞 记录的价值</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
          </div>

          <IntroSectionCard variant="highlight" delay={0.15}>
            <p className="text-sm text-foreground font-medium mb-3">
              记录，是最低成本打破自动驾驶的方式
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              持续记录的人，<br />
              会把"模糊的一天"，<br />
              变成可被看见、被调整的一天。
            </p>
            <div className="p-3 bg-background/80 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">长期研究显示，持续记录的人，在 5 年后：</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>决策速度明显更快</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>职业转型、创业效率提升 <strong>2-3 倍</strong></span>
                </li>
              </ul>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 font-medium">
                不是因为他们更聪明，<br />
                而是因为他们更清醒。
              </p>
            </div>
          </IntroSectionCard>

          {/* ═══════ 模块4：极简记录方式 ═══════ */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">✍️ 极简记录方式</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>

          <IntroSectionCard delay={0.2}>
            <p className="text-sm text-foreground font-medium text-center mb-4">
              你不需要写很多，<br />
              每天只需要 <span className="text-amber-600 dark:text-amber-400">5 分钟</span>。
            </p>
            <p className="text-sm text-muted-foreground text-center">
              我们只记录两件事：
            </p>
          </IntroSectionCard>

          {/* 困境记录 */}
          <Card className="p-4 border-l-4 border-l-red-400 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">①</span>
              <span className="font-semibold text-foreground">一个困境（逆境）</span>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">但不是写：</p>
              <p className="text-muted-foreground line-through italic pl-3">
                "我今天遇到了一个很糟糕的事……"
              </p>
              <p className="text-foreground font-medium">而是改成：</p>
              <div className="pl-3 space-y-1">
                <p className="text-amber-600 dark:text-amber-400">"我今天破局的关键点是……"</p>
                <p className="text-amber-600 dark:text-amber-400">"这可能是我命运的一个转折点……"</p>
              </div>
              <p className="text-muted-foreground mt-3">
                当你这样写，<br />
                你就不再只是重复悲惨叙事，<br />
                而是开始看见问题、思考解决方案。
              </p>
              <div className="p-3 bg-background/80 rounded-lg mt-3">
                <p className="text-sm font-medium text-foreground mb-2">你会清楚地看到：</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-red-400">•</span>
                    自己惯性的情绪反应
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-red-400">•</span>
                    情绪如何带来错误处理方式
                  </li>
                </ul>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                  这一刻，觉察就发生了。<br />
                  你会自然地跳出旧模式，开始寻找更好的选择。
                </p>
              </div>
            </div>
          </Card>

          {/* 顺境记录 */}
          <Card className="p-4 border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">②</span>
              <span className="font-semibold text-foreground">一个顺境（正向体验）</span>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">如果今天没有发生什么"大好事"，你也可以记录：</p>
              <div className="flex flex-wrap gap-2">
                {['一次散步', '一场电影', '一顿饭', '一次聊天', '一个灵感', '一个平静的小瞬间'].map((item) => (
                  <span key={item} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground mt-3">
                这些看似微不足道的事，<br />
                会在记录中累积成一种真实而稳定的<br />
                <span className="text-amber-600 dark:text-amber-400 font-medium">"我在好好生活"</span>的证据。
              </p>
              <p className="text-foreground mt-3 font-medium">
                当你回头翻看，<br />
                你会发现：<br />
                你并不是一无所获，<br />
                <span className="text-amber-600 dark:text-amber-400">你只是以前没看见。</span>
              </p>
            </div>
          </Card>

          {/* ═══════ 模块5：觉察入口做的三件事 ═══════ */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">🌿 觉察入口在做的三件事</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent" />
          </div>

          <IntroSectionCard delay={0.25}>
            <div className="space-y-3">
              {[
                { num: '1', from: '无意识', to: '可觉察' },
                { num: '2', from: '情绪反应', to: '可调整' },
                { num: '3', from: '碎片时间', to: '成长复利' },
              ].map((item, i) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded-full text-sm font-bold">
                    {item.num}
                  </span>
                  <span className="text-sm">
                    把<span className="font-medium text-foreground">{item.from}</span>，变成<span className="font-medium text-green-600 dark:text-green-400">{item.to}</span>
                  </span>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              记录，不是回忆过去，<br />
              而是把命运从"随机漂流"，<br />
              <span className="text-foreground font-medium">拉回到你能掌舵的轨道上。</span>
            </p>
          </IntroSectionCard>

          {/* ═══════ 模块6：为什么能坚持 ═══════ */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">💛 为什么能坚持</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>

          <IntroSectionCard variant="highlight" delay={0.3}>
            <p className="text-sm text-foreground font-medium mb-3">
              因为觉察入口，会给你很快、且持续的正向反馈。
            </p>
            <p className="text-sm text-muted-foreground">
              很多人第一天记录，<br />
              焦虑就明显下降。
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              不是因为问题立刻消失了，<br />
              而是因为——<br />
              <span className="text-amber-600 dark:text-amber-400 font-medium">你终于不再被困在混乱里。</span>
            </p>
          </IntroSectionCard>

          {/* ═══════════════════════════════════════════ */}
          {/* ═══════ 模块7：为什么是6大入口 ═══════ */}
          <div className="py-4">
            <div className="h-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent rounded-full" />
          </div>

          <motion.div
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">📍</span>
              <h2 className="text-lg font-bold text-foreground">
                为什么是「6 大入口」
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              不是多，也不是少，而是刚好覆盖一个人全部的生命运行
            </p>
          </motion.div>

          <IntroSectionCard delay={0.4}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              我们每天的生活，看起来很复杂，<br />
              但从认知科学、心理学和行为科学的角度看，<br />
              人所有的状态，其实都反复发生在 <strong className="text-foreground">6 个维度</strong>里。
            </p>
            <p className="text-sm text-foreground font-medium mt-3">
              这 6 个入口，不是功能划分，<br />
              而是人类每天正在运行的 <span className="text-purple-600 dark:text-purple-400">6 个"生命系统"</span>。
            </p>
          </IntroSectionCard>

          {/* 7.1 问题映射表 */}
          <IntroSectionCard delay={0.42}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">你每天其实只在处理 6 类问题</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              不管你今天经历了什么，它最终一定会落回到下面某一类：
            </p>
          </IntroSectionCard>

          <ProblemMappingTable delay={0.45} />

          {/* 7.2 为什么不做更多入口 */}
          <IntroSectionCard delay={0.5}>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">为什么不做更多入口？</span>
            </div>
            <p className="text-sm text-muted-foreground">
              因为入口不是越多越好。
            </p>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-3">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">从神经科学角度：</p>
              <p className="text-sm text-muted-foreground">
                当选项<strong className="text-foreground">超过 7 个</strong><br />
                人的大脑就会进入<strong className="text-foreground">决策疲劳</strong><br />
                最终选择：<span className="text-red-500">什么都不做</span>
              </p>
            </div>
            <p className="text-sm text-foreground mt-3">
              👉 所以入口页的第一原则是：<br />
              <span className="text-amber-600 dark:text-amber-400 font-medium">"一眼就懂，一下就能点。"</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              6 个，是人类认知负担最小、又不遗漏核心的数量。
            </p>
          </IntroSectionCard>

          {/* 7.3 觉察闭环 */}
          <IntroSectionCard delay={0.52}>
            <p className="text-sm font-medium text-foreground mb-3">
              6 大入口 = 一个完整的「觉察闭环」
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              这 6 个入口不是并列的，它们本身构成了一个不断自我修正的循环系统：
            </p>
          </IntroSectionCard>

          <AwarenessLoopDiagram delay={0.55} />

          <IntroSectionCard delay={0.57}>
            <p className="text-sm text-muted-foreground">
              📌 如果少任何一个，人都会卡在某个阶段反复打转。
            </p>
          </IntroSectionCard>

          {/* 7.4 为什么每天都值得记录 */}
          <IntroSectionCard delay={0.6}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">为什么这 6 个「每天都值得记录」？</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              因为它们有一个共同点：<br />
              <strong className="text-foreground">它们每天都在发生，却最容易被忽略。</strong>
            </p>
            <div className="space-y-2">
              {dailyWorthRecording.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.03 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <span>{item.emoji}</span>
                  <span className="font-medium">{item.title}：</span>
                  <span className="text-muted-foreground">{item.reason}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-4 font-medium text-center">
              记录的意义，就是把"自动发生"，<br />
              变成"可觉察、可调整"。
            </p>
          </IntroSectionCard>

          {/* 7.5 干预层级表 */}
          <IntroSectionCard delay={0.7}>
            <p className="text-sm font-medium text-foreground mb-2">
              为什么这 6 个入口可以"改命"，而不是鸡汤？
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              因为它们分别对应了人类最核心的 6 个可干预点：
            </p>
          </IntroSectionCard>

          <InterventionLevelTable delay={0.72} />

          <IntroSectionCard delay={0.75}>
            <p className="text-sm text-foreground font-medium">
              👉 改变不是靠意志力，<br />
              而是靠持续在这 6 个点上做微调。
            </p>
          </IntroSectionCard>

          {/* 7.6 为什么不是其他维度 */}
          <IntroSectionCard delay={0.78}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">为什么不是别的名字或别的维度？</span>
            </div>
            <p className="text-sm text-muted-foreground">你可能会问：</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 pl-4">
              <li>为什么不单独做「财富」？</li>
              <li>为什么不单独做「学习」？</li>
              <li>为什么不单独做「健康」？</li>
            </ul>
            <p className="text-sm text-foreground mt-3 font-medium">
              因为它们不是"入口级变量"，而是<span className="text-amber-600 dark:text-amber-400">结果变量</span>。
            </p>
            <div className="p-3 bg-muted/50 rounded-lg mt-3 space-y-1">
              <p className="text-xs text-muted-foreground">财富 = 行动 × 选择 × 关系 × 方向</p>
              <p className="text-xs text-muted-foreground">学习 = 行动 × 方向</p>
              <p className="text-xs text-muted-foreground">健康 = 情绪 × 习惯 × 关系</p>
            </div>
            <p className="text-sm text-red-500 mt-3">
              👉 如果把结果当入口，人会很快焦虑、内疚、放弃。
            </p>
          </IntroSectionCard>

          {/* ═══════ 模块8：6入口分类展示 ═══════ */}
          <div className="flex items-center gap-2 pt-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">六大入口一览</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>

          {/* 困境入口 */}
          <motion.div
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-red-300 rounded-full" />
              <span className="text-sm font-semibold text-foreground">困境 → 破局关键点</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {challengeEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.82 + i * 0.05 }}
                  className={`p-3 rounded-xl bg-gradient-to-br ${entry.gradient} shadow-md text-center`}
                >
                  <span className="text-2xl">{entry.emoji}</span>
                  <p className="text-sm font-medium text-white mt-1">{entry.title}</p>
                  <p className="text-[10px] text-white/80 mt-0.5">{entry.categoryLabel}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 顺境入口 */}
          <motion.div
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-amber-300 rounded-full" />
              <span className="text-sm font-semibold text-foreground">顺境 → 滋养与锚定</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {blessingEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.87 + i * 0.05 }}
                  className={`p-3 rounded-xl bg-gradient-to-br ${entry.gradient} shadow-md text-center`}
                >
                  <span className="text-2xl">{entry.emoji}</span>
                  <p className="text-sm font-medium text-white mt-1">{entry.title}</p>
                  <p className="text-[10px] text-white/80 mt-0.5">{entry.categoryLabel}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 写法小贴士 */}
          <IntroSectionCard variant="highlight" delay={0.9}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">写法小贴士</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span className="text-muted-foreground">
                  写困境时，不叫「困难」，叫<span className="text-foreground font-medium">「破局关键点」</span>或<span className="text-foreground font-medium">「命运转折点」</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span className="text-muted-foreground">
                  写顺境时，记录微小美好：<span className="text-foreground font-medium">散步、电影、灵感、三餐</span>
                </span>
              </li>
            </ul>
          </IntroSectionCard>

          {/* ═══════ 四层支持系统 ═══════ */}
          <div className="flex items-center gap-2 pt-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
            <span className="text-sm font-medium text-teal-600 dark:text-teal-400">🌱 四层支持系统</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
          </div>

          <div className="space-y-2">
            {fourLayers.map((layer, i) => {
              const styles = colorStyles[layer.color];
              const isExpanded = expandedLayer === layer.id;

              return (
                <Collapsible
                  key={layer.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedLayer(isExpanded ? null : layer.id)}
                >
                  <div className={`bg-card rounded-xl border ${isExpanded ? 'ring-2 ring-amber-400/50' : ''} overflow-hidden`}>
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{layer.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 ${styles.bg} ${styles.text} rounded text-[10px] font-medium`}>
                              第{i + 1}层
                            </span>
                            <h3 className="font-semibold text-foreground text-sm">{layer.title}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">{layer.subtitle}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="px-4 pb-4 space-y-3"
                        >
                          {/* Layer 1 specific content */}
                          {layer.id === 'layer1' && (
                            <>
                              <p className="text-sm text-muted-foreground">{layer.description}</p>
                              {layer.features && (
                                <div className="space-y-1">
                                  {layer.features.map((f, j) => (
                                    <div key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span className="text-amber-400">•</span>
                                      {f}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          {/* Layer 2 specific content */}
                          {layer.id === 'layer2' && layer.things && (
                            <>
                              <p className="text-sm text-muted-foreground">AI 会帮你做 5 件事：</p>
                              <div className="flex flex-wrap gap-2">
                                {layer.things.map((thing, j) => (
                                  <div key={j} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                                    <thing.icon className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-xs text-blue-700 dark:text-blue-300">{thing.text}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Layer 3 specific content */}
                          {layer.id === 'layer3' && layer.triggers && (
                            <>
                              <p className="text-sm text-muted-foreground">触发条件：</p>
                              <div className="space-y-1.5">
                                {layer.triggers.map((t, j) => (
                                  <div key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                    {t}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Layer 4 specific content */}
                          {layer.id === 'layer4' && layer.options && (
                            <div className="grid grid-cols-2 gap-2">
                              {layer.options.map((opt, j) => (
                                <div key={j} className="p-3 bg-teal-50/50 dark:bg-teal-900/20 rounded-lg text-center space-y-1">
                                  <opt.icon className="w-5 h-5 text-teal-600 mx-auto" />
                                  <p className="text-xs font-medium">{opt.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Highlight */}
                          <div className={`p-2.5 ${styles.bg} rounded-lg border ${styles.border}`}>
                            <p className={`text-xs ${styles.text} font-medium`}>
                              📌 {layer.highlight}
                            </p>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>

          {/* ═══════ 模块9：开始觉察的召唤 ═══════ */}
          <div className="flex items-center gap-2 pt-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">🧭 开始觉察</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>

          <IntroSectionCard delay={0.95}>
            <p className="text-sm text-foreground text-center leading-relaxed">
              你不需要想清楚，<br />
              也不需要写得好。<br /><br />
              只要从现在开始，<br />
              写下一点真实的状态。
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center mt-4 font-medium">
              觉察入口会陪你，<br />
              把混乱，慢慢变成清晰；<br />
              把重复，慢慢变成转折。
            </p>
          </IntroSectionCard>

          {/* 一句话总结 */}
          <IntroSectionCard variant="highlight" delay={0.97}>
            <p className="text-sm font-medium text-foreground text-center leading-relaxed">
              人生看似复杂，<br />
              其实每天只在这 6 个地方卡住。<br />
              <span className="text-amber-600 dark:text-amber-400">觉察入口，就是把这 6 个地方一一照亮。</span>
            </p>
          </IntroSectionCard>

          {/* 灵魂金句 */}
          <IntroSectionCard variant="quote" delay={1}>
            <p className="text-sm text-center leading-relaxed italic">
              <span className="text-purple-600 dark:text-purple-400">6 大入口不是在管理你的人生，</span><br />
              <span className="text-purple-600 dark:text-purple-400">而是在你每天最真实的时刻，</span><br />
              <span className="text-purple-600 dark:text-purple-400 font-semibold">给你一个可以回到清醒的位置。</span>
            </p>
          </IntroSectionCard>

        </main>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto space-y-2">
            <Button
              onClick={() => navigate('/awakening')}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              开始觉察记录
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="w-full h-10 text-muted-foreground"
            >
              <Settings className="w-4 h-4 mr-2" />
              前往设置
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AwakeningSystemIntro;
