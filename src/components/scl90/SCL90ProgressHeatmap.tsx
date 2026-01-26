import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { scl90Questions } from "./scl90Data";

interface SCL90ProgressHeatmapProps {
  answers: Record<number, number>;
  currentPage: number;
  questionsPerPage: number;
  onPageClick?: (page: number) => void;
}

export function SCL90ProgressHeatmap({ 
  answers, 
  currentPage, 
  questionsPerPage,
  onPageClick 
}: SCL90ProgressHeatmapProps) {
  const totalPages = Math.ceil(scl90Questions.length / questionsPerPage);

  // 计算每页的完成情况
  const pageStats = Array.from({ length: totalPages }, (_, pageIndex) => {
    const startId = pageIndex * questionsPerPage + 1;
    const endId = Math.min((pageIndex + 1) * questionsPerPage, 90);
    const questionsInPage = endId - startId + 1;
    
    let answered = 0;
    for (let i = startId; i <= endId; i++) {
      if (answers[i] !== undefined) {
        answered++;
      }
    }
    
    return {
      page: pageIndex,
      answered,
      total: questionsInPage,
      percent: (answered / questionsInPage) * 100,
      isComplete: answered === questionsInPage,
    };
  });

  // 获取颜色类名
  const getHeatColor = (percent: number, isCurrentPage: boolean) => {
    if (isCurrentPage) {
      return "ring-2 ring-primary ring-offset-1";
    }
    if (percent === 0) return "bg-muted";
    if (percent < 50) return "bg-amber-200 dark:bg-amber-800";
    if (percent < 100) return "bg-emerald-300 dark:bg-emerald-700";
    return "bg-emerald-500 dark:bg-emerald-600";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>答题进度热力图</span>
        <span>点击可跳转</span>
      </div>
      
      <div className="flex gap-1 flex-wrap justify-center">
        {pageStats.map((stat) => (
          <motion.button
            key={stat.page}
            onClick={() => onPageClick?.(stat.page)}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium transition-all",
              "touch-manipulation active:scale-95",
              getHeatColor(stat.percent, stat.page === currentPage),
              stat.page === currentPage 
                ? "bg-primary/20 text-primary" 
                : stat.isComplete 
                  ? "text-white dark:text-emerald-100" 
                  : "text-muted-foreground"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={`第${stat.page + 1}页: ${stat.answered}/${stat.total}题`}
          >
            {stat.page + 1}
          </motion.button>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-muted"></span>
          <span>未答</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800"></span>
          <span>部分</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-600"></span>
          <span>完成</span>
        </div>
      </div>
    </div>
  );
}
