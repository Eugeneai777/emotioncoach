import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";

interface IntensityReminderDialogProps {
  onRecord: () => void;
  onDismiss: () => void;
}

export const IntensityReminderDialog = ({ onRecord, onDismiss }: IntensityReminderDialogProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-4 border-primary/20 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                记录此刻情绪 💫
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                你今天感觉如何？
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3 py-2">
          <p className="text-sm text-foreground/80 leading-relaxed">
            花一分钟记录你的情绪强度，帮助你：
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>追踪每日情绪变化趋势</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>识别情绪波动规律</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>建立健康的情绪觉察习惯</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onRecord}
            className="flex-1 gap-2"
            size="lg"
          >
            <Heart className="w-4 h-4" />
            立即记录
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            稍后提醒
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          可在设置中调整提醒时间
        </p>
      </Card>
    </div>
  );
};