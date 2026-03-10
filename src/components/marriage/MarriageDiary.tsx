import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareWarning, MessagesSquare, Mic, BookHeart, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
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

const sourceConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  quarrel: { icon: MessageSquareWarning, label: "吵架复盘", color: "text-red-500" },
  coach: { icon: MessagesSquare, label: "沟通教练", color: "text-blue-500" },
  voice: { icon: Mic, label: "语音教练", color: "text-purple-500" },
};

const DiaryCard: React.FC<{ entry: DiaryEntry; onDelete: (id: string) => void }> = ({ entry, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const config = sourceConfig[entry.source] || sourceConfig.quarrel;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-marriage-border p-4 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className="text-xs font-medium text-foreground">{config.label}</span>
          {entry.source === "voice" && entry.duration_seconds && (
            <span className="text-[10px] text-muted-foreground">
              {Math.floor(entry.duration_seconds / 60)}分{entry.duration_seconds % 60}秒
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(entry.created_at), "MM/dd HH:mm", { locale: zhCN })}
          </span>
          <button onClick={() => onDelete(entry.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {entry.user_input && (
        <p className="text-xs text-foreground/80 line-clamp-2">{entry.user_input}</p>
      )}

      {entry.ai_result && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-marriage-primary font-medium"
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
                className="overflow-hidden"
              >
                <div className="bg-marriage-light rounded-xl p-3 prose prose-sm max-w-none text-xs text-foreground/90 leading-relaxed">
                  <ReactMarkdown>{entry.ai_result}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export const MarriageDiary: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
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
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("marriage_diary_entries").delete().eq("id", id);
    if (error) {
      toast.error("删除失败");
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("已删除");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <BookHeart className="h-12 w-12 text-marriage-primary/30 mx-auto mb-4" />
        <h2 className="text-base font-bold text-foreground mb-1">AI关系日记</h2>
        <p className="text-xs text-muted-foreground">登录后自动记录你的每次AI教练互动</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-marriage-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <BookHeart className="h-12 w-12 text-marriage-primary/30 mx-auto mb-4" />
        <h2 className="text-base font-bold text-foreground mb-1">还没有日记记录</h2>
        <p className="text-xs text-muted-foreground">
          使用"吵架复盘"或"沟通教练"后，AI会自动为你记录关系日记
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-foreground">AI关系日记</h2>
        <span className="text-[10px] text-muted-foreground">{entries.length} 条记录</span>
      </div>
      {entries.map((entry) => (
        <DiaryCard key={entry.id} entry={entry} onDelete={handleDelete} />
      ))}
    </div>
  );
};
