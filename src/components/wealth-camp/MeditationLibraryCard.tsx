import { Cloud, CloudOff, Download, Loader2, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface WealthMeditation {
  id: string;
  day_number: number;
  title: string;
  description?: string;
  audio_url: string;
  duration_seconds: number;
}

interface MeditationLibraryCardProps {
  meditation: WealthMeditation;
  isCached: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onCache: () => Promise<boolean>;
}

export function MeditationLibraryCard({
  meditation,
  isCached,
  isSelected,
  onSelect,
  onCache,
}: MeditationLibraryCardProps) {
  const [isCaching, setIsCaching] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCacheClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCaching || isCached) return;
    
    setIsCaching(true);
    await onCache();
    setIsCaching(false);
  };

  return (
    <Card
      onClick={onSelect}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]",
        "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40",
        "border-amber-200 dark:border-amber-800",
        isSelected && "ring-2 ring-amber-500 shadow-lg"
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Day Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
            Day {meditation.day_number}
          </span>
          
          {/* Cache Status */}
          <button
            onClick={handleCacheClick}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isCached 
                ? "text-green-600 bg-green-50 dark:bg-green-900/30" 
                : "text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            )}
          >
            {isCaching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCached ? (
              <Cloud className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Title */}
        <h3 className="font-medium text-amber-900 dark:text-amber-100 line-clamp-2 min-h-[2.5rem]">
          {meditation.title}
        </h3>

        {/* Duration & Play Hint */}
        <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
          <span>⏱ {formatDuration(meditation.duration_seconds)}</span>
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            点击播放
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
