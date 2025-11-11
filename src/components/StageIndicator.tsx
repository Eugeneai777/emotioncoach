interface StageIndicatorProps {
  currentStage: number;
}

export const StageIndicator = ({ currentStage }: StageIndicatorProps) => {
  const stages = [
    { name: "觉察", icon: "🌱" },
    { name: "理解", icon: "💭" },
    { name: "看见", icon: "👁️" },
    { name: "转化", icon: "🦋" },
  ];

  return (
    <div className="flex items-center justify-center gap-3 py-6">
      {stages.map((stage, index) => (
        <div key={index} className="flex items-center gap-3">
          <div
            className={`flex flex-col items-center gap-1 transition-all duration-500 ${
              index === currentStage
                ? "scale-110"
                : index < currentStage
                ? "opacity-50"
                : "opacity-30"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500 ${
                index === currentStage
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : index < currentStage
                  ? "bg-gentle text-gentle-foreground"
                  : "bg-muted"
              }`}
            >
              {stage.icon}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {stage.name}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div
              className={`w-8 h-0.5 transition-all duration-500 ${
                index < currentStage ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};
