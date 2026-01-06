import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Sparkles, History, Target, Heart, Brain } from 'lucide-react';
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

interface StickingPoints {
  dominantBehavior?: { name: string; count: number };
  dominantEmotion?: { name: string; count: number };
  dominantBelief?: { name: string; count: number };
  totalDays: number;
}

interface ProfileEvolutionCardProps {
  currentProfile: WealthProfile | null;
  evolutionInsight?: string;
  stickingPoints?: StickingPoints;
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
  stickingPoints,
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
      "bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border-border/50 shadow-sm",
      className
    )}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="w-4 h-4 text-violet-600" />
          <span className="text-foreground">我的财富画像</span>
          {hasHistory && (
            <Badge variant="secondary" className="ml-auto text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              第{currentProfile.current_week || 1}周
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {/* Sticking Points - Integrated from Core Sticking Points */}
        {stickingPoints && (stickingPoints.dominantBehavior || stickingPoints.dominantEmotion || stickingPoints.dominantBelief) && (
          <div className="grid grid-cols-3 gap-2">
            {stickingPoints.dominantBehavior && (
              <div className="p-2.5 bg-amber-100/60 dark:bg-amber-900/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs text-amber-700 dark:text-amber-300">行为层</span>
                </div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {stickingPoints.dominantBehavior.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stickingPoints.dominantBehavior.count}次
                </p>
              </div>
            )}
            {stickingPoints.dominantEmotion && (
              <div className="p-2.5 bg-pink-100/60 dark:bg-pink-900/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Heart className="w-3.5 h-3.5 text-pink-600" />
                  <span className="text-xs text-pink-700 dark:text-pink-300">情绪层</span>
                </div>
                <p className="text-sm font-medium text-pink-800 dark:text-pink-200">
                  {stickingPoints.dominantEmotion.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stickingPoints.dominantEmotion.count}次
                </p>
              </div>
            )}
            {stickingPoints.dominantBelief && (
              <div className="p-2.5 bg-violet-100/60 dark:bg-violet-900/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <Brain className="w-3.5 h-3.5 text-violet-600" />
                  <span className="text-xs text-violet-700 dark:text-violet-300">信念层</span>
                </div>
                <p className="text-sm font-medium text-violet-800 dark:text-violet-200">
                  {stickingPoints.dominantBelief.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stickingPoints.dominantBelief.count}次
                </p>
              </div>
            )}
          </div>
        )}

        {/* Health Score with Trend */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/60 dark:bg-white/5 border border-border/30">
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-full", trend.bgColor)}>
              <TrendIcon className={cn("w-4 h-4", trend.color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">健康指数</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-foreground">{currentScore}</span>
                {hasHistory && scoreDiff !== 0 && (
                  <span className={cn(
                    "text-xs font-medium",
                    scoreDiff > 0 ? "text-green-600" : "text-amber-600"
                  )}>
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className={cn("text-xs px-2 py-1 rounded-full", trend.bgColor, trend.color)}>
            {trend.label}
          </span>
        </div>

        {/* Type Changes - Simplified */}
        {hasAnyChange && (
          <div className="flex flex-wrap gap-1.5">
            {behaviorChange && (
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 line-through opacity-60 text-xs py-0">
                  {behaviorChange.from}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge className="bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/50 dark:text-amber-300 text-xs py-0">
                  {behaviorChange.to}
                </Badge>
              </div>
            )}
            {emotionChange && (
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 line-through opacity-60 text-xs py-0">
                  {emotionChange.from}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge className="bg-pink-100 text-pink-700 border-0 dark:bg-pink-900/50 dark:text-pink-300 text-xs py-0">
                  {emotionChange.to}
                </Badge>
              </div>
            )}
            {beliefChange && (
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="outline" className="bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 line-through opacity-60 text-xs py-0">
                  {beliefChange.from}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge className="bg-violet-100 text-violet-700 border-0 dark:bg-violet-900/50 dark:text-violet-300 text-xs py-0">
                  {beliefChange.to}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* AI Evolution Insight */}
        {evolutionInsight && (
          <div className="p-2.5 rounded-lg bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                {evolutionInsight}
              </p>
            </div>
          </div>
        )}

        {/* No History State */}
        {!hasHistory && !stickingPoints && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">
              继续完成训练，系统将记录你的成长轨迹
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
