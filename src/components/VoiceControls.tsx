import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  disabled?: boolean;
  voiceSupported?: boolean;
}

export const VoiceControls = ({
  isListening,
  isSpeaking,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  disabled,
  voiceSupported = true
}: VoiceControlsProps) => {
  if (!voiceSupported) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={isListening ? onStopListening : onStartListening}
      disabled={disabled || isSpeaking}
      className={cn(
        "h-10 w-10 rounded-xl transition-all duration-200 flex-shrink-0",
        isListening && "bg-primary text-primary-foreground animate-pulse"
      )}
    >
      {isListening ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
};
