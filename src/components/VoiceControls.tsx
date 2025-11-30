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

  const handleClick = () => {
    if (isSpeaking) {
      onStopSpeaking();
    } else if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const getTitle = () => {
    if (isSpeaking) return "点击停止播放";
    if (isListening) return "点击停止录音";
    return "点击开始录音";
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={disabled}
      title={getTitle()}
      className={cn(
        "h-10 w-10 rounded-xl transition-all duration-200 flex-shrink-0",
        isListening && "bg-primary text-primary-foreground animate-pulse",
        isSpeaking && "bg-orange-100 text-orange-600 border-orange-300 animate-pulse"
      )}
    >
      {isSpeaking ? (
        <Volume2 className="w-4 h-4" />
      ) : isListening ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
};
