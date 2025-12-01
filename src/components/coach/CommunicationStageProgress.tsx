import { Check } from "lucide-react";

interface CommunicationStageProgressProps {
  currentStage: number;
}

const stages = [
  { id: 0, name: "开场", subtitle: "倾听困境" },
  { id: 1, name: "看见", subtitle: "澄清内心" },
  { id: 2, name: "读懂", subtitle: "理解对方" },
  { id: 3, name: "影响", subtitle: "新的表达" },
  { id: 4, name: "行动", subtitle: "小小开始" },
];

export const CommunicationStageProgress = ({ currentStage }: CommunicationStageProgressProps) => {
  return (
    <div className="flex items-center justify-between gap-1 py-3 px-4 bg-secondary/30 rounded-lg mb-4 overflow-x-auto">
      {stages.map((stage, index) => {
        const isCompleted = currentStage > stage.id;
        const isCurrent = currentStage === stage.id;
        const isPending = currentStage < stage.id;
        
        return (
          <div key={stage.id} className="flex items-center gap-1 min-w-fit">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/70 text-primary-foreground ring-2 ring-primary/30 animate-pulse"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check size={14} /> : stage.id}
              </div>
              <div className="flex flex-col items-center">
                <span
                  className={`text-[10px] font-medium transition-colors whitespace-nowrap ${
                    isCompleted || isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {stage.name}
                </span>
                <span
                  className={`text-[9px] transition-colors whitespace-nowrap ${
                    isCompleted || isCurrent
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {stage.subtitle}
                </span>
              </div>
            </div>
            {index < stages.length - 1 && (
              <div
                className={`w-4 h-0.5 transition-colors flex-shrink-0 ${
                  isCompleted ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};