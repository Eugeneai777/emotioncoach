import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Sparkles, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSnapshot {
  week: number;
  snapshot: {
    dominant_poor?: string;
    dominant_emotion?: string;
    dominant_belief?: string;
    health_score?: number;
    reaction_pattern?: string;
  };
  created_at: string;
}

interface WealthProfile {
  dominant_poor?: string;
  dominant_emotion?: string;
  dominant_belief?: string;
  health_score?: number;
  reaction_pattern?: string;
  current_week?: number;
  profile_snapshots?: ProfileSnapshot[];
  updated_at?: string;
}

interface ProfileEvolutionCardProps {
  currentProfile: WealthProfile | null;
  evolutionInsight?: string;
  className?: string;
}

// Type name mappings
const behaviorTypeNames: Record<string, string> = {
  mouth: '嘴穷',
  lazy: '懒穷',
  slow: '慢穷',
  impulsive: '冲穷'
};

const emotionTypeNames: Record<string, string> = {
  anxiety: '焦虑',
  scarcity: '匮乏',
  guilt: '内疚',
  fear: '恐惧'
};

const beliefTypeNames: Record<string, string> = {
  unworthy: '不配得',
  lack: '匮乏信念',
  face: '面子困境',
  limit: '自我设限'
};

const patternNames: Record<string, string> = {
  chase: '追逐模式',
  avoid: '回避模式',
  trauma: '创伤模式',
  harmony: '和谐模式'
};

export function ProfileEvolutionCard({ 
  currentProfile, 
  evolutionInsight,
  className 
}: ProfileEvolutionCardProps) {
  if (!currentProfile) {
    return null;
  }

  const snapshots = currentProfile.profile_snapshots || [];
  const firstSnapshot = snapshots.length > 0 ? snapshots[0]?.snapshot : null;
  const hasHistory = !!firstSnapshot;

  // Calculate score difference
  const currentScore = currentProfile.health_score || 50;
  const originalScore = firstSnapshot?.health_score || currentScore;
  const scoreDiff = currentScore - originalScore;

  // Determine trend icon and color
  const getTrendDisplay = () => {
    if (scoreDiff > 5) {
      return { 
        icon: TrendingUp, 
        color: 'text-green-600', 
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        label: '持续提升' 
      };
    } else if (scoreDiff < -5) {
      return { 
        icon: TrendingDown, 
        color: 'text-amber-600', 
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        label: '调整期' 
      };
    }
    return { 
      icon: Minus, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      label: '保持稳定' 
    };
  };

  const trend = getTrendDisplay();
  const TrendIcon = trend.icon;

  // Get display names
  const getCurrentTypeName = (type: string | undefined, mapping: Record<string, string>) => {
    if (!type) return '未识别';
    return mapping[type] || type;
  };

  const getTypeChange = (current: string | undefined, original: string | undefined, mapping: Record<string, string>) => {
    if (!hasHistory || !original || current === original) {
      return null;
    }
    return {
      from: mapping[original] || original,
      to: mapping[current || ''] || current || '未识别'
    };
  };

  const behaviorChange = getTypeChange(currentProfile.dominant_poor, firstSnapshot?.dominant_poor, behaviorTypeNames);
  const emotionChange = getTypeChange(currentProfile.dominant_emotion, firstSnapshot?.dominant_emotion, emotionTypeNames);
  const beliefChange = getTypeChange(currentProfile.dominant_belief, firstSnapshot?.dominant_belief, beliefTypeNames);

  const hasAnyChange = behaviorChange || emotionChange || beliefChange || scoreDiff !== 0;

  return (
    <Card className={cn(
      "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="w-5 h-5 text-violet-600" />
          <span className="text-violet-800 dark:text-violet-200">财富画像演化</span>
          {hasHistory && (
            <Badge variant="secondary" className="ml-auto bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              第{currentProfile.current_week || 1}周
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score Comparison */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-white/5">
          <div>
            <p className="text-sm text-muted-foreground">财富健康指数</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-violet-700 dark:text-violet-300">{currentScore}</span>
              {hasHistory && scoreDiff !== 0 && (
                <span className={cn(
                  "text-sm font-medium",
                  scoreDiff > 0 ? "text-green-600" : "text-amber-600"
                )}>
                  {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                </span>
              )}
            </div>
          </div>
          <div className={cn("p-2 rounded-full", trend.bgColor)}>
            <TrendIcon className={cn("w-5 h-5", trend.color)} />
          </div>
        </div>

        {/* Type Changes */}
        {hasAnyChange && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">画像变化</p>
            <div className="grid gap-2">
              {/* Behavior Layer */}
              <div className="flex items-center gap-2 text-sm">
                <span className="w-16 text-muted-foreground">行为层</span>
                {behaviorChange ? (
                  <>
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700 line-through opacity-60">
                      {behaviorChange.from}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300">
                      {behaviorChange.to}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline" className="bg-red-50/50 text-red-600/80 border-red-200/50 dark:bg-red-900/20 dark:text-red-400/80">
                    {getCurrentTypeName(currentProfile.dominant_poor, behaviorTypeNames)}
                  </Badge>
                )}
              </div>

              {/* Emotion Layer */}
              <div className="flex items-center gap-2 text-sm">
                <span className="w-16 text-muted-foreground">情绪层</span>
                {emotionChange ? (
                  <>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700 line-through opacity-60">
                      {emotionChange.from}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300">
                      {emotionChange.to}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline" className="bg-blue-50/50 text-blue-600/80 border-blue-200/50 dark:bg-blue-900/20 dark:text-blue-400/80">
                    {getCurrentTypeName(currentProfile.dominant_emotion, emotionTypeNames)}
                  </Badge>
                )}
              </div>

              {/* Belief Layer */}
              <div className="flex items-center gap-2 text-sm">
                <span className="w-16 text-muted-foreground">信念层</span>
                {beliefChange ? (
                  <>
                    <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700 line-through opacity-60">
                      {beliefChange.from}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300">
                      {beliefChange.to}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline" className="bg-purple-50/50 text-purple-600/80 border-purple-200/50 dark:bg-purple-900/20 dark:text-purple-400/80">
                    {getCurrentTypeName(currentProfile.dominant_belief, beliefTypeNames)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Evolution Insight */}
        {evolutionInsight && (
          <div className="p-3 rounded-lg bg-white/80 dark:bg-white/10 border border-violet-100 dark:border-violet-800">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">
                {evolutionInsight}
              </p>
            </div>
          </div>
        )}

        {/* No History State */}
        {!hasHistory && (
          <div className="text-center py-3">
            <p className="text-sm text-muted-foreground">
              继续完成训练，系统将记录你的成长轨迹
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
