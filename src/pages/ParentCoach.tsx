import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { CoachScenarioChips } from "@/components/coach/CoachScenarioChips";
import { UnifiedStageProgress } from "@/components/coach/UnifiedStageProgress";
import { useParentCoach } from "@/hooks/useParentCoach";
import { useAuth } from "@/hooks/useAuth";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { useParentIntake } from "@/hooks/useParentIntake";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { CoachNotificationsModule } from "@/components/coach/CoachNotificationsModule";
import { CoachTrainingCamp } from "@/components/coach/CoachTrainingCamp";
import CommunityWaterfall from "@/components/community/CommunityWaterfall";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import BriefingShareDialog from "@/components/briefing/BriefingShareDialog";
import { ParentTeenBinding } from "@/components/parent-coach/ParentTeenBinding";
import { ProblemTypeCard } from "@/components/parent-coach/ProblemTypeCard";
import { TeenUsageStats } from "@/components/parent-coach/TeenUsageStats";
import { ParentVoiceCallCTA } from "@/components/parent-coach/ParentVoiceCallCTA";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { Sparkles, Heart, Users, ClipboardList, ChevronRight } from "lucide-react";

export default function ParentCoach() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campId = searchParams.get('campId');
  const { toast } = useToast();
  const initRef = useRef(false);
  
  const {
    session,
    messages,
    isLoading,
    isCreating,
    videoRecommendations,
    createSession,
    sendMessage,
    addAssistantMessage,
    fetchRecommendations,
    resetRecommendations
  } = useParentCoach();

  const [input, setInput] = useState("");
  const [briefing, setBriefing] = useState<any>(null);
  const [pendingBriefing, setPendingBriefing] = useState<any>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);

  const { user, loading: authLoading, signOut } = useAuth();
  const { data: coachConfig } = useCoachTemplate('parent');
  const { existingProfile, profileLoading } = useParentIntake();

  // Fetch active bindings for teen usage stats
  const { data: activeBindings } = useQuery({
    queryKey: ['parent-teen-bindings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('parent_teen_bindings')
        .select('id, teen_user_id, teen_nickname, status')
        .eq('parent_user_id', user.id)
        .eq('status', 'active');
      return data || [];
    },
    enabled: !!user?.id
  });

  // 获取家长训练营模板
  const { data: parentCampTemplate } = useQuery({
    queryKey: ['camp-template', 'parent_emotion_21'],
    queryFn: async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('camp_type', 'parent_emotion_21')
        .single();
      return data;
    }
  });

  // 查询用户是否已有家长训练营
  const { data: existingParentCamp } = useQuery({
    queryKey: ['existing-parent-camp', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('training_camps')
        .select('id, camp_name, current_day')
        .eq('user_id', user.id)
        .eq('camp_type', 'parent_emotion_21')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  const hasJoinedParentCamp = !!existingParentCamp;

  const { 
    notifications, 
    loading: notificationsLoading,
    markAsRead, 
    deleteNotification,
    triggerNotification,
  } = useSmartNotification('parent_coach');

  // No intake guide card - users can chat directly without completing questionnaire

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const initSession = async () => {
      if (initRef.current || session || isCreating) return;
      if (user) {
        initRef.current = true;
        await createSession(campId || undefined);
      }
    };
    initSession();
  }, [user, session, isCreating]);

  const formatBriefingMessage = (briefingData: any): string => {
    return `🌿 《亲子情绪四部曲简报》

🎭 今日主题情绪
${briefingData.emotion_theme}

📖 情绪四部曲旅程

1️⃣ 觉察（Feel it）
${briefingData.stage_1_content || '暂无记录'}

2️⃣ 看见（See it）
${briefingData.stage_2_content || '暂无记录'}

3️⃣ 反应（Sense it）
${briefingData.stage_3_content || '暂无记录'}

4️⃣ 转化（Transform it）
${briefingData.stage_4_content || '暂无记录'}

💡 今日洞察
${briefingData.insight || '暂无记录'}

✅ 今日行动
${briefingData.action || '暂无记录'}

🌸 1mm的松动
${briefingData.growth_story || '暂无记录'}

💾 简报已自动保存到你的亲子日记中`;
  };

  const handleSendMessage = async (message: string) => {
    const response = await sendMessage(message);
    if (response?.completed && response?.briefingId) {
      setPendingBriefing(response.toolCall?.args);
    }
  };

  const handleGenerateBriefing = async () => {
    if (pendingBriefing) {
      const briefingMessage = formatBriefingMessage(pendingBriefing);
      addAssistantMessage(briefingMessage);
      setBriefing(pendingBriefing);
      await fetchRecommendations(pendingBriefing);
      setPendingBriefing(null);
      
      // 触发智能通知
      triggerNotification('after_parent', {
        parent_theme: pendingBriefing.emotion_theme,
        emotion_intensity: pendingBriefing.emotion_intensity,
      });
      
      toast({
        title: "简报已生成",
        description: "已保存到你的亲子日记中"
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await handleSendMessage(input);
    setInput("");
  };

  const handleRestart = () => {
    setBriefing(null);
    setPendingBriefing(null);
    resetRecommendations();
    initRef.current = false;
    createSession(campId || undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleOptionClick = async (option: string) => {
    await handleSendMessage(option);
  };

  // Training Camp Module
  const trainingCampModule = (
    <div className="w-full mt-6">
      <CoachTrainingCamp
        onViewDetails={() => navigate("/parent-camp")}
        colorTheme="purple"
        campName="21天青少年困境突破营"
        campDescription="通过父母三力模型（稳定力、洞察力、修复力），21天系统提升亲子关系"
        campType="parent_emotion_21"
        requireIntake={true}
        intakeRoute="/parent/intake"
      />
    </div>
  );

  // Teen Mode Module
  const teenModeModule = (
    <div className="w-full mt-6 space-y-4">

      {/* Problem Type Card */}
      {existingProfile && (
        <ProblemTypeCard
          primaryType={existingProfile.primary_problem_type}
          secondaryTypes={existingProfile.secondary_problem_types as string[] | undefined}
        />
      )}

      {/* Parent-Teen Binding */}
      <ParentTeenBinding />

      {/* Teen Usage Stats */}
      {activeBindings && activeBindings.length > 0 && (
        <TeenUsageStats
          teenUserId={activeBindings[0].teen_user_id || undefined}
          bindingId={activeBindings[0].id}
        />
      )}
    </div>
  );

  // Notifications Module - using shared component
  const notificationsModule = (
    <CoachNotificationsModule
      notifications={notifications}
      loading={notificationsLoading}
      currentIndex={currentNotificationIndex}
      onIndexChange={setCurrentNotificationIndex}
      onMarkAsRead={markAsRead}
      onDelete={deleteNotification}
      colorTheme="purple"
      coachLabel="亲子教练"
    />
  );

  // Briefing Confirmation
  const briefingConfirmation = pendingBriefing && !isLoading ? (
    <div className="flex justify-start animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-card-lg p-card shadow-lg max-w-[85%]">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-2">你今天太棒了！🎉</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                完成了一次完整的情绪觉察之旅，亲子关系又松动了1mm。要不要生成简报，记录今天的成长？
              </p>
              <p className="text-xs text-muted-foreground mt-2 opacity-75">简报将直接显示在对话中</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateBriefing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Heart className="w-4 h-4 mr-2" />
              生成简报
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Camp Recommendation after briefing
  const campRecommendation = briefing && !pendingBriefing && videoRecommendations.length > 0 ? (
    <div className="flex justify-start animate-in fade-in-50 slide-in-from-bottom-4 duration-500 mt-4">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-card-lg p-card shadow-lg max-w-[85%]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏕️</span>
            <h4 className="font-semibold text-purple-700">推荐：21天青少年困境突破营</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            通过父母三力模型（稳定力、洞察力、修复力），21天系统提升亲子关系
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (hasJoinedParentCamp && existingParentCamp) {
                  navigate(`/camp/${existingParentCamp.id}`);
                } else {
                  setShowStartDialog(true);
                }
              }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              size="sm"
            >
              <Heart className="w-4 h-4 mr-1" />
              {hasJoinedParentCamp ? '进入训练营' : '加入训练营'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/parent-camp")}
              size="sm"
              className="border-purple-300 text-purple-600"
            >
              了解详情
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Dialogs
  const dialogs = (
    <>
      {parentCampTemplate && (
        <StartCampDialog 
          open={showStartDialog}
          onOpenChange={setShowStartDialog}
          campTemplate={parentCampTemplate}
          onSuccess={(campId) => navigate(`/camp/${campId}`)}
        />
      )}
      {briefing && (
        <BriefingShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          coachType="parent"
          briefingId={briefing.id || session?.id || ''}
          emotionTheme={briefing.theme}
          insight={briefing.insight}
          action={briefing.action}
          growthStory={briefing.growthStory}
        />
      )}
      {showVoiceChat && (
        <CoachVoiceChat
          onClose={() => setShowVoiceChat(false)}
          coachEmoji={coachConfig?.emoji || "💜"}
          coachTitle="亲子教练"
          primaryColor="purple"
          tokenEndpoint="vibrant-life-realtime-token"
          mode={existingProfile ? 'parent_teen' : 'general'}
        />
      )}
    </>
  );

  return (
    <CoachLayout
      emoji={coachConfig?.emoji || "💜"}
      title={coachConfig?.title || "亲子教练"}
      subtitle={coachConfig?.subtitle || ""}
      description={coachConfig?.description || "跟劲老师一起，化解亲子情绪困扰"}
      gradient={coachConfig?.gradient || "from-purple-500 to-pink-500"}
      primaryColor={coachConfig?.primary_color || "purple"}
      steps={coachConfig?.steps || []}
      stepsTitle={coachConfig?.steps_title || "亲子情绪四部曲"}
      stepsEmoji={coachConfig?.steps_emoji || "💜"}
      moreInfoRoute="/parent-coach-intro"
      historyRoute="/parent-diary"
      historyLabel="亲子日记"
      messages={messages.map(m => ({ ...m, role: m.role as "user" | "assistant" }))}
      isLoading={isLoading}
      input={input}
      onInputChange={setInput}
      onSend={handleSend}
      onNewConversation={handleRestart}
      onOptionClick={handleOptionClick}
      placeholder="分享一件亲子互动中的小事..."
      currentCoachKey="parent"
      stageProgress={
        messages.length > 0 && session ? (
          <UnifiedStageProgress coachType="parent" currentStage={session.current_stage || 0} />
        ) : undefined
      }
      trainingCamp={trainingCampModule}
      notifications={notificationsModule}
      community={<CommunityWaterfall />}
      briefingConfirmation={briefingConfirmation}
      campRecommendation={campRecommendation}
      scenarioChips={
        coachConfig?.enable_scenarios && coachConfig?.scenarios ? (
          <CoachScenarioChips
            scenarios={coachConfig.scenarios as any[]}
            onSelectScenario={async (prompt) => {
              setInput("");
              await handleSendMessage(prompt);
            }}
            primaryColor={coachConfig.primary_color}
          />
        ) : undefined
      }
      enableVoiceInput={true}
      enableStepsCollapse={true}
      voiceChatCTA={
        <ParentVoiceCallCTA
          onVoiceChatClick={() => setShowVoiceChat(true)}
          hasCompletedIntake={!!existingProfile}
        />
      }
      dialogs={dialogs}
    />
  );
}
