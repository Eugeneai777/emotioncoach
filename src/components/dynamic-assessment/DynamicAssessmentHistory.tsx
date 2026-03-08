import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Calendar, TrendingUp, TrendingDown, GitCompare } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { DynamicAssessmentRecord } from "@/hooks/useDynamicAssessmentHistory";
import { DimensionRadarChart } from "./DimensionRadarChart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DynamicAssessmentHistoryProps {
  records: DynamicAssessmentRecord[];
  isLoading: boolean;
  templateEmoji: string;
  onDelete?: (id: string) => void;
  onBack: () => void;
}

export function DynamicAssessmentHistory({
  records,
  isLoading,
  templateEmoji,
  onDelete,
  onBack,
}: DynamicAssessmentHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareRecords = selectedIds.length === 2
    ? [records.find((r) => r.id === selectedIds[0])!, records.find((r) => r.id === selectedIds[1])!]
    : null;

  // Sort: newer first for comparison (index 0 = newer)
  const sorted = compareRecords
    ? compareRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : null;

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold flex-1">测评历史</h2>
        {records.length >= 2 && (
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            className="gap-1 text-xs"
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedIds([]);
            }}
          >
            <GitCompare className="w-3.5 h-3.5" />
            {compareMode ? "退出对比" : "对比"}
          </Button>
        )}
      </div>

      {/* Compare hint */}
      {compareMode && selectedIds.length < 2 && (
        <div className="text-xs text-muted-foreground text-center mb-3 bg-muted/50 rounded-lg py-2">
          请选择 2 条记录进行对比（已选 {selectedIds.length}/2）
        </div>
      )}

      {/* Comparison View */}
      {sorted && compareMode && (
        <Card className="mb-4 border-primary/30">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">📊 对比分析</h3>
            <div className="flex items-center justify-between text-sm">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(sorted[1].created_at), "MM/dd", { locale: zhCN })}
                </p>
                <p className="text-lg font-bold">{sorted[1].total_score}</p>
              </div>
              <div className="text-center">
                {sorted[0].total_score > sorted[1].total_score ? (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">+{sorted[0].total_score - sorted[1].total_score}</span>
                  </div>
                ) : sorted[0].total_score < sorted[1].total_score ? (
                  <div className="flex items-center gap-1 text-destructive">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-medium">{sorted[0].total_score - sorted[1].total_score}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">持平</span>
                )}
                <p className="text-[10px] text-muted-foreground">变化</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(sorted[0].created_at), "MM/dd", { locale: zhCN })}
                </p>
                <p className="text-lg font-bold">{sorted[0].total_score}</p>
              </div>
            </div>

            {/* Radar comparison */}
            {(sorted[0].dimension_scores as any[])?.length >= 3 && (
              <DimensionRadarChart
                dimensionScores={sorted[0].dimension_scores as any[]}
                compareScores={sorted[1].dimension_scores as any[]}
              />
            )}

            {/* Dimension diff */}
            <div className="space-y-1.5">
              {((sorted[0].dimension_scores || []) as any[]).map((d: any, i: number) => {
                const prev = (sorted[1].dimension_scores as any[])?.[i];
                const diff = prev ? d.score - prev.score : 0;
                return (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <span>{d.emoji} {d.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{prev?.score ?? "-"} → {d.score}</span>
                      {diff !== 0 && (
                        <span className={diff > 0 ? "text-green-500" : "text-red-500"}>
                          {diff > 0 ? "+" : ""}{diff}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">暂无记录</h3>
            <p className="text-sm text-muted-foreground">完成测评后，记录将显示在这里</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-160px)]">
          <div className="space-y-3">
            {records.map((record, idx) => {
              const dimScores = (record.dimension_scores || []) as any[];
              const isSelected = selectedIds.includes(record.id);
              const prevRecord = records[idx + 1];
              const scoreDiff = prevRecord ? record.total_score - prevRecord.total_score : null;

              return (
                <Card
                  key={record.id}
                  className={`transition-all ${compareMode ? "cursor-pointer" : ""} ${
                    isSelected ? "ring-2 ring-primary border-primary" : ""
                  }`}
                  onClick={compareMode ? () => toggleSelect(record.id) : undefined}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl shrink-0">{templateEmoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{record.total_score} 分</Badge>
                            <span className="text-xs text-muted-foreground truncate">{record.primary_pattern}</span>
                            {scoreDiff !== null && scoreDiff !== 0 && (
                              <span className={`text-xs font-medium ${scoreDiff > 0 ? "text-green-500" : "text-red-500"}`}>
                                {scoreDiff > 0 ? "↑" : "↓"}{Math.abs(scoreDiff)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {format(new Date(record.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                          </div>
                        </div>
                      </div>
                      {!compareMode && onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(record.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {compareMode && (
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                        </div>
                      )}
                    </div>

                    {dimScores.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {dimScores.map((d: any) => (
                          <Badge key={d.label} variant="secondary" className="text-xs">
                            {d.emoji} {d.label} {d.score}/{d.maxScore}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除这条记录吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId && onDelete) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
