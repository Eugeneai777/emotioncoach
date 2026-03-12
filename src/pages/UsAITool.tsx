import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const toolConfig: Record<string, { title: string; placeholder: string; mode: string }> = {
  chat: {
    title: "今天我们聊什么",
    placeholder: "描述一下你们最近的状态，或者想聊的话题…",
    mode: "us-chat",
  },
  translate: {
    title: "情侣情绪翻译器",
    placeholder: "输入TA说的话，比如"你怎么又这么晚回来？"",
    mode: "us-translate",
  },
  repair: {
    title: "冲突修复助手",
    placeholder: "描述一下刚刚发生的事情…",
    mode: "us-repair",
  },
};

const UsAITool = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const type = params.get("type") || "chat";
  const config = toolConfig[type] || toolConfig.chat;

  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("marriage-ai-tool", {
        body: { input: input.trim(), mode: config.mode },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error === "Rate limited") {
          toast.error("请求太频繁，请稍后再试");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setResult(data?.result || "暂时无法生成结果。");
    } catch (e) {
      console.error(e);
      toast.error("生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-usai-beige">
      <Helmet>
        <title>{config.title} - 我们AI</title>
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-usai-beige/80 backdrop-blur-lg border-b border-usai-primary/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/us-ai")} className="p-2 -ml-2 rounded-full">
          <ArrowLeft className="w-5 h-5 text-usai-foreground" />
        </button>
        <h1 className="text-base font-bold text-usai-foreground">{config.title}</h1>
      </div>

      <div className="px-5 py-6 space-y-5 max-w-lg mx-auto">
        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={config.placeholder}
            rows={4}
            className="w-full rounded-2xl border border-usai-primary/15 bg-white p-4 text-sm text-usai-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-usai-primary/30 resize-none"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="w-full py-3 rounded-xl bg-usai-primary text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> AI 分析中…</>
            ) : (
              <><Send className="w-4 h-4" /> 开始分析</>
            )}
          </motion.button>
        </div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-5 border border-usai-primary/10 shadow-sm"
          >
            <div className="prose prose-sm max-w-none text-usai-foreground [&_strong]:text-usai-primary [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_p]:leading-relaxed">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UsAITool;
