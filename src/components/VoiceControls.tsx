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
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="lg"
        onClick={isListening ? onStopListening : onStartListening}
        disabled={disabled || isSpeaking}
        className={cn(
          "rounded-2xl h-[56px] px-4 transition-all duration-200",
          isListening && "bg-primary text-primary-foreground animate-pulse"
        )}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      {isSpeaking && (
        <Button
          variant="outline"
          size="lg"
          onClick={onStopSpeaking}
          className="rounded-2xl h-[56px] px-4 bg-primary/10 animate-pulse"
        >
          <VolumeX className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};
