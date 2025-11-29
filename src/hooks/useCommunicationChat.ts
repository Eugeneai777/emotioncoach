import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: string;
}

interface CommunicationBriefingData {
  communication_theme: string;
  see_content: string;
  understand_content: string;
  influence_content: string;
  act_content: string;
  scenario_analysis: string;
  perspective_shift: string;
  recommended_script: string;
  avoid_script: string;
  strategy: string;
  micro_action: string;
  growth_insight: string;
}

export const useCommunicationChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
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
          title: "卡内基沟通对话",
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

  const formatCommunicationBriefing = (data: CommunicationBriefingData): string => {
    return `

🎯 《卡内基沟通简报》


💬 沟通主题
${data.communication_theme}


📖 沟通四部曲旅程

1️⃣ 看见（See）
${data.see_content}

2️⃣ 读懂（Understand）
${data.understand_content}

3️⃣ 影响（Influence）
${data.influence_content}

4️⃣ 行动（Act）
${data.act_content}


📋 场景分析
${data.scenario_analysis}


🔄 视角转换
${data.perspective_shift}


✅ 推荐话术
"${data.recommended_script}"


❌ 避免说
"${data.avoid_script}"


🎯 最佳策略
${data.strategy}


🚀 今日微行动
${data.micro_action}


🌱 沟通成长洞察
${data.growth_insight}


💾 简报已自动保存到你的历史记录中`;
  };

  const saveCommunicationBriefing = async (convId: string, briefingData: CommunicationBriefingData) => {
    try {
      const { error } = await supabase
        .from("communication_briefings")
        .insert({
          conversation_id: convId,
          communication_theme: briefingData.communication_theme,
          see_content: briefingData.see_content,
          understand_content: briefingData.understand_content,
          influence_content: briefingData.influence_content,
          act_content: briefingData.act_content,
          scenario_analysis: briefingData.scenario_analysis,
          perspective_shift: briefingData.perspective_shift,
          recommended_script: briefingData.recommended_script,
          avoid_script: briefingData.avoid_script,
          strategy: briefingData.strategy,
          micro_action: briefingData.micro_action,
          growth_insight: briefingData.growth_insight,
        });

      if (error) throw error;

      toast({
        title: "简报已保存",
        description: "你的沟通简报已保存到历史记录",
      });
    } catch (error: any) {
      console.error("保存简报失败:", error);
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (input: string) => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    try {
      let convId = currentConversationId;
      if (!convId) {
        convId = await createConversation();
        if (!convId) throw new Error("创建对话失败");
        setCurrentConversationId(convId);
      }

      const userMessage: Message = { role: "user", content: input };
      setMessages(prev => [...prev, userMessage]);
      await saveMessage(convId, "user", input);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("未登录");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/carnegie-coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AI 请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let currentToolCall: any = null;
      let toolCallBuffer = "";

      const processChunk = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.trim() || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;

            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.content) {
                assistantMessage += delta.content;
                setMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg?.role === "assistant") {
                    return [...prev.slice(0, -1), { role: "assistant", content: assistantMessage }];
                  }
                  return [...prev, { role: "assistant", content: assistantMessage }];
                });
              }

              if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                  if (toolCall.function?.name === "generate_communication_briefing") {
                    if (toolCall.function.arguments) {
                      toolCallBuffer += toolCall.function.arguments;
                    }
                    currentToolCall = toolCall;
                  }
                }
              }
            } catch (e) {
              // Ignore parse errors for incomplete JSON
            }
          }
        }

        if (currentToolCall && toolCallBuffer) {
          try {
            const briefingData = JSON.parse(toolCallBuffer) as CommunicationBriefingData;
            const formattedBriefing = formatCommunicationBriefing(briefingData);
            
            assistantMessage += formattedBriefing;
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === "assistant") {
                return [...prev.slice(0, -1), { role: "assistant", content: assistantMessage }];
              }
              return [...prev, { role: "assistant", content: assistantMessage }];
            });

            await saveCommunicationBriefing(convId!, briefingData);
          } catch (e) {
            console.error("处理简报失败:", e);
          }
        }

        await saveMessage(convId!, "assistant", assistantMessage);
      };

      await processChunk();
    } catch (error: any) {
      console.error("发送消息失败:", error);
      toast({
        title: "发送失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  return {
    messages,
    isLoading,
    currentConversationId,
    sendMessage,
    resetConversation,
  };
};