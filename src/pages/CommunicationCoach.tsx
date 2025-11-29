import { useState } from "react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { CommunicationScenarios } from "@/components/communication/CommunicationScenarios";
import { useCommunicationChat } from "@/hooks/useCommunicationChat";
import { coachConfigs } from "@/config/coachConfigs";
import { useToast } from "@/hooks/use-toast";

const CommunicationCoach = () => {
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const { messages, isLoading, sendMessage, resetConversation } = useCommunicationChat();
  
  const config = coachConfigs.communication;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const messageToSend = input.trim();
    setInput("");
    await sendMessage(messageToSend);
  };

  const handleSelectScenario = (prompt: string) => {
    setInput(prompt);
  };

  const handleNewConversation = () => {
    resetConversation();
    toast({
      title: "开始新对话",
      description: "已清空当前对话，可以开始新的沟通梳理了 🎯",
    });
  };

  return (
    <CoachLayout
      emoji={config.emoji}
      title={config.title}
      subtitle={config.subtitle}
      description={config.description}
      gradient={config.gradient}
      primaryColor={config.primaryColor}
      steps={config.steps}
      stepsTitle={config.stepsTitle}
      stepsEmoji={config.stepsEmoji}
      historyRoute={config.historyRoute}
      historyLabel={config.historyLabel}
      messages={messages}
      isLoading={isLoading}
      input={input}
      onInputChange={setInput}
      onSend={handleSend}
      onNewConversation={handleNewConversation}
      placeholder={config.placeholder}
      scenarios={<CommunicationScenarios onSelectScenario={handleSelectScenario} />}
      showNotificationCenter={false}
    />
  );
};

export default CommunicationCoach;
