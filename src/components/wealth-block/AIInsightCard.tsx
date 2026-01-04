import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Search, Lightbulb, Target, AlertCircle, Footprints, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIInsightData {
  rootCauseAnalysis: string;
  combinedPatternInsight: string;
  breakthroughPath: string[];
  avoidPitfalls: string[];
  firstStep: string;
  encouragement: string;
}

interface AIInsightCardProps {
  insight: AIInsightData | null;
  isLoading: boolean;
  error: string | null;
}

export function AIInsightCard({ insight, isLoading, error }: AIInsightCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
              <p className="text-violet-600 font-medium">AI正在深度分析你的财富卡点...</p>
              <p className="text-muted-foreground text-sm mt-1">为你生成个性化洞察</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1">您仍可查看基础分析结果</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!insight) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="border-0 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-4 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI 个性化洞察</h3>
              <p className="text-white/80 text-xs">基于你的测评结果深度分析</p>
            </div>
          </div>
        </div>

        <CardContent className="p-5 space-y-5">
          {/* Root Cause Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-violet-600" />
              <h4 className="font-semibold text-violet-700">🔍 根因分析</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
              {insight.rootCauseAnalysis}
            </p>
          </div>

          {/* Combined Pattern Insight */}
          <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-violet-600" />
              <h4 className="font-semibold text-violet-700">💡 组合模式洞察</h4>
            </div>
            <p className="text-sm text-violet-800 leading-relaxed">
              {insight.combinedPatternInsight}
            </p>
          </div>

          {/* Breakthrough Path */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-600" />
              <h4 className="font-semibold text-emerald-700">🎯 3步突破路径</h4>
            </div>
            <div className="space-y-2 pl-2">
              {insight.breakthroughPath.map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                    index === 0 ? "bg-emerald-500" :
                    index === 1 ? "bg-teal-500" : "bg-cyan-500"
                  )}>
                    {index + 1}
                  </span>
                  <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Avoid Pitfalls */}
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h4 className="font-semibold text-rose-700">⚠️ 需要避开的坑</h4>
            </div>
            <ul className="space-y-1.5">
              {insight.avoidPitfalls.map((pitfall, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-rose-800">
                  <span className="text-rose-500">•</span>
                  <span>{pitfall}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* First Step */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="w-4 h-4 text-amber-600" />
              <h4 className="font-semibold text-amber-700">✨ 推荐立即执行的第一步</h4>
            </div>
            <p className="text-amber-800 font-medium">{insight.firstStep}</p>
          </div>

          {/* Encouragement */}
          <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <p className="text-pink-800 text-sm leading-relaxed italic">
                "{insight.encouragement}"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
