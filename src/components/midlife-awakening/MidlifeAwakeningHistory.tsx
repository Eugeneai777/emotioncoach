import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight, Compass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  personalityTypeConfig,
  dimensionConfig,
  getMidlifeScoreLevelLabel,
  getMidlifeScoreLevelColor,
  type MidlifePersonalityType,
  type MidlifeDimension,
  type MidlifeResult,
} from "./midlifeAwakeningData";
import type { Json } from "@/integrations/supabase/types";

export interface MidlifeHistoryRecord {
  id: string;
  created_at: string;
  personality_type: string;
  dimensions: Json;
  internal_friction_risk: number;
  action_power: number;
  mission_clarity: number;
  regret_risk: number;
  support_warmth: number;
  answers: Json;
  is_paid: boolean;
}

export function useMidlifeAwakeningHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['midlife-awakening-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('midlife_awakening_assessments' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MidlifeHistoryRecord[];
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

function HistoryCard({ record, onView }: { record: MidlifeHistoryRecord; onView: () => void }) {
  const personality = personalityTypeConfig[record.personality_type as MidlifePersonalityType];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(record.created_at), "yyyy年M月d日 HH:mm", { locale: zhCN })}</span>
          </div>
          {record.is_paid && <Badge variant="secondary" className="text-[10px] h-5">已完成</Badge>}
        </div>
        <div className="p-4 space-y-3">
          {personality && (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{personality.emoji}</span>
              <div>
                <p className="text-sm font-semibold">{personality.name}</p>
                <p className="text-xs text-muted-foreground">{personality.tagline}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
              <p className="text-lg font-bold text-red-600">{record.internal_friction_risk}</p>
              <p className="text-[10px] text-muted-foreground">内耗风险</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <p className="text-lg font-bold text-blue-600">{record.action_power}</p>
              <p className="text-[10px] text-muted-foreground">行动力</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <p className="text-lg font-bold text-amber-600">{record.mission_clarity}</p>
              <p className="text-[10px] text-muted-foreground">使命清晰</p>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Button variant="outline" className="w-full" onClick={onView}>
            查看完整报告 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HistorySkeleton() {
  return (
    <Card><CardContent className="p-4 space-y-3">
      <Skeleton className="h-4 w-32" />
      <div className="grid grid-cols-3 gap-3"><Skeleton className="h-20 rounded-lg" /><Skeleton className="h-20 rounded-lg" /><Skeleton className="h-20 rounded-lg" /></div>
      <Skeleton className="h-8 w-full" />
    </CardContent></Card>
  );
}

interface MidlifeAwakeningHistoryProps {
  onViewResult: (record: MidlifeHistoryRecord) => void;
}

export function MidlifeAwakeningHistory({ onViewResult }: MidlifeAwakeningHistoryProps) {
  const { data: records, isLoading, error } = useMidlifeAwakeningHistory();

  if (isLoading) return <div className="space-y-4"><HistorySkeleton /><HistorySkeleton /></div>;

  if (error) return (
    <Card><CardContent className="p-6 text-center">
      <p className="text-sm text-destructive">加载历史记录失败</p>
      <p className="text-xs text-muted-foreground mt-1">请稍后重试</p>
    </CardContent></Card>
  );

  if (!records || records.length === 0) return (
    <Card><CardContent className="p-8 text-center">
      <Compass className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
      <p className="text-sm font-medium">暂无测评记录</p>
      <p className="text-xs text-muted-foreground mt-1">完成测评后，你的报告将保存在这里</p>
    </CardContent></Card>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">共 {records.length} 次测评记录</h3>
      {records.map(record => (
        <HistoryCard key={record.id} record={record} onView={() => onViewResult(record)} />
      ))}
    </div>
  );
}
