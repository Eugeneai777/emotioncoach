import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Heart, 
  Lightbulb, 
  AlertCircle, 
  Footprints, 
  Loader2,
  Quote,
  Shield,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SeverityLevel } from "./scl90Data";

export interface SCL90AIInsight {
  overallAssessment: string;
  severityExplanation: string;
  primarySymptomAnalysis: string;
  secondarySymptomAnalysis?: string;
  symptomConnection?: string;
  copingStrategies: string[];
  immediateAction: string;
  professionalAdvice: string;
  warningNote?: string;
  encouragement: string;
  affirmation: string;
  campInvite?: {
    headline: string;
    reason: string;
    expectedBenefits: string[];
    urgency: string;
  };
}

interface SCL90AIAnalysisProps {
  insight: SCL90AIInsight | null;
  isLoading: boolean;
  error: string | null;
  severityLevel: SeverityLevel;
}

export function SCL90AIAnalysis({ 
  insight, 
  isLoading, 
  error, 
  severityLevel 
}: SCL90AIAnalysisProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
              <p className="text-purple-600 dark:text-purple-400 font-medium">AI正在分析你的心理健康状况...</p>
              <p className="text-muted-foreground text-sm mt-1">为你生成个性化解读</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
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

  if (!insight) return null;

  return (
    <motion.div
      initial={{ opacity: 0.01, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      <Card className="border-0 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-4 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI 个性化解读</h3>
              <p className="text-white/80 text-xs">基于你的SCL-90结果深度分析</p>
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Overall Assessment */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-3 sm:p-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl border border-purple-200 dark:border-purple-800 relative overflow-hidden"
          >
            <div className="absolute top-2 left-2 opacity-20">
              <Quote className="w-8 h-8 text-purple-600" />
            </div>
            <div className="relative pl-4">
              <p className="text-base font-medium text-purple-900 dark:text-purple-100 leading-relaxed">
                {insight.overallAssessment}
              </p>
            </div>
          </motion.div>

          {/* Severity Explanation */}
          <div className="p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-muted-foreground text-sm">当前状态解读</h4>
            </div>
            <p className="text-sm leading-relaxed">{insight.severityExplanation}</p>
          </div>

          {/* Primary Symptom Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <h4 className="font-semibold text-red-700 dark:text-red-400">主要症状分析</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
              {insight.primarySymptomAnalysis}
            </p>
          </div>

          {/* Secondary Symptom Analysis */}
          {insight.secondarySymptomAnalysis && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <h4 className="font-semibold text-orange-700 dark:text-orange-400">次要症状分析</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {insight.secondarySymptomAnalysis}
              </p>
            </div>
          )}

          {/* Symptom Connection */}
          {insight.symptomConnection && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-blue-700 dark:text-blue-400">症状关联洞察</h4>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                {insight.symptomConnection}
              </p>
            </div>
          )}

          {/* Coping Strategies - 紧凑化 */}
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
              <h4 className="font-semibold text-emerald-700 dark:text-emerald-400">💡 应对策略</h4>
            </div>
            <div className="space-y-1.5 sm:space-y-2 pl-1 sm:pl-2">
              {insight.copingStrategies.map((strategy, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-2 sm:gap-3"
                >
                  <span className={cn(
                    "flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white",
                    index === 0 ? "bg-emerald-500" :
                    index === 1 ? "bg-teal-500" : 
                    index === 2 ? "bg-cyan-500" : "bg-blue-500"
                  )}>
                    {index + 1}
                  </span>
                  <p className="text-sm text-muted-foreground pt-0.5">{strategy}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Immediate Action */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="w-4 h-4 text-amber-600" />
              <h4 className="font-semibold text-amber-700 dark:text-amber-400">✨ 立即可执行的第一步</h4>
            </div>
            <p className="text-amber-800 dark:text-amber-200 font-medium">{insight.immediateAction}</p>
          </div>

          {/* Professional Advice */}
          <div className={cn(
            "p-3 sm:p-4 rounded-xl border",
            severityLevel === "severe" 
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-slate-600" />
              <h4 className={cn(
                "font-semibold",
                severityLevel === "severe" ? "text-red-700 dark:text-red-400" : "text-slate-700 dark:text-slate-300"
              )}>
                🏥 专业建议
              </h4>
            </div>
            <p className={cn(
              "text-sm leading-relaxed",
              severityLevel === "severe" ? "text-red-800 dark:text-red-200" : "text-muted-foreground"
            )}>
              {insight.professionalAdvice}
            </p>
          </div>

          {/* Warning Note for Severe */}
          {insight.warningNote && (
            <div className="p-3 sm:p-4 bg-red-100 dark:bg-red-950/50 rounded-xl border-2 border-red-300 dark:border-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 dark:text-red-200 font-medium text-sm">
                    {insight.warningNote}
                  </p>
                  <p className="text-red-600 dark:text-red-400 text-xs mt-2">
                    🆘 全国心理援助热线：400-161-9995
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Encouragement */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-xl border border-pink-200 dark:border-pink-800">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <p className="text-pink-800 dark:text-pink-200 text-sm leading-relaxed italic">
                "{insight.encouragement}"
              </p>
            </div>
          </div>

          {/* Self Affirmation */}
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground mb-2">💪 对自己说：</p>
            <p className="text-base font-medium text-foreground italic">
              "{insight.affirmation}"
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
