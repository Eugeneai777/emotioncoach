import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Calendar, TrendingUp, TrendingDown, GitCompare, History, Sparkles, Brain } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { DynamicAssessmentRecord } from "@/hooks/useDynamicAssessmentHistory";
import { DimensionRadarChart } from "./DimensionRadarChart";
import { motion, AnimatePresence } from "framer-motion";
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
  scoringType?: string;
  onDelete?: (id: string) => void;
  onBack: () => void;
}


function getLevelLabel(score: number, maxScore: number): { label: string; color: string } {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct >= 0.67) return { label: 'H', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
  if (pct >= 0.34) return { label: 'M', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
  return { label: 'L', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export function DynamicAssessmentHistory({
  records,
  isLoading,
  templateEmoji,
  scoringType,
  onDelete,
  onBack,
}: DynamicAssessmentHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isSBTI = scoringType === 'sbti';

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

  const sorted = compareRecords
    ? compareRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Decorative floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 -right-20 w-56 h-56 bg-accent/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-40 h-40 bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 p-4 max-w-lg md:max-w-2xl mx-auto">
        {/* Hero Header */}
        <motion.div
          className="rounded-2xl bg-gradient-to-br from-primary/80 to-primary/60 p-5 mb-5 relative overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-8 -translate-y-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-x-6 translate-y-6" />

          <div className="flex items-center gap-3 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white/90 hover:text-white hover:bg-white/10 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5" />
                测评历史
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                {records.length > 0 ? `共 ${records.length} 条记录` : "查看过往测评表现"}
              </p>
            </div>
            {records.length >= 2 && (
              <motion.div {...fadeUp(0.3)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 text-xs border transition-all ${
                    compareMode
                      ? "bg-white text-primary border-white hover:bg-white/90"
                      : "text-white/90 border-white/30 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => {
                    setCompareMode(!compareMode);
                    setSelectedIds([]);
                  }}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  {compareMode ? "退出对比" : "对比"}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Compare hint */}
        <AnimatePresence>
          {compareMode && selectedIds.length < 2 && (
            <motion.div
              className="text-xs text-muted-foreground text-center mb-4 bg-card/80 backdrop-blur-md rounded-xl py-2.5 px-4 border border-border/40 shadow-sm"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                请选择 2 条记录进行对比（已选 {selectedIds.length}/2）
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison View */}
        <AnimatePresence>
          {sorted && compareMode && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Card className="mb-5 border-primary/30 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    对比分析
                  </h3>
                  <div className="flex items-center justify-between">
                    <motion.div className="text-center" {...fadeUp(0.1)}>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {format(new Date(sorted[1].created_at), "MM/dd", { locale: zhCN })}
                      </p>
                      <div className="text-2xl font-bold bg-gradient-to-br from-muted-foreground to-muted-foreground/70 bg-clip-text text-transparent">
                        {sorted[1].total_score}
                      </div>
                    </motion.div>
                    <motion.div className="text-center" {...fadeUp(0.2)}>
                      {sorted[0].total_score > sorted[1].total_score ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-lg font-bold">+{sorted[0].total_score - sorted[1].total_score}</span>
                        </div>
                      ) : sorted[0].total_score < sorted[1].total_score ? (
                        <div className="flex items-center gap-1 text-destructive">
                          <TrendingDown className="w-5 h-5" />
                          <span className="text-lg font-bold">{sorted[0].total_score - sorted[1].total_score}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">持平</span>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">变化</p>
                    </motion.div>
                    <motion.div className="text-center" {...fadeUp(0.3)}>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {format(new Date(sorted[0].created_at), "MM/dd", { locale: zhCN })}
                      </p>
                      <div className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                        {sorted[0].total_score}
                      </div>
                    </motion.div>
                  </div>

                  {(sorted[0].dimension_scores as any[])?.length >= 3 && (
                    <DimensionRadarChart
                      dimensionScores={sorted[0].dimension_scores as any[]}
                      compareScores={sorted[1].dimension_scores as any[]}
                    />
                  )}

                  <div className="space-y-2 pt-1">
                    {((sorted[0].dimension_scores || []) as any[]).map((d: any, i: number) => {
                      const prev = (sorted[1].dimension_scores as any[])?.[i];
                      const diff = prev ? d.score - prev.score : 0;
                      return (
                        <motion.div
                          key={d.label}
                          className="flex items-center justify-between text-xs bg-muted/30 backdrop-blur-sm rounded-lg px-3 py-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.05 }}
                        >
                          <span className="font-medium">{d.emoji} {d.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{prev?.score ?? "-"} → {d.score}</span>
                            {diff !== 0 && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  diff > 0
                                    ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                    : "text-destructive border-destructive/30"
                                }`}
                              >
                                {diff > 0 ? "+" : ""}{diff}
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-md overflow-hidden shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="p-5 space-y-3">
                  <div className="h-5 w-2/3 bg-muted rounded-lg animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                  <div className="h-4 w-1/2 bg-muted rounded-lg animate-pulse" style={{ animationDelay: `${i * 150 + 100}ms` }} />
                  <div className="flex gap-2">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="h-6 w-16 bg-muted rounded-full animate-pulse" style={{ animationDelay: `${i * 150 + j * 80}ms` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
              <CardContent className="p-10 text-center">
                <motion.div
                  className="text-5xl mb-4"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 12 }}
                >
                  📋
                </motion.div>
                <motion.h3
                  className="font-semibold mb-2 text-foreground"
                  {...fadeUp(0.5)}
                >
                  暂无记录
                </motion.h3>
                <motion.p
                  className="text-sm text-muted-foreground"
                  {...fadeUp(0.6)}
                >
                  完成测评后，记录将显示在这里
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <ScrollArea className="max-h-[calc(100vh-220px)]">
            <motion.div
              className="space-y-3 pb-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {records.map((record, idx) => {
                const dimScores = (record.dimension_scores || []) as any[];
                const isSelected = selectedIds.includes(record.id);
                const prevRecord = records[idx + 1];
                const scoreDiff = prevRecord ? record.total_score - prevRecord.total_score : null;

                // SBTI: full inline display
                if (isSBTI) {
                  return (
                    <motion.div key={record.id} variants={itemVariants}>
                      <Card
                        className={`transition-all duration-300 border-border/40 bg-card/95 backdrop-blur-md shadow-sm hover:shadow-lg hover:border-primary/20 ${
                          compareMode ? "cursor-pointer" : ""
                        } ${isSelected ? "ring-2 ring-primary border-primary/30 shadow-primary/10 shadow-lg" : ""}`}
                        onClick={compareMode ? () => toggleSelect(record.id) : undefined}
                      >
                        <CardContent className="p-4 sm:p-5 md:p-6">
                          {/* Header: emoji + pattern + score + date */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <motion.span
                                className="text-3xl sm:text-4xl shrink-0"
                                whileHover={{ scale: 1.15, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                {templateEmoji}
                              </motion.span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm sm:text-base truncate">{record.primary_pattern}</span>
                                  <Badge
                                    variant="outline"
                                    className="bg-primary/10 border-primary/25 text-primary font-semibold"
                                  >
                                    {record.total_score} 分
                                  </Badge>
                                  {scoreDiff !== null && scoreDiff !== 0 && (
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 font-medium ${
                                        scoreDiff > 0
                                          ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
                                          : "text-destructive border-destructive/30 bg-destructive/5"
                                      }`}
                                    >
                                      {scoreDiff > 0 ? "↑" : "↓"}{Math.abs(scoreDiff)}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  {format(new Date(record.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!compareMode && onDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-60 hover:opacity-100 transition-all"
                                  onClick={(e) => { e.stopPropagation(); setDeleteId(record.id); }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                              {compareMode && (
                                <motion.div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                    isSelected ? "border-primary bg-primary scale-110" : "border-muted-foreground/30"
                                  }`}
                                  whileTap={{ scale: 0.85 }}
                                >
                                  {isSelected && (
                                    <motion.div
                                      className="w-2 h-2 rounded-full bg-primary-foreground"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 400 }}
                                    />
                                  )}
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Radar Chart - always visible */}
                          {dimScores.length >= 3 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                                📊 维度雷达图
                              </h4>
                              <div className="h-[220px] md:h-[280px]">
                                <DimensionRadarChart dimensionScores={dimScores} />
                              </div>
                            </div>
                          )}

                          {/* Dimension Progress Bars */}
                          {dimScores.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                                📋 维度得分
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {dimScores.map((d: any) => {
                                  const pct = d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0;
                                  return (
                                    <div key={d.label} className="flex items-center gap-2">
                                      <span className="text-sm shrink-0 w-5 text-center">{d.emoji}</span>
                                      <span className="text-xs font-medium w-20 sm:w-24 shrink-0 truncate">{d.label}</span>
                                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                        <motion.div
                                          className="h-full bg-primary rounded-full"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${pct}%` }}
                                          transition={{ duration: 0.6, delay: 0.1 }}
                                        />
                                      </div>
                                      <span className="text-[11px] text-muted-foreground w-10 text-right shrink-0">
                                        {d.score}/{d.maxScore}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* AI Insight - inline */}
                          {record.ai_insight && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                                <Brain className="w-3.5 h-3.5" /> AI 个性化洞察
                              </h4>
                              <div className="text-sm text-foreground/90 bg-muted/30 rounded-lg p-3 sm:p-4 whitespace-pre-wrap leading-relaxed">
                                {record.ai_insight}
                              </div>
                            </div>
                          )}
                          {!record.ai_insight && (
                            <p className="text-xs text-muted-foreground italic">AI 洞察暂未保存（仅新测评会自动保存）</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                }

                // Non-SBTI: keep existing compact display
                return (
                  <motion.div key={record.id} variants={itemVariants}>
                    <Card
                      className={`group transition-all duration-300 border-border/40 bg-card/95 backdrop-blur-md shadow-sm hover:shadow-lg hover:border-primary/20 ${
                        compareMode ? "cursor-pointer" : ""
                      } ${isSelected ? "ring-2 ring-primary border-primary/30 shadow-primary/10 shadow-lg" : ""}`}
                      onClick={compareMode ? () => toggleSelect(record.id) : undefined}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <motion.span
                              className="text-2xl shrink-0"
                              whileHover={{ scale: 1.15, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {templateEmoji}
                            </motion.span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className="bg-primary/10 border-primary/25 text-primary font-semibold"
                                >
                                  {record.total_score} 分
                                </Badge>
                                <span className="text-xs text-muted-foreground truncate">{record.primary_pattern}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                                <Calendar className="w-3 h-3 shrink-0" />
                                {format(new Date(record.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                              </div>
                            </div>
                          </div>
                          {!compareMode && onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(record.id); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          {compareMode && (
                            <motion.div
                              className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                                isSelected ? "border-primary bg-primary scale-110" : "border-muted-foreground/30"
                              }`}
                              whileTap={{ scale: 0.85 }}
                            >
                              {isSelected && (
                                <motion.div
                                  className="w-2 h-2 rounded-full bg-primary-foreground"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 400 }}
                                />
                              )}
                            </motion.div>
                          )}
                        </div>
                        {dimScores.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {dimScores.map((d: any) => (
                              <Badge
                                key={d.label}
                                variant="secondary"
                                className="text-xs bg-muted/50 backdrop-blur-sm border border-border/30 hover:bg-muted/70 transition-colors"
                              >
                                {d.emoji} {d.label} {d.score}/{d.maxScore}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
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
    </div>
  );
}
