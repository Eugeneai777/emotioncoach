import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useDajinQuota } from "@/hooks/useDajinQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getChildRef } from "@/utils/elderMoodUpload";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elder-chat`;

const ElderChatPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "您好呀！😊 我是大劲，很高兴陪您聊天。您今天感觉怎么样？" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { remaining, deduct, refresh } = useDajinQuota();

  // Photo context state
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoDescriptions, setPhotoDescriptions] = useState<string[]>([]);
  const photosFetched = useRef(false);

  // Determine the target user for photos
  const childRef = getChildRef();
  const childUserId = childRef?.startsWith("child_") ? childRef.slice(6) : null;
  const targetUserId = childUserId || session?.user?.id || null;

  // Fetch recent family photos on mount
  useEffect(() => {
    if (!targetUserId || photosFetched.current) return;
    photosFetched.current = true;

    (async () => {
      try {
        const { data } = await supabase
          .from("family_photos")
          .select("photo_url")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (data?.length) {
          setPhotoUrls(data.map((p) => p.photo_url));
        }
      } catch (e) {
        console.error("Failed to fetch family photos:", e);
      }
    })();
  }, [targetUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (!deduct(1)) {
      setShowUpgrade(true);
      return;
    }

    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const allMsgs = [...messages, userMsg];

    try {
      const body: Record<string, any> = { messages: allMsgs };

      // On first send, pass photo URLs for analysis; after that pass cached descriptions
      if (photoDescriptions.length) {
        body.photoDescriptions = photoDescriptions;
      } else if (photoUrls.length) {
        body.photoUrls = photoUrls;
        body.userId = targetUserId;
      } else if (targetUserId) {
        body.userId = targetUserId;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok || !resp.body) throw new Error("请求失败");

      // Cache photo descriptions from response header
      const descHeader = resp.headers.get("X-Photo-Descriptions");
      if (descHeader && !photoDescriptions.length) {
        try {
          const descs = JSON.parse(decodeURIComponent(descHeader));
          if (Array.isArray(descs) && descs.length) {
            setPhotoDescriptions(descs);
          }
        } catch { /* ignore */ }
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              const snapshot = assistantSoFar;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > allMsgs.length) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
                }
                return [...prev, { role: "assistant", content: snapshot }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "assistant", content: "抱歉，网络不太好，请稍后再试 🌿" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "hsl(30 60% 98%)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "hsl(30 30% 90%)" }}>
        <Button variant="ghost" size="icon" onClick={() => navigate("/elder-care")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: "hsl(25 40% 30%)" }}>💬 大劲AI</h1>
          <p className="text-xs" style={{ color: "hsl(25 30% 55%)" }}>大劲在这里陪着您</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "hsl(45 60% 92%)", color: "hsl(25 50% 40%)" }}>
          剩余 {remaining} 点
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] rounded-2xl px-4 py-3 text-base leading-relaxed"
              style={{
                backgroundColor: m.role === "user" ? "hsl(25 75% 55%)" : "white",
                color: m.role === "user" ? "white" : "hsl(25 35% 30%)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(25 60% 55%)" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{ borderColor: "hsl(30 30% 90%)" }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="想和大劲说点什么..."
            className="flex-1 rounded-2xl px-4 py-3 text-base border-none outline-none"
            style={{ backgroundColor: "hsl(30 40% 95%)", color: "hsl(25 35% 25%)" }}
          />
          <Button
            onClick={send}
            disabled={!input.trim() || isLoading}
            className="rounded-full w-12 h-12 flex-shrink-0"
            style={{ backgroundColor: "hsl(25 75% 55%)" }}
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      <PurchaseOnboardingDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        triggerFeature="大劲AI聊天"
        onSuccess={() => { setShowUpgrade(false); refresh(); }}
      />
    </div>
  );
};

export default ElderChatPage;
