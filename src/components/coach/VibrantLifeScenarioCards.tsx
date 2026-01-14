import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface Scenario {
  id: string;
  emoji: string;
  title: string;
  description?: string;
  prompt: string;
  gradient?: string;
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
    <div className="w-full px-2 pb-4">
      <div className="text-center mb-3">
        <p className="text-sm text-muted-foreground">选择你的场景，开始对话</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {scenarios.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`
                relative overflow-hidden cursor-pointer 
                border border-border/50 
                bg-gradient-to-br ${scenario.gradient || 'from-primary/5 to-primary/10'}
                hover:border-primary/50 hover:shadow-md
                transition-all duration-200 active:scale-[0.98]
                p-3 min-h-[72px]
              `}
              onClick={() => onSelectScenario(scenario.prompt)}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl flex-shrink-0">{scenario.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground leading-tight">
                    {scenario.title}
                  </h4>
                  {scenario.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {scenario.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
