import { Card, CardContent } from "@/components/ui/card";
import { Brain, Heart, Lightbulb, Target } from "lucide-react";

export default function EmotionStepsCard() {
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
      icon: Target,
      title: "行动",
      description: "接下来可以怎么做",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <Card className="border-healing-lightGreen/30 bg-gradient-to-br from-healing-warmWhite to-healing-cream shadow-lg">
      <CardContent className="pt-6 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-2xl">🌱</p>
          <h3 className="text-lg font-medium text-healing-forestGreen">
            情绪四部曲
          </h3>
          <p className="text-sm text-healing-forestGreen/70 leading-relaxed">
            温柔地理解和陪伴自己的情绪旅程
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div
                key={index}
                className={`${stage.bgColor} rounded-lg p-3 space-y-2 transition-all hover:scale-105`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${stage.color}`} />
                  <span className={`font-medium ${stage.color}`}>
                    {stage.title}
                  </span>
                </div>
                <p className="text-xs text-healing-forestGreen/60 leading-relaxed">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center text-healing-forestGreen/60 leading-relaxed mt-4">
          点击"开始梳理"，和劲老师一起探索情绪的意义 💫
        </p>
      </CardContent>
    </Card>
  );
}
