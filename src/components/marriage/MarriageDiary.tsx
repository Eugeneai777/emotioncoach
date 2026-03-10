import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareWarning, MessagesSquare, Mic, BookHeart, ChevronDown, ChevronUp, Loader2, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isYesterday } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface DiaryEntry {
  id: string;
  source: string;
  user_input: string | null;
  ai_result: string | null;
  duration_seconds: number | null;
  created_at: string;
}

const sourceConfig: Record<string, { icon: React.ElementType; label: string; bgColor: string; textColor: string }> = {
  quarrel: { icon: MessageSquareWarning, label: "吵架复盘", bgColor: "bg-red-50", textColor: "text-red-500" },
  coach: { icon: MessagesSquare, label: "沟通教练", bgColor: "bg-blue-50", textColor: "text-blue-500" },
  voice: { icon: Mic, label: "语音教练", bgColor: "bg-purple-50", textColor: "text-purple-500" },
};

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "今天";
  if (isYesterday(date)) return "昨天";
  return format(date, "MM月dd日", { locale: zhCN });
}

const DiaryCard: React.FC<{ entry: DiaryEntry; onDelete: (id: string) => void }> = React.memo(({ entry, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const config = sourceConfig[entry.source] || sourceConfig.quarrel;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="bg-white rounded-2xl border border-marriage-border p-4 space-y-2.5 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`h-3.5 w-3.5 ${config.textColor}`} />
          </div>
          <span className="text-xs font-medium text-foreground">{config.label}</span>
          {entry.source === "voice" && entry.duration_seconds && (
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
              {Math.floor(entry.duration_seconds / 60)}分{entry.duration_seconds % 60}秒
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(entry.created_at), "HH:mm", { locale: zhCN })}
          </span>
          <button
            onClick={() => onDelete(entry.id)}
            className="text-muted-foreground/50 hover:text-red-400 transition-colors p-0.5"
            aria-label="删除"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {entry.user_input && (
        <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{entry.user_input}</p>
      )}

      {entry.ai_result && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-marriage-primary font-medium hover:text-marriage-primary/80 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "收起分析" : "查看AI分析"}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-marriage-light rounded-xl p-3 prose prose-sm max-w-none text-xs text-foreground/90 leading-relaxed [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:my-1.5">
                  <ReactMarkdown>{entry.ai_result}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
});

DiaryCard.displayName = "DiaryCard";

export const MarriageDiary: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("marriage_diary_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setEntries(data as DiaryEntry[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from("marriage_diary_entries").delete().eq("id", id);
    if (error) {
      toast.error("删除失败");
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("已删除");
    }
  }, []);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: DiaryEntry[] }[] = [];
    let currentLabel = "";

    for (const entry of entries) {
      const label = formatDateLabel(entry.created_at);
      if (label !== currentLabel) {
        groups.push({ label, entries: [entry] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }
    return groups;
  }, [entries]);

  // Source stats
  const stats = useMemo(() => {
    const counts = { quarrel: 0, coach: 0, voice: 0 };
    for (const e of entries) {
      if (e.source in counts) counts[e.source as keyof typeof counts]++;
    }
    return counts;
  }, [entries]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-marriage-light flex items-center justify-center mx-auto mb-4">
          <BookHeart className="h-8 w-8 text-marriage-primary/40" />
        </div>
        <h2 className="text-base font-bold text-foreground mb-1">AI关系日记</h2>
        <p className="text-xs text-muted-foreground">登录后自动记录你的每次AI教练互动</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-marriage-primary" />
        <span className="text-xs text-muted-foreground">加载日记中...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-marriage-light flex items-center justify-center mx-auto mb-4">
          <BookHeart className="h-8 w-8 text-marriage-primary/40" />
        </div>
        <h2 className="text-base font-bold text-foreground mb-1">还没有日记记录</h2>
        <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
          使用"吵架复盘"或"沟通教练"后，<br />AI会自动为你记录关系日记
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <BookHeart className="h-4 w-4 text-marriage-primary" />
          <h2 className="text-base font-bold text-foreground">AI关系日记</h2>
        </div>
        <span className="text-[10px] text-muted-foreground">{entries.length} 条记录</span>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2">
        {Object.entries(sourceConfig).map(([key, cfg]) => {
          const count = stats[key as keyof typeof stats] || 0;
          if (count === 0) return null;
          const Icon = cfg.icon;
          return (
            <div key={key} className={`flex items-center gap-1 ${cfg.bgColor} px-2 py-1 rounded-lg`}>
              <Icon className={`h-3 w-3 ${cfg.textColor}`} />
              <span className="text-[10px] font-medium text-foreground/70">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Grouped timeline */}
      {groupedEntries.map((group) => (
        <div key={group.label} className="space-y-2">
          <div className="flex items-center gap-2 pt-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">{group.label}</span>
            <div className="flex-1 h-px bg-marriage-border" />
          </div>
          {group.entries.map((entry) => (
            <DiaryCard key={entry.id} entry={entry} onDelete={handleDelete} />
          ))}
        </div>
      ))}
    </div>
  );
};
