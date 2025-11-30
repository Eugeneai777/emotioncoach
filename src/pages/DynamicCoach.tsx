import { useState } from "react";
import { useParams } from "react-router-dom";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { CoachScenarioChips } from "@/components/coach/CoachScenarioChips";
import { CoachCommunity } from "@/components/coach/CoachCommunity";
import { useDynamicCoachChat } from "@/hooks/useDynamicCoachChat";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const DynamicCoach = () => {
  const { coachKey } = useParams<{ coachKey: string }>();
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const { data: template, isLoading: templateLoading } = useCoachTemplate(coachKey || '');

  const {
    messages,
    isLoading,
    lastBriefingId,
    sendMessage,
    resetConversation,
  } = useDynamicCoachChat(
    template?.coach_key || '',
    template?.edge_function_name || '',
    template?.briefing_table_name || '',
    template?.briefing_tool_config as any
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

  return (
    <CoachLayout
      emoji={template.emoji}
      title={template.title}
      subtitle={template.subtitle || ''}
      description={template.description || ''}
      gradient={template.gradient || 'from-rose-500 to-red-500'}
      primaryColor={template.primary_color || 'red'}
      steps={transformedSteps}
      stepsTitle={template.steps_title || '四部曲'}
      stepsEmoji={template.steps_emoji || '✨'}
      moreInfoRoute={template.more_info_route || undefined}
      historyRoute={template.history_route}
      historyLabel={template.history_label || '我的日记'}
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
      community={template.enable_community ? <CoachCommunity /> : undefined}
      showNotificationCenter={template.enable_notifications || false}
    />
  );
};

export default DynamicCoach;
