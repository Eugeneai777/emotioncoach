import { Card } from "@/components/ui/card";

interface EmotionIntensityMeterProps {
  intensity: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export const EmotionIntensityMeter = ({ 
  intensity, 
  showLabel = true,
  size = "md" 
}: EmotionIntensityMeterProps) => {
  const getIntensityColor = (value: number) => {
    if (value <= 3) return { bg: "bg-green-100", fill: "bg-green-500", text: "text-green-700" };
    if (value <= 5) return { bg: "bg-blue-100", fill: "bg-blue-500", text: "text-blue-700" };
    if (value <= 7) return { bg: "bg-orange-100", fill: "bg-orange-500", text: "text-orange-700" };
    return { bg: "bg-red-100", fill: "bg-red-500", text: "text-red-700" };
  };

  const getIntensityLabel = (value: number) => {
    if (value <= 3) return "轻微";
    if (value <= 5) return "中等";
    if (value <= 7) return "较强";
    return "强烈";
  };

  const colors = getIntensityColor(intensity);
  const sizeClasses = {
    sm: { height: "h-2", width: "w-32", text: "text-xs" },
    md: { height: "h-3", width: "w-48", text: "text-sm" },
    lg: { height: "h-4", width: "w-64", text: "text-base" }
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`font-medium text-foreground ${sizeClasses[size].text}`}>
            情绪强度
          </span>
          <span className={`font-semibold ${colors.text} ${sizeClasses[size].text}`}>
            {intensity}/10 · {getIntensityLabel(intensity)}
          </span>
        </div>
      )}
      
      <div className={`relative ${sizeClasses[size].width} ${sizeClasses[size].height} ${colors.bg} rounded-full overflow-hidden`}>
        <div 
          className={`absolute left-0 top-0 ${sizeClasses[size].height} ${colors.fill} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${(intensity / 10) * 100}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>轻微</span>
        <span>强烈</span>
      </div>
    </div>
  );
};

export const EmotionIntensityCard = ({ intensity }: { intensity: number }) => {
  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-background border-primary/10">
      <EmotionIntensityMeter intensity={intensity} size="md" />
    </Card>
  );
};
