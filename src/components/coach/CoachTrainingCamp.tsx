import { Button } from "@/components/ui/button";
import { Sparkles, Heart } from "lucide-react";
import { TrainingCampCard } from "@/components/camp/TrainingCampCard";
import { TrainingCamp } from "@/types/trainingCamp";

interface CoachTrainingCampProps {
  activeCamp: TrainingCamp | null;
  onStartCamp: () => void;
  onViewDetails: () => void;
  onCheckIn?: () => void;
  colorTheme?: 'green' | 'purple' | 'blue' | 'orange';
  campName?: string;
  campDescription?: string;
}

const themeStyles = {
  green: {
    gradient: 'bg-gradient-to-br from-teal-50/80 via-cyan-50/50 to-blue-50/30 dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10',
    border: 'border-teal-200/40 dark:border-teal-800/30',
    title: 'text-teal-800 dark:text-teal-200',
    button: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white',
    outline: 'border-teal-300/50 text-teal-700 hover:bg-teal-50/50 dark:border-teal-700/50 dark:text-teal-400',
    icon: Sparkles
  },
  purple: {
    gradient: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10',
    border: 'border-purple-200/50 dark:border-purple-800/30',
    title: 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent',
    button: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
    outline: 'border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400',
    icon: Heart
  },
  blue: {
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10',
    border: 'border-blue-200/50 dark:border-blue-800/30',
    title: 'text-blue-800 dark:text-blue-200',
    button: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white',
    outline: 'border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400',
    icon: Sparkles
  },
  orange: {
    gradient: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10',
    border: 'border-orange-200/50 dark:border-orange-800/30',
    title: 'text-orange-800 dark:text-orange-200',
    button: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white',
    outline: 'border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400',
    icon: Sparkles
  }
};

export const CoachTrainingCamp = ({
  activeCamp,
  onStartCamp,
  onViewDetails,
  onCheckIn,
  colorTheme = "green",
  campName = "21天训练营",
  campDescription = "用21天养成习惯，获得专属徽章和成长洞察"
}: CoachTrainingCampProps) => {
  const theme = themeStyles[colorTheme];
  const IconComponent = theme.icon;

  if (!activeCamp) {
    return (
      <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <div className={`${theme.gradient} ${theme.border} border rounded-xl p-5 shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.title}`}>
              🏕️ {campName}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {campDescription}
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={onStartCamp} 
              className={`flex-1 ${theme.button}`}
            >
              <IconComponent className="h-4 w-4 mr-2" />
              开启训练营
            </Button>
            <Button 
              variant="outline" 
              onClick={onViewDetails}
              className={`flex-1 ${theme.outline}`}
            >
              了解详情
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <TrainingCampCard camp={activeCamp} onCheckIn={onCheckIn} />
    </div>
  );
};
