import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, RotateCcw } from "lucide-react";
import { VoiceControls } from "@/components/VoiceControls";
import { forwardRef } from "react";

interface CoachInputFooterProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onNewConversation?: () => void;
  placeholder: string;
  isLoading: boolean;
  hasMessages: boolean;
  gradient: string;
  // Voice control props (optional)
  voiceControls?: {
    isListening: boolean;
    isSpeaking: boolean;
    onStartListening: () => void;
    onStopListening: () => void;
    onStopSpeaking: () => void;
    isSupported: boolean;
  };
  // Scenario chips (optional)
  scenarioChips?: React.ReactNode;
  messagesCount?: number;
}

export const CoachInputFooter = forwardRef<HTMLTextAreaElement, CoachInputFooterProps>(({
  input,
  onInputChange,
  onSend,
  onKeyPress,
  onNewConversation,
  placeholder,
  isLoading,
  hasMessages,
  gradient,
  voiceControls,
  scenarioChips,
  messagesCount
}, ref) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-20">
      <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
        {/* Scenario Chips */}
        {scenarioChips && (messagesCount === undefined || messagesCount <= 1) && (
          <div className="mb-1.5">
            {scenarioChips}
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          {/* Voice Controls (optional) */}
          {voiceControls && voiceControls.isSupported && (
            <VoiceControls
              isListening={voiceControls.isListening}
              isSpeaking={voiceControls.isSpeaking}
              onStartListening={voiceControls.onStartListening}
              onStopListening={voiceControls.onStopListening}
              onStopSpeaking={voiceControls.onStopSpeaking}
              disabled={isLoading}
              voiceSupported={voiceControls.isSupported}
            />
          )}

          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={ref}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder={placeholder}
              className="resize-none min-h-[60px] max-h-[160px] w-full"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1.5">
            {hasMessages && onNewConversation && (
              <Button
                variant="outline"
                size="icon"
                onClick={onNewConversation}
                disabled={isLoading}
                title="开始新对话"
                className="h-8 w-8"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              onClick={onSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className={`h-10 w-10 bg-gradient-to-r ${gradient} text-white`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
});

CoachInputFooter.displayName = "CoachInputFooter";
