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
  voiceControls
}, ref) => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
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
          <Textarea
            ref={ref}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder={placeholder}
            className="resize-none min-h-[60px] max-h-[200px] flex-1"
            disabled={isLoading}
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {hasMessages && onNewConversation && (
              <Button
                variant="outline"
                size="icon"
                onClick={onNewConversation}
                disabled={isLoading}
                title="开始新对话"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={onSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className={`bg-gradient-to-r ${gradient} text-white`}
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
