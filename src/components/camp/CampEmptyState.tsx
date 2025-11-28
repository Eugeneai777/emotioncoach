import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface CampEmptyStateProps {
  categoryName: string;
  onExploreOther: () => void;
}

export function CampEmptyState({ categoryName, onExploreOther }: CampEmptyStateProps) {
  return (
    <Card className="border-dashed border-2 bg-gradient-to-br from-muted/30 to-muted/10">
      <div className="text-center py-16 px-6 space-y-6">
        <div className="relative inline-block">
          <div className="text-8xl opacity-20">🏕️</div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-primary animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">
            {categoryName}训练营即将推出
          </h3>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            我们正在精心准备更多精彩的训练营课程<br />
            敬请期待！
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
          <Button onClick={onExploreOther} variant="default" size="lg" className="gap-2">
            <Sparkles className="w-4 h-4" />
            探索其他训练营
          </Button>
        </div>

        <div className="pt-8 border-t max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">
            💡 提示：您可以在其他分类中找到更多精彩课程
          </p>
        </div>
      </div>
    </Card>
  );
}
