import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface CommunicationDifficultySelectorProps {
  difficulty: number;
  onDifficultyChange: (value: number) => void;
}

const difficultyLabels: { [key: number]: { label: string; desc: string; color: string } } = {
  1: { label: "非常简单", desc: "日常寒暄", color: "text-green-500" },
  2: { label: "较为简单", desc: "轻松交流", color: "text-green-400" },
  3: { label: "简单", desc: "常规对话", color: "text-lime-500" },
  4: { label: "稍有难度", desc: "需要一点技巧", color: "text-yellow-500" },
  5: { label: "中等难度", desc: "需要注意方式", color: "text-yellow-400" },
  6: { label: "有些困难", desc: "需要认真对待", color: "text-orange-400" },
  7: { label: "比较困难", desc: "需要准备应对", color: "text-orange-500" },
  8: { label: "很困难", desc: "具有挑战性", color: "text-red-400" },
  9: { label: "非常困难", desc: "高度敏感话题", color: "text-red-500" },
  10: { label: "极其困难", desc: "重大危机处理", color: "text-red-600" },
};

export const CommunicationDifficultySelector = ({
  difficulty,
  onDifficultyChange,
}: CommunicationDifficultySelectorProps) => {
  const currentLevel = difficultyLabels[difficulty];

  return (
    <Card className="p-4 bg-muted/50 border-border/50">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">沟通难度</Label>
          <div className="text-right">
            <div className={`text-sm font-semibold ${currentLevel.color}`}>
              {currentLevel.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentLevel.desc}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Slider
            value={[difficulty]}
            onValueChange={(values) => onDifficultyChange(values[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>简单</span>
            <span>中等</span>
            <span>困难</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          💡 根据你的感受选择这次沟通的难度级别
        </p>
      </div>
    </Card>
  );
};
