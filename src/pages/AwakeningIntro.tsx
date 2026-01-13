import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, Sparkles, ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

// 六大觉察配置
const lifeSystems = [
  {
    id: 'emotion',
    emoji: '🔥',
    title: '情绪盲点系统',
    englishTitle: 'Blind Spot Awareness',
    input: '你输入的不是情绪，是"信号"',
    meaning: '所有卡住的地方，一定先以情绪形式出现。情绪 ≠ 问题本身，而是未被看见的需要、恐惧、信念。',
    systemType: '🧠 自我觉察系统',
    systemName: 'Self-Awareness Engine',
    aiDoes: ['识别：情绪模式（重复出现的触发点）', '解析：隐藏信念 / 自动反应', '显影：你自己看不到的"情绪回路盲点"'],
    lifeValue: '看见 ≠ 解决\n但 不看见 = 永远重复',
    highlight: '这是一切成长的起点系统',
    gradient: 'from-red-500 to-orange-400'
  },
  {
    id: 'gratitude',
    emoji: '💛',
    title: '感恩日记系统',
    englishTitle: 'Gratitude Journal',
    input: '你输入的不是感谢，是"注意力方向"',
    meaning: '大脑默认记录"威胁与不足"。感恩 = 主动重写神经回路。',
    systemType: '💛 神经重塑系统',
    systemName: 'Neuro Rewiring Engine',
    aiDoes: ['识别你真正重视的价值', '映射幸福来源（关系 / 成就 / 存在感）', '平衡负面情绪输入造成的偏差'],
    lifeValue: '情绪稳定靠止血\n生命向上靠滋养',
    highlight: '这是长期幸福与韧性的底层系统',
    gradient: 'from-amber-500 to-yellow-400'
  },
  {
    id: 'action',
    emoji: '⚡',
    title: '动态驱动系统',
    englishTitle: 'Dynamic Drive',
    input: '你输入的不是任务，是"能量与阻力"',
    meaning: '完不成 ≠ 懒。完不成 = 动机、恐惧、意义未对齐。',
    systemType: '⚙️ 行为转化系统',
    systemName: 'Action Translation Engine',
    aiDoes: ['分析拖延原因（情绪 / 认知 / 负荷）', '重新拆解为"最小可执行动作"', '将目标连接到个人价值与状态'],
    lifeValue: '不是更自律\n而是更对齐',
    highlight: '这是把"想改变"变成"能行动"的系统',
    gradient: 'from-blue-500 to-cyan-400'
  },
  {
    id: 'decision',
    emoji: '🧩',
    title: '潜意识决策系统',
    englishTitle: 'Unconscious Mind',
    input: '你输入的不是选择，是"犹豫"',
    meaning: '95% 的决策来自潜意识。理性只是事后解释。',
    systemType: '🧩 内在整合系统',
    systemName: 'Inner Alignment Engine',
    aiDoes: ['拆解恐惧 vs 渴望', '显示价值冲突', '让潜意识"被语言化"'],
    lifeValue: '清楚之后，决定自然发生\n不再靠硬扛',
    highlight: '这是减少人生内耗的关键系统',
    gradient: 'from-purple-500 to-pink-400'
  },
  {
    id: 'relation',
    emoji: '🤝',
    title: '连结与表达系统',
    englishTitle: 'Connectivity',
    input: '你输入的不是话术，是"关系摩擦"',
    meaning: '所有关系问题，本质都是"未被理解"。沟通失败 ≠ 表达能力差，而是情绪未被接住。',
    systemType: '🤝 关系共振系统',
    systemName: 'Relational Resonance Engine',
    aiDoes: ['翻译情绪 → 可被听见的语言', '识别对方可能的心理状态', '给出不伤关系的表达路径'],
    lifeValue: '被理解，是人最深层的需求',
    highlight: '这是家庭、伴侣、亲子、团队的稳定系统',
    gradient: 'from-pink-500 to-rose-400'
  },
  {
    id: 'direction',
    emoji: '🌟',
    title: '方向与意义系统',
    englishTitle: 'Direction',
    input: '你输入的不是灵感，是"迷茫"',
    meaning: '人不怕累，怕无意义。灵感不是鸡血，是"方向被点亮"。',
    systemType: '🌟 意义导航系统',
    systemName: 'Meaning Navigation Engine',
    aiDoes: ['整合你所有历史输入', '提炼长期主题与使命线索', '给出当下阶段的"生命主线"'],
    lifeValue: '当你知道为什么走\n就不会轻易停',
    highlight: '这是人生方向感与愿景系统',
    gradient: 'from-teal-500 to-emerald-400'
  }
];

