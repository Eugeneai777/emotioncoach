import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Sparkles } from "lucide-react";

interface GoalSuggestionCardProps {
  suggestion: {
    id: string;
    category: string;
    goal_type: string;
    goal_category: string;
    title: string;
    description: string;
    target_count: number;
    target_tag_id?: string | null;
    target_tag_name?: string | null;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    expected_benefit: string;
    difficulty: 'easy' | 'medium' | 'hard';
    data_basis: Record<string, any>;
  };
  onAdopt: (suggestion: any) => void;
  onIgnore: (suggestionId: string) => void;
}

export const GoalSuggestionCard = ({ suggestion, onAdopt, onIgnore }: GoalSuggestionCardProps) => {
  const getPriorityConfig = (priority: string) => {
    if (priority === 'high') return { color: 'bg-red-100 text-red-700 border-red-200', label: '高优先级', icon: '🔴' };
    if (priority === 'medium') return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '中优先级', icon: '🟡' };
    return { color: 'bg-blue-100 text-blue-700 border-blue-200', label: '低优先级', icon: '🔵' };
  };

  const getDifficultyConfig = (difficulty: string) => {
    if (difficulty === 'easy') return { label: '简单', color: 'bg-green-100 text-green-700' };
    if (difficulty === 'medium') return { label: '中等', color: 'bg-orange-100 text-orange-700' };
    return { label: '困难', color: 'bg-red-100 text-red-700' };
  };

  const getCategoryIcon = (category: string) => {
    if (category === 'emotion') return '💭';
    if (category === 'lifestyle') return '🏃';
    if (category === 'mindfulness') return '🧘';
    if (category === 'growth') return '🌱';
    return '🎯';
  };

  const priorityConfig = getPriorityConfig(suggestion.priority);
  const difficultyConfig = getDifficultyConfig(suggestion.difficulty);

  return (
    <Card className={`p-6 border-l-4 ${suggestion.priority === 'high' ? 'border-l-red-500' : suggestion.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl">{getCategoryIcon(suggestion.category)}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className={priorityConfig.color}>
                  {priorityConfig.icon} {priorityConfig.label}
                </Badge>
                <Badge variant="outline" className={difficultyConfig.color}>
                  {difficultyConfig.label}
                </Badge>
              </div>
              <h4 className="font-semibold text-lg mb-1">{suggestion.title}</h4>
              <p className="text-sm text-muted-foreground">{suggestion.description}</p>
            </div>
          </div>
        </div>

        {/* Data Basis */}
        {suggestion.data_basis && Object.keys(suggestion.data_basis).length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Target className="w-4 h-4" />
              <span>数据依据</span>
            </div>
            {Object.entries(suggestion.data_basis).map(([key, value]) => (
              <div key={key} className="text-sm text-muted-foreground pl-6">
                • {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </div>
            ))}
          </div>
        )}

        {/* Reasoning */}
        <div className="flex items-start gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-muted-foreground">{suggestion.reasoning}</p>
        </div>

        {/* Expected Benefit */}
        <div className="flex items-start gap-2 text-sm bg-primary/5 rounded-lg p-3">
          <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-primary mb-1">预期收益</div>
            <p className="text-muted-foreground">{suggestion.expected_benefit}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            onClick={() => onAdopt(suggestion)}
            className="flex-1"
          >
            采纳并创建目标
          </Button>
          <Button 
            variant="outline"
            onClick={() => onIgnore(suggestion.id)}
          >
            忽略
          </Button>
        </div>
      </div>
    </Card>
  );
};
