import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { CoachScenarioChips } from "@/components/coach/CoachScenarioChips";
import { VideoRecommendationCard } from "@/components/coach/VideoRecommendationCard";
import { ToolRecommendationCard } from "@/components/coach/ToolRecommendationCard";
import { EmotionButtonRecommendationCard } from "@/components/coach/EmotionButtonRecommendationCard";
import { CampRecommendationCard } from "@/components/coach/CampRecommendationCard";
import { CoachNotificationsModule } from "@/components/coach/CoachNotificationsModule";
import { CoachTrainingCamp } from "@/components/coach/CoachTrainingCamp";
import { useDynamicCoachChat, CoachChatMode } from "@/hooks/useDynamicCoachChat";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCampEntitlement } from "@/hooks/useCampEntitlement";
import { useWeChatBindStatus } from "@/hooks/useWeChatBindStatus";
import { triggerFollowReminder } from "@/hooks/useFollowReminder";
import { Loader2 } from "lucide-react";
import { MeditationAnalysisIntro } from "@/components/wealth-camp/MeditationAnalysisIntro";

interface LocationState {
  initialMessage?: string;
  fromCamp?: boolean;
  fromAwakening?: boolean;
  campId?: string;
  dayNumber?: number;
  meditationTitle?: string;
  sessionId?: string;
}

const COACH_KEY = "wealth_coach_4_questions";

