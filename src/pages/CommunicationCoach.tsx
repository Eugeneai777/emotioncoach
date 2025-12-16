import { useState, useEffect } from "react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { CoachScenarioChips } from "@/components/coach/CoachScenarioChips";
import { UnifiedStageProgress } from "@/components/coach/UnifiedStageProgress";
import { CommunicationDifficultyDialog } from "@/components/communication/CommunicationDifficultyDialog";
import { CoachNotificationsModule } from "@/components/coach/CoachNotificationsModule";
import { CoachTrainingCamp } from "@/components/coach/CoachTrainingCamp";
import { CoachCommunity } from "@/components/coach/CoachCommunity";
import { useCommunicationChat } from "@/hooks/useCommunicationChat";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";

const CommunicationCoach = () => {
  const [input, setInput] = useState("");
  const [difficulty, setDifficulty] = useState(5);
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [difficultyConfirmed, setDifficultyConfirmed] = useState(false);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const { toast } = useToast();
  const { showTour, completeTour } = usePageTour('communication_coach');
  const { messages, isLoading, userMessageCount, lastBriefingId, currentStage, sendMessage, resetConversation } = useCommunicationChat();
  const { data: template, isLoading: templateLoading } = useCoachTemplate('communication');
  const { notifications, loading: notificationsLoading, markAsRead, deleteNotification } = useSmartNotification('communication_coach');
  
  // 在对话进行2轮后自动弹出难度选择
  useEffect(() => {
    if (userMessageCount === 2 && !difficultyConfirmed) {
      setShowDifficultyDialog(true);
    }
  }, [userMessageCount, difficultyConfirmed]);
  
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
    await sendMessage(messageToSend, difficultyConfirmed ? difficulty : undefined);
  };

  const handleSelectScenario = async (prompt: string) => {
    setInput("");
    await sendMessage(prompt, difficultyConfirmed ? difficulty : undefined);
  };

  const handleNewConversation = () => {
    resetConversation();
    setDifficultyConfirmed(false);
    setDifficulty(5);
    toast({
      title: "开始新对话",
      description: "已清空当前对话，可以开始新的沟通梳理了 🎯",
    });
  };

  const handleOptionClick = async (option: string) => {
    setInput("");
    await sendMessage(option, difficultyConfirmed ? difficulty : undefined);
  };

  const handleOptionSelect = (option: string) => {
    setInput(option);
  };
  
  const handleDifficultyConfirm = () => {
    setDifficultyConfirmed(true);
    setShowDifficultyDialog(false);
  };

  return (
    <>
      <CoachLayout
        emoji={template.emoji}
        title={template.title}
        subtitle={template.subtitle || ''}
        description={template.description || ''}
        gradient={template.gradient || 'from-blue-500 to-indigo-500'}
        primaryColor={template.primary_color || 'blue'}
        themeConfig={template.theme_config}
        steps={template.steps || []}
        stepsTitle={template.steps_title || '四部曲'}
        stepsEmoji={template.steps_emoji || '🎯'}
        moreInfoRoute={template.more_info_route || undefined}
        historyRoute={template.history_route}
        historyLabel={template.history_label || '我的日记'}
        historyLabelShort="日记"
        currentCoachKey="communication"
        messages={messages}
        isLoading={isLoading}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onNewConversation={handleNewConversation}
        onOptionClick={handleOptionClick}
        onOptionSelect={handleOptionSelect}
        placeholder={template.placeholder || '分享你的想法...'}
        communicationBriefingId={lastBriefingId}
        scenarioChips={
          template.enable_scenarios && template.scenarios ? (
            <CoachScenarioChips
              scenarios={template.scenarios as any[]}
              onSelectScenario={handleSelectScenario}
              primaryColor={template.primary_color}
            />
          ) : undefined
        }
        stageProgress={
          messages.length > 0 ? (
            <UnifiedStageProgress coachType="communication" currentStage={currentStage} />
          ) : undefined
        }
        notifications={
          <CoachNotificationsModule
            notifications={notifications}
            loading={notificationsLoading}
            currentIndex={currentNotificationIndex}
            onIndexChange={setCurrentNotificationIndex}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            colorTheme="blue"
            coachLabel="沟通教练"
          />
        }
        trainingCamp={<CoachTrainingCamp campType="identity_bloom" colorTheme="blue" />}
        community={<CoachCommunity />}
        showNotificationCenter={true}
        enableVoiceInput={true}
      />
      
      <CommunicationDifficultyDialog
        open={showDifficultyDialog}
        onClose={() => setShowDifficultyDialog(false)}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onConfirm={handleDifficultyConfirm}
      />
      <PageTour open={showTour} onComplete={completeTour} steps={pageTourConfig.communication_coach} pageTitle="沟通教练" />
    </>
  );
};

export default CommunicationCoach;
