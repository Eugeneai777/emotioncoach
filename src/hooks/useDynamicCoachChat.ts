import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BriefingToolConfig {
  tool_name: string;
  description: string;
  parameters: any;
}

export const useDynamicCoachChat = (
  coachKey: string,
  edgeFunctionName: string,
  briefingTableName: string,
  briefingToolConfig?: BriefingToolConfig,
  conversationId?: string
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const [lastBriefingId, setLastBriefingId] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const loadConversation = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = (data || []).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      setMessages(loadedMessages);
    } catch (error: any) {
      console.error("加载对话失败:", error);
    }
  };

  const createConversation = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: `${coachKey}对话`,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error: any) {
      console.error("创建对话失败:", error);
      return null;
    }
  };

  const saveMessage = async (convId: string, role: "user" | "assistant", content: string) => {
    try {
      await supabase.from("messages").insert({
        conversation_id: convId,
        role,
        content,
      });
    } catch (error: any) {
      console.error("保存消息失败:", error);
    }
  };

  const saveBriefing = async (convId: string, briefingData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const { data, error } = await (supabase as any)
        .from(briefingTableName)
        .insert({
          user_id: user.id,
          conversation_id: convId,
          ...briefingData,
        })
        .select()
        .single();

      if (error) throw error;
      setLastBriefingId(data.id);

      toast({
        title: "简报已生成",
        description: "你的对话简报已保存 ✨",
      });
    } catch (error: any) {
      console.error("保存简报失败:", error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    let convId = currentConversationId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) {
        toast({
          title: "发送失败",
          description: "创建对话失败，请重试",
          variant: "destructive",
        });
        return;
      }
      setCurrentConversationId(convId);
    }

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(convId, "user", messageText);

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("未登录");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${edgeFunctionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("请求过于频繁，请稍后再试");
        }
        if (response.status === 402) {
          throw new Error("额度不足，请联系管理员充值");
        }
        throw new Error("AI 服务出错");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let toolCallBuffer = "";
      let inToolCall = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.trim() || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.content) {
                assistantMessage += delta.content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) =>
                      i === prev.length - 1 ? { ...m, content: assistantMessage } : m
                    );
                  }
                  return [...prev, { role: "assistant", content: assistantMessage }];
                });
              }

              if (delta?.tool_calls) {
                inToolCall = true;
                toolCallBuffer += JSON.stringify(delta.tool_calls);
              }
            } catch (e) {
              console.warn("解析 SSE 数据失败:", e);
            }
          }
        }
      }

      // 保存最终消息
      if (assistantMessage && convId) {
        await saveMessage(convId, "assistant", assistantMessage);
      }

      // 处理工具调用
      if (inToolCall && briefingToolConfig && convId) {
        try {
          const toolCalls = JSON.parse(toolCallBuffer);
          const toolCall = toolCalls[0];
          if (toolCall?.function?.name === briefingToolConfig.tool_name) {
            const briefingData = JSON.parse(toolCall.function.arguments);
            await saveBriefing(convId, briefingData);
          }
        } catch (e) {
          console.error("处理工具调用失败:", e);
        }
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error("发送消息失败:", error);
      toast({
        title: "发送失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setLastBriefingId(null);
  };

  return {
    messages,
    isLoading,
    lastBriefingId,
    sendMessage,
    resetConversation,
  };
};
