import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquareWarning, MessagesSquare, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";

interface QuarrelToolProps {
  mode: "quarrel" | "coach";
}

const quickPrompts: Record<string, string[]> = {
  quarrel: [
    "因为家务分工吵架",
    "孩子教育方式有分歧",
    "觉得对方不尊重自己",
    "冷战了好几天",
  ],
  coach: [
    "觉得对方不在意我",
    "他总是否定我的感受",
    "想让他多陪陪我",
    "不知道怎么道歉",
  ],
};

export const MarriageQuarrelTool: React.FC<QuarrelToolProps> = ({ mode }) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();

  const placeholder =
    mode === "quarrel"
      ? "描述最近一次争吵发生了什么\n\n例如：我们因为孩子教育方式吵架，他觉得我太控制，我觉得他不负责任。"
      : '描述你想表达但"说不清"的委屈或情绪\n\n例如：我觉得他从来不在意我的感受，每次我说什么他都敷衍。';

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) {
      toast.error("请先输入内容");
      return;
    }
    setLoading(true);
    setResult("");
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke("marriage-ai-tool", {
        body: { input: input.trim(), mode },
      });

      if (error) throw error;
      const aiResult = data?.result || "暂时无法生成分析结果，请稍后再试。";
      setResult(aiResult);

      // Auto-save to diary
      if (user) {
        supabase.from("marriage_diary_entries").insert({
          user_id: user.id,
          source: mode,
          user_input: input.trim(),
          ai_result: aiResult,
        }).then(({ error: saveErr }) => {
          if (saveErr) {
            console.warn("Diary save failed:", saveErr);
          } else {
            setSaved(true);
          }
        });
      }
    } catch (e: any) {
      console.error("AI tool error:", e);
      if (e?.message?.includes("429") || e?.status === 429) {
        toast.error("请求太频繁，请稍后再试");
      } else if (e?.message?.includes("402") || e?.status === 402) {
        toast.error("AI服务额度已用完，请稍后再试");
      } else {
        toast.error("分析失败，请稍后再试");
      }
    } finally {
      setLoading(false);
    }
  }, [input, mode, user]);

  const handleReset = useCallback(() => {
    setInput("");
    setResult("");
    setSaved(false);
  }, []);

  const handleQuickPrompt = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  const ResultIcon = mode === "quarrel" ? MessageSquareWarning : MessagesSquare;

  return (
    <div className="space-y-4">
      {/* Quick prompts */}
      {!result && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2"
        >
          {quickPrompts[mode].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              className="text-[11px] px-3 py-1.5 rounded-full bg-marriage-light border border-marriage-border text-foreground/70 hover:bg-marriage-primary/10 hover:text-marriage-primary hover:border-marriage-primary/30 transition-all"
            >
              {prompt}
            </button>
          ))}
        </motion.div>
      )}

      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="min-h-[140px] rounded-2xl border-marriage-border focus-visible:ring-marriage-primary/30 bg-white resize-none pr-4"
          maxLength={1000}
          disabled={loading}
        />
        <span className="absolute bottom-2.5 left-3 text-[10px] text-muted-foreground">
          {input.length}/1000
        </span>
      </div>

      <div className="flex justify-end items-center gap-2">
        {result && (
          <Button
            variant="outline"
            onClick={handleReset}
            className="rounded-xl gap-1.5 border-marriage-border text-muted-foreground hover:text-foreground"
            size="sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重新开始
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-marriage-primary hover:bg-marriage-primary/90 text-white gap-2 shadow-sm shadow-marriage-primary/20"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {loading ? "分析中..." : "开始分析"}
        </Button>
      </div>

      {/* Loading progress */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 bg-marriage-light rounded-2xl p-4 border border-marriage-border"
          >
            <div className="w-8 h-8 rounded-full bg-marriage-primary/10 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-marriage-primary animate-spin" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">AI正在分析中...</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {mode === "quarrel" ? "正在解读冲突模式和情绪需求" : "正在转化你的表达方式"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-gradient-to-br from-marriage-light via-white to-marriage-light/50 rounded-2xl p-5 border border-marriage-border shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-marriage-primary/10 flex items-center justify-center">
                  <ResultIcon className="h-3.5 w-3.5 text-marriage-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {mode === "quarrel" ? "AI分析结果" : "AI沟通建议"}
                </span>
              </div>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 text-[10px] text-marriage-primary"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  已记录到日记
                </motion.div>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-sm text-foreground/90 leading-relaxed [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_p]:my-2 [&_ul]:my-2 [&_li]:my-0.5">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
