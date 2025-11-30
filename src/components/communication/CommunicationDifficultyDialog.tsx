import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface CommunicationDifficultyDialogProps {
  open: boolean;
  onClose: () => void;
  difficulty: number;
  onDifficultyChange: (value: number) => void;
  onConfirm: () => void;
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

export const CommunicationDifficultyDialog = ({
  open,
  onClose,
  difficulty,
  onDifficultyChange,
  onConfirm,
}: CommunicationDifficultyDialogProps) => {
  const currentLevel = difficultyLabels[difficulty];

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>这次沟通对你来说有多难？</DrawerTitle>
          <DrawerDescription>
            选择难度可以帮助我更好地为你提供建议
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="p-6 space-y-6">
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
              💡 根据你的真实感受选择这次沟通的难度级别
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              跳过
            </Button>
            <Button 
              className="flex-1"
              onClick={onConfirm}
            >
              确认
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};