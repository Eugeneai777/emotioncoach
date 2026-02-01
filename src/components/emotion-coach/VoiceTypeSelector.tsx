import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  VOICE_TYPE_OPTIONS, 
  DEFAULT_VOICE_TYPE, 
  getSavedVoiceType, 
  saveVoiceType,
  type VoiceTypeOption 
} from '@/config/voiceTypeConfig';

interface VoiceTypeSelectorProps {
  value?: string;
  onChange?: (voiceType: string) => void;
  className?: string;
}

export const VoiceTypeSelector = ({ 
  value, 
  onChange,
  className 
}: VoiceTypeSelectorProps) => {
  const [selectedVoiceType, setSelectedVoiceType] = useState<string>(
    value || getSavedVoiceType()
  );

  // 同步外部 value 变化
  useEffect(() => {
    if (value && value !== selectedVoiceType) {
      setSelectedVoiceType(value);
    }
  }, [value]);

  const handleSelect = (option: VoiceTypeOption) => {
    setSelectedVoiceType(option.voice_type);
    saveVoiceType(option.voice_type);
    onChange?.(option.voice_type);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-muted-foreground">选择声音</span>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {VOICE_TYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
              "border hover:scale-105 active:scale-95",
              selectedVoiceType === option.voice_type
                ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 shadow-sm"
                : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground/30"
            )}
            title={option.description}
          >
            <span>{option.emoji}</span>
            <span>{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
