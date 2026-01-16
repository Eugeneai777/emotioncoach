import { Badge } from "@/components/ui/badge";
import { HorizontalScrollHint } from "@/components/ui/horizontal-scroll-hint";

interface Scenario {
  id: string;
  emoji: string;
  title: string;
  prompt: string;
}

interface CoachScenarioChipsProps {
  scenarios: Scenario[];
  onSelectScenario: (prompt: string) => void;
  primaryColor?: string;
}

export const CoachScenarioChips = ({ 
  scenarios, 
  onSelectScenario,
  primaryColor = "primary"
}: CoachScenarioChipsProps) => {
  if (!scenarios || scenarios.length === 0) return null;

  return (
    <HorizontalScrollHint className="pb-2">
      <div className="flex gap-1.5">
        {scenarios.map((scenario) => (
          <Badge
            key={scenario.id}
            variant="outline"
            className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all px-2 py-1 text-xs whitespace-nowrap flex-shrink-0"
            onClick={() => onSelectScenario(scenario.prompt)}
          >
            <span className="mr-0.5">{scenario.emoji}</span>
            {scenario.title}
          </Badge>
        ))}
      </div>
    </HorizontalScrollHint>
  );
};
