import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
interface Step {
  id: number;
  emoji?: string;
  name: string;
  subtitle: string;
  description: string;
  details?: string;
}
interface CoachEmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  steps: Step[];
  stepsTitle: string;
  stepsEmoji: string;
  primaryColor?: string;
  moreInfoRoute?: string;
  scenarios?: ReactNode;
  extraContent?: ReactNode;
  trainingCamp?: ReactNode;
  notifications?: ReactNode;
  community?: ReactNode;
}
export const CoachEmptyState = ({
  emoji,
  title,
  subtitle,
  description,
  gradient,
  steps,
  stepsTitle,
  stepsEmoji,
  primaryColor = "primary",
  moreInfoRoute,
  scenarios,
  extraContent,
  trainingCamp,
  notifications,
  community
}: CoachEmptyStateProps) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Title Section */}
      <div className="text-center space-y-2 md:space-y-3 py-4 md:py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>

      {/* Steps Card - 情绪四部曲风格 */}
      <div className="bg-card border border-border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
        <div className="animate-in fade-in-50 duration-300">
          <div className="mb-card-gap flex items-center justify-between">
            <h3 className="font-medium text-foreground flex items-center gap-1.5 text-sm">
              <span className="text-primary text-sm">{stepsEmoji}</span>
              {stepsTitle}
            </h3>
            {moreInfoRoute && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => navigate(moreInfoRoute)}
                className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
              >
                了解更多 →
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-card-gap">
            {steps.map((step) => (
              <Collapsible 
                key={step.id} 
                open={expandedStep === step.id} 
                onOpenChange={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="bg-background/50 rounded-card p-card-sm border border-border/50 hover:border-primary/30 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all">
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
                      {step.description}
                    </p>
                    {step.details && (
                      <p className="text-xs text-muted-foreground leading-snug whitespace-pre-line">
                        {step.details}
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>

      {/* Optional Scenarios */}
      {scenarios}

      {/* Training Camp */}
      {trainingCamp}

      {/* Notifications */}
      {notifications}

      {/* Community Waterfall */}
      {community}

      {/* Extra Content */}
      {extraContent}
    </div>
  );
};