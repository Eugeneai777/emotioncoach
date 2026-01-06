import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus, Sparkles, Target, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ComparisonData {
  hasComparison: boolean;
  current: {
    behavior_score: number;
    emotion_score: number;
    belief_score: number;
    total_score: number;
    created_at: string;
    version?: number;
  };
  previous?: {
    behavior_score: number;
    emotion_score: number;
    belief_score: number;
    total_score: number;
    created_at: string;
    version?: number;
  };
  changes?: {
    behavior: { absolute: number; percent: number };
    emotion: { absolute: number; percent: number };
    belief: { absolute: number; percent: number };
    overall: { absolute: number; percent: number };
  };
  analysis: {
    overall_change: string | null;
    highlight: string;
    still_working: string | null;
    breakthrough_signals: string[];
    next_focus: string;
    encouragement?: string;
  };
}

interface AssessmentComparisonProps {
  currentAssessmentId: string;
  previousAssessmentId?: string;
}

export function AssessmentComparison({ currentAssessmentId, previousAssessmentId }: AssessmentComparisonProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComparison() {
      try {
        setLoading(true);
        const { data: result, error: fetchError } = await supabase.functions.invoke('compare-assessments', {
          body: {
            current_assessment_id: currentAssessmentId,
            previous_assessment_id: previousAssessmentId
          }
        });

        if (fetchError) throw fetchError;
        setData(result);
      } catch (e) {
        console.error('Error fetching comparison:', e);
        setError(e instanceof Error ? e.message : '加载对比数据失败');
      } finally {
        setLoading(false);
      }
    }

    if (currentAssessmentId) {
      fetchComparison();
    }
  }, [currentAssessmentId, previousAssessmentId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const getChangeIcon = (value: number) => {
    if (value < -5) return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    if (value > 5) return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getChangeColor = (value: number) => {
    // For scores, lower is better (less stuck)
    if (value < -5) return 'text-emerald-600';
    if (value > 5) return 'text-red-600';
    return 'text-muted-foreground';
  };

  if (!data.hasComparison) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            首次测评基准
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{data.analysis.highlight}</p>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            💡 {data.analysis.next_focus}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            测评变化对比
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            T{data.previous?.version || 1} → T{data.current.version || 2}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Score Changes */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '行为层', key: 'behavior' as const, color: 'amber' },
            { label: '情绪层', key: 'emotion' as const, color: 'pink' },
            { label: '信念层', key: 'belief' as const, color: 'violet' },
          ].map(({ label, key, color }) => (
            <div 
              key={key}
              className={cn(
                "p-3 rounded-lg text-center",
                `bg-${color}-50 dark:bg-${color}-950/30`
              )}
            >
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="flex items-center justify-center gap-1">
                {getChangeIcon(data.changes![key].absolute)}
                <span className={cn("font-bold", getChangeColor(data.changes![key].absolute))}>
                  {data.changes![key].percent > 0 ? '+' : ''}{data.changes![key].percent}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.previous![`${key}_score`]} → {data.current[`${key}_score`]}
              </div>
            </div>
          ))}
        </div>

        {/* Highlight */}
        {data.analysis.highlight && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              ✨ {data.analysis.highlight}
            </p>
          </div>
        )}

        {/* Breakthrough Signals */}
        {data.analysis.breakthrough_signals.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">突破信号：</p>
            <div className="flex flex-wrap gap-2">
              {data.analysis.breakthrough_signals.map((signal, i) => (
                <span 
                  key={i}
                  className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Still Working */}
        {data.analysis.still_working && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{data.analysis.still_working}</p>
          </div>
        )}

        {/* Next Focus */}
        <div className="pt-2 border-t">
          <p className="text-sm">
            <span className="font-medium">💡 下阶段重点：</span>
            <span className="text-muted-foreground ml-1">{data.analysis.next_focus}</span>
          </p>
        </div>

        {/* Encouragement */}
        {data.analysis.encouragement && (
          <p className="text-center text-sm font-medium text-amber-600 dark:text-amber-400 pt-2">
            {data.analysis.encouragement}
          </p>
        )}

        {/* Time Range */}
        <div className="text-xs text-center text-muted-foreground pt-2 border-t">
          {format(new Date(data.previous!.created_at), 'M月d日', { locale: zhCN })} 
          {' → '} 
          {format(new Date(data.current.created_at), 'M月d日', { locale: zhCN })}
        </div>
      </CardContent>
    </Card>
  );
}
