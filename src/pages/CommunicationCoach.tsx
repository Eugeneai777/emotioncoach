import { useState } from "react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { CommunicationScenarioChips } from "@/components/communication/CommunicationScenarioChips";
import { CommunicationDifficultySelector } from "@/components/communication/CommunicationDifficultySelector";
import { useCommunicationChat } from "@/hooks/useCommunicationChat";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const CommunicationCoach = () => {
  const [input, setInput] = useState("");
  const [difficulty, setDifficulty] = useState(5);
  const { toast } = useToast();
  const { messages, isLoading, sendMessage, resetConversation } = useCommunicationChat();
  const { data: template, isLoading: templateLoading } = useCoachTemplate('communication');
  
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
    await sendMessage(messageToSend, difficulty);
  };

  const handleSelectScenario = async (prompt: string) => {
    setInput("");
    await sendMessage(prompt, difficulty);
  };

  const handleNewConversation = () => {
    resetConversation();
    toast({
      title: "开始新对话",
      description: "已清空当前对话，可以开始新的沟通梳理了 🎯",
    });
  };

  const handleOptionClick = async (option: string) => {
    setInput("");
    await sendMessage(option, difficulty);
  };

  const handleOptionSelect = (option: string) => {
    setInput(option);
  };

  return (
    <CoachLayout
      emoji={template.emoji}
      title={template.title}
      subtitle={template.subtitle || ''}
      description={template.description || ''}
      gradient={template.gradient || 'from-blue-500 to-indigo-500'}
      primaryColor={template.primary_color || 'blue'}
      steps={template.steps || []}
      stepsTitle={template.steps_title || '四部曲'}
      stepsEmoji={template.steps_emoji || '🎯'}
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
      scenarioChips={
        <div className="space-y-3">
          <CommunicationDifficultySelector 
            difficulty={difficulty} 
            onDifficultyChange={setDifficulty}
          />
          <CommunicationScenarioChips onSelectScenario={handleSelectScenario} />
        </div>
      }
      showNotificationCenter={false}
    />
  );
};

export default CommunicationCoach;
