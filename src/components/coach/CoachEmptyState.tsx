import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
interface Step {
  id: number;
  emoji?: string;
  name: string;
  subtitle?: string;
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
  enableCollapse?: boolean;
  voiceChatCTA?: ReactNode;
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
  campRecommendation,
  enableCollapse = false,
  voiceChatCTA
}: CoachEmptyStateProps) => {
  const navigate = useNavigate();
  const [isStepsExpanded, setIsStepsExpanded] = useState(!enableCollapse);

  // 根据主题色获取步骤卡片样式
  const getStepCardStyle = () => {
    if (primaryColor === 'pink') {
      return 'bg-gradient-to-br from-pink-50/80 to-rose-50/60 dark:from-pink-950/30 dark:to-rose-950/20 border-pink-200/50 dark:border-pink-800/30';
    }
    return 'bg-background/50 border-border/50';
  };
  const getStepIconStyle = () => {
    if (primaryColor === 'pink') {
      return 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400';
    }
    return 'bg-primary/15 text-primary';
  };

  // Render steps content (shared between collapse and non-collapse modes)
  const renderStepsContent = () => <div className="grid grid-cols-2 gap-card-gap">
      {steps.map(step => <div key={step.id} className={`rounded-card p-card-sm border ${getStepCardStyle()} transition-all duration-300 hover:shadow-md`}>
          <div className="flex items-center gap-1.5 mb-2">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${getStepIconStyle()}`}>
              {step.emoji || step.id}
            </div>
            <div className="flex-1 text-left min-w-0">
              <h4 className="font-medium text-foreground text-sm">
                {step.name}
              </h4>
              <p className="text-xs text-muted-foreground">{step.subtitle}</p>
            </div>
          </div>
          
          {step.details && <p className="text-xs text-muted-foreground leading-snug mt-1 whitespace-pre-line">
              {step.details}
            </p>}
        </div>)}
    </div>;
  return <div className="space-y-2 md:space-y-3">
      {/* Voice Chat CTA - 当有居中CTA时，替代原有标题区 */}
      {voiceChatCTA ? voiceChatCTA : (/* Title Section */
    <div className="text-center space-y-2 md:space-y-3 pt-4 md:pt-6 pb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>)}

      {/* Steps Card or Daily Reminder */}
      {showDailyReminder && dailyReminderContent ? <div className="bg-card border border-border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
          {dailyReminderContent}
        </div> : enableCollapse ? (/* Collapsible mode for emotion coach */
    <Collapsible open={isStepsExpanded} onOpenChange={setIsStepsExpanded}>
          <div className={`border rounded-card-lg p-3 text-left shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200 ${primaryColor === 'pink' ? 'bg-white/60 dark:bg-pink-950/30 backdrop-blur-sm border-rose-200/40 dark:border-pink-800/30' : 'bg-card/60 backdrop-blur-sm border-border/50'}`}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer flex-1">
                  <h3 className={`font-medium flex items-center gap-1.5 text-sm ${primaryColor === 'pink' ? 'text-pink-800 dark:text-pink-200' : 'text-foreground'}`}>
                    <span className={`text-sm ${primaryColor === 'pink' ? 'text-pink-500' : 'text-primary'}`}>{stepsEmoji}</span>
                    {stepsTitle}
                  </h3>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${primaryColor === 'pink' ? 'text-pink-400' : 'text-muted-foreground'} ${isStepsExpanded ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              {moreInfoRoute && <span role="button" onClick={() => navigate(moreInfoRoute)} className={`text-xs hover:opacity-80 cursor-pointer ${primaryColor === 'pink' ? 'text-pink-600 dark:text-pink-400' : 'text-primary'}`}>
                  了解更多 →
                </span>}
            </div>
            <CollapsibleContent className="mt-3">
              {renderStepsContent()}
            </CollapsibleContent>
          </div>
        </Collapsible>) : (/* Non-collapsible mode for parent/communication/gratitude coach */
    <div className={`border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200 ${primaryColor === 'pink' ? 'bg-gradient-to-br from-pink-50/90 to-rose-50/70 dark:from-pink-950/40 dark:to-rose-950/30 border-pink-200/60 dark:border-pink-800/40' : 'bg-card border-border'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium flex items-center gap-1.5 text-sm ${primaryColor === 'pink' ? 'text-pink-800 dark:text-pink-200' : 'text-foreground'}`}>
              <span className={`text-sm ${primaryColor === 'pink' ? 'text-pink-500' : 'text-primary'}`}>{stepsEmoji}</span>
              {stepsTitle}
            </h3>
            {moreInfoRoute && <span role="button" onClick={() => navigate(moreInfoRoute)} className={`text-xs hover:opacity-80 cursor-pointer ${primaryColor === 'pink' ? 'text-pink-600 dark:text-pink-400' : 'text-primary'}`}>
                了解更多 →
              </span>}
          </div>
          {renderStepsContent()}
        </div>)}

      {/* Optional Scenarios */}
      {scenarios}

      {/* Camp Recommendation */}
      {campRecommendation}

      {/* Training Camp */}
      {trainingCamp}

      {/* Notifications */}
      {notifications}

      {/* Community Waterfall */}
      {community && <div className="pt-2">
          
          {community}
        </div>}

      {/* Extra Content */}
      {extraContent}
    </div>;
};