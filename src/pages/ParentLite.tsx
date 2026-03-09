import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ParentLiteIntro } from "@/components/parent-lite/ParentLiteIntro";
import { ParentLiteQuestions, type ParentLiteAnswer } from "@/components/parent-lite/ParentLiteQuestions";
import { ParentLiteResult } from "@/components/parent-lite/ParentLiteResult";
import { StartCampDialog } from "@/components/camp/StartCampDialog";

type Phase = "intro" | "questions" | "result";

export default function ParentLitePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<ParentLiteAnswer[]>([]);
  const [showCampDialog, setShowCampDialog] = useState(false);

  const { data: campTemplate } = useQuery({
    queryKey: ["camp-template", "parent_emotion_21"],
    queryFn: async () => {
      const { data } = await supabase
        .from("camp_templates")
        .select("*")
        .eq("camp_type", "parent_emotion_21")
        .single();
      return data;
    },
  });

  const handleComplete = (ans: ParentLiteAnswer[]) => {
    setAnswers(ans);
    setPhase("result");
  };

  const handleJoinCamp = () => {
    if (campTemplate) {
      setShowCampDialog(true);
    } else {
      navigate("/parent-camp");
    }
  };

  return (
    <div
      className="h-screen overflow-y-auto overscroll-contain bg-background"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <DynamicOGMeta pageKey="parentLite" />

      {phase === "intro" && (
        <ParentLiteIntro onStart={() => setPhase("questions")} />
      )}

      {phase === "questions" && (
        <ParentLiteQuestions
          onComplete={handleComplete}
          onBack={() => setPhase("intro")}
        />
      )}

      {phase === "result" && (
        <ParentLiteResult
          answers={answers}
          onJoinCamp={handleJoinCamp}
        />
      )}

      {campTemplate && (
        <StartCampDialog
          open={showCampDialog}
          onOpenChange={setShowCampDialog}
          campTemplate={campTemplate}
          onSuccess={() => navigate("/parent-coach")}
        />
      )}
    </div>
  );
}
