import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mama-ai`;

interface MamaChatProps {
  tool: string;
  inputs: Record<string, string>;
  round?: number;
  history?: { round: number; inputs: Record<string, string>; response: string }[];
  onReset?: () => void;
  onComplete?: (responseText: string) => void;
}

export function MamaChat({ tool, inputs, round, history, onReset, onComplete }: MamaChatProps) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  const startChat = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    setResponse("");
    setDone(false);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ tool, inputs, round, history }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || "请求失败，请稍后重试");
        setLoading(false);
        return;
      }

      if (!resp.body) {
        toast.error("连接中断");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let accumulated = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setResponse(accumulated);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setDone(true);
      onComplete?.(accumulated);
    } catch (e) {
      console.error(e);
      toast.error("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }, [tool, inputs, round, history, onComplete]);

  useEffect(() => {
    startChat();
  }, [startChat]);

  return (
    <div className="space-y-4">
      {loading && !response && (
        <div className="flex items-center gap-3 text-rose-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>姐姐正在思考...</span>
        </div>
      )}

      {response && (
        <div className="bg-rose-50 rounded-xl rounded-tl-sm p-4 border border-pink-100">
          <div className="prose prose-sm max-w-none 
            prose-headings:text-rose-900 prose-headings:font-bold
            prose-p:text-rose-800/80 prose-p:leading-relaxed
            prose-strong:text-rose-600
            prose-li:text-rose-800/80">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </div>
      )}

      {done && onReset && !onComplete && (
        <button
          onClick={onReset}
          className="w-full py-3 rounded-lg border border-pink-200 text-rose-400 hover:bg-rose-50 transition-colors text-sm"
        >
          再聊一次
        </button>
      )}
    </div>
  );
}
