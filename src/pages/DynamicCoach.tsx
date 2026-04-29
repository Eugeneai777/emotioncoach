import { Suspense, lazy, useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { OG_BASE_URL } from "@/config/ogConfig";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { CoachScenarioChips } from "@/components/coach/CoachScenarioChips";
import { VibrantLifeScenarioCards } from "@/components/coach/VibrantLifeScenarioCards";
import { VoiceCallCTA } from "@/components/coach/VoiceCallCTA";
import { useDynamicCoachChat, CoachChatMode } from "@/hooks/useDynamicCoachChat";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCampEntitlement } from "@/hooks/useCampEntitlement";
import { useWeChatBindStatus } from "@/hooks/useWeChatBindStatus";
import { triggerFollowReminder } from "@/hooks/useFollowReminder";
import { GratitudeQuickAdd } from "@/components/gratitude/GratitudeQuickAdd";
import { Loader2 } from "lucide-react";
import { MeditationAnalysisIntro } from "@/components/wealth-camp/MeditationAnalysisIntro";
import { Badge } from "@/components/ui/badge";

const CoachCommunity = lazy(() => import("@/components/coach/CoachCommunity").then((m) => ({ default: m.CoachCommunity })));
const VideoRecommendationCard = lazy(() => import("@/components/coach/VideoRecommendationCard").then((m) => ({ default: m.VideoRecommendationCard })));
const ToolRecommendationCard = lazy(() => import("@/components/coach/ToolRecommendationCard").then((m) => ({ default: m.ToolRecommendationCard })));
const EmotionButtonRecommendationCard = lazy(() => import("@/components/coach/EmotionButtonRecommendationCard").then((m) => ({ default: m.EmotionButtonRecommendationCard })));
const CampRecommendationCard = lazy(() => import("@/components/coach/CampRecommendationCard").then((m) => ({ default: m.CampRecommendationCard })));
const CoachNotificationsModule = lazy(() => import("@/components/coach/CoachNotificationsModule").then((m) => ({ default: m.CoachNotificationsModule })));
const CoachTrainingCamp = lazy(() => import("@/components/coach/CoachTrainingCamp").then((m) => ({ default: m.CoachTrainingCamp })));
const CoachVoiceChat = lazy(() => import("@/components/coach/CoachVoiceChat").then((m) => ({ default: m.CoachVoiceChat })));

interface LocationState {
  initialMessage?: string;
  fromCamp?: boolean;
  fromAwakening?: boolean;
  campId?: string;
  dayNumber?: number;
  meditationTitle?: string;
  sessionId?: string; // 从通知跳转恢复的会话ID
}


const DynamicCoach = () => {
  const { coachKey } = useParams<{ coachKey: string }>();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const [input, setInput] = useState("");
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: template, isLoading: templateLoading } = useCoachTemplate(coachKey || '');
  
  // 检查财富训练营权益
  const isWealthCoach = coachKey === 'wealth_coach_4_questions';
  const { data: campEntitlement } = useCampEntitlement(isWealthCoach ? 'wealth_block_7' : '');
  
  // 微信绑定状态（用于关键时刻提示）
  const { isBound, isEmailUser } = useWeChatBindStatus();
  
  
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
      case 'wealth_coach_4_questions':
        return 'after_wealth_coaching';
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
      // 财富教练专属字段
      behavior_insight: briefingData.behavior_insight,
      emotion_insight: briefingData.emotion_insight,
      belief_insight: briefingData.belief_insight,
      giving_action: briefingData.giving_action,
    });
    
    // 关键时刻：对话完成后，检查是否需要提示绑定微信（仅首次）
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

  // 确定对话模式：来自训练营的冥想感受使用 meditation_analysis 模式
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
      dayNumber: locationState?.dayNumber 
    }
  );

  // 处理从训练营带入的初始消息（冥想感受）
  const [hasAutoSent, setHasAutoSent] = useState(false);
  // 是否显示冥想分析引导（来自训练营时）
  const [showMeditationAnalysisIntro, setShowMeditationAnalysisIntro] = useState(
    !!(locationState?.fromCamp && locationState?.initialMessage)
  );
  
  useEffect(() => {
    // 支持从训练营(fromCamp)或觉察系统(fromAwakening)带入的初始消息
    const hasInitialMessage = locationState?.initialMessage && 
      (locationState?.fromCamp || locationState?.fromAwakening);
    
    if (
      hasInitialMessage && 
      template && 
      !hasAutoSent && 
      messages.length === 0 &&
      !isLoading
    ) {
      setHasAutoSent(true);
      // 延迟一点发送，确保组件已完全初始化
      const timer = setTimeout(() => {
        sendMessage(locationState.initialMessage!);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [locationState, template, hasAutoSent, messages.length, isLoading, sendMessage]);




  // 当收到AI回复后，隐藏冥想分析引导
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
  const enableStepsCollapse = template.coach_key === 'emotion' || template.coach_key === 'vibrant_life_sage' || template.coach_key === 'wealth_coach_4_questions';

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
      <DynamicOGMeta pageKey={`coach_${coachKey}`} />
      <CoachLayout
      emoji={template.emoji}
      title={template.title}
      subtitle={
        isWealthCoach && campEntitlement?.hasAccess 
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
      currentCoachKey={coachKey}
      messages={isWealthCoach ? [] : messages}
      isLoading={isWealthCoach ? false : isLoading}
      input={isWealthCoach ? '' : input}
      onInputChange={isWealthCoach ? () => {} : setInput}
      onSend={isWealthCoach ? () => {} : handleSend}
      onNewConversation={isWealthCoach ? undefined : handleNewConversation}
      hideInput={isWealthCoach}
      chatEntryRoute={isWealthCoach ? '/wealth-coach-chat' : undefined}
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
          template.coach_key === 'vibrant_life_sage' ? (
            <VibrantLifeScenarioCards
              scenarios={template.scenarios as any[]}
              onSelectScenario={handleSelectScenario}
            />
          ) : (
            <CoachScenarioChips
              scenarios={template.scenarios as any[]}
              onSelectScenario={handleSelectScenario}
              primaryColor={template.primary_color}
            />
          )
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
            colorTheme={template.primary_color === 'purple' ? 'purple' : template.primary_color === 'blue' ? 'blue' : template.primary_color === 'pink' ? 'pink' : template.primary_color === 'amber' ? 'amber' : 'green'}
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
      enableVoiceChat={template.coach_key === 'vibrant_life_sage'}
      onVoiceChatClick={() => setShowVoiceChat(true)}
      enableVoiceInput={true}
      showVoiceInputSuccessToast={false}
      customFooter={gratitudeFooter}
      loadingPlaceholder={showMeditationAnalysisIntro ? (
        <MeditationAnalysisIntro
          dayNumber={locationState?.dayNumber}
          meditationTitle={locationState?.meditationTitle}
        />
      ) : undefined}
    />
    
    {/* OpenAI Realtime 语音对话全屏界面 */}
    {showVoiceChat && (
      <CoachVoiceChat
        onClose={() => setShowVoiceChat(false)}
        coachEmoji={template.emoji}
        coachTitle={template.title}
        primaryColor={template.primary_color || 'rose'}
        featureKey="realtime_voice_vibrant_life"
        scenario={new URLSearchParams(location.search).get('scenario') || undefined}
      />
    )}
  </>
  );
};

export default DynamicCoach;
