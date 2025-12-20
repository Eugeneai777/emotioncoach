import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Heart, TrendingUp, Target, Mic, BookOpen } from "lucide-react";

interface WelcomeOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    icon: Heart,
    title: "欢迎来到情绪梳理教练",
    description: "劲老师会陪你一起走过情绪梳理4部曲的旅程",
    detail: "通过温柔的对话，帮助你觉察、理解、反应和转化情绪🌿",
  },
  {
    icon: BookOpen,
    title: "情绪四部曲流程",
    description: "1️⃣ 觉察情绪 → 2️⃣ 理解情绪 → 3️⃣ 反应觉察 → 4️⃣ 温柔转化",
    detail: "每个阶段都会提供选项帮助你找到最真实的声音，完成后自动生成情绪简报",
  },
  {
    icon: TrendingUp,
    title: "追踪你的情绪旅程",
    description: "查看历史简报和情绪趋势分析",
    detail: "通过可视化图表了解你的情绪模式，识别周期性规律和成长轨迹",
  },
  {
    icon: Target,
    title: "设定情绪管理目标",
    description: "建立每周或每月的情绪管理目标",
    detail: "追踪进度，获得成就徽章，庆祝每一个小小的成长💫",
  },
  {
    icon: Mic,
    title: "语音对话功能",
    description: "支持语音输入，让交流更自然",
    detail: "可以自定义语音性别和语速，选择你喜欢的陪伴方式",
  },
];

export const WelcomeOnboarding = ({ open, onComplete }: WelcomeOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideCloseButton className="max-w-md p-0 gap-0 border-border/50">
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                {currentStepData.title}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                {currentStepData.description}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground/80 pt-2">
                {currentStepData.detail}
              </p>
            </div>

            <div className="flex gap-1.5 pt-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-primary"
                      : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 md:p-6 bg-muted/30 border-t border-border/50">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一步
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 rounded-xl"
          >
            {currentStep === steps.length - 1 ? "开始使用" : "下一步"}
            {currentStep < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 ml-1" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
