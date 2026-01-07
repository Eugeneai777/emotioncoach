import { Card } from "@/components/ui/card";
import { ClipboardCheck, Tent, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface WealthTrilogyCardProps {
  className?: string;
}

export const WealthTrilogyCard = ({ className }: WealthTrilogyCardProps) => {
  const navigate = useNavigate();

  const steps = [
    {
      step: 1,
      title: "财富卡点测评",
      subtitle: "30道题深度分析",
      icon: ClipboardCheck,
      gradient: "from-purple-500 to-violet-500",
      bgGlow: "bg-purple-500/20",
      onClick: () => navigate("/wealth-block"),
      isPrimary: true,
    },
    {
      step: 2,
      title: "21天训练营",
      subtitle: "五层同频突破",
      icon: Tent,
      gradient: "from-amber-500 to-orange-500",
      bgGlow: "bg-amber-500/20",
      onClick: () => navigate("/wealth-camp-intro"),
    },
    {
      step: 3,
      title: "每日邀请",
      subtitle: "共同突破成长",
      icon: Users,
      gradient: "from-emerald-500 to-teal-500",
      bgGlow: "bg-emerald-500/20",
      onClick: () => navigate("/share-invite"),
    },
  ];

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.step} className="relative flex items-center">
                <Card
                  onClick={step.onClick}
                  className={cn(
                    "relative w-[120px] bg-white/95 dark:bg-card/95 backdrop-blur border border-border/50 overflow-hidden transition-all active:scale-95 cursor-pointer",
                    step.isPrimary && "ring-2 ring-purple-400/50 ring-offset-1"
                  )}
                >
                  {/* Pulse effect for primary step */}
                  {step.isPrimary && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10 animate-pulse" />
                  )}
                  
                  <div className="relative p-3 flex flex-col items-center text-center gap-2">
                    {/* Step number badge */}
                    <div className={cn(
                      "absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white shadow-sm",
                      step.gradient
                    )}>
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md",
                      step.gradient
                    )}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-tight">{step.title}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{step.subtitle}</p>
                    </div>
                  </div>
                </Card>

                {/* Connection arrow */}
                {index < steps.length - 1 && (
                  <div className="flex items-center px-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-3 gap-4 relative">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <div key={step.step} className="relative">
              <Card
                onClick={step.onClick}
                className={cn(
                  "relative h-full bg-white/95 dark:bg-card/95 backdrop-blur border border-border/50 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group",
                  step.isPrimary && "ring-2 ring-purple-400/60 ring-offset-2"
                )}
              >
                {/* Glow effect on hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                  step.bgGlow
                )} />

                {/* Pulse for primary */}
                {step.isPrimary && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5" />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-500 text-white text-[9px] font-medium rounded">
                      推荐先做
                    </div>
                  </>
                )}

                <div className="relative p-4 flex flex-col items-center text-center gap-3">
                  {/* Step indicator */}
                  <div className={cn(
                    "text-xs font-bold bg-gradient-to-r bg-clip-text text-transparent",
                    step.gradient
                  )}>
                    Step {step.step}
                  </div>

                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform",
                    step.gradient
                  )}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
                  </div>

                  {/* CTA hint */}
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium bg-gradient-to-r bg-clip-text text-transparent mt-1",
                    step.gradient
                  )}>
                    点击开始
                    <ChevronRight className="w-3 h-3 text-amber-500" />
                  </div>
                </div>
              </Card>

              {/* Desktop connection arrow */}
              {index < steps.length - 1 && (
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <div className="w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-md">
                    <ChevronRight className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
