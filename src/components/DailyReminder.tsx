import { Button } from "@/components/ui/button";
import CarouselCardWrapper from "@/components/home/CarouselCardWrapper";

interface DailyReminderProps {
  onStart: () => void;
  onDismiss: () => void;
}

export default function DailyReminder({ onStart, onDismiss }: DailyReminderProps) {
  return (
    <CarouselCardWrapper 
      background="linear-gradient(135deg, hsl(var(--healing-warmWhite)) 0%, hsl(var(--healing-cream)) 100%)"
      textMode="dark"
    >
      <div className="flex flex-col justify-center items-center h-full space-y-4">
        <div className="text-center space-y-3">
          <p className="text-3xl">🌿</p>
          <h3 className="text-xl font-semibold text-healing-forestGreen">
            温柔的提醒
          </h3>
          <p className="text-base text-healing-forestGreen/80 leading-relaxed px-4">
            今天的情绪，想和劲老师一起梳理吗？
          </p>
          <p className="text-sm text-healing-forestGreen/60 leading-relaxed px-4">
            无论是什么感受，都值得被看见和理解。劲老师在这里陪着你 💫
          </p>
        </div>
        <div className="flex gap-3 w-full px-6">
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
      </div>
    </CarouselCardWrapper>
  );
}
