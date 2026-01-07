import { Brain, Sparkles, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCoachMemories, getMemoryTypeLabel, getLayerLabel, getLayerColor } from '@/hooks/useCoachMemories';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CoachMemoriesCardProps {
  limit?: number;
  showViewAll?: boolean;
}

export const CoachMemoriesCard = ({ limit = 5, showViewAll = true }: CoachMemoriesCardProps) => {
  const { data: memories, isLoading } = useCoachMemories(limit);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-purple-800 dark:text-purple-200">
            <Brain className="w-4 h-4" />
            <span>教练记住了...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-purple-200/50 rounded w-3/4" />
            <div className="h-4 bg-purple-200/50 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!memories || memories.length === 0) {
    return null; // 没有记忆时不显示
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-purple-800 dark:text-purple-200">
          <Brain className="w-4 h-4" />
          <span>教练记住了</span>
          <Sparkles className="w-3 h-3 text-purple-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="max-h-48">
          <div className="space-y-2">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="p-2.5 bg-white/60 dark:bg-white/5 rounded-lg border-l-2 border-purple-300 dark:border-purple-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-purple-900 dark:text-purple-100 flex-1">
                    {memory.content}
                  </p>
                  {memory.importance_score >= 8 && (
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                    {getMemoryTypeLabel(memory.memory_type)}
                  </Badge>
                  {memory.layer && (
                    <Badge className={`text-xs px-1.5 py-0 h-5 ${getLayerColor(memory.layer)}`}>
                      {getLayerLabel(memory.layer)}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(memory.created_at), 'M/d', { locale: zhCN })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {showViewAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-100/50"
            onClick={() => navigate('/wealth-awakening-archive')}
          >
            查看完整财富觉醒
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
