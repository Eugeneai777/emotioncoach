import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ChevronDown, Sparkles, Settings, Share2,
  Eye, Heart, Lightbulb, RefreshCw, Target, MessageCircle, Users, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";

// 六大觉察入口（简化版）
const sixEntries = [
  { id: 'emotion', emoji: '🔥', title: '情绪', subtitle: '看见被忽略的信号', gradient: 'from-red-500 to-orange-400' },
  { id: 'gratitude', emoji: '💛', title: '感恩', subtitle: '重写神经回路', gradient: 'from-amber-500 to-yellow-400' },
  { id: 'action', emoji: '⚡', title: '行动', subtitle: '把想法变成可执行', gradient: 'from-blue-500 to-cyan-400' },
  { id: 'decision', emoji: '🧩', title: '选择', subtitle: '理清内心的声音', gradient: 'from-purple-500 to-pink-400' },
  { id: 'relation', emoji: '🤝', title: '关系', subtitle: '被理解的表达', gradient: 'from-pink-500 to-rose-400' },
  { id: 'direction', emoji: '🌟', title: '方向', subtitle: '点亮人生主线', gradient: 'from-teal-500 to-emerald-400' },
];

// 四层支持系统
const fourLayers = [
  {
    id: 'layer1',
    emoji: '📝',
    title: '轻记录入口',
    subtitle: '从一个很小的输入开始',
    color: 'amber',
    description: '每天只需要写下一点点你现在的状态。不需要想清楚，真实就好。',
    highlight: '你可以只点一下，也可以只写半句话。'
  },
  {
    id: 'layer2',
    emoji: '🪞',
    title: '智能看见',
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

const AwakeningSystemIntro: React.FC = () => {
  const navigate = useNavigate();
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  return (
    <>
      <DynamicOGMeta pageKey="awakeningIntro" />

      <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">有劲觉察系统</h1>
            <IntroShareDialog config={introShareConfigs.awakening} />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0.01, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                每天1次轻记录
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              我帮你看见盲点与模式 → 给你一个最小行动
            </p>
          </motion.div>

          {/* 六大入口 - 水平滚动卡片 */}
          <motion.section
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">📍</span>
                六大觉察入口
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground"
                onClick={() => navigate('/awakening-intro')}
              >
                详情 →
              </Button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {sixEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={`flex-shrink-0 w-24 p-3 rounded-xl bg-gradient-to-br ${entry.gradient} shadow-md`}
                >
                  <div className="text-center space-y-1">
                    <span className="text-2xl">{entry.emoji}</span>
                    <p className="font-medium text-white text-sm">{entry.title}</p>
                    <p className="text-[10px] text-white/80 leading-tight">{entry.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* 四层支持 - 可折叠卡片 */}
          <motion.section
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">🌱</span>
                四层支持系统
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground"
                onClick={() => navigate('/transformation-flow')}
              >
                详情 →
              </Button>
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
                                <div className="grid grid-cols-3 gap-2">
                                  {sixEntries.slice(0, 6).map((e) => (
                                    <div key={e.id} className="flex flex-col items-center gap-1 p-2 bg-secondary/50 rounded-lg">
                                      <span className="text-lg">{e.emoji}</span>
                                      <span className="text-xs font-medium">{e.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {/* Layer 2 specific content */}
                            {layer.id === 'layer2' && layer.things && (
                              <div className="flex flex-wrap gap-2">
                                {layer.things.map((thing, j) => (
                                  <div key={j} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                                    <thing.icon className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-xs text-blue-700 dark:text-blue-300">{thing.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Layer 3 specific content */}
                            {layer.id === 'layer3' && layer.triggers && (
                              <div className="space-y-1.5">
                                {layer.triggers.map((t, j) => (
                                  <div key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                    {t}
                                  </div>
                                ))}
                              </div>
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
          </motion.section>

          {/* 一句话总结 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 text-center border border-amber-200/50"
          >
            <p className="text-sm text-foreground">
              你随时可以从一个很小的记录开始，<br />
              有劲AI 会陪你走到你真正想去的地方。
            </p>
          </motion.div>
        </main>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto space-y-2">
            <Button
              onClick={() => navigate('/awakening')}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              开始觉察
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
