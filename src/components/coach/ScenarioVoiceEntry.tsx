import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { CoachVoiceChat } from "./CoachVoiceChat";
import { Mic } from "lucide-react";

interface Scenario {
  emoji: string;
  title: string;
  desc: string;
  strategy?: string;
}

interface ScenarioVoiceEntryProps {
  scenarios: Scenario[];
}

export const ScenarioVoiceEntry = ({ scenarios }: ScenarioVoiceEntryProps) => {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleScenarioClick = (scenarioTitle: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setActiveScenario(scenarioTitle);
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {scenarios.map((scenario, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleScenarioClick(scenario.title)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 min-w-[90px] rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100/50 hover:border-teal-300 hover:shadow-md transition-all active:scale-95"
          >
            <span className="text-2xl">{scenario.emoji}</span>
            <span className="text-xs font-medium text-foreground">{scenario.title}</span>
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0 h-4 bg-teal-500/10 border-teal-300/50 text-teal-700 flex items-center gap-0.5"
            >
              <Mic className="w-2.5 h-2.5" />
              语音
            </Badge>
          </motion.button>
        ))}
      </div>

      {/* 场景语音通话 */}
      {activeScenario && (
        <CoachVoiceChat
          onClose={() => setActiveScenario(null)}
          coachEmoji="🌿"
          coachTitle={`有劲AI · ${activeScenario}`}
          primaryColor="teal"
          scenario={activeScenario}
          featureKey="realtime_voice_vibrant_life"
        />
      )}
    </>
  );
};
