import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tent, Sparkles, ChevronRight } from "lucide-react";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const CommunicationTrainingCampModule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showStartDialog, setShowStartDialog] = useState(false);

  // 查询身份绽放训练营模板
  const { data: campTemplate } = useQuery({
    queryKey: ['camp-template', 'identity_bloom'],
    queryFn: async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('camp_type', 'identity_bloom')
        .single();
      return data;
    }
  });

  // 查询用户是否已加入该训练营
  const { data: existingCamp } = useQuery({
    queryKey: ['user-camp', 'identity_bloom', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('camp_type', 'identity_bloom')
        .eq('status', 'active')
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  if (!campTemplate) return null;

  const handleStartCamp = () => {
    if (existingCamp) {
      navigate(`/camp-check-in?campId=${existingCamp.id}`);
    } else {
      setShowStartDialog(true);
    }
  };

  const handleLearnMore = () => {
    navigate(`/camp-template/${campTemplate.id}`);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-card-lg p-card-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-sm">
            <Tent className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
              {campTemplate.icon} {campTemplate.camp_name}
              {existingCamp && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full">
                  进行中
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {campTemplate.camp_subtitle || `${campTemplate.duration_days}天提升职场沟通力，建立有影响力的表达方式`}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-muted-foreground">系统化的沟通方法论</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-muted-foreground">真实场景的沟通演练</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-muted-foreground">AI教练全程陪伴</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleStartCamp}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm"
          >
            {existingCamp ? '继续训练' : '加入训练营'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLearnMore}
            className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50"
          >
            了解详情
          </Button>
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
};
