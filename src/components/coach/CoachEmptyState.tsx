import { ReactNode, useState, useEffect } from "react";
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
  subtitle?: string;
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
  dailyReminderContent?: ReactNode;
  showDailyReminder?: boolean;
  campRecommendation?: ReactNode;
}
export const CoachEmptyState = ({
  emoji,
  title,
  subtitle = "",
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
  community,
  dailyReminderContent,
  showDailyReminder = false,
  campRecommendation
}: CoachEmptyStateProps) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [isStepsCardExpanded, setIsStepsCardExpanded] = useState(true);
  const navigate = useNavigate();

  // 首次访问展开，再次访问折叠
  useEffect(() => {
    const storageKey = `has_seen_${stepsTitle.replace(/\s/g, '_')}_steps_card`;
    const hasSeen = localStorage.getItem(storageKey);
    if (hasSeen) {
      setIsStepsCardExpanded(false);
    } else {
      localStorage.setItem(storageKey, 'true');
    }
  }, [stepsTitle]);

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Title Section */}
      <div className="text-center space-y-2 md:space-y-3 pt-4 md:pt-6 pb-0">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>

      {/* Steps Card or Daily Reminder - 可折叠 */}
      {showDailyReminder && dailyReminderContent ? (
        <div className="bg-card border border-border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
          {dailyReminderContent}
        </div>
      ) : (
      <Collapsible open={isStepsCardExpanded} onOpenChange={setIsStepsCardExpanded}>
        <div className="bg-card border border-border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
          <CollapsibleTrigger className="w-full flex items-center justify-between cursor-pointer bg-transparent border-0 p-0 text-left">
              <h3 className="font-medium text-foreground flex items-center gap-1.5 text-sm">
                <span className="text-primary text-sm">{stepsEmoji}</span>
                {stepsTitle}
              </h3>
              <div className="flex items-center gap-2">
                {moreInfoRoute && (
                  <span 
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(moreInfoRoute);
                    }}
                    className="text-xs text-primary hover:text-primary/80 cursor-pointer"
                  >
                    了解更多 →
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isStepsCardExpanded ? 'rotate-180' : ''}`} />
              </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-card-gap mt-card-gap">
              {steps.map((step) => (
                <Collapsible 
                  key={step.id} 
                  open={expandedStep === step.id} 
                  onOpenChange={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <CollapsibleTrigger className="w-full bg-background/50 rounded-card p-card-sm border border-border/50 hover:border-primary/30 transition-all duration-200 group cursor-pointer text-left">
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
          </CollapsibleContent>
        </div>
      </Collapsible>
      )}

      {/* Optional Scenarios */}
      {scenarios}

      {/* Camp Recommendation */}
      {campRecommendation}

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