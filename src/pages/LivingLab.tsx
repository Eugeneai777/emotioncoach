import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ChevronDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useToolUsage } from "@/hooks/useToolUsage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import SuperEntry from "@/components/living-lab/SuperEntry";
import UsageStreakBar from "@/components/living-lab/UsageStreakBar";
import ToolGrid from "@/components/living-lab/ToolGrid";
import QuickNavFooter from "@/components/living-lab/QuickNavFooter";

// Inline tool components
import { BreathingExercise } from "@/components/tools/BreathingExercise";
import { MindfulnessPractice } from "@/components/tools/MindfulnessPractice";
import { ValuesExplorer } from "@/components/tools/ValuesExplorer";
import { StrengthsFinder } from "@/components/tools/StrengthsFinder";
import { VisionBoard } from "@/components/tools/VisionBoard";
import { GratitudeJournal } from "@/components/tools/GratitudeJournal";
import { HabitTracker } from "@/components/tools/HabitTracker";
import { EnergyManagement } from "@/components/tools/EnergyManagement";
import { SleepLogger } from "@/components/tools/SleepLogger";
import { ExerciseLogger } from "@/components/tools/ExerciseLogger";
import { FinanceTracker } from "@/components/tools/FinanceTracker";
import { TimeManagement } from "@/components/tools/TimeManagement";
import { RelationshipTracker } from "@/components/tools/RelationshipTracker";
import { EnergyDeclaration } from "@/components/tools/EnergyDeclaration";
import { AliveCheck } from "@/components/tools/AliveCheck";

interface ToolCard {
  id: string;
  tool_id: string;
  title: string;
  description: string;
  icon_name: string;
  category: string;
  gradient: string;
  is_available: boolean;
}

const LivingLab = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { streak, weekDays, loading: streakLoading, trackUsage } = useToolUsage();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["energy-studio-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_studio_tools")
        .select("*")
        .eq("is_available", true)
        .order("display_order");
      if (error) throw error;
      return data as ToolCard[];
    },
  });

  const handleToolClick = (toolId: string) => {
    if (user) trackUsage(toolId);

    const navRoutes: Record<string, string> = {
      awakening: "/awakening",
      goals: "/goals",
      "wealth-block": "/wealth-block",
      scl90: "/scl90",
      "emotion-health": "/emotion-health",
      "women-competitiveness": "/women-competitiveness",
      "comm-assessment": "/communication-assessment",
      "parent-ability": "/parent-ability-assessment",
      "midlife-awakening": "/midlife-awakening",
    };

    if (navRoutes[toolId]) {
      navigate(navRoutes[toolId]);
      return;
    }

    setActiveTool(toolId);
  };

  const renderTool = () => {
    switch (activeTool) {
      case "breathing": return <BreathingExercise />;
      case "mindfulness": return <MindfulnessPractice />;
      case "values": return <ValuesExplorer />;
      case "strengths": return <StrengthsFinder />;
      case "vision": return <VisionBoard />;
      case "gratitude": return <GratitudeJournal />;
      case "habits": return <HabitTracker />;
      case "energy": return <EnergyManagement />;
      case "sleep": return <SleepLogger />;
      case "exercise": return <ExerciseLogger />;
      case "finance": return <FinanceTracker />;
      case "time": return <TimeManagement />;
      case "relationships": return <RelationshipTracker />;
      case "declaration": return <EnergyDeclaration />;
      case "alive-check": return <AliveCheck />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-6 h-6 animate-pulse mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-zinc-950 via-neutral-900 to-zinc-950" style={{ WebkitOverflowScrolling: "touch" }}>
      <DynamicOGMeta pageKey="energyStudio" />
      <PageHeader title="每个人的生活教练" titleClassName="text-white" />

      <main className="container max-w-2xl mx-auto px-3 py-3 space-y-4">
        {activeTool ? (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setActiveTool(null)} className="mb-3 gap-1.5 text-sm text-zinc-300 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            {renderTool()}
          </div>
        ) : (
          <>
            {/* 1. Super Entry - 超级入口 */}
            <div className="pt-4">
              <SuperEntry onInlineTool={handleToolClick} />
            </div>


            {/* 3. 更多工具（折叠） */}
            <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-center gap-1.5 py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                <span>还想探索更多？</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 pb-6">
                  <QuickNavFooter />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </main>
    </div>
  );
};

export default LivingLab;