const WealthCoachChat = () => {
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const [input, setInput] = useState("");
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: template, isLoading: templateLoading } = useCoachTemplate(COACH_KEY);

  // 检查财富训练营权益
  const { data: campEntitlement } = useCampEntitlement('wealth_block_7');

  // 微信绑定状态
  const { isBound, isEmailUser } = useWeChatBindStatus();

  // 智能通知
  const coachTypeForNotifications = 'wealth_coach_4_questions_coach';
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    deleteNotification,
    triggerNotification,
  } = useSmartNotification(coachTypeForNotifications);

  // 简报生成后触发智能通知
  const handleBriefingGenerated = (briefingData: any) => {
    if (!template?.coach_key) return;

    triggerNotification('after_wealth_coaching', {
      emotion_theme: briefingData.emotion_theme,
      emotion_intensity: briefingData.emotion_intensity,
      behavior_insight: briefingData.behavior_insight,
      emotion_insight: briefingData.emotion_insight,
      belief_insight: briefingData.belief_insight,
      giving_action: briefingData.giving_action,
    });

    if (isEmailUser && !isBound) {
      const COACH_REMINDER_SHOWN_KEY = 'coach_follow_reminder_shown';
      const alreadyShown = localStorage.getItem(COACH_REMINDER_SHOWN_KEY);
      if (!alreadyShown) {
        setTimeout(() => {
          triggerFollowReminder('after_coach');
          localStorage.setItem(COACH_REMINDER_SHOWN_KEY, 'true');
        }, 2000);
      }
    }
  };

  const initialChatMode: CoachChatMode = locationState?.fromCamp ? 'meditation_analysis' : 'standard';

  const {
    messages,
    isLoading,
    lastBriefingId,
    coachRecommendation,
    videoRecommendation,
    toolRecommendation,
    emotionButtonRecommendation,
    campRecommendation,
    sendMessage,
    resetConversation,
    setVideoRecommendation,
    setToolRecommendation,
    setEmotionButtonRecommendation,
    setCampRecommendation,
  } = useDynamicCoachChat(
    template?.coach_key || '',
    template?.edge_function_name || '',
    template?.briefing_table_name || '',
    template?.briefing_tool_config as any,
    locationState?.sessionId || undefined,
    handleBriefingGenerated,
    initialChatMode,
    {
      campId: locationState?.campId,
      dayNumber: locationState?.dayNumber,
    }
  );

  // 处理从训练营带入的初始消息
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const [showMeditationAnalysisIntro, setShowMeditationAnalysisIntro] = useState(
    !!(locationState?.fromCamp && locationState?.initialMessage)
  );

  useEffect(() => {
    const hasInitialMessage = locationState?.initialMessage &&
      (locationState?.fromCamp || locationState?.fromAwakening);

    if (hasInitialMessage && template && !hasAutoSent && messages.length === 0 && !isLoading) {
      setHasAutoSent(true);
      const timer = setTimeout(() => {
        sendMessage(locationState.initialMessage!);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [locationState, template, hasAutoSent, messages.length, isLoading, sendMessage]);

  useEffect(() => {
    if (messages.length > 1 && showMeditationAnalysisIntro) {
      setShowMeditationAnalysisIntro(false);
    }
  }, [messages.length, showMeditationAnalysisIntro]);

  if (templateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">教练配置加载失败</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const messageToSend = input.trim();
    setInput("");
    await sendMessage(messageToSend);
  };

  const handleSelectScenario = async (prompt: string) => {
    setInput("");
    await sendMessage(prompt);
  };

  const handleNewConversation = () => {
    resetConversation();
    toast({
      title: "开始新对话",
      description: "已清空当前对话，可以开始新的探索了 ✨",
    });
  };

  const handleOptionClick = async (option: string) => {
    setInput("");
    await sendMessage(option);
  };

  const handleOptionSelect = (option: string) => {
    setInput(option);
  };

  const transformedSteps = (template.steps || []).map((step: any, index: number) => ({
    id: Number(step.step || step.id || index),
    emoji: step.icon || step.emoji || '',
    name: step.title || step.name || '',
    subtitle: step.description ? step.description.substring(0, 50) + (step.description.length > 50 ? '...' : '') : (step.subtitle || ''),
    description: step.description || '',
    details: step.questions ? step.questions.join('\n') : (step.details || ''),
  }));

  const optionClickHandler = template.disable_option_buttons ? undefined : handleOptionClick;
  const optionSelectHandler = template.disable_option_buttons ? undefined : handleOptionSelect;

  return (
    <>
      <DynamicOGMeta pageKey="coach_wealth_coach_4_questions" />
      <CoachLayout
        emoji={template.emoji}
        title={template.title}
        subtitle={
          campEntitlement?.hasAccess
            ? `${template.subtitle || ''} 💰 训练营会员 · 免费使用`
            : (template.subtitle || '')
        }
        description={template.description || ''}
        gradient={template.gradient || 'from-rose-500 to-red-500'}
        primaryColor={template.primary_color || 'red'}
        themeConfig={template.theme_config}
        steps={transformedSteps}
        stepsTitle={template.steps_title || '四部曲'}
        stepsEmoji={template.steps_emoji || '✨'}
        moreInfoRoute={template.more_info_route || undefined}
        historyRoute={template.history_route}
        historyLabel={template.history_label || '我的日记'}
        historyLabelShort={template.history_label_short || '日记'}
        currentCoachKey={COACH_KEY}
        messages={messages}
        isLoading={isLoading}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onNewConversation={handleNewConversation}
        onOptionClick={optionClickHandler}
        onOptionSelect={optionSelectHandler}
        placeholder={template.placeholder || '分享你的想法...'}
        communicationBriefingId={lastBriefingId}
        coachRecommendation={coachRecommendation}
        enableStepsCollapse={true}
        skipEmptyState={true}
        scenarioChips={
          template.enable_scenarios && template.scenarios ? (
            <CoachScenarioChips
              scenarios={template.scenarios as any[]}
              onSelectScenario={handleSelectScenario}
              primaryColor={template.primary_color}
            />
          ) : undefined
        }
        videoRecommendation={videoRecommendation ? (
          <VideoRecommendationCard
            topicSummary={videoRecommendation.topicSummary}
            category={videoRecommendation.category}
            learningGoal={videoRecommendation.learningGoal}
            videoId={videoRecommendation.videoId}
            videoTitle={videoRecommendation.videoTitle}
            videoUrl={videoRecommendation.videoUrl}
            onDismiss={() => setVideoRecommendation(null)}
          />
        ) : undefined}
        toolRecommendation={toolRecommendation ? (
          <ToolRecommendationCard
            userNeed={toolRecommendation.userNeed}
            toolId={toolRecommendation.toolId}
            usageReason={toolRecommendation.usageReason}
            onDismiss={() => setToolRecommendation(null)}
          />
        ) : undefined}
        emotionButtonRecommendation={emotionButtonRecommendation ? (
          <EmotionButtonRecommendationCard
            recommendation={emotionButtonRecommendation}
            onDismiss={() => setEmotionButtonRecommendation(null)}
          />
        ) : undefined}
        campRecommendation={campRecommendation ? (
          <CampRecommendationCard
            recommendation={campRecommendation}
            onDismiss={() => setCampRecommendation(null)}
          />
        ) : undefined}
        showNotificationCenter={template.enable_notifications || false}
        notifications={
          template.enable_notifications ? (
            <CoachNotificationsModule
              notifications={notifications}
              loading={notificationsLoading}
              currentIndex={currentNotificationIndex}
              onIndexChange={setCurrentNotificationIndex}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              colorTheme={template.primary_color === 'amber' ? 'amber' : 'green'}
              coachLabel={template.title}
            />
          ) : undefined
        }
        trainingCamp={
          template.enable_training_camp ? (
            <CoachTrainingCamp
              colorTheme={(template.primary_color as 'green' | 'purple' | 'blue' | 'orange' | 'pink' | 'amber') || 'green'}
              campType={template.training_camp_type ?? undefined}
            />
          ) : undefined
        }
        enableVoiceInput={true}
        loadingPlaceholder={showMeditationAnalysisIntro ? (
          <MeditationAnalysisIntro
            dayNumber={locationState?.dayNumber}
            meditationTitle={locationState?.meditationTitle}
          />
        ) : undefined}
      />
    </>
  );
};

export default WealthCoachChat;
