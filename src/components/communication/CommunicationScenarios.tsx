import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Home, XCircle, Heart, Users, MessageSquare } from "lucide-react";

interface Scenario {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  description: string;
  prompt: string;
}

const scenarios: Scenario[] = [
  {
    id: "work-report",
    title: "职场汇报",
    icon: Briefcase,
    gradient: "from-blue-500 to-cyan-500",
    description: "向上级汇报工作、寻求认可",
    prompt: "我需要向领导汇报工作进展，但担心表达不清或被质疑..."
  },
  {
    id: "family-talk",
    title: "家庭沟通",
    icon: Home,
    gradient: "from-purple-500 to-pink-500",
    description: "与家人表达需求、化解矛盾",
    prompt: "我想和家人沟通我的想法，但担心引起争执..."
  },
  {
    id: "reject-request",
    title: "拒绝请求",
    icon: XCircle,
    gradient: "from-orange-500 to-red-500",
    description: "温和而坚定地说\"不\"",
    prompt: "有人请我帮忙，但我实在没有时间，不知道怎么拒绝..."
  },
  {
    id: "express-feelings",
    title: "表达感受",
    icon: Heart,
    gradient: "from-pink-500 to-rose-500",
    description: "传达情感而不让对方防御",
    prompt: "我想表达我的感受，但不想让对方觉得我在指责..."
  },
  {
    id: "team-feedback",
    title: "团队反馈",
    icon: Users,
    gradient: "from-green-500 to-emerald-500",
    description: "给同事建议、处理分歧",
    prompt: "我需要给同事一些建议，但担心影响关系..."
  },
  {
    id: "difficult-conversation",
    title: "困难对话",
    icon: MessageSquare,
    gradient: "from-indigo-500 to-violet-500",
    description: "处理敏感话题、化解冲突",
    prompt: "有一个很敏感的话题需要讨论，我不知道从何说起..."
  }
];

interface CommunicationScenariosProps {
  onSelectScenario: (prompt: string) => void;
}

export const CommunicationScenarios = ({ onSelectScenario }: CommunicationScenariosProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">
          💬 选择一个沟通场景
        </h2>
        <p className="text-sm text-muted-foreground">
          或者直接分享你的沟通困境
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <Card
              key={scenario.id}
              className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
              onClick={() => onSelectScenario(scenario.prompt)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${scenario.gradient} flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">
                    {scenario.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {scenario.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          💡 点击任意场景开始对话，或在下方输入你的具体情况
        </p>
      </div>
    </div>
  );
};
