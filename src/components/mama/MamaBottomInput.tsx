import { useState, useRef, useCallback } from "react";
import { Mic, Keyboard, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { acquireMicrophone, releaseMicrophone } from "@/utils/microphoneManager";
import { toast } from "sonner";

interface MamaBottomInputProps {
  onSendText: (text: string) => void;
  onFocusInput: () => void;
  lastChat?: { summary: string; time: number } | null;
  onContinueChat?: (context: string) => void;
}

const MamaBottomInput = ({ onSendText, onFocusInput, lastChat, onContinueChat }: MamaBottomInputProps) => {
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    onSendText(text);
  };

  const handleInputFocus = () => {
    if (lastChat && onContinueChat) {
      onContinueChat(`我想继续聊上次的话题：${lastChat.summary}`);
    } else {
      onFocusInput();
    }
  };

  const placeholder = lastChat ? `继续聊：${lastChat.summary}...` : "想找人说说话...";

  const startRecording = useCallback(async () => {
    try {
      const stream = await acquireMicrophone();
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        setIsRecording(false);
        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribe(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("无法访问麦克风");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    releaseMicrophone();
  }, []);

  const transcribe = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const { data, error } = await supabase.functions.invoke("voice-to-text", {
        body: { audio: base64 },
      });

      if (error) throw error;
      const text = data?.text?.trim();
      if (text) {
        onSendText(text);
      } else {
        toast.error("没有识别到语音内容");
      }
    } catch {
      toast.error("语音识别失败，请重试");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    startRecording();
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) stopRecording();
  };

  return (
    <div
      className="fixed left-0 right-0 z-40 px-3 pt-2 pb-2 bg-[hsl(var(--mama-bg))] border-t border-[hsl(var(--mama-border))]"
      style={{ bottom: 0, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <AnimatePresence mode="wait">
        {mode === "text" ? (
          <motion.div
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={() => setMode("voice")}
              className="shrink-0 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-[hsl(var(--mama-card))] border border-[hsl(var(--mama-border))] text-[hsl(var(--mama-muted))] active:bg-[hsl(var(--mama-card-alt))] transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              className="flex-1 h-10 min-h-[40px] rounded-full bg-[hsl(var(--mama-card))] border border-[hsl(var(--mama-border))] px-4 text-sm text-[hsl(var(--mama-heading))] placeholder:text-[hsl(var(--mama-muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--mama-accent)/0.3)]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="shrink-0 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-[hsl(var(--mama-accent))] text-white disabled:opacity-40 active:bg-[hsl(var(--mama-accent-hover))] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="voice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={() => setMode("text")}
              className="shrink-0 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-[hsl(var(--mama-card))] border border-[hsl(var(--mama-border))] text-[hsl(var(--mama-muted))] active:bg-[hsl(var(--mama-card-alt))] transition-colors"
            >
              <Keyboard className="w-5 h-5" />
            </button>
            <button
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={() => { if (isRecording) stopRecording(); }}
              disabled={isTranscribing}
              className={`flex-1 h-10 min-h-[40px] rounded-full border text-sm font-medium select-none transition-all ${
                isRecording
                  ? "bg-[hsl(var(--mama-accent))] text-white border-[hsl(var(--mama-accent))] scale-105"
                  : isTranscribing
                  ? "bg-[hsl(var(--mama-card-alt))] text-[hsl(var(--mama-muted))] border-[hsl(var(--mama-border))]"
                  : "bg-[hsl(var(--mama-card))] text-[hsl(var(--mama-heading))] border-[hsl(var(--mama-border))] active:bg-[hsl(var(--mama-card-alt))]"
              }`}
            >
              {isRecording ? "松开 发送" : isTranscribing ? "识别中..." : "按住 说话"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MamaBottomInput;
