import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Button } from "@/components/ui/button";
import { ChatEmotionIntensityPrompt } from "@/components/ChatEmotionIntensityPrompt";
import { EmotionAlert } from "@/components/EmotionAlert";

import { EmotionIntensitySelector } from "@/components/EmotionIntensitySelector";
import { IntensityReminderDialog } from "@/components/IntensityReminderDialog";
import { CoachScenarioChips } from "@/components/coach/CoachScenarioChips";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";

import { TrainingCampCard } from "@/components/camp/TrainingCampCard";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { CoachNotificationsModule } from "@/components/coach/CoachNotificationsModule";
import { CoachTrainingCamp } from "@/components/coach/CoachTrainingCamp";

import CampCheckInSuccessDialog from "@/components/camp/CampCheckInSuccessDialog";
import CommunityWaterfall from "@/components/community/CommunityWaterfall";
import { UnifiedStageProgress } from "@/components/coach/UnifiedStageProgress";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useAuth } from "@/hooks/useAuth";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { usePurchaseOnboarding } from "@/hooks/usePurchaseOnboarding";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCamp } from "@/types/trainingCamp";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTodayInBeijing, getDaysSinceStart } from "@/utils/dateUtils";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { EmotionVoiceCallCTA } from "@/components/emotion-coach/EmotionVoiceCallCTA";
import { EmotionVoiceBriefingPreview } from "@/components/emotion-coach/EmotionVoiceBriefingPreview";
import { VoiceTypeSelector } from "@/components/emotion-coach/VoiceTypeSelector";
import { getSavedVoiceType, DEFAULT_VOICE_TYPE } from "@/config/voiceTypeConfig";
// WeChatBindOnboarding removed - now only triggers at key moments
// Build refresh marker: 2026-01-30

