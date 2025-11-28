import { Check } from "lucide-react";

interface ParentStageProgressProps {
  currentStage: number;
}

const stages = [
  { id: 1, name: "觉察", subtitle: "Feel it" },
  { id: 2, name: "看见", subtitle: "See it" },
  { id: 3, name: "感受", subtitle: "Sense it" },
  { id: 4, name: "转化", subtitle: "Transform it" }
];

export const ParentStageProgress = ({ currentStage }: ParentStageProgressProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  stage.id < currentStage
                    ? "bg-primary text-primary-foreground"
                    : stage.id === currentStage
                    ? "bg-primary/20 text-primary ring-2 ring-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stage.id < currentStage ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stage.id
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium">{stage.name}</div>
                <div className="text-xs text-muted-foreground">{stage.subtitle}</div>
              </div>
            </div>
            {index < stages.length - 1 && (
              <div
                className={`h-[2px] flex-1 mx-2 transition-all ${
                  stage.id < currentStage ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};