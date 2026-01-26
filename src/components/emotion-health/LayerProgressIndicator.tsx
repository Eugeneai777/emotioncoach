import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { type QuestionLayer, layerConfig } from "./emotionHealthData";

interface LayerProgressIndicatorProps {
  currentLayer: QuestionLayer;
  className?: string;
}

export function LayerProgressIndicator({ currentLayer, className }: LayerProgressIndicatorProps) {
  const layers: QuestionLayer[] = ['screening', 'pattern', 'blockage'];
  const currentIndex = layers.indexOf(currentLayer);

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {layers.map((layer, index) => {
        const config = layerConfig[layer];
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={layer} className="flex items-center">
            {/* 层级圆圈 */}
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                isComplete && "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
                isActive && `bg-gradient-to-r ${config.color} text-white shadow-md`,
                !isActive && !isComplete && "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? <Check className="w-3.5 h-3.5" /> : index + 1}
            </div>

            {/* 连接线 */}
            {index < layers.length - 1 && (
              <div
                className={cn(
                  "w-6 h-0.5 mx-1",
                  index < currentIndex ? "bg-emerald-500" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface LayerLabelProps {
  currentLayer: QuestionLayer;
  className?: string;
}

export function LayerLabel({ currentLayer, className }: LayerLabelProps) {
  const config = layerConfig[currentLayer];
  
  return (
    <div className={cn("text-center", className)}>
      <span className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
        `bg-gradient-to-r ${config.color} text-white`
      )}>
        {config.name}
      </span>
    </div>
  );
}
