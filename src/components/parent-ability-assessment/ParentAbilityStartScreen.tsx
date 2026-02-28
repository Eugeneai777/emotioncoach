import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Shield, Eye, Heart, Sparkles } from "lucide-react";

interface ParentAbilityStartScreenProps {
  onStart: () => void;
  onBack?: () => void;
  onHistory?: () => void;
}

export function ParentAbilityStartScreen({ onStart, onBack }: ParentAbilityStartScreenProps) {
  const painPoints = [
    { text: '孩子一发脾气，我也忍不住跟着爆发', emoji: '😤' },
    { text: '明明为TA好，为什么TA就是觉得我不理解？', emoji: '😔' },
    { text: '吵完架就冷战，不知道怎么开口修复', emoji: '🥶' },
  ];

  const threeForces = [
    { icon: Shield, label: '情绪稳定力', desc: '面对孩子情绪时，能否稳住自己', color: 'text-emerald-600 bg-emerald-100' },
    { icon: Eye, label: '情绪洞察力', desc: '能否看懂行为背后的真实需求', color: 'text-sky-600 bg-sky-100' },
    { icon: Heart, label: '关系修复力', desc: '冲突后能否主动修复、重建连接', color: 'text-violet-600 bg-violet-100' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 p-4 flex flex-col items-center justify-center relative">
      {onBack && (
        <motion.div
          initial={{ opacity: 0.01 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4"
          style={{ transform: 'translateZ(0)' }}
        >
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />返回
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-4"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* 标题 */}
        <motion.div initial={{ opacity: 0.01 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-center mb-2">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-xl font-bold text-emerald-800 mb-1">家长应对能力测评</h1>
          <p className="text-sm text-muted-foreground">基于"父母三力模型"，发现你的优势和提升方向</p>
        </motion.div>

        {/* 痛点共鸣 */}
        <motion.div initial={{ opacity: 0.01, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ transform: 'translateZ(0)' }}>
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 space-y-2">
              <span className="font-medium text-emerald-800 text-sm">你是否也有这样的困惑？</span>
              {painPoints.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.01, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <span>{p.emoji}</span>
                  <span>{p.text}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* 三力模型 */}
        <motion.div initial={{ opacity: 0.01, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ transform: 'translateZ(0)' }}>
          <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-teal-500" />
                <span className="font-medium text-teal-700 text-sm">三力诊断模型</span>
              </div>
              {threeForces.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${f.color}`}>
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{f.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{f.desc}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* 测评信息 */}
        <motion.div initial={{ opacity: 0.01 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={{ transform: 'translateZ(0)' }}>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>📋 24道专业量表</span>
            <span>⏱ 约5分钟</span>
            <span>🤖 AI深度解读</span>
          </div>
        </motion.div>

        {/* 开始按钮 */}
        <motion.div initial={{ opacity: 0.01, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-2" style={{ transform: 'translateZ(0)' }}>
          <Button
            onClick={onStart}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl shadow-lg text-base"
          >
            开始测评我的三力水平
          </Button>
        </motion.div>

        {/* 隐私 */}
        <motion.div initial={{ opacity: 0.01 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center" style={{ transform: 'translateZ(0)' }}>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />回答完全保密，仅用于生成专属分析报告
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
