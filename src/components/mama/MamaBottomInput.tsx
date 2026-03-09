import { useState, useRef, useCallback } from "react";
import { Mic, Keyboard, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { acquireMicrophone, releaseMicrophone } from "@/utils/microphoneManager";
import { toast } from "sonner";

interface MamaBottomInputProps {
  onSendText: (text: string) => void;
  onFocusInput: () => void;
}

const MamaBottomInput = ({ onSendText, onFocusInput }: MamaBottomInputProps) => {
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
    onFocusInput();
  };

  // --- Voice recording ---
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

  // Touch handlers for hold-to-speak
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
      className="fixed left-0 right-0 z-40 px-3 pt-2 pb-2 bg-[#FFF8F0] border-t border-[#F5E6D3]"
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
              className="shrink-0 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-white border border-[#F5E6D3] text-[#A89580] active:bg-[#FFF3EB] transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="想找人说说话..."
              className="flex-1 h-10 min-h-[40px] rounded-full bg-white border border-[#F5E6D3] px-4 text-sm text-[#3D3028] placeholder:text-[#C4B49A] focus:outline-none focus:ring-1 focus:ring-[#F4845F]/30"
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
              className="shrink-0 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-[#F4845F] text-white disabled:opacity-40 active:bg-[#E5734E] transition-colors"
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
              className="shrink-0 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-white border border-[#F5E6D3] text-[#A89580] active:bg-[#FFF3EB] transition-colors"
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
                  ? "bg-[#F4845F] text-white border-[#F4845F] scale-105"
                  : isTranscribing
                  ? "bg-[#FFF3EB] text-[#C4B49A] border-[#F5E6D3]"
                  : "bg-white text-[#3D3028] border-[#F5E6D3] active:bg-[#FFF3EB]"
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
