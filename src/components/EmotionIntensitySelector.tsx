import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface EmotionIntensitySelectorProps {
  onSelect: (intensity: number) => void;
  onSkip?: () => void;
  disabled?: boolean;
}

const intensityDescriptions = [
  { level: 1, label: "非常平静", desc: "情绪非常稳定，几乎感受不到波动" },
  { level: 2, label: "较为平静", desc: "情绪比较平稳，有一些轻微的感受" },
  { level: 3, label: "轻微波动", desc: "开始有一些情绪，但还算平和" },
  { level: 4, label: "有所感受", desc: "情绪开始变得明显，能清晰感知到" },
  { level: 5, label: "中等强度", desc: "情绪比较明显，开始影响思考和感受" },
  { level: 6, label: "较为强烈", desc: "情绪变得强烈，需要注意和处理" },
  { level: 7, label: "很强烈", desc: "情绪很强，明显影响身心状态" },
  { level: 8, label: "非常强烈", desc: "情绪非常强烈，难以忽视" },
  { level: 9, label: "极其强烈", desc: "情绪几乎要溢出，很难控制" },
  { level: 10, label: "最强烈", desc: "情绪达到顶峰，完全被情绪占据" },
];

const getIntensityColor = (level: number) => {
  if (level <= 3) return "from-green-500/20 to-green-600/20";
  if (level <= 5) return "from-blue-500/20 to-blue-600/20";
  if (level <= 7) return "from-orange-500/20 to-orange-600/20";
  return "from-red-500/20 to-red-600/20";
};

export const EmotionIntensitySelector = ({ onSelect, onSkip, disabled }: EmotionIntensitySelectorProps) => {
  const [selectedIntensity, setSelectedIntensity] = useState<number>(5);

  const handleSliderChange = (value: number[]) => {
    setSelectedIntensity(value[0]);
  };

  const handleConfirm = () => {
    onSelect(selectedIntensity);
  };

  const currentDescription = intensityDescriptions[selectedIntensity - 1];

  return (
    <div className="bg-card/30 border border-border/50 rounded-xl p-3 animate-in fade-in-50 duration-700">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">情绪强度</h3>
            <p className="text-xs text-muted-foreground mt-0.5">拖动调整你的感受强度</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{selectedIntensity}</div>
            <div className="text-xs text-muted-foreground">{currentDescription.label}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="px-2">
            <Slider
              value={[selectedIntensity]}
              onValueChange={handleSliderChange}
              min={1}
              max={10}
              step={1}
              disabled={disabled}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>1 轻微</span>
            <span>5 中等</span>
            <span>10 强烈</span>
          </div>
          
          <div className="flex gap-2">
            {onSkip && (
              <Button 
                onClick={onSkip}
                disabled={disabled}
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
              >
                跳过，让AI判断
              </Button>
            )}
            <Button 
              onClick={handleConfirm}
              disabled={disabled}
              size="sm"
              className={`h-8 text-xs ${onSkip ? 'flex-1' : 'w-full'}`}
            >
              确认开始对话
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};