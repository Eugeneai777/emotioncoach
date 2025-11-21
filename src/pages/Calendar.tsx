import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import EmotionCalendarHeatmap from "@/components/EmotionCalendarHeatmap";

const Calendar = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-1.5 md:gap-2 text-xs md:text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">返回主页</span>
              <span className="sm:hidden">返回</span>
            </Button>
            <h1 className="text-base md:text-xl font-bold text-foreground">情绪日历</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <EmotionCalendarHeatmap />
      </main>
    </div>
  );
};

export default Calendar;
