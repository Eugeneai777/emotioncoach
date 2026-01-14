import { motion } from "framer-motion";

interface Scenario {
  id: string;
  emoji: string;
  title: string;
  prompt: string;
}

interface VibrantLifeScenarioCardsProps {
  scenarios: Scenario[];
  onSelectScenario: (prompt: string) => void;
}

export const VibrantLifeScenarioCards = ({ 
  scenarios, 
  onSelectScenario 
}: VibrantLifeScenarioCardsProps) => {
  if (!scenarios || scenarios.length === 0) return null;

  return (
    <div className="w-full px-2 pb-3">
      <div className="text-center mb-2">
        <p className="text-xs text-muted-foreground">选择场景，开始对话</p>
      </div>
      {/* 横向滚动容器 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {scenarios.map((scenario, index) => (
          <motion.button
            key={scenario.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className="
              flex-shrink-0 flex items-center gap-1
              px-3 py-2 rounded-full
              bg-gradient-to-r from-primary/5 to-primary/10
              border border-primary/20
              hover:border-primary/40 hover:bg-primary/15
              active:scale-95 transition-all
              text-sm font-medium text-foreground
            "
            onClick={() => onSelectScenario(scenario.prompt)}
          >
            <span className="text-base">{scenario.emoji}</span>
            <span>{scenario.title}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
