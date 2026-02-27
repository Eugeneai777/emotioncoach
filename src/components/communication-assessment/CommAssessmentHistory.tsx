import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Calendar, TrendingUp, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { patternConfigs, type PatternType } from "./communicationAssessmentData";
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

export interface CommHistoryRecord {
  id: string;
  perspective: string;
  listening_score: number;
  empathy_score: number;
  boundary_score: number;
  expression_score: number;
  conflict_score: number;
  understanding_score: number;
  primary_pattern: string | null;
  secondary_pattern: string | null;
  invite_code: string | null;
  created_at: string;
}

interface CommAssessmentHistoryProps {
  records: CommHistoryRecord[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  onViewDetail?: (record: CommHistoryRecord) => void;
}

const dimensionLabels = [
  { key: 'listening_score', label: '倾听', color: 'bg-sky-500' },
  { key: 'empathy_score', label: '共情', color: 'bg-pink-500' },
  { key: 'boundary_score', label: '边界', color: 'bg-amber-500' },
  { key: 'expression_score', label: '表达', color: 'bg-emerald-500' },
  { key: 'conflict_score', label: '冲突', color: 'bg-red-500' },
  { key: 'understanding_score', label: '理解', color: 'bg-indigo-500' },
];

export function CommAssessmentHistory({ records, isLoading, onDelete, onViewDetail }: CommAssessmentHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-100 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="font-semibold mb-2">暂无测评记录</h3>
          <p className="text-sm text-muted-foreground">
            完成亲子沟通测评后，你的记录将显示在这里
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[60vh] sm:max-h-[500px] pr-2 sm:pr-4">
        <div className="space-y-4">
          {records.map((record, index) => {
            const pattern = record.primary_pattern
              ? patternConfigs[record.primary_pattern as PatternType]
              : null;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0.01, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-400">
                          <span className="text-lg">{pattern?.emoji || '📊'}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium">{pattern?.label || '未知模式'}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
                              {record.perspective === 'parent' ? '👨‍👩‍👧 家长' : '🧑‍🎓 青少年'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(new Date(record.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">六维度得分</p>
                        <div className="space-y-2">
                          {dimensionLabels.map(item => {
                            const score = (record as any)[item.key] as number;
                            return (
                              <div key={item.key} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-8">{item.label}</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full", item.color)}
                                    style={{ width: `${(score / 12) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium w-10 text-right">{score}/12</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {onViewDetail && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => onViewDetail(record)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            查看详情
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(record.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条测评记录吗？此操作无法撤销。
            </AlertDialogDescription>
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
    </>
  );
}
