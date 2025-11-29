import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ParentSession {
  id: string;
  feel_it: any;
  see_it: any;
  sense_it: any;
  transform_it: any;
}

interface FourStepsProgressProps {
  sessions: ParentSession[];
}

export const FourStepsProgress = ({ sessions }: FourStepsProgressProps) => {
  const total = sessions.length;
  
  if (total === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center">暂无数据</p>
      </Card>
    );
  }

  const steps = [
    {
      id: 1,
      name: "觉察 (Feel it)",
      emoji: "1️⃣",
      count: sessions.filter(s => s.feel_it).length,
      color: "bg-purple-500"
    },
    {
      id: 2,
      name: "看见 (See it)",
      emoji: "2️⃣",
      count: sessions.filter(s => s.see_it).length,
      color: "bg-pink-500"
    },
    {
      id: 3,
      name: "反应 (Sense it)",
      emoji: "3️⃣",
      count: sessions.filter(s => s.sense_it).length,
      color: "bg-blue-500"
    },
    {
      id: 4,
      name: "转化 (Transform it)",
      emoji: "4️⃣",
      count: sessions.filter(s => s.transform_it).length,
      color: "bg-green-500"
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">四部曲完成情况</h3>
        <div className="space-y-6">
          {steps.map(step => {
            const percentage = (step.count / total) * 100;
            return (
              <div key={step.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{step.emoji}</span>
                    <span className="text-sm font-medium text-foreground">{step.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {step.count} / {total} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">阶段性洞察</h3>
        <div className="space-y-3">
          {steps.map(step => {
            const percentage = (step.count / total) * 100;
            let insight = "";
            
            if (percentage === 100) {
              insight = "🌟 太棒了！这个阶段你已经完全掌握了！";
            } else if (percentage >= 80) {
              insight = "💪 做得很好！继续保持这个势头！";
            } else if (percentage >= 50) {
              insight = "👍 不错的进展，再加把劲！";
            } else {
              insight = "🌱 这个阶段还有提升空间，不要着急，慢慢来。";
            }

            return (
              <div key={step.id} className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-1">
                  {step.emoji} {step.name}
                </p>
                <p className="text-xs text-muted-foreground">{insight}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 md:p-6 bg-primary/5">
        <p className="text-sm text-foreground font-medium mb-2">💡 成长提示</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          亲子情绪四部曲是一个循序渐进的过程。不要着急，每一次练习都是在为更好的亲子关系打基础。
          记住：觉察、看见、反应、转化——每一步都很重要！
        </p>
      </Card>
    </div>
  );
};
