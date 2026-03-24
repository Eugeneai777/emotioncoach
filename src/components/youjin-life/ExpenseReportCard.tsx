import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

interface ExpenseReportCardProps {
  month: string;
  totalAmount: number;
  categories: CategorySummary[];
}

const categoryColors: Record<string, string> = {
  "餐饮": "bg-red-400",
  "交通": "bg-blue-400",
  "购物": "bg-amber-400",
  "娱乐": "bg-purple-400",
  "居住": "bg-emerald-400",
  "医疗": "bg-pink-400",
  "教育": "bg-cyan-400",
  "其他": "bg-gray-400",
};

export function ExpenseReportCard({ month, totalAmount, categories }: ExpenseReportCardProps) {
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  const maxTotal = sorted[0]?.total || 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{month} 消费报告</p>
          <p className="text-xl font-bold text-foreground mt-0.5">¥{totalAmount.toFixed(2)}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
      </div>

      {/* Category bars */}
      <div className="px-4 py-3 space-y-2.5">
        {sorted.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">暂无消费记录</p>
        )}
        {sorted.map((cat) => {
          const pct = Math.round((cat.total / totalAmount) * 100);
          const barWidth = Math.max(8, (cat.total / maxTotal) * 100);
          const color = categoryColors[cat.category] || "bg-gray-400";

          return (
            <div key={cat.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium">{cat.category}</span>
                <span className="text-muted-foreground">¥{cat.total.toFixed(0)} · {pct}%</span>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${color}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/30 text-center">
        <p className="text-[10px] text-muted-foreground">共 {categories.reduce((s, c) => s + c.count, 0)} 笔消费</p>
      </div>
    </motion.div>
  );
}
