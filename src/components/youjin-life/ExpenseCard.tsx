import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface ExpenseCardProps {
  amount: number;
  category: string;
  note: string;
  saved?: boolean;
}

const categoryEmojis: Record<string, string> = {
  "餐饮": "🍜",
  "交通": "🚗",
  "购物": "🛍️",
  "娱乐": "🎮",
  "居住": "🏠",
  "医疗": "💊",
  "教育": "📚",
  "其他": "📝",
};

export function ExpenseCard({ amount, category, note, saved = true }: ExpenseCardProps) {
  const emoji = categoryEmojis[category] || "📝";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border/50 rounded-2xl p-3.5 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-foreground">¥{amount}</span>
            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded-full">{category}</span>
          </div>
          {note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{note}</p>}
        </div>
        {saved && (
          <div className="flex items-center gap-1 text-green-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-medium">已记录</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
