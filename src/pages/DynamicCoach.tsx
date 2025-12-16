import { useState } from "react";
import { useParams } from "react-router-dom";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { CoachScenarioChips } from "@/components/coach/CoachScenarioChips";
import { CoachCommunity } from "@/components/coach/CoachCommunity";
import { VideoRecommendationCard } from "@/components/coach/VideoRecommendationCard";
import { ToolRecommendationCard } from "@/components/coach/ToolRecommendationCard";
import { EmotionButtonRecommendationCard } from "@/components/coach/EmotionButtonRecommendationCard";
import { CampRecommendationCard } from "@/components/coach/CampRecommendationCard";
import { CoachNotificationsModule } from "@/components/coach/CoachNotificationsModule";
import { CoachTrainingCamp } from "@/components/coach/CoachTrainingCamp";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { VoiceCallCTA } from "@/components/coach/VoiceCallCTA";
import { useDynamicCoachChat } from "@/hooks/useDynamicCoachChat";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GratitudeQuickAdd } from "@/components/gratitude/GratitudeQuickAdd";
import { Loader2 } from "lucide-react";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";

const DynamicCoach = () => {
  const { coachKey } = useParams<{ coachKey: string }>();
  const [input, setInput] = useState("");
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: template, isLoading: templateLoading } = useCoachTemplate(coachKey || '');
  
  // 根据教练类型选择引导配置
  const tourKey = coachKey === 'vibrant_life_sage' 
    ? 'vibrant_life_coach' 
    : coachKey === 'gratitude_coach'
      ? 'gratitude_coach'
      : null;
  const { showTour, completeTour } = usePageTour(tourKey || '');
  
  // 智能生成 coachType：如果 coach_key 已经包含 _coach 后缀则直接使用，否则拼接
  const getCoachTypeForNotifications = (coachKey: string | undefined, isLoading: boolean) => {
    if (isLoading || !coachKey) return null;
    // 如果已经以 _coach 结尾，直接使用
    if (coachKey.endsWith('_coach')) {
      return coachKey;
    }
    // 否则拼接 _coach 后缀
    return `${coachKey}_coach`;
  };

  const coachTypeForNotifications = getCoachTypeForNotifications(template?.coach_key, templateLoading);

  // 智能通知
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    deleteNotification,
    triggerNotification,
  } = useSmartNotification(coachTypeForNotifications);

  // 根据教练类型决定通知场景
  const getNotificationScenario = (coachKey: string) => {
    switch (coachKey) {
      case 'communication':
        return 'after_communication';
      case 'parent':
        return 'after_parent';
      case 'gratitude_coach':
        return 'after_gratitude_analysis';
      case 'vibrant_life_sage':
        return 'after_vibrant_life';
      case 'story':
        return 'after_story';
      default:
        return 'after_briefing';
    }
  };

  // 简报生成后触发智能通知
  const handleBriefingGenerated = (briefingData: any) => {
    if (!template?.coach_key) return;
    
    const scenario = getNotificationScenario(template.coach_key);
    triggerNotification(scenario, {
      emotion_theme: briefingData.emotion_theme,
      emotion_intensity: briefingData.emotion_intensity,
      communication_theme: briefingData.communication_theme,
      communication_difficulty: briefingData.communication_difficulty,
      parent_theme: briefingData.parent_theme || briefingData.emotion_theme,
    });
  };

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
    undefined,
    handleBriefingGenerated
  );

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

  // Transform steps to match CoachEmptyState interface
  const transformedSteps = (template.steps || []).map((step: any, index: number) => ({
    id: Number(step.step || step.id || index),
    emoji: step.icon || step.emoji || '',
    name: step.title || step.name || '',
    subtitle: step.description ? step.description.substring(0, 50) + (step.description.length > 50 ? '...' : '') : (step.subtitle || ''),
    description: step.description || '',
    details: step.questions ? step.questions.join('\n') : (step.details || '')
  }));

  // 如果禁用选项按钮，则不传递回调函数
  const optionClickHandler = template.disable_option_buttons ? undefined : handleOptionClick;
  const optionSelectHandler = template.disable_option_buttons ? undefined : handleOptionSelect;

  // 判断是否启用步骤折叠（情绪教练折叠，其他教练展开）
  // 判断是否启用步骤折叠（情绪教练和有劲生活教练折叠，其他教练展开）
  const enableStepsCollapse = template.coach_key === 'emotion' || template.coach_key === 'vibrant_life_sage';

  // 感恩教练使用 GratitudeQuickAdd 输入框
  const gratitudeFooter = template.coach_key === 'gratitude_coach' && user?.id ? (
    <GratitudeQuickAdd
      userId={user.id}
      onAdded={() => {
        toast({
          title: "记录成功 ✨",
          description: "感恩已记录，可在日记中查看"
        });
      }}
    />
  ) : undefined;

  return (
    <>
      {tourKey && pageTourConfig[tourKey] && (
        <PageTour
          steps={pageTourConfig[tourKey]}
          open={showTour}
          onComplete={completeTour}
        />
      )}
      <CoachLayout
      emoji={template.emoji}
      title={template.title}
      subtitle={template.subtitle || ''}
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
      currentCoachKey={coachKey}
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
      enableStepsCollapse={enableStepsCollapse}
      voiceChatCTA={template.coach_key === 'vibrant_life_sage' ? (
        <VoiceCallCTA onVoiceChatClick={() => setShowVoiceChat(true)} />
      ) : undefined}
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
      community={template.enable_community ? <CoachCommunity /> : undefined}
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
            colorTheme={template.primary_color === 'purple' ? 'purple' : template.primary_color === 'blue' ? 'blue' : template.primary_color === 'pink' ? 'pink' : 'green'}
            coachLabel={template.title}
          />
        ) : undefined
      }
      trainingCamp={
        template.enable_training_camp ? (
          <CoachTrainingCamp
            colorTheme={template.primary_color === 'purple' ? 'purple' : template.primary_color === 'blue' ? 'blue' : template.primary_color === 'orange' ? 'orange' : template.primary_color === 'pink' ? 'pink' : 'green'}
          />
        ) : undefined
      }
      enableVoiceChat={template.coach_key === 'vibrant_life_sage'}
      onVoiceChatClick={() => setShowVoiceChat(true)}
      enableVoiceInput={true}
      customFooter={gratitudeFooter}
    />
    
    {/* OpenAI Realtime 语音对话全屏界面 */}
    {showVoiceChat && (
      <CoachVoiceChat
        onClose={() => setShowVoiceChat(false)}
        coachEmoji={template.emoji}
        coachTitle={template.title}
        primaryColor={template.primary_color || 'rose'}
        featureKey="realtime_voice_vibrant_life"
      />
    )}
  </>
  );
};

export default DynamicCoach;
