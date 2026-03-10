import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageFooter } from "@/components/marriage/MarriageFooter";
import { assessments } from "@/components/marriage/MarriageAssessmentCards";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Simple assessment questions per type
const questionBank: Record<string, { q: string; options: string[] }[]> = {
  happiness: [
    { q: "你们最近一个月争吵频率如何？", options: ["很少", "偶尔", "经常", "几乎每天"] },
    { q: "你觉得对方理解你的情绪吗？", options: ["非常理解", "基本理解", "不太理解", "完全不理解"] },
    { q: "你们多久没有一起做开心的事了？", options: ["最近就有", "一两周前", "一个月以上", "已经记不清"] },
    { q: "你对这段婚姻的整体满意度？", options: ["很满意", "还行", "不太满意", "很不满意"] },
    { q: "你觉得对方还爱你吗？", options: ["确定爱", "应该爱", "不确定", "可能不爱了"] },
  ],
  "divorce-risk": [
    { q: "你们是否经常冷战？", options: ["从不", "偶尔", "经常", "几乎每天"] },
    { q: "你有想过离婚吗？", options: ["从没想过", "偶尔闪念", "认真考虑过", "已在行动"] },
    { q: "你们能心平气和讨论问题吗？", options: ["总是可以", "大多时候", "很难", "完全不能"] },
    { q: "你是否觉得这段关系让你痛苦？", options: ["不会", "偶尔", "经常", "一直"] },
    { q: "你们是否还有亲密行为？", options: ["很频繁", "偶尔有", "很少", "完全没有"] },
  ],
  communication: [
    { q: "当有分歧时你们通常怎么处理？", options: ["冷静讨论", "各退一步", "一方妥协", "吵架或冷战"] },
    { q: "你觉得对方会认真听你说话吗？", options: ["总是会", "大部分时候", "很少", "从不"] },
    { q: "你在表达不满时通常会？", options: ["直接但温和", "暗示", "忍耐", "爆发"] },
    { q: "争吵后你们多久能和好？", options: ["很快", "当天", "几天", "要很久"] },
    { q: "你觉得你们沟通的最大问题是？", options: ["没有大问题", "不够坦诚", "说不到一起", "根本不沟通"] },
  ],
  "in-law": [
    { q: "婆媳之间的关系如何？", options: ["很融洽", "还可以", "有点紧张", "很紧张"] },
    { q: "伴侣在婆媳冲突中会站哪边？", options: ["站我这边", "会调和", "偏向父母", "不管不问"] },
    { q: "婆媳矛盾多久出现一次？", options: ["很少", "偶尔", "经常", "几乎每天"] },
    { q: "婆媳矛盾是否影响了夫妻关系？", options: ["没有", "有一点", "影响较大", "严重影响"] },
    { q: "你觉得边界问题严重吗？", options: ["有清晰边界", "基本有", "比较模糊", "完全没边界"] },
  ],
  repair: [
    { q: "你还想修复这段关系吗？", options: ["非常想", "愿意尝试", "不太确定", "不想了"] },
    { q: "对方是否也有修复意愿？", options: ["很想", "应该愿意", "不确定", "不愿意"] },
    { q: "你们之间还有信任吗？", options: ["完全信任", "基本信任", "信任很少", "不信任"] },
    { q: "你们是否愿意接受专业帮助？", options: ["都愿意", "我愿意", "都犹豫", "都不愿意"] },
    { q: "你觉得问题的根源是什么？", options: ["沟通方式", "性格差异", "外部压力", "感情淡了"] },
  ],
};

