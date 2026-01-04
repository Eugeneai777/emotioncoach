import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Target, Heart, Brain, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { questions, scoreLabels, getLayerTitle, calculateResult, AssessmentResult } from "./wealthBlockData";

interface WealthBlockQuestionsProps {
  onComplete: (result: AssessmentResult, answers: Record<number, number>) => void;
}

export function WealthBlockQuestions({ onComplete }: WealthBlockQuestionsProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const questionsPerPage = 10;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const currentQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const result = calculateResult(answers);
    onComplete(result, answers);
  };

  const canSubmit = answeredCount === questions.length;
  const canGoNext = currentQuestions.every(q => answers[q.id] !== undefined);

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">财富卡点测评</span>
        </div>
        <h2 className="text-xl font-bold">发现阻碍你财富增长的深层卡点</h2>
        <p className="text-sm text-muted-foreground">共30道题目，预计用时5-8分钟</p>
      </div>

      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">完成进度</span>
          <span className="font-medium">{answeredCount}/30</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 层级标题 */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
        <div className="p-2 bg-amber-100 rounded-lg">
          {currentPage === 0 && <Target className="w-5 h-5 text-amber-600" />}
          {currentPage === 1 && <Heart className="w-5 h-5 text-pink-600" />}
          {currentPage === 2 && <Brain className="w-5 h-5 text-purple-600" />}
        </div>
        <div>
          <p className="font-medium">{getLayerTitle(currentQuestions[0]?.layer)}</p>
          <p className="text-xs text-muted-foreground">
            {currentPage === 0 && "探索你的财富行为模式"}
            {currentPage === 1 && "觉察你对金钱的情绪反应"}
            {currentPage === 2 && "识别你的财富限制性信念"}
          </p>
        </div>
      </div>

      {/* 题目列表 */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {currentQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "transition-all duration-300",
                  answers[question.id] ? "border-amber-200 bg-amber-50/30" : ""
                )}>
                  <CardContent className="p-4 space-y-4">
                    <p className="font-medium leading-relaxed">
                      <span className="text-amber-600 mr-2">{question.id}.</span>
                      {question.text}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {scoreLabels.map(option => (
                        <Button
                          key={option.value}
                          variant={answers[question.id] === option.value ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "flex-1 min-w-[60px] transition-all",
                            answers[question.id] === option.value 
                              ? "bg-gradient-to-r from-amber-500 to-yellow-500 border-0 text-white" 
                              : "hover:border-amber-300"
                          )}
                          onClick={() => handleAnswer(question.id, option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* 导航按钮 */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          className="flex-1"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一页
        </Button>
        
        {currentPage < totalPages - 1 ? (
          <Button
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
            disabled={!canGoNext}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            下一页
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            查看结果
          </Button>
        )}
      </div>
    </div>
  );
}
