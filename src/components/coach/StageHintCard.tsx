import { Lightbulb } from "lucide-react";

const stageHints = [
  { emoji: "📝", name: "事件捕捉", hint: "说说最近一件让你情绪波动的亲子互动..." },
  { emoji: "🌱", name: "觉察 Feel it", hint: "试着描述一下当时的情绪和身体感受" },
  { emoji: "👀", name: "看见 See it", hint: "想想这个情绪背后，你在担心什么？" },
  { emoji: "💫", name: "反应 Sense it", hint: "你当时的第一反应是什么？有没有更好的方式？" },
  { emoji: "🦋", name: "转化 Transform it", hint: "今天可以做的一个小小改变是什么？" },
];

interface StageHintCardProps {
  currentStage: number;
}

export const StageHintCard = ({ currentStage }: StageHintCardProps) => {
  const stage = stageHints[currentStage] || stageHints[0];

  return (
    <div className="mx-4 mt-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 flex items-start gap-2.5">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
        <Lightbulb className="w-3.5 h-3.5 text-purple-500" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-purple-600 mb-0.5">
          {stage.emoji} {stage.name}
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          {stage.hint}
        </div>
      </div>
    </div>
  );
};
