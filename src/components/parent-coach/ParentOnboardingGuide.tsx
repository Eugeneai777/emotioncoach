import { Button } from "@/components/ui/button";
import { ClipboardList, Tent, ChevronRight, X } from "lucide-react";
import { useState, useEffect } from "react";

interface ParentOnboardingGuideProps {
  hasCompletedIntake: boolean;
  hasJoinedCamp: boolean;
  onStartIntake: () => void;
  onStartCamp: () => void;
  onViewCampDetails: () => void;
}

const DISMISS_KEY = "parent_onboarding_guide_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function ParentOnboardingGuide({
  hasCompletedIntake,
  hasJoinedCamp,
  onStartIntake,
  onStartCamp,
  onViewCampDetails,
}: ParentOnboardingGuideProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_KEY);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  };

  // If both completed or dismissed, don't show
  if ((hasCompletedIntake && hasJoinedCamp) || isDismissed) {
    return null;
  }

  // Case 1: Intake not completed
  if (!hasCompletedIntake) {
    return (
      <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-card-lg p-4 shadow-sm">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="稍后提醒"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 pr-6">
              <h4 className="font-medium text-foreground mb-1">完善你的亲子画像</h4>
              <p className="text-sm text-muted-foreground mb-3">
                花2分钟完成问卷，AI将为你定制专属的亲子对话体验
              </p>
              <Button
                onClick={onStartIntake}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                开始问卷
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Intake completed but not joined camp
  if (hasCompletedIntake && !hasJoinedCamp) {
    return (
      <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-card-lg p-4 shadow-sm">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="稍后提醒"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <Tent className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 pr-6">
              <h4 className="font-medium text-foreground mb-1">推荐：21天青少年困境突破营</h4>
              <p className="text-sm text-muted-foreground mb-3">
                通过父母三力模型，21天系统提升亲子关系
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={onStartCamp}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  开启训练营
                </Button>
                <Button
                  onClick={onViewCampDetails}
                  size="sm"
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  了解详情
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
