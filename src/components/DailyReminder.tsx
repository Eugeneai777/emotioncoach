import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DailyReminderProps {
  onStart: () => void;
  onDismiss: () => void;
}

export default function DailyReminder({ onStart, onDismiss }: DailyReminderProps) {
  return (
    <Card className="border-healing-lightGreen/30 bg-gradient-to-br from-healing-warmWhite to-healing-cream shadow-lg mb-6">
      <CardContent className="pt-6 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-2xl">🌿</p>
          <h3 className="text-lg font-medium text-healing-forestGreen">
            温柔的提醒
          </h3>
          <p className="text-healing-forestGreen/70 leading-relaxed">
            今天的情绪，想和劲老师一起梳理吗？
          </p>
          <p className="text-sm text-healing-forestGreen/60 leading-relaxed">
            无论是什么感受，都值得被看见和理解。劲老师在这里陪着你 💫
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={onStart}
            className="flex-1 bg-healing-lightGreen hover:bg-healing-sage text-white"
          >
            开始梳理
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
            className="flex-1 border-healing-sage/30 text-healing-forestGreen hover:bg-healing-cream"
          >
            稍后再说
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
