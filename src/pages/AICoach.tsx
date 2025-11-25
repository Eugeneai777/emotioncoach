import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { Heart, Activity, Brain, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { HealthOverviewCard } from "@/components/coach/HealthOverviewCard";
import { DimensionCard } from "@/components/coach/DimensionCard";
import { RecommendationCard } from "@/components/coach/RecommendationCard";
import { InsightCard } from "@/components/coach/InsightCard";
import { SmartGoalSuggestionsPanel } from "@/components/coach/SmartGoalSuggestionsPanel";

interface CoachData {
  overall_score: number;
  life_summary: string;
  dimensions: {
    emotion: {
      score: number;
      status: string;
      last_briefing_days_ago: number;
      recent_emotion_themes: string[];
      avg_intensity: number;
      trend: string;
    };
    lifestyle: {
      score: number;
      status: string;
      habit_completion_rate: number;
      exercise_frequency: string;
      sleep_quality_avg: number;
    };
    mindfulness: {
      score: number;
      status: string;
      meditation_this_week: number;
      breathing_this_week: number;
    };
    growth: {
      score: number;
      status: string;
      gratitude_count_week: number;
      has_clear_values: boolean;
      has_vision: boolean;
    };
  };
  smart_recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    reason: string;
    action_text: string;
    action_route: string;
    tool_id?: string;
  }>;
  cross_dimension_insights: Array<{
    insight: string;
    suggestion: string;
  }>;
  encouragement: string;
}

const AICoach = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coachData, setCoachData] = useState<CoachData | null>(null);

  const loadCoachData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('life-coach', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setCoachData(data);
    } catch (error) {
      console.error('获取AI教练数据失败:', error);
      toast.error('获取健康分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoachData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">请先登录以使用AI生活教练</p>
          <Button onClick={() => navigate('/auth')}>前往登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h1 className="text-lg font-bold">AI生活教练</h1>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadCoachData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {loading && !coachData ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-muted-foreground">正在分析你的健康数据...</p>
          </div>
        ) : coachData ? (
          <>
            {/* Overall Health */}
            <HealthOverviewCard 
              score={coachData.overall_score} 
              summary={coachData.life_summary} 
            />

            {/* Four Dimensions */}
            <div>
              <h2 className="text-lg font-semibold mb-3">四维健康状态</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DimensionCard
                  icon={Heart}
                  title="情绪健康"
                  score={coachData.dimensions.emotion.score}
                  status={coachData.dimensions.emotion.status}
                  details={[
                    `距上次梳理：${coachData.dimensions.emotion.last_briefing_days_ago}天`,
                    `平均情绪强度：${coachData.dimensions.emotion.avg_intensity}/10`,
                    `最近情绪：${coachData.dimensions.emotion.recent_emotion_themes.slice(0, 3).join('、')}`,
                  ]}
                />
                <DimensionCard
                  icon={Activity}
                  title="生活习惯"
                  score={coachData.dimensions.lifestyle.score}
                  status={coachData.dimensions.lifestyle.status}
                  details={[
                    `习惯完成率：${Math.round(coachData.dimensions.lifestyle.habit_completion_rate * 100)}%`,
                    `运动频率：${coachData.dimensions.lifestyle.exercise_frequency}`,
                    `睡眠质量：${coachData.dimensions.lifestyle.sleep_quality_avg}/10`,
                  ]}
                />
                <DimensionCard
                  icon={Brain}
                  title="身心调节"
                  score={coachData.dimensions.mindfulness.score}
                  status={coachData.dimensions.mindfulness.status}
                  details={[
                    `本周冥想：${coachData.dimensions.mindfulness.meditation_this_week}次`,
                    `本周呼吸练习：${coachData.dimensions.mindfulness.breathing_this_week}次`,
                  ]}
                />
                <DimensionCard
                  icon={Target}
                  title="自我成长"
                  score={coachData.dimensions.growth.score}
                  status={coachData.dimensions.growth.status}
                  details={[
                    `本周感恩：${coachData.dimensions.growth.gratitude_count_week}篇`,
                    coachData.dimensions.growth.has_clear_values ? '已设定价值观 ✓' : '尚未设定价值观',
                    coachData.dimensions.growth.has_vision ? '已创建愿景 ✓' : '尚未创建愿景',
                  ]}
                />
              </div>
            </div>

            {/* Smart Recommendations */}
            {coachData.smart_recommendations.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">🎯 今日推荐行动</h2>
                <div className="space-y-3">
                  {coachData.smart_recommendations.map((rec, index) => (
                    <RecommendationCard 
                      key={index}
                      type={rec.type}
                      priority={rec.priority}
                      title={rec.title}
                      reason={rec.reason}
                      actionText={rec.action_text}
                      actionRoute={rec.action_route}
                      toolId={rec.tool_id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cross-Dimension Insights */}
            {coachData.cross_dimension_insights.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">🔗 跨维度洞察</h2>
                <div className="space-y-3">
                  {coachData.cross_dimension_insights.map((insight, index) => (
                    <InsightCard key={index} {...insight} />
                  ))}
                </div>
              </div>
            )}

            {/* Smart Goal Suggestions */}
            <SmartGoalSuggestionsPanel userId={user.id} />

            {/* Encouragement */}
            <div className="text-center py-6">
              <p className="text-lg font-medium text-purple-600">
                {coachData.encouragement}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">暂无数据</p>
            <Button onClick={loadCoachData}>重新加载</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICoach;