const Index = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const partnerId = searchParams.get('partner');


  // AI 来电状态 - 从 navigation state 获取
  const incomingCallState = location.state as { 
    isIncomingCall?: boolean; aiCallId?: string; openingMessage?: string; autoStartVoice?: boolean;
    meditationReflection?: { thought: string; emotionImpact: string; dayNumber: number };
  } | null;
  
  const meditationReflection = incomingCallState?.meditationReflection;
  const [input, setInput] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  
  const [showIntensitySelector, setShowIntensitySelector] = useState(false);
  const [showIntensityReminder, setShowIntensityReminder] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [activeCamp, setActiveCamp] = useState<TrainingCamp | null>(null);
  const [showStartCamp, setShowStartCamp] = useState(false);
  const [autoDismissSeconds, setAutoDismissSeconds] = useState(10);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [checkInSuccessData, setCheckInSuccessData] = useState<any>(null);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [selectedVoiceType, setSelectedVoiceType] = useState<string>(() => {
    const saved = getSavedVoiceType();
    console.log('[EmotionCoach] Initial voiceType from storage:', saved);
    return saved && saved.trim() !== '' ? saved : DEFAULT_VOICE_TYPE;
  });
  const [briefingPreview, setBriefingPreview] = useState<{
    briefingId: string;
    briefingData: any;
  } | null>(null);
  const { toast } = useToast();

  // AI 来电：自动启动语音聊天
  useEffect(() => {
    if (incomingCallState?.isIncomingCall) {
      console.log('[EmotionCoach] AI incoming call detected, auto-starting voice chat');
      setShowVoiceChat(true);
    }
  }, [incomingCallState?.isIncomingCall]);

  // 购买引导
  const {
    showDialog: showPurchaseDialog,
    setShowDialog: setShowPurchaseDialog,
    triggerFeature,
    requirePurchase,
    handlePurchaseSuccess,
    partnerId: hookPartnerId
  } = usePurchaseOnboarding({ partnerId: partnerId || undefined });
  
  const { data: coachConfig } = useCoachTemplate('emotion');

  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();

  // 查询21天情绪日记是否已通过 orders 表购买
  const { data: journalOrderPurchase } = useQuery({
    queryKey: ['journal-order-purchase', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .in('package_key', ['synergy_bundle', 'camp-emotion_journal_21'])
        .eq('status', 'paid')
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  const {
    messages,
    isLoading,
    sendMessage,
    resetConversation,
    removeIntensityPrompt,
    videoRecommendations,
    currentStage
  } = useStreamChat();
  const { 
    notifications, 
    loading: notificationsLoading,
    markAsRead, 
    deleteNotification,
  } = useSmartNotification('emotion_coach');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 冥想反思：自动发送反思内容作为开场
  const meditationReflectionSentRef = useRef(false);
  useEffect(() => {
    if (meditationReflection && !meditationReflectionSentRef.current) {
      meditationReflectionSentRef.current = true;
      const parts: string[] = [];
      parts.push(`我刚完成了第${meditationReflection.dayNumber}天的解压冥想。`);
      if (meditationReflection.thought) {
        parts.push(`冥想时脑海里出现了这个想法：${meditationReflection.thought}`);
      }
      if (meditationReflection.emotionImpact) {
        parts.push(`这让我的情绪感受是：${meditationReflection.emotionImpact}`);
      }
      const msg = parts.join('\n');
      setTimeout(() => sendMessage(msg), 500);
    }
  }, [meditationReflection, sendMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 不再强制跳转，允许游客浏览
  useEffect(() => {
    if (user) {
      loadActiveCamp();
    }
  }, [user, authLoading]);

  // Listen for check-in success events
  useEffect(() => {
    const handleCheckInSuccess = (event: any) => {
      const { campId, campName, campDay, briefingId, briefingData } = event.detail;
      setCheckInSuccessData({
        campId,
        campName,
        campDay,
        briefingId,
        emotionTheme: briefingData.emotion_theme,
        emotionIntensity: briefingData.emotion_intensity,
        insight: briefingData.insight,
        action: briefingData.action
      });
      setShowCheckInSuccess(true);
      loadActiveCamp();
    };

    window.addEventListener('camp-checkin-success', handleCheckInSuccess);
    return () => {
      window.removeEventListener('camp-checkin-success', handleCheckInSuccess);
    };
  }, []);

  // Auto dismiss reminder
  useEffect(() => {
    if (showReminder && autoDismissSeconds > 0) {
      const timer = setTimeout(() => {
        handleDismissReminder();
      }, autoDismissSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [showReminder, autoDismissSeconds]);

  // Auto refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadActiveCamp();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const loadActiveCamp = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('camp_type', ['emotion_journal_21', 'emotion_stress_7'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const calculatedCurrentDay = Math.max(1, 
          getDaysSinceStart(data.start_date) + 1
        );
        const finalCurrentDay = Math.min(calculatedCurrentDay, data.duration_days);
        
        setActiveCamp({
          ...data,
          check_in_dates: Array.isArray(data.check_in_dates) ? data.check_in_dates : [],
          current_day: finalCurrentDay
        } as TrainingCamp);
      } else {
        setActiveCamp(null);
      }
    } catch (error) {
      console.error('Error loading active camp:', error);
      setActiveCamp(null);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !activeCamp) return;

    const today = getTodayInBeijing();
    if (activeCamp.check_in_dates.includes(today)) {
      toast({
        title: "今天已打卡",
        description: "每天只能打卡一次哦"
      });
      return;
    }

    try {
      const newCheckInDates = [...activeCamp.check_in_dates, today];
      const newCompletedDays = newCheckInDates.length;
      const newCurrentDay = activeCamp.current_day + 1;

      const updates: any = {
        check_in_dates: newCheckInDates,
        completed_days: newCompletedDays,
        current_day: newCurrentDay
      };

      if (newCompletedDays >= 7 && !activeCamp.milestone_7_reached) {
        updates.milestone_7_reached = true;
        toast({
          title: "🎉 达成里程碑！",
          description: "恭喜获得「一周勇士」徽章！",
          duration: 5000
        });
      }
      if (newCompletedDays >= 14 && !activeCamp.milestone_14_reached) {
        updates.milestone_14_reached = true;
        toast({
          title: "🎉 达成里程碑！",
          description: "恭喜获得「半程达人」徽章！",
          duration: 5000
        });
      }
      if (newCompletedDays >= 21) {
        updates.milestone_21_completed = true;
        updates.status = 'completed';
        toast({
          title: "🏆 训练营毕业！",
          description: "恭喜完成21天情绪日记训练营！",
          duration: 5000
        });
      }

      const { error } = await supabase
        .from('training_camps')
        .update(updates)
        .eq('id', activeCamp.id);

      if (error) throw error;

      loadActiveCamp();
      toast({
        title: "打卡成功！",
        description: `连续打卡 ${newCompletedDays} 天`
      });
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "打卡失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  };


  useEffect(() => {
    if (user && messages.length === 0) {
      checkReminder();
      checkIntensityReminder();
    }
  }, [user, messages]);

  const checkReminder = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("reminder_enabled, reminder_time, last_reminder_shown, reminder_auto_dismiss_seconds")
        .eq("id", user.id)
        .single();
      if (!profile || !profile.reminder_enabled) return;
      
      setAutoDismissSeconds(profile.reminder_auto_dismiss_seconds ?? 10);
      
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [hours, minutes] = (profile.reminder_time || "20:00").split(":");
      const reminderTime = parseInt(hours) * 60 + parseInt(minutes);
      if (currentTime < reminderTime) return;
      const lastShown = profile.last_reminder_shown ? new Date(profile.last_reminder_shown) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!lastShown || lastShown < today) {
        const { data: todayConversations } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString())
          .limit(1);
        if (!todayConversations || todayConversations.length === 0) {
          setShowReminder(true);
        }
      }
    } catch (error) {
      console.error("Error checking reminder:", error);
    }
  };

  const checkIntensityReminder = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("intensity_reminder_enabled, intensity_reminder_time, last_intensity_reminder_shown")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.intensity_reminder_enabled) return;

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [hours, minutes] = (profile.intensity_reminder_time || "21:00").split(":");
      const reminderTime = parseInt(hours) * 60 + parseInt(minutes);

      if (currentTime < reminderTime) return;

      const lastShown = profile.last_intensity_reminder_shown
        ? new Date(profile.last_intensity_reminder_shown)
        : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!lastShown || lastShown < today) {
        const { data: todayLogs } = await supabase
          .from("emotion_quick_logs")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString())
          .limit(1);

        if (!todayLogs || todayLogs.length === 0) {
          setShowIntensityReminder(true);
        }
      }
    } catch (error) {
      console.error("Error checking intensity reminder:", error);
    }
  };

  const handleDismissReminder = async () => {
    setShowReminder(false);
    if (user) {
      await supabase
        .from("profiles")
        .update({ last_reminder_shown: new Date().toISOString() })
        .eq("id", user.id);
    }
    // 不再显示强度选择器，让 AI 自行判断
  };

  const handleStartFromReminder = () => {
    setShowReminder(false);
    // 不再显示强度选择器，直接开始对话
  };

  const handleIntensityReminderRecord = () => {
    setShowIntensityReminder(false);
  };

  const handleDismissIntensityReminder = async () => {
    setShowIntensityReminder(false);
    if (user) {
      await supabase
        .from("profiles")
        .update({ last_intensity_reminder_shown: new Date().toISOString() })
        .eq("id", user.id);
    }
  };

  const handleIntensitySelect = (intensity: number) => {
    setSelectedIntensity(intensity);
    setShowIntensitySelector(false);
    const message = `我现在的情绪强度是 ${intensity}/10`;
    setInput("");
    sendMessage(message);
  };

  const handleChatIntensitySelect = async (intensity: number) => {
    removeIntensityPrompt();
    
    const message = `我现在的情绪强度是 ${intensity}/10`;
    await sendMessage(message);
    
    if (user) {
      try {
        await supabase.from("emotion_quick_logs").insert({
          user_id: user.id,
          emotion_intensity: intensity,
          note: "从对话中记录"
        });
      } catch (error) {
        console.error("Error saving intensity log:", error);
      }
    }
  };

  const handleDismissChatIntensity = () => {
    removeIntensityPrompt();
    sendMessage("跳过强度记录，继续对话");
  };

  const handleSkipIntensity = () => {
    setShowIntensitySelector(false);
    setSelectedIntensity(null);
  };

  const handleSend = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    // 检查是否需要购买套餐
    requirePurchase(async () => {
      await sendMessage(message);
      setInput("");
    }, '发送消息');
  };

  // 点击"生成简报"等特殊按钮 → 直接发送
  const handleOptionClick = async (option: string) => {
    setInput("");
    await sendMessage(option);
  };

  // 点击普通四部曲选项 → 填入输入框，用户可编辑后发送
  const handleOptionSelect = (option: string) => {
    setInput(option);
  };

  const handleRestart = () => {
    resetConversation();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <>
        <DynamicOGMeta pageKey="home" />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-green-50/30 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-green-950/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </>
    );
  }

  // Render intensity prompt component
  const renderIntensityPrompt = (message: any, index: number) => {
    if (message.type === "intensity_prompt") {
      return (
        <ChatEmotionIntensityPrompt
          key={index}
          onSelect={handleChatIntensitySelect}
          onDismiss={handleDismissChatIntensity}
        />
      );
    }
    return null;
  };

  // Build daily reminder content
  const dailyReminderContent = showReminder ? (
    <div className="animate-in fade-in-50 duration-300">
      <div className="text-center space-y-3">
        <p className="text-2xl">🌿</p>
        <h3 className="font-semibold text-foreground text-base md:text-lg">
          温柔的提醒
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          今天的情绪，想和劲老师一起梳理吗？
        </p>
        <p className="text-sm text-muted-foreground/80 leading-relaxed">
          无论是什么感受，都值得被看见和理解。劲老师在这里陪着你 💫
        </p>
      </div>
      <div className="flex gap-3 mt-4">
        <Button onClick={handleStartFromReminder} className="flex-1">
          开始梳理
        </Button>
        <Button onClick={handleDismissReminder} variant="outline" className="flex-1">
          稍后再说
        </Button>
      </div>
    </div>
  ) : null;

  // Build training camp content
  const getCampDisplayInfo = (campType: string) => {
    switch (campType) {
      case 'emotion_stress_7':
        return { name: '7天有劲训练营', desc: '用7天释放压力，找回内心平静与清晰' };
      case 'wealth_block_7':
      case 'wealth_block_21':
        return { name: '7天财富觉醒训练营', desc: '用7天突破财富卡点，重塑金钱关系' };
      default:
        return { name: '21天情绪日记训练营', desc: '用21天养成情绪记录习惯，获得专属徽章和成长洞察' };
    }
  };

  const campInfo = activeCamp ? getCampDisplayInfo(activeCamp.camp_type) : getCampDisplayInfo('');

  const trainingCampContent = activeCamp ? (
    <div className="w-full mt-6 space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <CoachTrainingCamp
        activeCamp={activeCamp}
        onStartCamp={() => setShowStartCamp(true)}
        onViewDetails={() => navigate("/camps")}
        onCheckIn={handleCheckIn}
        colorTheme="green"
        campName={campInfo.name}
        campDescription={campInfo.desc}
      />
      
      <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <EmotionAlert />
      </div>
      
      <CoachNotificationsModule
        notifications={notifications}
        loading={notificationsLoading}
        currentIndex={currentNotificationIndex}
        onIndexChange={setCurrentNotificationIndex}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
        colorTheme="green"
        coachLabel="情绪教练"
      />
    </div>
  ) : null;

  // Build camp recommendation content
  const campRecommendationContent = !activeCamp ? (
    <div className="w-full mt-6">
      <CoachTrainingCamp
        activeCamp={null}
        onStartCamp={() => setShowStartCamp(true)}
        onViewDetails={() => navigate("/camps")}
        colorTheme="green"
        campName={campInfo.name}
        campDescription={campInfo.desc}
      />
    </div>
  ) : null;

  // 强度选择器已移除，不再显示
  const intensitySelectorContent = null;

  return (
    <>
      <PurchaseOnboardingDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        partnerId={partnerId || undefined}
        triggerFeature={triggerFeature}
        onSuccess={handlePurchaseSuccess}
      />
      
      <StartCampDialog
        open={showStartCamp}
        onOpenChange={setShowStartCamp}
        campTemplate={{
          camp_type: 'emotion_journal_21',
          camp_name: '21天情绪日记训练营',
          duration_days: 21,
          icon: '📝',
          price: 399,
          original_price: 399,
        }}
        isPurchased={!!journalOrderPurchase}
        onSuccess={loadActiveCamp}
      />
      
      {checkInSuccessData && (
        <CampCheckInSuccessDialog
          open={showCheckInSuccess}
          onOpenChange={setShowCheckInSuccess}
          campId={checkInSuccessData.campId}
          campName={checkInSuccessData.campName}
          campDay={checkInSuccessData.campDay}
          briefingId={checkInSuccessData.briefingId}
          emotionTheme={checkInSuccessData.emotionTheme}
          emotionIntensity={checkInSuccessData.emotionIntensity}
          insight={checkInSuccessData.insight}
          action={checkInSuccessData.action}
        />
      )}

      {showIntensityReminder && (
        <IntensityReminderDialog
          onRecord={handleIntensityReminderRecord}
          onDismiss={handleDismissIntensityReminder}
        />
      )}

      {showVoiceChat && (
        <CoachVoiceChat
          onClose={() => setShowVoiceChat(false)}
          coachEmoji={coachConfig?.emoji || "💚"}
          coachTitle="情绪教练"
          primaryColor="green"
          tokenEndpoint="emotion-realtime-token"
          userId={user?.id || ''}
          mode="emotion"
          featureKey="realtime_voice_emotion"
          voiceType={selectedVoiceType}
          onBriefingSaved={(briefingId, briefingData) => {
            // 🔧 简报生成后不立即关闭语音对话，让用户可以继续或主动关闭
            // setShowVoiceChat(false); // 移除自动关闭
            setBriefingPreview({ briefingId, briefingData });
            // 通过 toast 提示用户简报已生成
            toast({
              title: "✨ 简报已生成",
              description: "可以继续对话或点击关闭查看简报",
            });
          }}
        />
      )}

      {briefingPreview && (
        <EmotionVoiceBriefingPreview
          briefingId={briefingPreview.briefingId}
          briefingData={briefingPreview.briefingData}
          onClose={() => setBriefingPreview(null)}
        />
      )}

      <CoachLayout
        emoji={coachConfig?.emoji || "💚"}
        title={coachConfig?.title || "情绪觉醒教练"}
        description={coachConfig?.description || "跟劲老师一起，找回情绪里的力量"}
        primaryColor={coachConfig?.primary_color || "green"}
        themeConfig={coachConfig?.theme_config}
        gradient={coachConfig?.gradient || "from-emerald-500 to-green-500"}
        historyRoute="/history"
        historyLabel="我的情绪日记"
        historyLabelShort="日记"
        currentCoachKey="emotion"
        messages={messages}
        isLoading={isLoading}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onOptionClick={handleOptionClick}
        onOptionSelect={handleOptionSelect}
        onRestart={handleRestart}
        onSignOut={handleSignOut}
        placeholder="分享你的想法..."
        stageProgress={
          currentStage > 0 ? (
            <UnifiedStageProgress 
              coachType="emotion" 
              currentStage={currentStage} 
              primaryColor="green"
            />
          ) : null
        }
        trainingCamp={trainingCampContent}
        notifications={null}
        campRecommendation={campRecommendationContent}
        communityContent={<CommunityWaterfall />}
        scenarioChips={
          coachConfig?.enable_scenarios && coachConfig?.scenarios ? (
            <CoachScenarioChips
              scenarios={coachConfig.scenarios as any[]}
              onSelectScenario={(prompt) => setInput(prompt)}
              primaryColor={coachConfig.primary_color}
            />
          ) : undefined
        }
        intensitySelector={intensitySelectorContent}
        dailyReminderContent={dailyReminderContent}
        showDailyReminder={showReminder}
        videoRecommendations={videoRecommendations}
        renderIntensityPrompt={renderIntensityPrompt}
        stepsConfig={{
          emoji: coachConfig?.steps_emoji || '🌱',
          title: coachConfig?.steps_title || '情绪四部曲',
          steps: coachConfig?.steps || [],
          introRoute: '/introduction'
        }}
        enableStepsCollapse={true}
        enableVoiceInput={true}
        messagesEndRef={messagesEndRef}
        voiceChatCTA={
          <>
            <EmotionVoiceCallCTA
              onVoiceChatClick={() => setShowVoiceChat(true)}
            />
            <VoiceTypeSelector
              value={selectedVoiceType}
              onChange={setSelectedVoiceType}
              className="mt-4"
            />
          </>
        }
      />
    </>
  );
};

export default Index;
