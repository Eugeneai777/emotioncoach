import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, Trash2, Calendar, TrendingUp, Activity, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { scl90FactorInfo, severityConfig, SCL90Factor, SeverityLevel } from "./scl90Data";
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

export interface SCL90HistoryRecord {
  id: string;
  gsi: number;
  total_score: number;
  positive_count: number;
  positive_score_avg: number;
  severity_level: SeverityLevel;
  primary_symptom: SCL90Factor | null;
  secondary_symptom: SCL90Factor | null;
  somatization_score: number;
  obsessive_score: number;
  interpersonal_score: number;
  depression_score: number;
  anxiety_score: number;
  hostility_score: number;
  phobic_score: number;
  paranoid_score: number;
  psychoticism_score: number;
  other_score: number;
  created_at: string;
}

interface SCL90HistoryProps {
  records: SCL90HistoryRecord[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  onViewDetail?: (record: SCL90HistoryRecord) => void;
}

export function SCL90History({ records, isLoading, onDelete, onViewDetail }: SCL90HistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="font-semibold mb-2">暂无测评记录</h3>
          <p className="text-sm text-muted-foreground">
            完成 SCL-90 心理健康测评后，你的记录将显示在这里
          </p>
        </CardContent>
      </Card>
    );
  }

  // 获取因子得分数组用于显示
  const getFactorScores = (record: SCL90HistoryRecord) => [
    { key: 'somatization' as const, score: record.somatization_score },
    { key: 'obsessive' as const, score: record.obsessive_score },
    { key: 'interpersonal' as const, score: record.interpersonal_score },
    { key: 'depression' as const, score: record.depression_score },
    { key: 'anxiety' as const, score: record.anxiety_score },
    { key: 'hostility' as const, score: record.hostility_score },
    { key: 'phobic' as const, score: record.phobic_score },
    { key: 'paranoid' as const, score: record.paranoid_score },
    { key: 'psychoticism' as const, score: record.psychoticism_score },
    { key: 'other' as const, score: record.other_score },
  ].sort((a, b) => b.score - a.score);

  return (
    <>
      <ScrollArea className="max-h-[60vh] sm:max-h-[500px] pr-2 sm:pr-4">
        <div className="space-y-4">
          {records.map((record, index) => {
            const severity = severityConfig[record.severity_level];
            const primaryInfo = record.primary_symptom ? scl90FactorInfo[record.primary_symptom] : null;
            const isExpanded = expandedId === record.id;
            const factorScores = getFactorScores(record);

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
                    {/* 主要信息 */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg bg-gradient-to-br",
                          severity.color
                        )}>
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium">{severity.label}</span>
                            {primaryInfo && (
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                primaryInfo.bgColor,
                                "text-white"
                              )}>
                                {primaryInfo.emoji} {primaryInfo.name}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(record.created_at), "yyyy年MM月dd日", { locale: zhCN })}
                            </span>
                            <span>GSI: {record.gsi}</span>
                          </div>
                        </div>

                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* 展开详情 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 pb-4 pt-2 border-t space-y-4">
                            {/* 核心指标 */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-muted/50">
                                <div className="text-lg font-bold">{record.total_score}</div>
                                <div className="text-xs text-muted-foreground">总分</div>
                              </div>
                              <div className="p-2 rounded-lg bg-muted/50">
                                <div className="text-lg font-bold">{record.positive_count}</div>
                                <div className="text-xs text-muted-foreground">阳性项</div>
                              </div>
                              <div className="p-2 rounded-lg bg-muted/50">
                                <div className="text-lg font-bold">{record.positive_score_avg || '-'}</div>
                                <div className="text-xs text-muted-foreground">阳性均分</div>
                              </div>
                            </div>

                            {/* Top 5 因子得分 */}
                            <div className="space-y-2">
                              <p className="text-sm font-medium">主要症状因子</p>
                              <div className="space-y-1.5">
                                {factorScores.slice(0, 5).map(({ key, score }) => {
                                  const info = scl90FactorInfo[key];
                                  return (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="text-xs w-16 truncate">{info.emoji} {info.name}</span>
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className={cn("h-full rounded-full bg-gradient-to-r", info.color)}
                                          style={{ width: `${(score / 5) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-medium w-8 text-right">{score}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex gap-2">
                              {onViewDetail && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 gap-1.5"
                                  onClick={() => onViewDetail(record)}
                                >
                                  <Eye className="w-4 h-4" />
                                  查看详情
                                </Button>
                              )}
                              {onDelete && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(record.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* 删除确认对话框 */}
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
                if (deleteId && onDelete) {
                  onDelete(deleteId);
                }
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
