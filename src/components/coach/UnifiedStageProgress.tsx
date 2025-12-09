import { Check } from "lucide-react";

interface Stage {
  id: number;
  name: string;
  subtitle: string;
}

const stageConfigs: Record<string, Stage[]> = {
  emotion: [
    { id: 1, name: "觉察", subtitle: "Feel it" },
    { id: 2, name: "理解", subtitle: "Name it" },
    { id: 3, name: "反应", subtitle: "React it" },
    { id: 4, name: "转化", subtitle: "Transform it" }
  ],
  parent: [
    { id: 1, name: "觉察", subtitle: "Feel it" },
    { id: 2, name: "看见", subtitle: "See it" },
    { id: 3, name: "反应", subtitle: "Sense it" },
    { id: 4, name: "转化", subtitle: "Transform it" }
  ],
  communication: [
    { id: 1, name: "看", subtitle: "See" },
    { id: 2, name: "理解", subtitle: "Understand" },
    { id: 3, name: "影响", subtitle: "Influence" },
    { id: 4, name: "行动", subtitle: "Act" }
  ]
};

interface UnifiedStageProgressProps {
  coachType: 'emotion' | 'parent' | 'communication';
  currentStage: number;
}

export const UnifiedStageProgress = ({ coachType, currentStage }: UnifiedStageProgressProps) => {
  const stages = stageConfigs[coachType] || stageConfigs.emotion;
  
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  stage.id < currentStage && currentStage > 0
                    ? "bg-primary text-primary-foreground"
                    : stage.id === currentStage && currentStage > 0
                    ? "bg-primary/20 text-primary ring-2 ring-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stage.id < currentStage && currentStage > 0 ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  stage.id
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs md:text-sm font-medium">{stage.name}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">{stage.subtitle}</div>
              </div>
            </div>
            {index < stages.length - 1 && (
              <div
                className={`h-[2px] flex-1 mx-1 md:mx-2 transition-all ${
                  stage.id < currentStage && currentStage > 0 ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
