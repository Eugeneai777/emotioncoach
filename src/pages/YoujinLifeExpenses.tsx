import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

const categoryEmojis: Record<string, string> = {
  "餐饮": "🍜", "交通": "🚗", "购物": "🛍️", "娱乐": "🎮",
  "居住": "🏠", "医疗": "💊", "教育": "📚", "其他": "📝",
};

const categoryColors: Record<string, string> = {
  "餐饮": "bg-red-400", "交通": "bg-blue-400", "购物": "bg-amber-400",
  "娱乐": "bg-purple-400", "居住": "bg-emerald-400", "医疗": "bg-pink-400",
  "教育": "bg-cyan-400", "其他": "bg-gray-400",
};

interface FinanceRecord {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
  type: string;
}

export default function YoujinLifeExpenses() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const monthLabel = format(selectedMonth, "yyyy年M月");

  // Generate last 6 months for picker
  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), i);
      return { date: d, label: format(d, "yyyy年M月") };
    });
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedMonth]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const start = startOfMonth(selectedMonth).toISOString();
    const end = endOfMonth(selectedMonth).toISOString();

    const { data } = await supabase
      .from("finance_records")
      .select("id, amount, category, note, created_at, type")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });

    setRecords((data as FinanceRecord[]) || []);
    setLoading(false);
  };

  // Compute summary
  const totalAmount = records.reduce((s, r) => s + Number(r.amount), 0);
  const categoryMap = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    records.forEach((r) => {
      const cat = r.category || "其他";
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += Number(r.amount);
      map[cat].count += 1;
    });
    return Object.entries(map)
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [records]);

  const maxCatTotal = categoryMap[0]?.total || 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/youjin-life")} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground flex-1">消费记录</h1>
          <button
            onClick={() => navigate("/youjin-life/chat?q=" + encodeURIComponent("帮我记一笔账"))}
            className="text-xs px-3 py-1.5 rounded-full bg-foreground text-background font-medium"
          >
            + 记账
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Month selector + Summary */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative inline-block">
            <button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="flex items-center gap-1 text-sm font-medium text-foreground"
            >
              {monthLabel}
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {showMonthPicker && (
              <div className="absolute top-8 left-0 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
                {months.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => { setSelectedMonth(m.date); setShowMonthPicker(false); }}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-accent transition-colors ${
                      format(selectedMonth, "yyyy-MM") === format(m.date, "yyyy-MM") ? "font-bold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100/50 overflow-hidden"
        >
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">本月总支出</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">¥{totalAmount.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">共 {records.length} 笔消费</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>

          {/* Category bars */}
          {categoryMap.length > 0 && (
            <div className="px-4 pb-4 space-y-2">
              {categoryMap.map((cat) => {
                const pct = totalAmount > 0 ? Math.round((cat.total / totalAmount) * 100) : 0;
                const barWidth = Math.max(8, (cat.total / maxCatTotal) * 100);
                const color = categoryColors[cat.category] || "bg-gray-400";
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium flex items-center gap-1">
                        <span>{categoryEmojis[cat.category] || "📝"}</span>
                        {cat.category}
                      </span>
                      <span className="text-muted-foreground">¥{cat.total.toFixed(0)} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Records list */}
        <div className="px-4 pb-8">
          <h2 className="text-xs font-bold text-muted-foreground mb-3">消费明细</h2>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm text-muted-foreground">本月暂无消费记录</p>
              <button
                onClick={() => navigate("/youjin-life/chat?q=" + encodeURIComponent("帮我记一笔账"))}
                className="mt-3 text-xs text-foreground font-medium underline"
              >
                去对话记账
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-xl border border-border/50 p-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-base shrink-0">
                    {categoryEmojis[r.category] || "📝"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-foreground">¥{Number(r.amount).toFixed(0)}</span>
                      <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded-full">{r.category || "其他"}</span>
                    </div>
                    {r.note && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{r.note}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 shrink-0">
                    {format(new Date(r.created_at), "M/d HH:mm")}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
