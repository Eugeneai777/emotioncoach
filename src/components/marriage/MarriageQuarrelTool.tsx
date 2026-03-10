import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";

interface QuarrelToolProps {
  mode: "quarrel" | "coach";
}

export const MarriageQuarrelTool: React.FC<QuarrelToolProps> = ({ mode }) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const placeholder =
    mode === "quarrel"
      ? "描述最近一次争吵发生了什么\n\n例如：我们因为孩子教育方式吵架，他觉得我太控制，我觉得他不负责任。"
      : '描述你想表达但"说不清"的委屈或情绪\n\n例如：我觉得他从来不在意我的感受，每次我说什么他都敷衍。';

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error("请先输入内容");
      return;
    }
    setLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("marriage-ai-tool", {
        body: { input: input.trim(), mode },
      });

      if (error) throw error;
      setResult(data?.result || "暂时无法生成分析结果，请稍后再试。");
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
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="min-h-[140px] rounded-xl border-marriage-border focus-visible:ring-marriage-primary/30 bg-white"
        maxLength={1000}
      />
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground">{input.length}/1000</span>
        <Button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-marriage-primary hover:bg-marriage-primary/90 text-white gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {loading ? "分析中..." : "开始分析"}
        </Button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-marriage-light to-white rounded-2xl p-5 border border-marriage-border"
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareWarning className="h-4 w-4 text-marriage-primary" />
            <span className="text-sm font-semibold text-foreground">
              {mode === "quarrel" ? "AI分析结果" : "AI沟通建议"}
            </span>
          </div>
          <div className="prose prose-sm max-w-none text-sm text-foreground/90 leading-relaxed">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
};
