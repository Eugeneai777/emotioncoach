import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Target, CheckCircle, Shield, Eye, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ParentLiteIntroProps {
  onStart: () => void;
}

export function ParentLiteIntro({ onStart }: ParentLiteIntroProps) {
  const painPoints = [
    { emoji: "😤", text: "孩子一发脾气，我也忍不住跟着爆发" },
    { emoji: "😔", text: "明明为TA好，为什么TA总觉得我不理解？" },
    { emoji: "🥶", text: "吵完架就冷战，不知道怎么修复关系" },
    { emoji: "📱", text: "沉迷手机不学习，说了无数遍没用" },
    { emoji: "😩", text: "每天都很累，却不知道问题出在哪里" },
  ];

  const threeForces = [
    { icon: Shield, label: "情绪稳定力", desc: "面对孩子情绪时稳住自己", color: "text-emerald-600 bg-emerald-100" },
    { icon: Eye, label: "情绪洞察力", desc: "看懂行为背后的真实需求", color: "text-sky-600 bg-sky-100" },
    { icon: Heart, label: "关系修复力", desc: "冲突后主动修复、重建连接", color: "text-rose-600 bg-rose-100" },
  ];

  return (
    <div className="bg-gradient-to-b from-emerald-50/60 to-background px-4 py-6 pb-36">
      {/* 标题区域 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-full text-emerald-700 text-sm mb-4">
          <Sparkles className="w-4 h-4" />
          <span>宝妈专属 · 免费测评</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          亲子关系快速体检
        </h1>
        <p className="text-muted-foreground text-lg">
          5道题，找到你和孩子关系的突破口
        </p>
      </motion.div>

      {/* 痛点共鸣 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="mb-6 border-emerald-200/50 bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <h2 className="font-semibold text-foreground mb-3">
              你是否也有这样的困惑？
            </h2>
            <div className="space-y-2.5">
              {painPoints.map((p, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="text-base shrink-0">{p.emoji}</span>
                  <span>{p.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 三力模型简介 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="mb-6 border-teal-200/50 bg-gradient-to-r from-teal-50/80 to-emerald-50/80 backdrop-blur">
          <CardContent className="p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-500" />
              基于「父母三力模型」诊断
            </h2>
            <div className="space-y-3">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 你将获得 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="mb-8 border-emerald-200/50 bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <h2 className="font-semibold text-foreground mb-4">你将获得</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-muted-foreground">你的亲子关系类型诊断</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-muted-foreground">三力维度优劣势分析</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-muted-foreground">个性化改善建议与行动方案</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 测评信息 */}
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>约2分钟</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4" />
          <span>5道题</span>
        </div>
      </div>

      {/* 开始按钮 */}
      <Button
        onClick={onStart}
        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
      >
        免费开始测评
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
