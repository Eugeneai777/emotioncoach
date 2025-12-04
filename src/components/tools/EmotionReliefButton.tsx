import React from "react";
import { EmotionType } from "@/config/emotionReliefConfig";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmotionReliefButtonProps {
  emotion: EmotionType;
  onClick: () => void;
}

const EmotionReliefButton: React.FC<EmotionReliefButtonProps> = ({ emotion, onClick }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant="ghost"
          className={`
            h-14 px-4 rounded-xl w-full
            bg-gradient-to-br ${emotion.gradient}
            text-white border-0 shadow-md
            hover:shadow-xl hover:scale-105 hover:brightness-110
            active:scale-95
            transition-all duration-200
            flex items-center justify-center gap-2
          `}
        >
          <span className="text-xl">{emotion.emoji}</span>
          <span className="font-medium text-sm">{emotion.title}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px] text-center">
        <p className="text-xs">{emotion.subtitle}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default EmotionReliefButton;
