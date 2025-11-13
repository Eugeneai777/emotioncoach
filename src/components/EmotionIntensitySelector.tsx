import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmotionIntensitySelectorProps {
  onSelect: (intensity: number) => void;
  disabled?: boolean;
}

const intensityDescriptions = [
  { level: 1, label: "非常平静", desc: "情绪非常稳定，几乎感受不到波动", color: "bg-green-100 hover:bg-green-200 border-green-300 text-green-700" },
  { level: 2, label: "较为平静", desc: "情绪比较平稳，有一些轻微的感受", color: "bg-green-100 hover:bg-green-200 border-green-300 text-green-700" },
  { level: 3, label: "轻微波动", desc: "开始有一些情绪，但还算平和", color: "bg-green-100 hover:bg-green-200 border-green-300 text-green-700" },
  { level: 4, label: "有所感受", desc: "情绪开始变得明显，能清晰感知到", color: "bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700" },
  { level: 5, label: "中等强度", desc: "情绪比较明显，开始影响思考和感受", color: "bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700" },
  { level: 6, label: "较为强烈", desc: "情绪变得强烈，需要注意和处理", color: "bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700" },
  { level: 7, label: "很强烈", desc: "情绪很强，明显影响身心状态", color: "bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700" },
  { level: 8, label: "非常强烈", desc: "情绪非常强烈，难以忽视", color: "bg-red-100 hover:bg-red-200 border-red-300 text-red-700" },
  { level: 9, label: "极其强烈", desc: "情绪几乎要溢出，很难控制", color: "bg-red-100 hover:bg-red-200 border-red-300 text-red-700" },
  { level: 10, label: "最强烈", desc: "情绪达到顶峰，完全被情绪占据", color: "bg-red-100 hover:bg-red-200 border-red-300 text-red-700" },
];

export const EmotionIntensitySelector = ({ onSelect, disabled }: EmotionIntensitySelectorProps) => {
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);

  const handleSelect = (intensity: number) => {
    setSelectedIntensity(intensity);
  };

  const handleConfirm = () => {
    if (selectedIntensity !== null) {
      onSelect(selectedIntensity);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/10 animate-in fade-in-50 duration-700">
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">现在的情绪强度如何？</h3>
          <p className="text-sm text-muted-foreground">
            将鼠标移到数字上可以看到详细说明，选择最符合你现在感受的强度
          </p>
        </div>

        <TooltipProvider delayDuration={100}>
          <div className="grid grid-cols-5 gap-2 py-4">
            {intensityDescriptions.map((item) => (
              <Tooltip key={item.level}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleSelect(item.level)}
                    disabled={disabled}
                    className={`
                      relative aspect-square rounded-lg border-2 transition-all duration-200
                      flex flex-col items-center justify-center gap-1
                      ${selectedIntensity === item.level 
                        ? `${item.color} scale-110 shadow-lg ring-2 ring-offset-2 ring-primary` 
                        : `${item.color} hover:scale-105`
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <span className="text-2xl font-bold">{item.level}</span>
                    <span className="text-[10px] leading-tight text-center px-1">{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className="font-semibold">{item.level} - {item.label}</p>
                    <p className="text-xs">{item.desc}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        <div className="flex items-center gap-2 pt-2">
          <div className="flex-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>轻微</span>
            <span>中等</span>
            <span>强烈</span>
          </div>
        </div>

        {selectedIntensity !== null && (
          <div className="text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-muted-foreground mb-3">
              你选择了 <span className="font-semibold text-foreground">{selectedIntensity}/10</span> - {intensityDescriptions[selectedIntensity - 1].label}
            </p>
            <Button 
              onClick={handleConfirm}
              disabled={disabled}
              className="w-full"
            >
              确认并开始对话
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};