import { Image, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackgroundSourceSelectorProps {
  source: 'unsplash' | 'ai';
  onSourceChange: (source: 'unsplash' | 'ai') => void;
}

export const BackgroundSourceSelector = ({ source, onSourceChange }: BackgroundSourceSelectorProps) => {
  return (
    <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
      <button
        onClick={() => onSourceChange('unsplash')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
          source === 'unsplash'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Image className="w-4 h-4" />
        <span>图库背景</span>
        <span className="text-xs text-green-600 font-normal">免费</span>
      </button>
      <button
        onClick={() => onSourceChange('ai')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
          source === 'ai'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span>AI生成</span>
        <span className="text-xs text-amber-600 font-normal">5点</span>
      </button>
    </div>
  );
};
