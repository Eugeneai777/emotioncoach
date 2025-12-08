import { ReactNode, useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowDown } from "lucide-react";
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
  historyRoute?: string;
  historyLabel?: string;
  
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
  communicationBriefingId?: string | null;
  coachRecommendation?: {
    coachKey: string;
    userIssueSummary: string;
    reasoning: string;
  } | null;
  
  // Optional features
  scenarios?: ReactNode;
  scenarioChips?: ReactNode;
  stageProgress?: ReactNode;
  extraContent?: ReactNode;
  trainingCamp?: ReactNode;
  notifications?: ReactNode;
  community?: ReactNode;
  videoRecommendation?: ReactNode;
  toolRecommendation?: ReactNode;
  emotionButtonRecommendation?: ReactNode;
  campRecommendation?: ReactNode;
  bottomContent?: ReactNode;
  showNotificationCenter?: boolean;
  onRefresh?: () => Promise<void>;
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
  communicationBriefingId,
  coachRecommendation,
  scenarios,
  scenarioChips,
  stageProgress,
  extraContent,
  trainingCamp,
  notifications,
  community,
  videoRecommendation,
  toolRecommendation,
  emotionButtonRecommendation,
  campRecommendation,
  bottomContent,
  showNotificationCenter = true,
  onRefresh
}: CoachLayoutProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const threshold = 80;

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

  // Pull to refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onRefresh) return;
    const scrollTop = mainRef.current?.scrollTop ?? 0;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [onRefresh]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing || !onRefresh) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      const dampedPull = Math.min(diff * 0.5, 120);
      setPullDistance(dampedPull);
    }
  }, [isPulling, isRefreshing, onRefresh]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || !onRefresh) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className={`w-8 h-8 animate-spin text-${primaryColor}-500`} />
      </div>
    );
  }

  const pullProgress = Math.min(pullDistance / threshold, 1);

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

      {/* Pull to Refresh Indicator */}
      {onRefresh && (pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-16 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
          style={{ 
            height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
            transition: isRefreshing ? 'height 0.3s ease-out' : 'none'
          }}
        >
          <div 
            className={`flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border shadow-lg transition-all duration-200 ${
              pullDistance >= threshold ? 'scale-110 bg-primary/10 border-primary/30' : ''
            }`}
            style={{
              opacity: Math.min(pullProgress * 1.5, 1),
              transform: `rotate(${pullProgress * 180}deg)`
            }}
          >
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <ArrowDown 
                className={`w-5 h-5 transition-colors ${
                  pullDistance >= threshold ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main 
        ref={mainRef}
        className="flex-1 overflow-y-auto overscroll-none scroll-container pb-44"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
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
              {stageProgress}
              {messages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  role={message.role}
                  content={message.content}
                  onOptionClick={onOptionClick}
                  onOptionSelect={onOptionSelect}
                  isLastMessage={index === messages.length - 1}
                  communicationBriefingId={communicationBriefingId}
                  coachRecommendation={index === messages.length - 1 ? coachRecommendation : null}
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
          
          {/* Recommendations section */}
          {(videoRecommendation || toolRecommendation || emotionButtonRecommendation || campRecommendation) && messages.length > 0 && (
            <div className="space-y-2 mt-4">
              {emotionButtonRecommendation}
              {campRecommendation}
              {videoRecommendation}
              {toolRecommendation}
            </div>
          )}
          
          {bottomContent}
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
        scenarioChips={scenarioChips}
        messagesCount={messages.length}
      />
    </div>
  );
};
