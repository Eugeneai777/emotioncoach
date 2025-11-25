import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Lightbulb } from "lucide-react";
import { GoalSuggestionCard } from "./GoalSuggestionCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SmartGoalSuggestionsPanelProps {
  userId: string;
}

interface GoalSuggestion {
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
}

interface SuggestionsData {
  success: boolean;
  analysis_summary: string;
  goal_suggestions: GoalSuggestion[];
  user_data?: any;
}

export const SmartGoalSuggestionsPanel = ({ userId }: SmartGoalSuggestionsPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-smart-goals', {
        body: {}
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || '获取目标建议失败');
      }

      setSuggestions(data);
      toast({
        title: "目标建议已生成",
        description: "AI已为你分析数据并生成个性化建议",
      });
    } catch (error: any) {
      console.error('Error fetching goal suggestions:', error);
      toast({
        title: "获取建议失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptGoal = async (suggestion: GoalSuggestion) => {
    try {
      // Calculate date range
      const startDate = new Date();
      const endDate = new Date();
      
      if (suggestion.goal_type === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (suggestion.goal_type === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Map suggestion to emotion_goals structure
      const goalData: any = {
        user_id: userId,
        goal_type: suggestion.goal_type,
        goal_category: suggestion.goal_category,
        description: `${suggestion.title}\n\n${suggestion.reasoning}\n\n预期收益：${suggestion.expected_benefit}`,
        target_count: suggestion.target_count,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: true,
      };

      // Add target_tag_id if it's a tag-related goal
      if (suggestion.target_tag_id && (suggestion.goal_category === 'tag_reduction' || suggestion.goal_category === 'tag_increase')) {
        goalData.target_tag_id = suggestion.target_tag_id;
      }

      // For intensity goals, add intensity fields
      if (suggestion.goal_category === 'intensity_average') {
        goalData.intensity_min = 1;
        goalData.intensity_max = 5;
        goalData.intensity_target_days = suggestion.target_count;
      }

      const { error } = await supabase
        .from('emotion_goals')
        .insert(goalData);

      if (error) throw error;

      toast({
        title: "目标创建成功",
        description: "已为你创建新目标，去目标页面查看吧",
      });

      // Navigate to goals page
      setTimeout(() => {
        navigate('/goals');
      }, 1000);

    } catch (error: any) {
      console.error('Error adopting goal:', error);
      toast({
        title: "创建目标失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleIgnoreGoal = (suggestionId: string) => {
    setIgnoredIds(prev => new Set(prev).add(suggestionId));
    toast({
      title: "已忽略建议",
      description: "你可以随时刷新获取新建议",
    });
  };

  const visibleSuggestions = suggestions?.goal_suggestions.filter(s => !ignoredIds.has(s.id)) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>智能目标推荐</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '分析中...' : suggestions ? '刷新建议' : '获取建议'}
          </Button>
        </div>
        <CardDescription>
          基于你的全维度数据，AI为你生成个性化可执行目标
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!suggestions && !loading && (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              点击"获取建议"按钮，让AI为你分析数据并生成目标建议
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">AI正在分析你的数据...</p>
          </div>
        )}

        {suggestions && !loading && (
          <>
            {/* Analysis Summary */}
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-primary mb-1">AI 分析</div>
                  <p className="text-sm text-muted-foreground">{suggestions.analysis_summary}</p>
                </div>
              </div>
            </div>

            {/* Goal Suggestions */}
            {visibleSuggestions.length > 0 ? (
              <div className="space-y-4">
                {visibleSuggestions.map((suggestion) => (
                  <GoalSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAdopt={handleAdoptGoal}
                    onIgnore={handleIgnoreGoal}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                所有建议已处理，点击刷新获取新建议
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
