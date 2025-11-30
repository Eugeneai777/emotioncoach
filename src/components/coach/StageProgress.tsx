import { Check } from "lucide-react";

interface StageProgressProps {
  currentStage: number;
  stages: string[];
}

export const StageProgress = ({ currentStage, stages }: StageProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-4 px-6 bg-secondary/30 rounded-lg mb-4">
      {stages.map((stage, index) => {
        const stageNum = index + 1;
        const isCompleted = currentStage > stageNum;
        const isCurrent = currentStage === stageNum;
        
        return (
          <div key={index} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/70 text-primary-foreground ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check size={16} /> : stageNum}
              </div>
              <span
                className={`text-xs mt-1 transition-colors ${
                  isCompleted || isCurrent
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {stage}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div
                className={`w-8 h-0.5 transition-colors ${
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