import { Check } from "lucide-react";

export interface StageConfig {
  id: number;
  name: string;
  subtitle?: string;
  emoji?: string;
}

// 默认配置，当 template.steps 不可用时作为降级方案
const defaultConfigs: Record<string, StageConfig[]> = {
  emotion: [
    { id: 1, name: "觉察", subtitle: "Feel it", emoji: "🌱" },
    { id: 2, name: "理解", subtitle: "Name it", emoji: "💭" },
    { id: 3, name: "反应", subtitle: "React it", emoji: "👁️" },
    { id: 4, name: "转化", subtitle: "Transform it", emoji: "🦋" }
  ],
  parent: [
    { id: 1, name: "觉察", subtitle: "Feel it", emoji: "🌱" },
    { id: 2, name: "看见", subtitle: "See it", emoji: "👀" },
    { id: 3, name: "反应", subtitle: "Sense it", emoji: "💫" },
    { id: 4, name: "转化", subtitle: "Transform it", emoji: "🦋" }
  ],
  communication: [
    { id: 0, name: "开场", subtitle: "倾听困境", emoji: "👂" },
    { id: 1, name: "看见", subtitle: "澄清内心", emoji: "💡" },
    { id: 2, name: "读懂", subtitle: "理解对方", emoji: "🤝" },
    { id: 3, name: "影响", subtitle: "新的表达", emoji: "💬" },
    { id: 4, name: "行动", subtitle: "小小开始", emoji: "🚀" }
  ]
};

interface UnifiedStageProgressProps {
  coachType?: 'emotion' | 'parent' | 'communication';
  currentStage: number;
  primaryColor?: string;
  stages?: StageConfig[]; // 支持从外部传入动态配置
}

export const UnifiedStageProgress = ({ 
  coachType = 'emotion', 
  currentStage, 
  primaryColor,
  stages: externalStages 
}: UnifiedStageProgressProps) => {
  // 优先使用外部传入的配置，否则使用默认配置
  const stages = externalStages && externalStages.length > 0 
    ? externalStages 
    : (defaultConfigs[coachType] || defaultConfigs.emotion);
  
  const isCommunication = coachType === 'communication';
  
  return (
    <div className={`w-full ${isCommunication ? 'py-3 px-4 bg-secondary/30 rounded-lg mb-4 overflow-x-auto' : 'py-4'}`}>
      <div className={`flex items-center ${isCommunication ? 'justify-between gap-1' : 'justify-between max-w-2xl mx-auto'}`}>
        {stages.map((stage, index) => {
          const isCompleted = isCommunication 
            ? currentStage > stage.id 
            : (stage.id < currentStage && currentStage > 0);
          const isCurrent = isCommunication 
            ? currentStage === stage.id 
            : (stage.id === currentStage && currentStage > 0);
          
          return (
            <div key={stage.id} className={`flex items-center ${isCommunication ? 'gap-1 min-w-fit' : 'flex-1'}`}>
              <div className={`flex flex-col items-center ${isCommunication ? 'gap-0.5' : 'flex-1'}`}>
                <div
                  className={`${isCommunication ? 'w-7 h-7 text-xs' : 'w-8 h-8 md:w-10 md:h-10 text-sm'} rounded-full flex items-center justify-center font-medium transition-all ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? isCommunication 
                        ? "bg-primary/70 text-primary-foreground ring-2 ring-primary/30 animate-pulse"
                        : "bg-primary/20 text-primary ring-2 ring-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className={isCommunication ? "w-3.5 h-3.5" : "w-4 h-4 md:w-5 md:h-5"} />
                  ) : stage.emoji ? (
                    <span className={isCommunication ? "text-sm" : "text-base md:text-lg"}>{stage.emoji}</span>
                  ) : (
                    stage.id
                  )}
                </div>
                <div className={`${isCommunication ? '' : 'mt-2'} text-center flex flex-col items-center`}>
                  <span
                    className={`${isCommunication ? 'text-[10px]' : 'text-xs md:text-sm'} font-medium transition-colors whitespace-nowrap ${
                      isCompleted || isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stage.name}
                  </span>
                  {stage.subtitle && (
                    <span
                      className={`${isCommunication ? 'text-[9px]' : 'text-[10px] md:text-xs'} transition-colors whitespace-nowrap ${
                        isCompleted || isCurrent
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {stage.subtitle}
                    </span>
                  )}
                </div>
              </div>
              {index < stages.length - 1 && (
                <div
                  className={`${isCommunication ? 'w-4 h-0.5 flex-shrink-0' : 'h-[2px] flex-1 mx-1 md:mx-2'} transition-all ${
                    isCompleted ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
