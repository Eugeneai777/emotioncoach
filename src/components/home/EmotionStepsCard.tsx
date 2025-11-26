import { Brain, Heart, Lightbulb, Rocket } from "lucide-react";
import CarouselCardWrapper from "./CarouselCardWrapper";

const stages = [
  {
    icon: Brain,
    title: "觉察",
    description: "感受到了什么情绪",
    color: "text-healing-lightGreen",
    bgColor: "bg-healing-lightGreen/10",
  },
  {
    icon: Heart,
    title: "理解",
    description: "为什么会有这种感受",
    color: "text-healing-sage",
    bgColor: "bg-healing-sage/10",
  },
  {
    icon: Lightbulb,
    title: "洞见",
    description: "发现了什么新的认识",
    color: "text-healing-forestGreen",
    bgColor: "bg-healing-forestGreen/10",
  },
  {
    icon: Rocket,
    title: "行动",
    description: "接下来可以怎么做",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

export default function EmotionStepsCard() {
  return (
    <CarouselCardWrapper
      background="linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #fff 100%)"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1 text-foreground">情绪四部曲</h3>
        <p className="text-sm text-muted-foreground">
          通过四个阶段深入理解和管理你的情绪
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div
              key={index}
              className={`${stage.bgColor} rounded-lg p-3 flex flex-col gap-2 transition-all hover:scale-105`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stage.color}`} />
                <span className={`text-sm font-medium ${stage.color}`}>
                  {stage.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {stage.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-border/20">
        <p className="text-xs text-muted-foreground text-center">
          从觉察到行动，开启情绪成长之旅 🌱
        </p>
      </div>
    </CarouselCardWrapper>
  );
}
