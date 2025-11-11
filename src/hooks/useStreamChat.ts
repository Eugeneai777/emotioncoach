import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };

interface BriefingData {
  emotion_theme: string;
  stage_1_content: string;
  stage_2_content: string;
  stage_3_content: string;
  stage_4_content: string;
  insight: string;
  action: string;
  growth_story: string;
}

export const useStreamChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const { toast } = useToast();

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

  // 加载现有对话
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversation = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        setMessages(data.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })));
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const createConversation = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: "新的情绪梳理"
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const saveMessage = async (convId: string, role: "user" | "assistant", content: string) => {
    try {
      await supabase
        .from("messages")
        .insert({
          conversation_id: convId,
          role,
          content
        });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const formatBriefing = (data: BriefingData): string => {
    return `

---

🌿 **《情绪四部曲简报》**

**🎭 主题情绪**
${data.emotion_theme}

**📖 情绪四部曲旅程**

1️⃣ **觉察（Feel it）**
${data.stage_1_content}

2️⃣ **理解（Name it）**
${data.stage_2_content}

3️⃣ **反应（React it）**
${data.stage_3_content}

4️⃣ **转化（Transform it）**
${data.stage_4_content}

**💫 今日洞察**
${data.insight}

**✅ 今日行动**
${data.action}

**🌸 今日成长故事**
${data.growth_story}

---
💾 简报已自动保存到你的历史记录中`;
  };

  const saveBriefing = async (convId: string, briefingData: BriefingData) => {
    try {
      const { error } = await supabase
        .from("briefings")
        .insert({
          conversation_id: convId,
          ...briefingData
        });

      if (error) throw error;

      toast({
        title: "简报已保存 🌿",
        description: "你可以在历史记录中查看",
      });
    } catch (error) {
      console.error("Error saving briefing:", error);
      toast({
        title: "简报保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (input: string) => {
    const trimmedInput = input.trim();
    
    // Validate input
    if (!trimmedInput) {
      toast({ title: "消息不能为空", variant: "destructive" });
      return;
    }
    
    if (trimmedInput.length > 2000) {
      toast({ title: "消息过长", description: "消息长度不能超过2000字符", variant: "destructive" });
      return;
    }

    // 如果没有对话ID，创建新对话
    let convId = currentConversationId;
    if (!convId) {
      convId = await createConversation();
      if (convId) {
        setCurrentConversationId(convId);
      }
    }

    const userMsg: Message = { role: "user", content: trimmedInput };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // 保存用户消息
    if (convId) {
      await saveMessage(convId, "user", trimmedInput);
    }

    let assistantContent = "";
    let toolCallBuffer = "";
    let inToolCall = false;

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("未登录");
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to start stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            
            // 检查是否有tool调用
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            if (toolCalls && toolCalls.length > 0) {
              const toolCall = toolCalls[0];
              
              if (toolCall.function?.name === "generate_briefing") {
                inToolCall = true;
                if (toolCall.function?.arguments) {
                  toolCallBuffer += toolCall.function.arguments;
                }
              }
            }
            
            // 正常内容更新
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              updateAssistant(content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // 处理剩余缓冲区
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            if (toolCalls && toolCalls.length > 0) {
              const toolCall = toolCalls[0];
              if (toolCall.function?.name === "generate_briefing" && toolCall.function?.arguments) {
                toolCallBuffer += toolCall.function.arguments;
              }
            }
            
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            /* ignore */
          }
        }
      }

      // 如果检测到简报生成，保存到数据库并显示在聊天中
      if (inToolCall && toolCallBuffer && convId) {
        try {
          const briefingData = JSON.parse(toolCallBuffer) as BriefingData;
          
          // 格式化并显示简报
          const briefingText = formatBriefing(briefingData);
          updateAssistant(briefingText);
          
          // 保存到数据库
          await saveBriefing(convId, briefingData);
        } catch (e) {
          console.error("Error parsing briefing data:", e);
        }
      }

      // 保存助手消息
      if (convId && assistantContent) {
        await saveMessage(convId, "assistant", assistantContent);
      }

      setIsLoading(false);
    } catch (e) {
      console.error("发送消息失败");
      toast({
        title: "发送失败",
        description: "请稍后重试",
        variant: "destructive",
      });
      setIsLoading(false);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setCurrentConversationId(undefined);
  };

  return { 
    messages, 
    isLoading, 
    sendMessage, 
    resetConversation,
    conversationId: currentConversationId 
  };
};
