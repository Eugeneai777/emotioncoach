import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: number;
  text: string;
  strength: string;
}

interface StrengthResult {
  name: string;
  score: number;
  description: string;
  color: string;
}

const questions: Question[] = [
  { id: 1, text: "我喜欢学习新事物，享受获取知识的过程", strength: "热爱学习" },
  { id: 2, text: "我能从不同角度看待问题，思考事物的本质", strength: "洞察力" },
  { id: 3, text: "我在困难时期也能保持乐观和希望", strength: "希望" },
  { id: 4, text: "我善于欣赏生活中的美好事物", strength: "审美力" },
  { id: 5, text: "我对他人的感受很敏感，能理解别人的情绪", strength: "同理心" },
  { id: 6, text: "我经常帮助别人，乐于助人", strength: "善良" },
  { id: 7, text: "我做事有计划，善于组织和管理", strength: "领导力" },
  { id: 8, text: "我能坚持完成困难的任务", strength: "坚韧" },
  { id: 9, text: "我喜欢与人交往，建立新的关系", strength: "社交力" },
  { id: 10, text: "我能够控制自己的情绪和行为", strength: "自控力" },
  { id: 11, text: "我经常提出新的想法和解决方案", strength: "创造力" },
  { id: 12, text: "我对生活充满热情和活力", strength: "热情" },
  { id: 13, text: "我善于发现事物的幽默之处", strength: "幽默感" },
  { id: 14, text: "我对朋友和家人非常忠诚", strength: "忠诚" },
  { id: 15, text: "我勇于尝试新事物，即使可能失败", strength: "勇气" }
];

const strengthColors: { [key: string]: string } = {
  "热爱学习": "hsl(210, 70%, 55%)",
  "洞察力": "hsl(280, 65%, 60%)",
  "希望": "hsl(45, 90%, 55%)",
  "审美力": "hsl(320, 70%, 60%)",
  "同理心": "hsl(340, 75%, 55%)",
  "善良": "hsl(120, 60%, 50%)",
  "领导力": "hsl(210, 80%, 50%)",
  "坚韧": "hsl(25, 75%, 55%)",
  "社交力": "hsl(180, 60%, 50%)",
  "自控力": "hsl(260, 60%, 55%)",
  "创造力": "hsl(290, 70%, 60%)",
  "热情": "hsl(15, 85%, 60%)",
  "幽默感": "hsl(50, 85%, 55%)",
  "忠诚": "hsl(200, 70%, 55%)",
  "勇气": "hsl(30, 80%, 55%)"
};

export const StrengthsFinder = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [results, setResults] = useState<StrengthResult[] | null>(null);

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: parseInt(value) });
  };

  const handleNext = () => {
    if (!answers[currentQuestion]) {
      toast({
        title: "请选择一个选项",
        variant: "destructive"
      });
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    const strengthScores: { [key: string]: number[] } = {};

    questions.forEach((q) => {
      if (!strengthScores[q.strength]) {
        strengthScores[q.strength] = [];
      }
      strengthScores[q.strength].push(answers[q.id - 1] || 0);
    });

    const strengthResults: StrengthResult[] = Object.entries(strengthScores).map(([name, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      return {
        name,
        score: Math.round(avgScore * 20), // 转换为百分比
        description: getStrengthDescription(name),
        color: strengthColors[name] || "hsl(var(--primary))"
      };
    });

    const sortedResults = strengthResults.sort((a, b) => b.score - a.score);
    setResults(sortedResults);
  };

  const getStrengthDescription = (strength: string): string => {
    const descriptions: { [key: string]: string } = {
      "热爱学习": "你对知识充满渴望，享受学习的过程",
      "洞察力": "你善于深入思考，能看到事物的本质",
      "希望": "你对未来充满信心，即使在困难时期也能保持乐观",
      "审美力": "你能欣赏和创造美，对艺术有独特的感受",
      "同理心": "你能理解他人的感受，与人建立深层连接",
      "善良": "你乐于帮助他人，关心他人的福祉",
      "领导力": "你善于组织和激励他人，引导团队前进",
      "坚韧": "你有毅力完成困难的任务，不轻易放弃",
      "社交力": "你喜欢与人交往，建立新的人际关系",
      "自控力": "你能控制自己的情绪和行为，保持理性",
      "创造力": "你富有想象力，能提出新颖的想法",
      "热情": "你对生活充满活力，能感染周围的人",
      "幽默感": "你能发现生活中的幽默，让人开心",
      "忠诚": "你对朋友和家人非常忠诚可靠",
      "勇气": "你勇于面对挑战，不怕失败"
    };
    return descriptions[strength] || "";
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (results) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>你的优势概览</CardTitle>
            <CardDescription>根据测评结果，这是你的前5大优势</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.slice(0, 5).map((result, index) => (
              <div key={result.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: result.color }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{result.name}</div>
                      <div className="text-sm text-muted-foreground">{result.description}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: result.color }}>
                    {result.score}%
                  </div>
                </div>
                <Progress value={result.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>如何发挥你的优势</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">💪 {results[0].name}</h4>
              <p className="text-sm text-muted-foreground">
                这是你最强的优势。尝试在日常工作和生活中更多地运用它。
                寻找能让你发挥这一优势的机会和场景。
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🌟 优势组合</h4>
              <p className="text-sm text-muted-foreground">
                你的 {results[0].name} 和 {results[1].name} 可以很好地结合。
                考虑如何同时运用这两个优势来创造更大的价值。
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => { setResults(null); setCurrentQuestion(0); setAnswers({}); }}>
            <Download className="w-4 h-4 mr-2" />
            重新测评
          </Button>
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            获取AI建议
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>优势发现测评</CardTitle>
          <CardDescription>
            问题 {currentQuestion + 1} / {questions.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progress} className="h-2" />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{questions[currentQuestion].text}</h3>

            <RadioGroup value={answers[currentQuestion]?.toString()} onValueChange={handleAnswer}>
              <div className="space-y-3">
                {[
                  { value: "5", label: "非常符合" },
                  { value: "4", label: "比较符合" },
                  { value: "3", label: "一般" },
                  { value: "2", label: "不太符合" },
                  { value: "1", label: "完全不符合" }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              上一题
            </Button>
            <Button onClick={handleNext}>
              {currentQuestion === questions.length - 1 ? "查看结果" : "下一题"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
