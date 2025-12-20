import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Zap, Eye, Target, Heart, Lightbulb, Check, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

// 处理层步骤
const processSteps = [
  { step: 1, name: '情绪识别', desc: '识别你的情绪状态与触发点', icon: Eye },
  { step: 2, name: '模式分析', desc: '发现重复出现的思维/行为模式', icon: RefreshCw },
  { step: 3, name: '盲点显影', desc: '显示你自己看不到的认知回路', icon: Lightbulb },
  { step: 4, name: '价值映射', desc: '连接到你真正重视的人生价值', icon: Heart },
  { step: 5, name: '行动转化', desc: '生成最小可执行的微行动', icon: Target },
];

// 输出层类型
const outputs = [
  { type: '即时反馈', desc: '每次对话后的洞察', value: '当下的清晰', icon: Zap, color: 'from-amber-500 to-orange-400' },
  { type: '日报周报', desc: '情绪趋势与模式分析', value: '短期的觉察', icon: Clock, color: 'from-blue-500 to-cyan-400' },
  { type: '成长档案', desc: '长期数据积累', value: '人生的脉络', icon: TrendingUp, color: 'from-purple-500 to-pink-400' },
  { type: '生命主线', desc: '提炼使命与方向', value: '意义的显现', icon: Sparkles, color: 'from-teal-500 to-emerald-400' },
];

// 用户旅程时间轴
const journeyStages = [
  { period: 'Day 1-7', title: '建立习惯', desc: '开始记录 → 建立习惯', color: 'bg-amber-500' },
  { period: 'Day 8-21', title: '觉察盲点', desc: '看见模式 → 觉察盲点', color: 'bg-orange-500' },
  { period: 'Day 22-60', title: '行为改变', desc: '微行动累积 → 行为改变', color: 'bg-rose-500' },
  { period: 'Day 61+', title: '生命升级', desc: '生命升级 → 活出自己', color: 'bg-purple-500' },
];

// 对比数据
const comparisons = [
  { dimension: '情绪处理', traditional: '压抑或发泄', youjin: '看见并转化' },
  { dimension: '自我认知', traditional: '靠感觉', youjin: '数据支持' },
  { dimension: '改变方式', traditional: '靠意志力', youjin: '靠对齐' },
  { dimension: '成长路径', traditional: '无方向', youjin: '有系统' },
];

// 六大入口简化展示
const sixEntries = [
  { emoji: '🔥', name: '情绪', color: 'from-red-500 to-orange-400' },
  { emoji: '💛', name: '感恩', color: 'from-amber-500 to-yellow-400' },
  { emoji: '⚡', name: '行动', color: 'from-blue-500 to-cyan-400' },
  { emoji: '🧩', name: '选择', color: 'from-purple-500 to-pink-400' },
  { emoji: '🤝', name: '关系', color: 'from-pink-500 to-rose-400' },
  { emoji: '🌟', name: '方向', color: 'from-teal-500 to-emerald-400' },
];

const TransformationFlow: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>生命转化系统 - 有劲AI</title>
        <meta name="description" content="从看见自己到活出自己，有劲AI帮你完成生命转化" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-orange-50/30">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">生命转化系统</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-lg mx-auto px-4 py-6 pb-40 space-y-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                有劲AI · 生命转化系统
              </h2>
            </div>
            
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 border border-amber-200/50">
              <p className="text-lg font-medium text-amber-800">
                「从看见自己，到活出自己」
              </p>
            </div>

            {/* 转化公式 */}
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground flex-wrap">
              <span className="bg-secondary px-2 py-1 rounded">每日轻输入</span>
              <ArrowRight className="w-3 h-3 text-amber-500" />
              <span className="bg-secondary px-2 py-1 rounded">AI深度分析</span>
              <ArrowRight className="w-3 h-3 text-amber-500" />
              <span className="bg-secondary px-2 py-1 rounded">盲点显现</span>
              <ArrowRight className="w-3 h-3 text-amber-500" />
              <span className="bg-secondary px-2 py-1 rounded">微行动引导</span>
              <ArrowRight className="w-3 h-3 text-amber-500" />
              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium">生命升级</span>
            </div>
          </motion.div>

          {/* 三层结构 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-center">转化的三层结构</h3>

            {/* 第一层：输入层 */}
            <div className="bg-card rounded-xl border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">第一层</span>
                <h4 className="font-semibold text-foreground">输入层 · Input</h4>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {sixEntries.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${entry.color} flex items-center justify-center text-lg`}>
                      {entry.emoji}
                    </div>
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                  </motion.div>
                ))}
              </div>
              
              <p className="text-sm text-center text-muted-foreground">
                每天3-5分钟，轻量记录<br />
                <span className="text-foreground font-medium">「你输入的不是文字，是生命信号」</span>
              </p>
            </div>

            {/* 第二层：处理层 */}
            <div className="bg-card rounded-xl border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">第二层</span>
                <h4 className="font-semibold text-foreground">处理层 · Process</h4>
              </div>
              
              <div className="space-y-2">
                {processSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                    <step.icon className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 第三层：输出层 */}
            <div className="bg-card rounded-xl border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">第三层</span>
                <h4 className="font-semibold text-foreground">输出层 · Output</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {outputs.map((output, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="p-3 bg-secondary/50 rounded-lg space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded bg-gradient-to-br ${output.color} flex items-center justify-center`}>
                        <output.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{output.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{output.desc}</p>
                    <p className="text-xs text-amber-600 font-medium">{output.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 用户旅程时间轴 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-card rounded-xl border p-4 space-y-4"
          >
            <h3 className="text-center font-semibold text-foreground">📅 你的转化旅程</h3>
            
            <div className="relative">
              {/* 时间轴线 */}
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-amber-500 via-orange-500 to-purple-500" />
              
              <div className="space-y-4">
                {journeyStages.map((stage, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="flex items-center gap-4 pl-2"
                  >
                    <div className={`w-5 h-5 rounded-full ${stage.color} ring-4 ring-background flex items-center justify-center z-10`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{stage.period}</span>
                        <span className="text-sm font-medium text-foreground">{stage.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{stage.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 对比区域 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="bg-card rounded-xl border p-4 space-y-4"
          >
            <h3 className="text-center font-semibold text-foreground">⚡ 传统方式 vs 有劲AI</h3>
            
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
                <span className="text-center">维度</span>
                <span className="text-center">传统方式</span>
                <span className="text-center text-amber-600">有劲AI</span>
              </div>
              
              {comparisons.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 + i * 0.05 }}
                  className="grid grid-cols-3 gap-2 text-sm"
                >
                  <span className="text-center text-foreground font-medium">{item.dimension}</span>
                  <span className="text-center text-muted-foreground bg-secondary/50 rounded py-1">{item.traditional}</span>
                  <span className="text-center text-amber-700 bg-amber-100 rounded py-1 font-medium">{item.youjin}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 底部定位语 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-center text-white"
          >
            <p className="text-lg font-semibold mb-2">✨ 有劲AI的承诺</p>
            <p className="text-sm opacity-95">
              有劲AI不是让你变成另一个人，<br />
              而是帮你<span className="font-bold">成为真正的自己</span>
            </p>
          </motion.div>
        </main>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-lg mx-auto space-y-2">
            <Button
              onClick={() => navigate('/awakening')}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              开始我的生命转化
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/awakening-intro')}
              className="w-full h-12 text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              了解六大生命入口
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransformationFlow;
