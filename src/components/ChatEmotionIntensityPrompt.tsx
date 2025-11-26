import { Button } from "@/components/ui/button";

interface ChatEmotionIntensityPromptProps {
  onSelect: (intensity: number) => void;
  onDismiss: () => void;
}

const intensityDescriptions = [
  { level: 1, label: "非常平静", desc: "几乎感受不到波动" },
  { level: 2, label: "较为平静", desc: "轻微的感受" },
  { level: 3, label: "轻微波动", desc: "有一些情绪" },
  { level: 4, label: "有所感受", desc: "情绪开始明显" },
  { level: 5, label: "中等强度", desc: "比较明显" },
  { level: 6, label: "较为强烈", desc: "需要注意" },
  { level: 7, label: "很强烈", desc: "明显影响" },
  { level: 8, label: "非常强烈", desc: "难以忽视" },
  { level: 9, label: "极其强烈", desc: "很难控制" },
  { level: 10, label: "最强烈", desc: "完全占据" },
];

export const ChatEmotionIntensityPrompt = ({ onSelect, onDismiss }: ChatEmotionIntensityPromptProps) => {
  return (
    <div className="flex justify-start mb-4 animate-in fade-in-50 duration-500">
      <div className="max-w-[85%] bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm text-foreground mb-3">
            🌿 此刻的情绪强度有多少？
          </p>
          
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
              const desc = intensityDescriptions[n - 1];
              return (
                <Button
                  key={n}
                  variant="outline"
                  onClick={() => onSelect(n)}
                  className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-primary/10 hover:border-primary/50 transition-all"
                  title={`${desc.label} - ${desc.desc}`}
                >
                  <span className="text-base font-semibold">{n}</span>
                  <span className="text-[9px] text-muted-foreground leading-none">{desc.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="flex gap-2 text-xs text-muted-foreground justify-between px-1">
            <span>轻微</span>
            <span>中等</span>
            <span>强烈</span>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="w-full text-xs"
          >
            跳过，让AI判断
          </Button>
        </div>
      </div>
    </div>
  );
};
