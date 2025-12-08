import { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface SwipeableMessageProps {
  children: ReactNode;
  onDelete?: () => void;
  className?: string;
}

export const SwipeableMessage = ({ 
  children, 
  onDelete,
  className = ""
}: SwipeableMessageProps) => {
  const { swipeDistance, isSwiping, isSwipingLeft, handlers, swipeStyle } = useSwipeGesture({
    onSwipeLeft: onDelete,
    threshold: 80,
    maxSwipe: 100
  });

  const deleteOpacity = Math.min(Math.abs(swipeDistance) / 80, 1);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Delete indicator background */}
      {onDelete && isSwipingLeft && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive/20"
          style={{ 
            width: `${Math.abs(swipeDistance) + 20}px`,
            opacity: deleteOpacity
          }}
        >
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive text-destructive-foreground transition-transform"
            style={{ 
              transform: `scale(${0.5 + deleteOpacity * 0.5})`,
              opacity: deleteOpacity
            }}
          >
            <Trash2 className="w-5 h-5" />
          </div>
        </div>
      )}
      
      {/* Swipeable content */}
      <div 
        {...handlers}
        style={swipeStyle}
        className="relative bg-background"
      >
        {children}
      </div>
    </div>
  );
};
