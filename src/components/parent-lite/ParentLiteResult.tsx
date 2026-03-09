import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Heart, ArrowRight, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { type ParentLiteAnswer } from "./ParentLiteQuestions";

interface ParentLiteResultProps {
  answers: ParentLiteAnswer[];
  onJoinCamp: () => void;
}

interface DiagnosisResult {
  type: string;
  title: string;
  emoji: string;
  description: string;
  stability: { score: number; label: string; color: string };
  insight: { score: number; label: string; color: string };
  repair: { score: number; label: string; color: string };
  suggestion: string;
  urgency: "high" | "medium" | "low";
}

function analyzeAnswers(answers: ParentLiteAnswer[]): DiagnosisResult {
  const answerMap: Record<string, string> = {};
  answers.forEach(a => { answerMap[a.questionId] = a.values[0] || ""; });

  // Score stability (0-100)
  let stability = 50;
  if (answerMap.parent_reaction === "explode") stability = 20;
  else if (answerMap.parent_reaction === "lecture") stability = 40;
  else if (answerMap.parent_reaction === "helpless") stability = 35;
  else if (answerMap.parent_reaction === "withdraw") stability = 45;

  // Score insight (0-100)
  let insight = 50;
  if (answerMap.expectation === "understand") insight = 70;
  else if (answerMap.expectation === "method") insight = 55;
  else if (answerMap.parent_feeling === "anxious") insight = 35;

  // Score repair (0-100)
  let repair = 50;
  if (answerMap.repair_ability === "apologize") repair = 80;
  else if (answerMap.repair_ability === "stuck") repair = 35;
  else if (answerMap.repair_ability === "wait") repair = 40;
  else if (answerMap.repair_ability === "pretend") repair = 25;

  const getLabel = (score: number) => score >= 70 ? "较强" : score >= 45 ? "中等" : "需提升";
  const getColor = (score: number) => score >= 70 ? "text-emerald-600" : score >= 45 ? "text-amber-600" : "text-rose-600";

  // Determine type
  const weakest = Math.min(stability, insight, repair);
  let type = "balanced";
  let title = "均衡发展型";
  let emoji = "🌱";
  let description = "你的三力较为均衡，通过系统训练可以全面提升。";
  let suggestion = "建议从情绪稳定力开始，逐步提升三力水平。";
  let urgency: "high" | "medium" | "low" = "medium";

  if (weakest === stability && stability < 40) {
    type = "emotional_storm";
    title = "情绪风暴型";
    emoji = "🌊";
    description = "你在面对孩子时容易被情绪裹挟，这会让孩子也陷入不安全感中。";
    suggestion = "当务之急是学会「情绪暂停」技巧，先稳住自己，孩子才愿意靠近你。";
    urgency = "high";
  } else if (weakest === repair && repair < 40) {
    type = "frozen_repair";
    title = "关系冰冻型";
    emoji = "🧊";
    description = "冲突后你和孩子都不知道如何破冰，关系在沉默中越来越远。";
    suggestion = "学习「修复性对话」模式，用一句简单的话重新打开连接。";
    urgency = "high";
  } else if (weakest === insight && insight < 45) {
    type = "blind_spot";
    title = "盲区困惑型";
    emoji = "🔍";
    description = "你很努力，但可能没有真正看懂孩子行为背后的真实需求。";
    suggestion = "学习读懂孩子的「情绪密码」，从表面行为看到内心渴望。";
    urgency = "medium";
  }

  return {
    type, title, emoji, description,
    stability: { score: stability, label: getLabel(stability), color: getColor(stability) },
    insight: { score: insight, label: getLabel(insight), color: getColor(insight) },
    repair: { score: repair, label: getLabel(repair), color: getColor(repair) },
    suggestion, urgency,
  };
}

export function ParentLiteResult({ answers, onJoinCamp }: ParentLiteResultProps) {
  const navigate = useNavigate();
  const result = useMemo(() => analyzeAnswers(answers), [answers]);

  const forces = [
    { icon: Shield, label: "情绪稳定力", ...result.stability },
    { icon: Eye, label: "情绪洞察力", ...result.insight },
    { icon: Heart, label: "关系修复力", ...result.repair },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-background px-4 py-6 pb-40">
      {/* 诊断结果标题 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6"
      >
        <div className="text-5xl mb-3">{result.emoji}</div>
        <Badge className={`mb-3 ${
          result.urgency === "high" 
            ? "bg-rose-100 text-rose-700 border-rose-200" 
            : "bg-amber-100 text-amber-700 border-amber-200"
        }`}>
          {result.urgency === "high" ? "⚠️ 需要关注" : "📊 诊断结果"}
        </Badge>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          你属于「{result.title}」
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
          {result.description}
        </p>
      </motion.div>

      {/* 三力评分 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="mb-6 border-emerald-200/50">
          <CardContent className="p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-500" />
              你的三力画像
            </h2>
            <div className="space-y-4">
              {forces.map((f, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <f.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{f.label}</span>
                    </div>
                    <span className={`text-sm font-semibold ${f.color}`}>{f.label}</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        f.score >= 70 ? "bg-emerald-500" : f.score >= 45 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${f.score}%` }}
                      transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 建议 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Card className="mb-6 border-amber-200/50 bg-amber-50/50">
          <CardContent className="p-5">
            <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              给你的建议
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.suggestion}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 训练营推荐 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <Card className="mb-6 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-emerald-800">推荐：21天亲子突破营</h2>
            </div>
            <p className="text-sm text-emerald-700 mb-4 leading-relaxed">
              基于你的诊断结果，我们为你推荐21天系统训练。每天只需15分钟，
              帮你建立稳定的亲子沟通模式，让孩子重新愿意靠近你。
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">21天</div>
                <div className="text-xs text-muted-foreground">系统训练</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">15分</div>
                <div className="text-xs text-muted-foreground">每天投入</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">AI+真人</div>
                <div className="text-xs text-muted-foreground">双教练陪伴</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 底部固定CTA */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t p-4"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="container max-w-lg mx-auto space-y-2">
          <Button
            onClick={onJoinCamp}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium shadow-lg"
          >
            加入21天亲子突破营
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/parent-coach")}
            className="w-full text-sm text-muted-foreground"
          >
            先和AI亲子教练聊聊
          </Button>
        </div>
      </div>
    </div>
  );
}
