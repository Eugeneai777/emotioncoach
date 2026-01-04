import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, Heart, Brain, ChevronDown, ChevronUp, Trash2, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { blockInfo, patternInfo, BlockLayer, ReactionPattern } from "./wealthBlockData";
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

export interface HistoryRecord {
  id: string;
  behavior_score: number;
  emotion_score: number;
  belief_score: number;
  dominant_block: BlockLayer;
  reaction_pattern: ReactionPattern;
  created_at: string;
}

const iconMap = {
  behavior: Target,
  emotion: Heart,
  belief: Brain,
};

interface WealthBlockHistoryProps {
  records: HistoryRecord[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  onViewDetail?: (record: HistoryRecord) => void;
}

export function WealthBlockHistory({ records, isLoading, onDelete, onViewDetail }: WealthBlockHistoryProps) {
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="font-semibold mb-2">暂无测评记录</h3>
          <p className="text-sm text-muted-foreground">
            完成财富卡点测评后，你的记录将显示在这里
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {records.map((record, index) => {
            const dominant = blockInfo[record.dominant_block];
            const pattern = patternInfo[record.reaction_pattern];
            const Icon = iconMap[record.dominant_block];
            const isExpanded = expandedId === record.id;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
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
                          dominant.color
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{dominant.emoji} {dominant.name}</span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full border",
                              pattern.color
                            )}>
                              {pattern.emoji} {pattern.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(new Date(record.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                            </span>
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
                            {/* 三层得分 */}
                            <div className="space-y-2">
                              <p className="text-sm font-medium">三层卡点得分</p>
                              <div className="space-y-2">
                                {[
                                  { label: '行为层', score: record.behavior_score, color: 'bg-blue-500' },
                                  { label: '情绪层', score: record.emotion_score, color: 'bg-pink-500' },
                                  { label: '信念层', score: record.belief_score, color: 'bg-purple-500' },
                                ].map(item => (
                                  <div key={item.label} className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-12">{item.label}</span>
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className={cn("h-full rounded-full", item.color)}
                                        style={{ width: `${(item.score / 50) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium w-10 text-right">{item.score}/50</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex gap-2">
                              {onViewDetail && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => onViewDetail(record)}
                                >
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
