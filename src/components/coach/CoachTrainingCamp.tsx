import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, ChevronRight } from "lucide-react";
import { TrainingCampCard } from "@/components/camp/TrainingCampCard";
import { TrainingCamp } from "@/types/trainingCamp";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CoachTrainingCampProps {
  activeCamp?: TrainingCamp | null;
  onStartCamp?: () => void;
  onViewDetails?: () => void;
  onCheckIn?: () => void;
  colorTheme?: 'green' | 'purple' | 'blue' | 'orange' | 'pink' | 'amber';
  campName?: string;
  campDescription?: string;
  campType?: string;
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
  },
  pink: {
    gradient: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/10',
    border: 'border-pink-200/50 dark:border-pink-800/30',
    title: 'text-pink-800 dark:text-pink-200',
    button: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white',
    outline: 'border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-pink-700 dark:text-pink-400',
    icon: Heart
  },
  amber: {
    gradient: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/10',
    border: 'border-amber-200/50 dark:border-amber-800/30',
    title: 'text-amber-800 dark:text-amber-200',
    button: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white',
    outline: 'border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400',
    icon: Sparkles
  }
};

export const CoachTrainingCamp = ({
  activeCamp: externalActiveCamp,
  onStartCamp: externalOnStartCamp,
  onViewDetails: externalOnViewDetails,
  onCheckIn,
  colorTheme = "green",
  campName,
  campDescription,
  campType,
  requireIntake = false,
  intakeRoute = "/parent/intake"
}: CoachTrainingCampProps & { 
  requireIntake?: boolean; 
  intakeRoute?: string;
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const theme = themeStyles[colorTheme];
  const IconComponent = theme.icon;

  // 检查用户是否已完成入驻问卷（仅当 requireIntake 为 true 时）
  const { data: intakeProfile } = useQuery({
    queryKey: ['parent-intake-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('parent_problem_profile')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && requireIntake
  });

  // 如果提供了 campType，从数据库查询训练营模板和用户训练营
  const { data: campTemplate } = useQuery({
    queryKey: ['camp-template', campType],
    queryFn: async () => {
      if (!campType) return null;
      const { data } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('camp_type', campType)
        .single();
      return data;
    },
    enabled: !!campType
  });

  const { data: userCamp } = useQuery({
    queryKey: ['user-camp', campType, user?.id],
    queryFn: async () => {
      if (!user || !campType) return null;
      const { data } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('camp_type', campType)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as TrainingCamp | null;
    },
    enabled: !!user && !!campType
  });

  // 使用外部传入的 activeCamp 或查询到的 userCamp
  const activeCamp = externalActiveCamp !== undefined ? externalActiveCamp : userCamp;
  
  // 显示的训练营名称和描述
  const displayName = campName || campTemplate?.camp_name || "21天训练营";
  const displayDescription = campDescription || campTemplate?.camp_subtitle || "用21天养成习惯，获得专属徽章和成长洞察";

  const handleStartCamp = () => {
    // 如果需要先完成问卷且用户未完成，跳转到问卷页面
    if (requireIntake && !intakeProfile) {
      navigate(intakeRoute);
      return;
    }
    
    if (externalOnStartCamp) {
      externalOnStartCamp();
    } else if (activeCamp) {
      navigate(`/camp-check-in?campId=${activeCamp.id}`);
    } else {
      setShowStartDialog(true);
    }
  };

  const handleViewDetails = () => {
    if (externalOnViewDetails) {
      externalOnViewDetails();
    } else if (campTemplate) {
      navigate(`/camp-template/${campTemplate.id}`);
    }
  };

  // 如果使用 campType 但模板未加载，不渲染
  if (campType && !campTemplate) return null;

  if (!activeCamp) {
    return (
      <>
        <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className={`${theme.gradient} ${theme.border} border rounded-xl p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.title}`}>
                🏕️ {displayName}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {displayDescription}
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={handleStartCamp} 
                className={`flex-1 ${theme.button}`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                开启训练营
              </Button>
              <Button 
                variant="outline" 
                onClick={handleViewDetails}
                className={`flex-1 ${theme.outline}`}
              >
                了解详情
              </Button>
            </div>
          </div>
        </div>
        {campTemplate && (
          <StartCampDialog
            open={showStartDialog}
            onOpenChange={setShowStartDialog}
            campTemplate={campTemplate}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <TrainingCampCard camp={activeCamp} onCheckIn={onCheckIn} />
      </div>
      {campTemplate && (
        <StartCampDialog
          open={showStartDialog}
          onOpenChange={setShowStartDialog}
          campTemplate={campTemplate}
        />
      )}
    </>
  );
};
