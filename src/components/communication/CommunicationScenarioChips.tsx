import { Badge } from "@/components/ui/badge";

interface Scenario {
  id: string;
  emoji: string;
  title: string;
  prompt: string;
}

const scenarios: Scenario[] = [
  {
    id: "work-report",
    emoji: "💼",
    title: "职场汇报",
    prompt: "我需要向领导汇报工作进展，但担心表达不清或被质疑..."
  },
  {
    id: "family-talk",
    emoji: "🏠",
    title: "家庭沟通",
    prompt: "我想和家人沟通我的想法，但担心引起争执..."
  },
  {
    id: "reject-request",
    emoji: "❌",
    title: "拒绝请求",
    prompt: "有人请我帮忙，但我实在没有时间，不知道怎么拒绝..."
  },
  {
    id: "express-feelings",
    emoji: "💗",
    title: "表达感受",
    prompt: "我想表达我的感受，但不想让对方觉得我在指责..."
  },
  {
    id: "team-feedback",
    emoji: "👥",
    title: "团队反馈",
    prompt: "我需要给同事一些建议，但担心影响关系..."
  },
  {
    id: "difficult-conversation",
    emoji: "💬",
    title: "困难对话",
    prompt: "有一个很敏感的话题需要讨论，我不知道从何说起..."
  }
];

interface CommunicationScenarioChipsProps {
  onSelectScenario: (prompt: string) => void;
}

export const CommunicationScenarioChips = ({ onSelectScenario }: CommunicationScenarioChipsProps) => {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground px-1">
        💡 快速选择沟通场景
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
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
    </div>
  );
};
