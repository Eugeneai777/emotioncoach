import { ReactNode } from "react";
import { CoachStepsCard } from "./CoachStepsCard";
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
  return <div className="space-y-6 md:space-y-8">
      {/* Title Section */}
      <div className="text-center space-y-3 md:space-y-4 py-8 md:py-12">
        
        <h1 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${gradient} text-transparent bg-clip-text`}>
          {title}
        </h1>
        
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
      </div>

      {/* Steps Card */}
      <CoachStepsCard title={stepsTitle} titleEmoji={stepsEmoji} steps={steps} moreInfoRoute={moreInfoRoute} primaryColor={primaryColor} />

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
    </div>;
};