const MarriageAssessments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeId = searchParams.get("id");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const activeAssessment = assessments.find((a) => a.id === activeId);
  const questions = activeId ? questionBank[activeId] || [] : [];

  const handleAnswer = async (optionIdx: number) => {
    const newAnswers = [...answers, optionIdx];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1);
    } else {
      // Generate result
      setGenerating(true);
      try {
        const score = newAnswers.reduce((sum, a) => sum + a, 0);
        const maxScore = (questions.length - 1) * 3;
        const { data, error } = await supabase.functions.invoke("marriage-ai-tool", {
          body: {
            mode: "assessment-result",
            input: JSON.stringify({
              assessmentTitle: activeAssessment?.title,
              questions: questions.map((q, i) => ({
                question: q.q,
                answer: q.options[newAnswers[i]],
              })),
              score,
              maxScore,
            }),
          },
        });
        if (error) throw error;
        setResult(data?.result || "暂无结果");
      } catch (e) {
        console.error(e);
        toast.error("生成结果失败");
        // Fallback
        const score = newAnswers.reduce((sum, a) => sum + a, 0);
        const pct = Math.round((1 - score / (questions.length * 3)) * 100);
        setResult(`**测评得分：${pct}/100**\n\n根据您的回答，建议您关注关系中的沟通方式和情绪管理。点击下方按钮，体验AI关系工具或预约专业咨询获取更详细的建议。`);
      } finally {
        setGenerating(false);
      }
    }
  };

  const resetAssessment = () => {
    setCurrentQ(0);
    setAnswers([]);
    setResult(null);
    navigate("/marriage/assessments");
  };

  // Assessment list view
  if (!activeId) {
    return (
      <>
        <Helmet>
          <title>婚姻关系测评中心 - 婚因有道</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-b from-marriage-light to-white pb-24">
          <div className="px-5 pt-10 pb-6 max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-foreground text-center mb-1">婚姻关系测评中心</h1>
            <p className="text-xs text-muted-foreground text-center mb-6">选择一个更适合你当前问题的测评</p>

            <div className="space-y-3">
              {assessments.map((a) => (
                <motion.button
                  key={a.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/marriage/assessments?id=${a.id}`)}
                  className={`w-full bg-gradient-to-r ${a.color} rounded-2xl p-4 border ${a.borderColor} shadow-sm text-left`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{a.emoji}</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
          <MarriageNav />
        </div>
      </>
    );
  }

  // Result view
  if (result) {
    return (
      <>
        <Helmet>
          <title>{activeAssessment?.title} - 结果 - 婚因有道</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-b from-marriage-light to-white pb-24">
          <div className="px-5 pt-8 max-w-lg mx-auto">
            <button onClick={resetAssessment} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> 返回测评列表
            </button>

            <div className="text-center mb-6">
              <span className="text-4xl">{activeAssessment?.emoji}</span>
              <h2 className="text-lg font-bold text-foreground mt-2">{activeAssessment?.title}</h2>
              <p className="text-xs text-muted-foreground">测评完成</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-marriage-border shadow-sm mb-6">
              <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/marriage/ai-tools")}
                className="w-full rounded-xl bg-marriage-primary hover:bg-marriage-primary/90 text-white"
              >
                体验AI关系工具
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/marriage/help")}
                className="w-full rounded-xl border-marriage-primary/30 text-marriage-primary"
              >
                预约专业咨询
              </Button>
              <Button variant="ghost" onClick={resetAssessment} className="text-muted-foreground text-sm">
                重新测评
              </Button>
            </div>
          </div>
          <MarriageNav />
        </div>
      </>
    );
  }

  // Question view
  return (
    <>
      <Helmet>
        <title>{activeAssessment?.title} - 婚因有道</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-marriage-light to-white pb-24">
        <div className="px-5 pt-8 max-w-lg mx-auto">
          <button onClick={resetAssessment} className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> 返回
          </button>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-1.5 bg-marriage-border rounded-full overflow-hidden">
              <div
                className="h-full bg-marriage-primary rounded-full transition-all duration-300"
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{currentQ + 1}/{questions.length}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-base font-bold text-foreground text-center">
                {questions[currentQ]?.q}
              </h2>

              <div className="space-y-2.5 mt-6">
                {questions[currentQ]?.options.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(idx)}
                    className="w-full p-4 rounded-xl border-2 border-marriage-border bg-white text-left text-sm font-medium text-foreground hover:border-marriage-primary/50 hover:bg-marriage-light/50 transition-all"
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {generating && (
            <div className="mt-8 text-center">
              <div className="w-8 h-8 border-2 border-marriage-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">正在生成测评结果...</p>
            </div>
          )}
        </div>
        <MarriageNav />
      </div>
    </>
  );
};

export default MarriageAssessments;
