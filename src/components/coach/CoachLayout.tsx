import { ReactNode, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { CoachHeader } from "./CoachHeader";
import { CoachEmptyState } from "./CoachEmptyState";
import { CoachInputFooter } from "./CoachInputFooter";
import { useAuth } from "@/hooks/useAuth";

interface Step {
  id: number;
  emoji?: string;
  name: string;
  subtitle: string;
  description: string;
  details?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: string;
}

interface CoachLayoutProps {
  // Theme configuration
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  primaryColor: string;
  
  // Steps configuration
  steps: Step[];
  stepsTitle: string;
  stepsEmoji: string;
  moreInfoRoute?: string;
  
  // Routes configuration
  historyRoute: string;
  historyLabel: string;
  
  // Chat configuration
  messages: Message[];
  isLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onNewConversation: () => void;
  onOptionClick?: (option: string) => void;
  onOptionSelect?: (option: string) => void;
  placeholder: string;
  
  // Optional features
  scenarios?: ReactNode;
  scenarioChips?: ReactNode;
  extraContent?: ReactNode;
  trainingCamp?: ReactNode;
  notifications?: ReactNode;
  community?: ReactNode;
  voiceControls?: {
    isListening: boolean;
    isSpeaking: boolean;
    onStartListening: () => void;
    onStopListening: () => void;
    onStopSpeaking: () => void;
    isSupported: boolean;
  };
  showNotificationCenter?: boolean;
}

export const CoachLayout = ({
  emoji,
  title,
  subtitle,
  description,
  gradient,
  primaryColor,
  steps,
  stepsTitle,
  stepsEmoji,
  moreInfoRoute,
  historyRoute,
  historyLabel,
  messages,
  isLoading,
  input,
  onInputChange,
  onSend,
  onNewConversation,
  onOptionClick,
  onOptionSelect,
  placeholder,
  scenarios,
  scenarioChips,
  extraContent,
  trainingCamp,
  notifications,
  community,
  voiceControls,
  showNotificationCenter = true
}: CoachLayoutProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className={`w-8 h-8 animate-spin text-${primaryColor}-500`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <CoachHeader
        emoji={emoji}
        primaryColor={primaryColor}
        historyRoute={historyRoute}
        historyLabel={historyLabel}
        hasMessages={messages.length > 0}
        onRestart={onNewConversation}
        onSignOut={handleSignOut}
        showNotificationCenter={showNotificationCenter}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-4 md:py-8">
          {messages.length === 0 ? (
            <CoachEmptyState
              emoji={emoji}
              title={title}
              subtitle={subtitle}
              description={description}
              gradient={gradient}
              steps={steps}
              stepsTitle={stepsTitle}
              stepsEmoji={stepsEmoji}
              primaryColor={primaryColor}
              moreInfoRoute={moreInfoRoute}
              scenarios={scenarios}
              extraContent={extraContent}
              trainingCamp={trainingCamp}
              notifications={notifications}
              community={community}
            />
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  role={message.role}
                  content={message.content}
                  onOptionClick={onOptionClick}
                  onOptionSelect={onOptionSelect}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">正在思考...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Footer Input */}
      <CoachInputFooter
        ref={textareaRef}
        input={input}
        onInputChange={onInputChange}
        onSend={onSend}
        onKeyPress={handleKeyPress}
        onNewConversation={onNewConversation}
        placeholder={placeholder}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
        gradient={gradient}
        voiceControls={voiceControls}
        scenarioChips={scenarioChips}
        messagesCount={messages.length}
      />
    </div>
  );
};
