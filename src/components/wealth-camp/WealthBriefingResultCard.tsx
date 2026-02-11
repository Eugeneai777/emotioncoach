import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Heart, Brain, Gift, ChevronRight } from 'lucide-react';

interface WealthBriefingCardData {
  dayNumber: number;
  journalId?: string;
  behavior_insight: string;
  emotion_insight: string;
  belief_insight: string;
  giving_action: string;
}

interface WealthBriefingResultCardProps {
  data: WealthBriefingCardData;
}

export function WealthBriefingResultCard({ data }: WealthBriefingResultCardProps) {
  const navigate = useNavigate();

  const layers = [
    { icon: <Target className="w-4 h-4" />, label: '行为觉察', value: data.behavior_insight, color: 'amber' },
    { icon: <Heart className="w-4 h-4" />, label: '情绪信号', value: data.emotion_insight, color: 'pink' },
    { icon: <Brain className="w-4 h-4" />, label: '信念转化', value: data.belief_insight, color: 'violet' },
    { icon: <Gift className="w-4 h-4" />, label: '给予行动', value: data.giving_action, color: 'emerald' },
  ].filter(l => l.value);

  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    pink: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-200',
    violet: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-200',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
  };

  const iconColorMap: Record<string, string> = {
    amber: 'text-amber-600 dark:text-amber-400',
    pink: 'text-pink-600 dark:text-pink-400',
    violet: 'text-violet-600 dark:text-violet-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
  };

  return (
    <Card className="mt-3 overflow-hidden bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/80 dark:border-amber-800/50 shadow-lg shadow-amber-500/10">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
              财富简报已生成
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400">Day {data.dayNumber} · 觉醒记录</p>
          </div>
        </div>

        {/* Layer cards */}
        <div className="space-y-2">
          {layers.map((layer, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-lg border ${colorMap[layer.color]}`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 flex-shrink-0 ${iconColorMap[layer.color]}`}>
                  {layer.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium opacity-70 mb-0.5">{layer.label}</p>
                  <p className="text-sm leading-relaxed">{layer.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View detail button */}
        {data.journalId && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            onClick={() => navigate(`/wealth-journal/${data.journalId}`)}
          >
            查看完整简报
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          ✨ 已保存至「成长档案 → 财富简报」
        </p>
      </CardContent>
    </Card>
  );
}
