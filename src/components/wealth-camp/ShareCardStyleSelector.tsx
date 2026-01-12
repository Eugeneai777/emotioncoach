import React from 'react';
import { CARD_STYLE_CONFIGS, CardStylePreset } from './shareCardStyles';
import { cn } from '@/lib/utils';

interface ShareCardStyleSelectorProps {
  selectedStyle: CardStylePreset;
  onStyleChange: (style: CardStylePreset) => void;
  className?: string;
}

const STYLE_PREVIEWS: { id: CardStylePreset; gradient: string }[] = [
  { id: 'default', gradient: 'bg-gradient-to-r from-amber-200 to-orange-200' },
  { id: 'warm', gradient: 'bg-gradient-to-r from-rose-200 to-pink-200' },
  { id: 'professional', gradient: 'bg-gradient-to-r from-slate-200 to-gray-200' },
  { id: 'minimal', gradient: 'bg-gradient-to-r from-white to-gray-100' },
];

export function ShareCardStyleSelector({ 
  selectedStyle, 
  onStyleChange,
  className 
}: ShareCardStyleSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground font-medium">选择风格</p>
      <div className="grid grid-cols-4 gap-2">
        {STYLE_PREVIEWS.map((style) => {
          const config = CARD_STYLE_CONFIGS[style.id];
          const isSelected = selectedStyle === style.id;
          
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onStyleChange(style.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                isSelected 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <div 
                className={cn(
                  "w-full h-6 rounded-md",
                  style.gradient,
                  "border border-black/5"
                )}
              />
              <span className="text-[10px] text-muted-foreground">
                {config.label}
              </span>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-primary-foreground">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
