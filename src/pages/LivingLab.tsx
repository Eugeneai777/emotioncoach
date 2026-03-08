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
import PathDetailCards from "@/components/living-lab/PathDetailCards";
import UseCasesSection from "@/components/living-lab/UseCasesSection";
import TestimonialsSection from "@/components/living-lab/TestimonialsSection";
import BottomCTA from "@/components/living-lab/BottomCTA";

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
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-5 h-5 animate-pulse mx-auto mb-2 text-amber-400" />
          <p className="text-xs text-stone-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-stone-950" style={{ WebkitOverflowScrolling: "touch" }}>
      <DynamicOGMeta pageKey="energyStudio" />
      
      {/* Custom dark header */}
      <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-lg border-b border-stone-800/50">
        <div className="flex items-center justify-between h-11 px-3 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className="h-8 w-8 text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-sm font-medium text-amber-100/90 tracking-wide">每个人的生活教练</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-4 space-y-5">
        {activeTool ? (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setActiveTool(null)} className="mb-3 gap-1.5 text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800/50">
              <ArrowLeft className="w-3.5 h-3.5" />
              返回
            </Button>
            {renderTool()}
          </div>
        ) : (
          <>
            {/* 1. Super Entry */}
            <SuperEntry onInlineTool={handleToolClick} />

            {/* 2. 探索更多（折叠） */}
            <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-center gap-1 py-2.5 text-xs text-stone-500 hover:text-stone-400 transition-colors">
                <span>还想探索更多？</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-5 pb-6">
                  <PathDetailCards />
                  <UseCasesSection />
                  <TestimonialsSection />
                  <QuickNavFooter />
                  <BottomCTA onVoiceClick={() => {
                    if (!user) {
                      navigate("/auth");
                      return;
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }} />
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
