import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { DynamicAssessmentRecord } from "@/hooks/useDynamicAssessmentHistory";
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

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">测评历史</h2>
      </div>

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
        <ScrollArea className="max-h-[calc(100vh-120px)]">
          <div className="space-y-3">
            {records.map((record) => {
              const dimScores = (record.dimension_scores || []) as any[];
              return (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{templateEmoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{record.total_score} 分</Badge>
                            <span className="text-xs text-muted-foreground">{record.primary_pattern}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(record.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                          </div>
                        </div>
                      </div>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Mini dimension scores */}
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
