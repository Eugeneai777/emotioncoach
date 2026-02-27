import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquareHeart, Trash2, Calendar, TrendingUp, User, Users } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { patternConfigs, type PatternType, type Perspective, dimensions } from "./communicationAssessmentData";
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
  perspective: Perspective;
  primary_pattern: PatternType;
  secondary_pattern: PatternType | null;
  listening_score: number;
  empathy_score: number;
  boundary_score: number;
  expression_score: number;
  conflict_score: number;
  understanding_score: number;
  created_at: string;
}

interface CommAssessmentHistoryProps {
  records: CommHistoryRecord[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
}

export function CommAssessmentHistory({ records, isLoading, onDelete }: CommAssessmentHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent>
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
          <p className="text-sm text-muted-foreground">完成亲子沟通测评后，记录将显示在这里</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[60vh] pr-2">
        <div className="space-y-4">
          {records.map((record, index) => {
            const pattern = patternConfigs[record.primary_pattern];
            const scores = [
              { label: '倾听', score: record.listening_score, color: 'bg-sky-500' },
              { label: '共情', score: record.empathy_score, color: 'bg-pink-500' },
              { label: '边界', score: record.boundary_score, color: 'bg-amber-500' },
              { label: '表达', score: record.expression_score, color: 'bg-emerald-500' },
              { label: '冲突', score: record.conflict_score, color: 'bg-red-500' },
              { label: '理解', score: record.understanding_score, color: 'bg-indigo-500' },
            ];
            const total = scores.reduce((s, d) => s + d.score, 0);

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ transform: 'translateZ(0)' }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-400">
                          <MessageSquareHeart className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium">{pattern?.emoji} {pattern?.label}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 flex items-center gap-1">
                              {record.perspective === 'parent' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {record.perspective === 'parent' ? '家长' : '青少年'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                              {Math.round((total / 72) * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(record.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-4 pt-2 border-t space-y-3">
                      <div className="space-y-1.5">
                        {scores.map(item => (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-8">{item.label}</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.score / 12) * 100}%` }} />
                            </div>
                            <span className="text-xs font-medium w-8 text-right">{item.score}/12</span>
                          </div>
                        ))}
                      </div>
                      {onDelete && (
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(record.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
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
            <AlertDialogDescription>确定要删除这条测评记录吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId && onDelete) onDelete(deleteId); setDeleteId(null); }}
            >删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
