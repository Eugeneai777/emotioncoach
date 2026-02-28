import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Shield, Eye, Heart, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resultTypes, type ResultType } from "./parentAbilityData";
import { format } from "date-fns";
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
import { toast } from "sonner";

export interface AssessmentRecord {
  id: string;
  total_score: number;
  total_max: number;
  result_type: string;
  result_title: string;
  stability_score: number;
  stability_max: number;
  insight_score: number;
  insight_max: number;
  repair_score: number;
  repair_max: number;
  sub_dimension_scores: any;
  answers: Record<number, number>;
  follow_up_answers: any;
  ai_insight: any;
  created_at: string;
}

interface ParentAbilityHistoryProps {
  onViewReport: (record: AssessmentRecord) => void;
  onBack: () => void;
}

export function ParentAbilityHistory({ onViewReport, onBack }: ParentAbilityHistoryProps) {
  const { user } = useAuth();
  const [records, setRecords] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchRecords = async () => {
      const { data, error } = await supabase
        .from('parent_ability_assessments' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setRecords(data as any);
      }
      setLoading(false);
    };
    fetchRecords();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('parent_ability_assessments' as any)
      .delete()
      .eq('id', id);
    if (!error) {
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success('已删除');
    } else {
      toast.error('删除失败');
    }
    setDeleteId(null);
  };

  const dimIcons = [
    { key: 'stability', Icon: Shield, label: '稳定力', color: 'text-emerald-600' },
    { key: 'insight', Icon: Eye, label: '洞察力', color: 'text-sky-600' },
    { key: 'repair', Icon: Heart, label: '修复力', color: 'text-violet-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={onBack}>← 返回</Button>
          <h2 className="text-lg font-bold text-emerald-800">历史记录</h2>
          <div className="w-16" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>加载中...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-muted-foreground mb-4">暂无历史测评记录</p>
            <Button variant="outline" onClick={onBack}>去测评</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r, idx) => {
              const rt = resultTypes[r.result_type as ResultType] || resultTypes.potential_awakening;
              const percentage = Math.round((r.total_score / r.total_max) * 100);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-emerald-200 bg-white/90 overflow-hidden">
                    <CardContent className="p-0">
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => onViewReport(r)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">{rt.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{rt.title}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                {percentage}%
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(r.created_at), 'yyyy年M月d日 HH:mm')}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>

                        {/* Mini dimension bars */}
                        <div className="space-y-1.5">
                          {dimIcons.map(d => {
                            const score = r[`${d.key}_score` as keyof AssessmentRecord] as number;
                            const max = r[`${d.key}_max` as keyof AssessmentRecord] as number;
                            const pct = Math.round((score / max) * 100);
                            return (
                              <div key={d.key} className="flex items-center gap-2">
                                <d.Icon className={`w-3 h-3 ${d.color}`} />
                                <span className="text-xs text-muted-foreground w-10">{d.label}</span>
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Delete button */}
                      <div className="px-4 pb-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-7 text-xs"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />删除
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

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
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