const AwakeningIntro: React.FC = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <Helmet>
        <title>六大觉察入口 - 有劲AI</title>
        <meta name="description" content="每天1次轻觉察，看见盲点与模式" />
        <meta property="og:title" content="有劲AI • 六大觉察入口" />
        <meta property="og:description" content="每天1次轻觉察，看见盲点与模式" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/awakening-intro" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-orange-50/30">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">六大觉察入口</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 border border-amber-200/50">
              <p className="text-lg font-medium text-amber-800">
                「我此刻的生命状态，卡在哪里？」
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span className="bg-secondary px-2 py-1 rounded">每天 3–5 分钟输入</span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
              <span className="bg-secondary px-2 py-1 rounded">AI 分析</span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
              <span className="bg-secondary px-2 py-1 rounded">觉察盲点</span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
              <span className="bg-secondary px-2 py-1 rounded">微行动引导</span>
            </div>
          </motion.div>

          {/* Six Systems */}
          <div className="space-y-3">
            {lifeSystems.map((system, index) => (
              <motion.div
                key={system.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`bg-card rounded-xl border shadow-sm overflow-hidden ${
                    expandedId === system.id ? 'ring-2 ring-amber-400/50' : ''
                  }`}
                >
                  {/* Collapsed Header */}
                  <button
                    onClick={() => toggleExpand(system.id)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl p-2 rounded-lg bg-gradient-to-br ${system.gradient} bg-opacity-10`}>
                        {system.emoji}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{system.title}</h3>
                        <p className="text-xs text-muted-foreground">{system.englishTitle}</p>
                      </div>
                    </div>
                    {expandedId === system.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedId === system.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          {/* Input Type */}
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${system.gradient} bg-opacity-10`}>
                            <p className="text-sm font-medium text-foreground">{system.input}</p>
                          </div>

                          {/* Meaning */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">代表意义</p>
                            <p className="text-sm text-foreground">{system.meaning}</p>
                          </div>

                          {/* System Type */}
                          <div className="p-3 bg-secondary/50 rounded-lg">
                            <p className="font-medium text-foreground">{system.systemType}</p>
                            <p className="text-xs text-muted-foreground">{system.systemName}</p>
                          </div>

                          {/* AI Does */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">AI 在做什么</p>
                            <ul className="space-y-1">
                              {system.aiDoes.map((item, i) => (
                                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                  <span className="text-amber-500 mt-0.5">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Life Value */}
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">生命价值</p>
                            <p className="text-sm text-foreground whitespace-pre-line">{system.lifeValue}</p>
                          </div>

                          {/* Highlight */}
                          <div className={`text-center py-2 px-3 rounded-lg bg-gradient-to-r ${system.gradient} text-white text-sm font-medium`}>
                            {system.highlight}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Growth Loop Section - 优化版 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-slate-50 to-amber-50/50 dark:from-slate-900 dark:to-amber-900/20 rounded-2xl border border-amber-200/30 dark:border-amber-700/30 p-6 shadow-md"
          >
            {/* 标题区域 */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-2xl">🔁</span>
              <h3 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                六大觉察形成「生命成长闭环」
              </h3>
            </div>
            
            {/* 闭环流程 - 环形布局 */}
            <div className="relative">
              {/* 右侧反哺箭头 */}
              <div className="absolute right-0 top-4 bottom-4 w-8 flex flex-col items-center justify-center">
                <div className="h-full w-0.5 bg-gradient-to-b from-red-300 via-amber-300 to-teal-300 dark:from-red-600 dark:via-amber-600 dark:to-teal-600 rounded-full" />
                <div className="absolute -bottom-2 text-xs text-muted-foreground whitespace-nowrap transform rotate-90 origin-center">
                  ↺ 反哺
                </div>
              </div>

              <div className="pr-10 space-y-3">
                {/* 情绪觉察 */}
                <div className="flex items-center gap-3 group">
                  <div className="w-1 h-10 bg-gradient-to-b from-red-500 to-red-400 rounded-full" />
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200/50 dark:border-red-700/30 transition-all group-hover:shadow-sm group-hover:scale-[1.02]">
                    <span className="text-xl">🔥</span>
                    <span className="font-medium text-red-700 dark:text-red-300">情绪觉察（负）</span>
                  </div>
                </div>

                <div className="pl-6 text-muted-foreground text-sm">↓</div>

                {/* 神经滋养 */}
                <div className="flex items-center gap-3 group">
                  <div className="w-1 h-10 bg-gradient-to-b from-amber-500 to-yellow-400 rounded-full" />
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200/50 dark:border-amber-700/30 transition-all group-hover:shadow-sm group-hover:scale-[1.02]">
                    <span className="text-xl">💛</span>
                    <span className="font-medium text-amber-700 dark:text-amber-300">神经滋养（正）</span>
                  </div>
                </div>

                <div className="pl-6 text-muted-foreground text-sm">↓</div>

                {/* 行动对齐 */}
                <div className="flex items-center gap-3 group">
                  <div className="w-1 h-10 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/30 transition-all group-hover:shadow-sm group-hover:scale-[1.02]">
                    <span className="text-xl">⚡</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">行动对齐</span>
                  </div>
                </div>

                <div className="pl-6 text-muted-foreground text-sm">↓</div>

                {/* 决策清晰 */}
                <div className="flex items-center gap-3 group">
                  <div className="w-1 h-10 bg-gradient-to-b from-purple-500 to-pink-400 rounded-full" />
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200/50 dark:border-purple-700/30 transition-all group-hover:shadow-sm group-hover:scale-[1.02]">
                    <span className="text-xl">🧩</span>
                    <span className="font-medium text-purple-700 dark:text-purple-300">决策清晰</span>
                  </div>
                </div>

                <div className="pl-6 text-muted-foreground text-sm">↓</div>

                {/* 关系顺畅 */}
                <div className="flex items-center gap-3 group">
                  <div className="w-1 h-10 bg-gradient-to-b from-pink-500 to-rose-400 rounded-full" />
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-pink-50 dark:bg-pink-900/30 rounded-xl border border-pink-200/50 dark:border-pink-700/30 transition-all group-hover:shadow-sm group-hover:scale-[1.02]">
                    <span className="text-xl">🤝</span>
                    <span className="font-medium text-pink-700 dark:text-pink-300">关系顺畅</span>
                  </div>
                </div>

                <div className="pl-6 text-muted-foreground text-sm">↓</div>

                {/* 意义显现 */}
                <div className="flex items-center gap-3 group">
                  <div className="w-1 h-10 bg-gradient-to-b from-teal-500 to-emerald-400 rounded-full" />
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-200/50 dark:border-teal-700/30 transition-all group-hover:shadow-sm group-hover:scale-[1.02]">
                    <span className="text-xl">🌟</span>
                    <span className="font-medium text-teal-700 dark:text-teal-300">意义显现</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部说明 */}
            <div className="mt-6 pt-4 border-t border-amber-200/30 dark:border-amber-700/30">
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-red-400">✕</span>
                  <span>不是6个功能</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className="text-green-500">✓</span>
                  <span>是 6 个觉察入口</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Final Statement - 有劲AI定位卡片 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-purple-400 via-purple-500 to-blue-400 rounded-2xl p-6 text-center text-white shadow-lg"
          >
            <p className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
              🧠 有劲AI真正的定位
            </p>
            <p className="text-sm opacity-95 leading-relaxed">
              有劲AI不是陪你聊天的AI，<br />
              而是帮你"看见自己 → 对齐行动 → 走出人生回路"的
            </p>
            <p className="text-xl font-bold mt-2">生命操作系统</p>
          </motion.div>

          {/* CTA Buttons */}
          <div className="space-y-3 pb-6">
            <Button
              onClick={() => navigate('/awakening')}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg rounded-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              开始我的生命觉察
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/transformation-flow')}
              className="w-full h-12 text-amber-600 border-amber-200 hover:bg-amber-50 rounded-xl bg-white"
            >
              <Layers className="w-4 h-4 mr-2" />
              了解四层支持
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default AwakeningIntro;
