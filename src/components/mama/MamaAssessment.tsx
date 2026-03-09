import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface MamaAssessmentProps {
  onBack: () => void;
  onOpenChat: (context: string) => void;
}

const questions = [
  {
    q: "孩子闹脾气时，你的第一反应是？",
    options: [
      { label: "先蹲下来抱抱他", type: "warm" },
      { label: "想一想他为什么闹", type: "growth" },
      { label: "赶紧处理别影响别人", type: "duty" },
      { label: "心里一下子也烦了", type: "anxious" },
    ],
  },
  {
    q: "周末你最想做的事情是？",
    options: [
      { label: "陪孩子一起玩耍", type: "warm" },
      { label: "学点新东西充实自己", type: "growth" },
      { label: "把家务和下周安排好", type: "duty" },
      { label: "什么都不想做，只想躺着", type: "anxious" },
    ],
  },
  {
    q: "别人夸你孩子的时候，你会？",
    options: [
      { label: "开心地分享孩子的可爱日常", type: "warm" },
      { label: "觉得是教育方法起了作用", type: "growth" },
      { label: "谦虚说还有很多不足", type: "duty" },
      { label: "担心自己做得还不够好", type: "anxious" },
    ],
  },
  {
    q: "你觉得做妈妈最重要的是？",
    options: [
      { label: "给孩子满满的爱和安全感", type: "warm" },
      { label: "和孩子一起学习成长", type: "growth" },
      { label: "把生活安排得井井有条", type: "duty" },
      { label: "不犯错、不耽误孩子", type: "anxious" },
    ],
  },
  {
    q: "深夜孩子睡着后，你通常在？",
    options: [
      { label: "看看孩子的睡脸，觉得满足", type: "warm" },
      { label: "看书或听课充电", type: "growth" },
      { label: "收拾家务准备明天的事", type: "duty" },
      { label: "翻来覆去想今天哪里做得不好", type: "anxious" },
    ],
  },
];

const results: Record<string, { title: string; emoji: string; desc: string; advice: string }> = {
  warm: {
    title: "温暖型妈妈",
    emoji: "🌸",
    desc: "你是一个用爱包围孩子的妈妈。你的温柔和耐心，是孩子最大的安全感来源。",
    advice: "记得在爱孩子的同时，也要好好爱自己哦。",
  },
  growth: {
    title: "成长型妈妈",
    emoji: "🌱",
    desc: "你是一个不断学习的妈妈。你相信妈妈和孩子可以一起成长，你的视野会带给孩子更大的世界。",
    advice: "偶尔也放下学习，享受当下的美好时光。",
  },
  duty: {
    title: "责任型妈妈",
    emoji: "🏡",
    desc: "你是一个有担当的妈妈。你把一切安排得井井有条，家人都因你而安心。",
    advice: "你已经做得很好了，允许自己偶尔偷个懒。",
  },
  anxious: {
    title: "焦虑型妈妈",
    emoji: "💜",
    desc: "你是一个对自己要求很高的妈妈。你的焦虑来源于对孩子深深的爱。",
    advice: "你不需要做完美妈妈，60分就已经足够好了。",
  },
};

const MamaAssessment = ({ onBack, onOpenChat }: MamaAssessmentProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [resultType, setResultType] = useState<string | null>(null);

  const handleAnswer = (type: string) => {
    const newAnswers = [...answers, type];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300);
    } else {
      // Calculate result
      const counts: Record<string, number> = {};
      newAnswers.forEach((a) => (counts[a] = (counts[a] || 0) + 1));
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setTimeout(() => setResultType(winner), 300);
    }
  };

  if (resultType) {
    const r = results[resultType];
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <span className="text-6xl">{r.emoji}</span>
          <h2 className="text-2xl font-bold text-[#3D3028] mt-4 mb-2">你是：{r.title}</h2>
          <p className="text-[#5D4E37] leading-relaxed mb-3">{r.desc}</p>
          <p className="text-[#F4845F] text-sm mb-8">{r.advice}</p>

          <Button
            onClick={() => onOpenChat(`我刚刚做了妈妈能量测评，结果是"${r.title}"。请根据这个结果给我一些温暖的建议和鼓励。`)}
            className="w-full bg-[#F4845F] hover:bg-[#E5734E] text-white rounded-xl py-3 mb-3"
          >
            💬 找AI妈妈教练聊聊
          </Button>
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full text-[#8B7355] rounded-xl"
          >
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 pt-4">
      <button onClick={onBack} className="flex items-center text-[#8B7355] text-sm mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> 返回
      </button>

      <div className="text-center mb-2">
        <p className="text-xs text-[#A89580]">{currentQ + 1} / {questions.length}</p>
        <div className="w-full bg-[#F5E6D3] rounded-full h-1.5 mt-2 mb-6">
          <div
            className="bg-[#F4845F] h-1.5 rounded-full transition-all"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-lg font-medium text-[#3D3028] text-center mb-6">{q.q}</p>

      <div className="space-y-3 max-w-sm mx-auto">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt.type)}
            className="w-full p-4 bg-white rounded-2xl border border-[#F5E6D3] text-left text-[#3D3028] text-sm hover:border-[#F4845F]/40 hover:shadow-sm active:scale-[0.97] transition-all"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MamaAssessment;
