import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, Sparkles, Layers, Zap, Heart, Target, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

// 六大觉醒配置
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
    gradient: 'from-red-500 to-orange-400',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200'
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
    gradient: 'from-amber-500 to-yellow-400',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200'
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
    gradient: 'from-blue-500 to-cyan-400',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200'
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
    gradient: 'from-purple-500 to-pink-400',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200'
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
    gradient: 'from-pink-500 to-rose-400',
    bgLight: 'bg-pink-50',
    borderColor: 'border-pink-200'
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
    gradient: 'from-teal-500 to-emerald-400',
    bgLight: 'bg-teal-50',
    borderColor: 'border-teal-200'
  }
];

// 成长闭环节点
const growthLoopNodes = [
  { label: '情绪觉察', emoji: '🔥', color: 'from-red-400 to-red-500' },
  { label: '神经滋养', emoji: '💛', color: 'from-amber-400 to-amber-500' },
  { label: '行动对齐', emoji: '⚡', color: 'from-blue-400 to-blue-500' },
  { label: '决策清晰', emoji: '🧩', color: 'from-purple-400 to-purple-500' },
  { label: '关系顺畅', emoji: '🤝', color: 'from-pink-400 to-pink-500' },
  { label: '意义显现', emoji: '🌟', color: 'from-teal-400 to-teal-500' }
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
        <title>六大觉醒 - 有劲AI</title>
        <meta name="description" content="有劲AI不是陪你聊天的AI，而是帮你看见自己、对齐行动、走出人生回路的生命操作系统" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-orange-50/30 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-20 -right-20 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-20 w-48 h-48 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl" />
        
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              生命觉醒入口
            </h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-lg mx-auto px-4 py-6 pb-36 space-y-8 relative z-[1]">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-5"
          >
            {/* Title with decorative elements */}
            <div className="relative inline-block">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-2 -left-6"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 bg-clip-text text-transparent">
                有劲AI · 六大觉醒入口
              </h2>
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -top-2 -right-6"
              >
                <Sparkles className="w-5 h-5 text-orange-400" />
              </motion.div>
            </div>
            
            {/* Core Question Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 rounded-2xl p-5 border border-amber-200/60 shadow-lg shadow-amber-100/50"
            >
              <p className="text-xl font-semibold text-amber-800">
                「我此刻的生命状态，卡在哪里？」
              </p>
            </motion.div>

            {/* Flow Process - Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: Brain, label: '输入', desc: '3-5分钟' },
                { icon: Zap, label: 'AI分析', desc: '深度解读' },
                { icon: Target, label: '觉察', desc: '看见盲点' },
                { icon: Heart, label: '引导', desc: '微行动' }
              ].map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex flex-col items-center gap-1.5 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-amber-100 shadow-sm"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${
                    i === 0 ? 'from-amber-400 to-orange-400' :
                    i === 1 ? 'from-blue-400 to-cyan-400' :
                    i === 2 ? 'from-purple-400 to-pink-400' :
                    'from-green-400 to-emerald-400'
                  }`}>
                    <step.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                  <span className="text-xs text-muted-foreground">{step.desc}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Section Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <span className="text-sm font-medium text-amber-600">六大觉醒系统</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>

          {/* Six Systems */}
          <div className="space-y-3">
            {lifeSystems.map((system, index) => (
              <motion.div
                key={system.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <div
                  className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${
                    expandedId === system.id ? `ring-2 ring-offset-2 ${system.borderColor} ring-opacity-50` : ''
                  }`}
                >
                  {/* Collapsed Header */}
                  <button
                    onClick={() => toggleExpand(system.id)}
                    className="w-full p-4 flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`text-2xl p-3 rounded-xl bg-gradient-to-br ${system.gradient} shadow-md`}
                      >
                        <span className="drop-shadow-sm">{system.emoji}</span>
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-amber-600 transition-colors">
                          {system.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">{system.englishTitle}</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedId === system.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedId === system.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-5 space-y-4">
                          {/* Divider */}
                          <div className={`h-px bg-gradient-to-r ${system.gradient} opacity-30`} />
                          
                          {/* Input Type */}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`p-4 rounded-xl ${system.bgLight} dark:bg-opacity-20 border ${system.borderColor} dark:border-opacity-30`}
                          >
                            <p className="text-sm font-semibold text-foreground">{system.input}</p>
                          </motion.div>

                          {/* Meaning */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                          >
                            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              代表意义
                            </p>
                            <p className="text-sm text-foreground leading-relaxed">{system.meaning}</p>
                          </motion.div>

                          {/* System Type */}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-4 bg-secondary/60 rounded-xl border border-border/50"
                          >
                            <p className="font-semibold text-foreground">{system.systemType}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{system.systemName}</p>
                          </motion.div>

                          {/* AI Does */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                          >
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              AI 在做什么
                            </p>
                            <ul className="space-y-2">
                              {system.aiDoes.map((item, i) => (
                                <motion.li 
                                  key={i} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 + i * 0.05 }}
                                  className="text-sm text-foreground flex items-start gap-2 bg-white/50 dark:bg-white/5 p-2 rounded-lg"
                                >
                                  <span className={`text-transparent bg-gradient-to-r ${system.gradient} bg-clip-text font-bold`}>
                                    {i + 1}.
                                  </span>
                                  {item}
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>

                          {/* Life Value */}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/30"
                          >
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              生命价值
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{system.lifeValue}</p>
                          </motion.div>

                          {/* Highlight */}
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className={`text-center py-3 px-4 rounded-xl bg-gradient-to-r ${system.gradient} text-white text-sm font-semibold shadow-lg`}
                          >
                            ✨ {system.highlight}
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Section Divider */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
            <span className="text-sm font-medium text-purple-600">成长闭环</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
          </div>

          {/* Growth Loop Section - Circular Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-2xl border shadow-md p-6 space-y-5"
          >
            <h3 className="text-center font-bold text-lg text-foreground">
              🔁 六大觉醒形成「生命成长闭环」
            </h3>
            
            {/* Circular Loop Visualization */}
            <div className="relative w-72 h-72 mx-auto">
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-300/50 flex items-center justify-center shadow-inner">
                <span className="text-2xl">🌱</span>
              </div>
              
              {/* Connecting circle */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 288">
                <circle 
                  cx="144" 
                  cy="144" 
                  r="110" 
                  fill="none" 
                  stroke="url(#loopGradient)" 
                  strokeWidth="2" 
                  strokeDasharray="8 4"
                  opacity="0.4"
                />
                <defs>
                  <linearGradient id="loopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Nodes positioned in a circle */}
              {growthLoopNodes.map((node, index) => {
                const angle = (index * 60 - 90) * (Math.PI / 180);
                const radius = 110;
                const x = 144 + radius * Math.cos(angle);
                const y = 144 + radius * Math.sin(angle);
                
                return (
                  <motion.div
                    key={node.label}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="absolute"
                    style={{
                      left: x,
                      top: y,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className={`flex flex-col items-center gap-1 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-md border`}>
                      <div className={`text-lg p-1.5 rounded-lg bg-gradient-to-br ${node.color}`}>
                        <span className="drop-shadow-sm">{node.emoji}</span>
                      </div>
                      <span className="text-xs font-medium text-foreground whitespace-nowrap">{node.label}</span>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Arrows between nodes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 288 288">
                {growthLoopNodes.map((_, index) => {
                  const startAngle = (index * 60 - 90 + 15) * (Math.PI / 180);
                  const endAngle = ((index + 1) * 60 - 90 - 15) * (Math.PI / 180);
                  const radius = 110;
                  
                  const startX = 144 + radius * Math.cos(startAngle);
                  const startY = 144 + radius * Math.sin(startAngle);
                  const endX = 144 + radius * Math.cos(endAngle);
                  const endY = 144 + radius * Math.sin(endAngle);
                  
                  const midAngle = ((index * 60 - 90 + 15) + ((index + 1) * 60 - 90 - 15)) / 2 * (Math.PI / 180);
                  const controlRadius = radius + 20;
                  const controlX = 144 + controlRadius * Math.cos(midAngle);
                  const controlY = 144 + controlRadius * Math.sin(midAngle);
                  
                  return (
                    <motion.path
                      key={index}
                      d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
                      fill="none"
                      stroke="#d1d5db"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="text-center space-y-2 pt-2">
              <p className="text-sm text-muted-foreground">📌 不是6个功能</p>
              <p className="text-base font-semibold text-foreground bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                📌 是 6 个觉醒入口，形成生命成长的无限循环
              </p>
            </div>
          </motion.div>

          {/* Final Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 rounded-2xl p-6 text-center text-white shadow-xl"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl mb-3"
              >
                🧠
              </motion.div>
              <p className="text-xl font-bold mb-3">有劲AI真正的定位</p>
              <p className="text-sm opacity-95 leading-relaxed">
                有劲AI不是陪你聊天的AI，<br />
                而是帮你<span className="font-bold text-amber-200">"看见自己 → 对齐行动 → 走出人生回路"</span>的<br />
                <span className="text-xl font-bold mt-2 block bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
                  生命操作系统
                </span>
              </p>
            </div>
          </motion.div>
        </main>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm">
          <div className="max-w-lg mx-auto space-y-2">
            <Button
              onClick={() => navigate('/awakening')}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white shadow-xl shadow-orange-500/25 rounded-2xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              开始我的生命觉醒
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/transformation-flow')}
              className="w-full h-12 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl"
            >
              <Layers className="w-4 h-4 mr-2" />
              了解四层支持
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AwakeningIntro;
