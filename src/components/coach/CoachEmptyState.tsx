import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

      {/* Steps Card or Daily Reminder - 直接展示，无折叠 */}
      {showDailyReminder && dailyReminderContent ? (
        <div className="bg-card border border-border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
          {dailyReminderContent}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground flex items-center gap-1.5 text-sm">
              <span className="text-primary text-sm">{stepsEmoji}</span>
              {stepsTitle}
            </h3>
            {moreInfoRoute && (
              <span 
                role="button"
                onClick={() => navigate(moreInfoRoute)}
                className="text-xs text-primary hover:text-primary/80 cursor-pointer"
              >
                了解更多 →
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-card-gap">
            {steps.map((step) => (
              <div 
                key={step.id}
                className="bg-background/50 rounded-card p-card-sm border border-border/50"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                    {step.emoji || step.id}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-medium text-foreground text-sm">
                      {step.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                  </div>
                </div>
                <p className="text-xs text-foreground leading-snug">
                  {step.description}
                </p>
                {step.details && (
                  <p className="text-xs text-muted-foreground leading-snug mt-1 whitespace-pre-line">
                    {step.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
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
