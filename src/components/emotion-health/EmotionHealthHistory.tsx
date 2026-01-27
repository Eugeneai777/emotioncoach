import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight, Heart, Activity, Brain, Target } from "lucide-react";
import { useEmotionHealthHistory, type EmotionHealthHistoryRecord } from "@/hooks/useEmotionHealthHistory";
import { patternConfig, blockedDimensionConfig, type BlockedDimension } from "./emotionHealthData";

// 阻滞维度的 emoji 映射
const blockedDimensionEmoji: Record<BlockedDimension, string> = {
  action: "🚀",
  emotion: "💖",
  belief: "💎",
  giving: "🔋",
};

interface EmotionHealthHistoryProps {
  onViewResult: (record: EmotionHealthHistoryRecord) => void;
}

// 获取指数等级
function getIndexLevel(value: number): { label: string; color: string } {
  if (value >= 80) return { label: "良好", color: "text-emerald-600" };
  if (value >= 60) return { label: "一般", color: "text-amber-600" };
  if (value >= 40) return { label: "偏低", color: "text-orange-600" };
  return { label: "需关注", color: "text-rose-600" };
}

function HistoryCard({ 
  record, 
  onView 
}: { 
  record: EmotionHealthHistoryRecord; 
  onView: () => void;
}) {
  const primaryPattern = patternConfig[record.primary_pattern as keyof typeof patternConfig];
  const blockedDim = blockedDimensionConfig[record.blocked_dimension as keyof typeof blockedDimensionConfig];
  const energyLevel = getIndexLevel(record.energy_index);
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* 顶部信息栏 */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {format(new Date(record.created_at), "yyyy年M月d日 HH:mm", { locale: zhCN })}
            </span>
          </div>
          {record.is_paid && (
            <Badge variant="secondary" className="text-[10px] h-5">已完成</Badge>
          )}
        </div>
        
        {/* 主要内容 */}
        <div className="p-4 space-y-3">
          {/* 核心指标 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
              <Activity className="w-4 h-4 mx-auto mb-1 text-violet-600" />
              <p className="text-lg font-bold text-violet-600">{record.energy_index}</p>
              <p className="text-[10px] text-muted-foreground">能量指数</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <Brain className="w-4 h-4 mx-auto mb-1 text-amber-600" />
              <p className="text-lg font-bold text-amber-600">{record.anxiety_index}</p>
              <p className="text-[10px] text-muted-foreground">焦虑张力</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20">
              <Target className="w-4 h-4 mx-auto mb-1 text-rose-600" />
              <p className="text-lg font-bold text-rose-600">{record.stress_index}</p>
              <p className="text-[10px] text-muted-foreground">压力负载</p>
            </div>
          </div>
          
          {/* 模式和卡点 */}
          <div className="flex items-center gap-2 flex-wrap">
            {primaryPattern && (
              <Badge variant="outline" className="text-xs gap-1">
                <span>{primaryPattern.emoji}</span>
                <span>{primaryPattern.name}</span>
              </Badge>
            )}
            {blockedDim && (
              <Badge variant="outline" className="text-xs gap-1 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
                <span>{blockedDimensionEmoji[record.blocked_dimension as BlockedDimension] || "🎯"}</span>
                <span>{blockedDim.name}阻滞</span>
              </Badge>
            )}
          </div>
          
          {/* 能量状态 */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-xs">情绪能量状态</span>
            </div>
            <span className={`text-xs font-medium ${energyLevel.color}`}>
              {energyLevel.label}
            </span>
          </div>
        </div>
        
        {/* 查看按钮 */}
        <div className="px-4 pb-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onView}
          >
            查看完整报告
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HistorySkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

export function EmotionHealthHistory({ onViewResult }: EmotionHealthHistoryProps) {
  const { data: records, isLoading, error } = useEmotionHealthHistory();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <HistorySkeleton />
        <HistorySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-destructive">加载历史记录失败</p>
          <p className="text-xs text-muted-foreground mt-1">请稍后重试</p>
        </CardContent>
      </Card>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm font-medium">暂无测评记录</p>
          <p className="text-xs text-muted-foreground mt-1">
            完成测评后，你的报告将保存在这里
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          共 {records.length} 次测评记录
        </h3>
      </div>
      
      {records.map((record) => (
        <HistoryCard 
          key={record.id} 
          record={record} 
          onView={() => onViewResult(record)}
        />
      ))}
    </div>
  );
}
