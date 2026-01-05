import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CoachThemeConfig } from "@/hooks/useCoachTemplates";
import { 
  getThemeStepCardStyle, 
  getThemeStepIconStyle, 
  getThemeAccentColor,
  getThemeTextColor,
  getThemeSecondaryTextColor 
} from "@/utils/coachThemeConfig";

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
  themeConfig?: CoachThemeConfig;
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
  themeConfig,
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
  const storageKey = 'coach_steps_collapsed';
  
  // 从 localStorage 读取初始状态
  const getInitialState = () => {
    if (!enableCollapse) return true; // 不启用折叠时始终展开
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      return saved === 'false'; // 存储的是折叠状态，反转为展开状态
    }
    return false; // 默认折叠
  };

  const [isStepsExpanded, setIsStepsExpanded] = useState(getInitialState);

  // 当状态改变时保存到 localStorage
  const handleExpandChange = (expanded: boolean) => {
    setIsStepsExpanded(expanded);
    if (enableCollapse) {
      localStorage.setItem(storageKey, String(!expanded)); // 存储折叠状态
    }
  };

  // 使用统一主题配置
  const stepCardStyle = getThemeStepCardStyle(primaryColor, themeConfig);
  const stepIconStyle = getThemeStepIconStyle(primaryColor, themeConfig);
  const accentColor = getThemeAccentColor(primaryColor, themeConfig);
  const textColorClass = getThemeTextColor(primaryColor, themeConfig);
  const secondaryTextColorClass = getThemeSecondaryTextColor(primaryColor, themeConfig);

  // 根据主题色获取步骤卡片样式
  const getStepCardStyle = () => {
    if (primaryColor === 'purple') {
      return 'bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-rose-50/50 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-rose-950/20 border-purple-200/50 dark:border-purple-800/30';
    }
    if (primaryColor === 'pink') {
      return 'bg-gradient-to-br from-pink-50/80 to-rose-50/60 dark:from-pink-950/30 dark:to-rose-950/20 border-pink-200/50 dark:border-pink-800/30';
    }
    return 'bg-background/50 border-border/50';
  };
  const getStepIconStyle = () => {
    if (primaryColor === 'purple') {
      return 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400';
    }
    if (primaryColor === 'pink') {
      return 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400';
    }
    return 'bg-primary/15 text-primary';
  };

  // Render steps content (shared between collapse and non-collapse modes)
  const renderStepsContent = () => (
    <div className="grid grid-cols-2 gap-card-gap">
      {steps.map(step => (
        <div key={step.id} className={`rounded-card p-card-sm border ${stepCardStyle} transition-all duration-300 hover:shadow-md`}>
          <div className="flex items-center gap-1.5 mb-2">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${stepIconStyle}`}>
              {step.emoji || step.id}
            </div>
            <div className="flex-1 text-left min-w-0">
              <h4 className="font-medium text-foreground text-sm">
                {step.name}
              </h4>
              <p className="text-xs text-muted-foreground">{step.subtitle}</p>
            </div>
          </div>
          
          {step.details && (
            <p className="text-xs text-muted-foreground leading-snug mt-1 whitespace-pre-line">
              {step.details}
            </p>
          )}
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-2 md:space-y-3">
      {/* Voice Chat CTA - 当有居中CTA时，替代原有标题区 */}
      {voiceChatCTA ? (
        <div className="mb-6 md:mb-8">
          {voiceChatCTA}
        </div>
      ) : (
        /* Title Section */
        <div className="text-center space-y-2 md:space-y-3 pt-4 md:pt-6 pb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>
      )}

      {/* Steps Card or Daily Reminder */}
      {showDailyReminder && dailyReminderContent ? (
        <div className="bg-card border border-border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
          {dailyReminderContent}
        </div>
      ) : enableCollapse ? (
        /* Collapsible mode for emotion coach */
        <Collapsible open={isStepsExpanded} onOpenChange={handleExpandChange}>
          <div className={`border rounded-card-lg p-3 text-left shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200 ${stepCardStyle}`}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer flex-1">
                  <h3 className={`font-medium flex items-center gap-1.5 text-sm ${textColorClass}`}>
                    <span className={`text-sm text-${accentColor}-500`}>{stepsEmoji}</span>
                    {stepsTitle}
                  </h3>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-${accentColor}-400 ${isStepsExpanded ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              {moreInfoRoute && (
                <span 
                  role="button" 
                  onClick={() => navigate(moreInfoRoute)} 
                  className={`text-xs hover:opacity-80 cursor-pointer ${secondaryTextColorClass}`}
                >
                  了解更多 →
                </span>
              )}
            </div>
            <CollapsibleContent className="mt-3">
              {renderStepsContent()}
            </CollapsibleContent>
          </div>
        </Collapsible>
      ) : (
        /* Non-collapsible mode for parent/communication/gratitude coach */
        <div className={`border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200 ${stepCardStyle}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium flex items-center gap-1.5 text-sm ${textColorClass}`}>
              <span className={`text-sm text-${accentColor}-500`}>{stepsEmoji}</span>
              {stepsTitle}
            </h3>
            {moreInfoRoute && (
              <span 
                role="button" 
                onClick={() => navigate(moreInfoRoute)} 
                className={`text-xs hover:opacity-80 cursor-pointer ${secondaryTextColorClass}`}
              >
                了解更多 →
              </span>
            )}
          </div>
          {renderStepsContent()}
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
      {community && (
        <div className="pt-2">
          {community}
        </div>
      )}

      {/* Extra Content */}
      {extraContent}
    </div>
  );
};