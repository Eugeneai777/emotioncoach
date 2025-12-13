import { getBadgeInfo } from "@/hooks/useHumanCoaches";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CoachBadgeProps {
  badgeType: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function CoachBadge({ badgeType, size = "md", showLabel = true }: CoachBadgeProps) {
  const badge = getBadgeInfo(badgeType);
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border font-medium",
              badge.color,
              sizeClasses[size]
            )}
          >
            <span>{badge.emoji}</span>
            {showLabel && <span>{badge.label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{badge.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
