import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Step {
  id: number;
  emoji?: string;
  name: string;
  subtitle: string;
  description: string;
  details?: string;
}

interface CoachStepsCardProps {
  title: string;
  titleEmoji: string;
  steps: Step[];
  moreInfoRoute?: string;
  primaryColor?: string;
}

export const CoachStepsCard = ({ 
  title, 
  titleEmoji, 
  steps, 
  moreInfoRoute,
  primaryColor = "primary"
}: CoachStepsCardProps) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground flex items-center gap-1.5 text-sm">
          <span className={`text-${primaryColor} text-sm`}>{titleEmoji}</span>
          {title}
        </h3>
        {moreInfoRoute && (
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => window.location.href = moreInfoRoute}
            className={`text-xs text-${primaryColor} hover:text-${primaryColor}/80 p-0 h-auto`}
          >
            了解更多 →
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {steps.map((step) => (
          <Collapsible 
            key={step.id}
            open={expandedStep === step.id} 
            onOpenChange={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
          >
            <CollapsibleTrigger className="w-full">
              <div className={`bg-background/50 rounded-card p-card-sm border border-border/50 hover:border-${primaryColor}/30 transition-all duration-200 group cursor-pointer`}>
                <div className="flex items-center gap-1.5">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-${primaryColor}/15 text-${primaryColor} flex items-center justify-center font-bold text-xs group-hover:bg-${primaryColor} group-hover:text-${primaryColor}-foreground transition-all`}>
                    {step.emoji || step.id}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate">
                      {step.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">{step.subtitle}</p>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expandedStep === step.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1">
              <div className="bg-background/30 rounded-card p-card-sm border border-border/30 space-y-1">
                <p className="text-xs text-foreground leading-snug">
                  {step.details || step.description}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};
