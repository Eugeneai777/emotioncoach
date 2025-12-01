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
  communication_difficulty?: number;
  scenario_type?: string;
  target_type?: string;
  difficulty_keywords?: string[];
}

interface CommunicationSession {
  id: string;
  current_stage: number;
  scenario_description?: string;
  see_content?: any;
  understand_content?: any;
  influence_content?: any;
  act_content?: any;
  briefing_requested: boolean;
  status: string;
}

const welcomeMessages = [
  "嗨，我是劲老师 👋 最近有没有什么沟通上的困扰想聊聊？不管是和家人、同事还是朋友，我都在这里陪你。说说看，是什么事让你有点卡住了？",
  "你好呀 😊 我是劲老师，专门陪你聊沟通的问题。最近有没有哪段对话让你觉得不太顺？可以从任何一个小困惑开始。",
  "欢迎来找我聊聊 💬 我是劲老师。最近和谁的沟通让你有点头疼？说出来，我们一起看看能怎么理顺。",
  "嗨～我是劲老师 🌟 今天想聊点什么呢？不管是工作上的汇报、家里的矛盾，还是朋友间的小摩擦，都可以和我说说。最近有什么沟通场景让你觉得难开口？",
  "你好，我是劲老师 🤝 每个人都会遇到不知道怎么开口的时刻。最近有没有一段对话，让你想说却不知道怎么说？和我聊聊吧。"
];

const getRandomWelcomeMessage = () => {
  return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
};

export const useCommunicationChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [lastBriefingId, setLastBriefingId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<CommunicationSession | null>(null);
  const [currentStage, setCurrentStage] = useState(0);

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

  const saveCommunicationBriefing = async (convId: string, briefingData: CommunicationBriefingData): Promise<string | null> => {
    try {
      const { data: briefing, error } = await supabase
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
          communication_difficulty: briefingData.communication_difficulty,
          scenario_type: briefingData.scenario_type,
          target_type: briefingData.target_type,
          difficulty_keywords: briefingData.difficulty_keywords,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "简报已保存",
        description: "你的沟通简报已保存到历史记录",
      });

      return briefing?.id || null;
    } catch (error: any) {
      console.error("保存简报失败:", error);
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSessionStage = async (sessionId: string, toolName: string, toolArgs: any) => {
    try {
      if (toolName === "capture_scenario") {
        await supabase
          .from("communication_coaching_sessions")
          .update({
            current_stage: 1,
            scenario_description: toolArgs.scenario_description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId);
        setCurrentStage(1);
      } else if (toolName === "complete_stage" && currentSession) {
        const nextStage = currentSession.current_stage + 1;
        const updateData: any = {
          current_stage: nextStage,
          updated_at: new Date().toISOString(),
        };

        // 根据当前阶段保存内容
        const stageKey = `stage_${currentSession.current_stage}_content`;
        if (currentSession.current_stage === 1) {
          updateData.see_content = { content: toolArgs.stage_content };
        } else if (currentSession.current_stage === 2) {
          updateData.understand_content = { content: toolArgs.stage_content };
        } else if (currentSession.current_stage === 3) {
          updateData.influence_content = { content: toolArgs.stage_content };
        } else if (currentSession.current_stage === 4) {
          updateData.act_content = { content: toolArgs.stage_content };
        }

        await supabase
          .from("communication_coaching_sessions")
          .update(updateData)
          .eq("id", sessionId);
        
        setCurrentStage(nextStage);
      }
    } catch (error) {
      console.error("更新会话阶段失败:", error);
    }
  };

  const handleBriefingRequest = async (sessionId: string) => {
    try {
      await supabase
        .from("communication_coaching_sessions")
        .update({
          briefing_requested: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
      
      if (currentSession) {
        setCurrentSession({ ...currentSession, briefing_requested: true });
      }
    } catch (error) {
      console.error("更新简报请求状态失败:", error);
    }
  };

  const sendMessage = async (input: string, userDifficulty?: number) => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    try {
      let convId = currentConversationId;
      if (!convId) {
        convId = await createConversation();
        if (!convId) throw new Error("创建对话失败");
        setCurrentConversationId(convId);
      }

      // 检查用户是否请求生成简报
      const briefingKeywords = ["生成简报", "生成报告", "1"];
      const isBriefingRequest = briefingKeywords.some(keyword => input.includes(keyword));
      
      if (isBriefingRequest && currentSession && currentSession.current_stage === 5) {
        await handleBriefingRequest(currentSession.id);
      }

      const userMessage: Message = { role: "user", content: input };
      setMessages(prev => [...prev, userMessage]);
      await saveMessage(convId, "user", input);
      setUserMessageCount(prev => prev + 1);

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
            userDifficulty,
            sessionId: currentSession?.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AI 请求失败");
      }

      // 从响应头获取 session_id
      const sessionIdFromHeader = response.headers.get('X-Session-Id');
      if (sessionIdFromHeader && !currentSession) {
        const { data: sessionData } = await supabase
          .from("communication_coaching_sessions")
          .select("*")
          .eq("id", sessionIdFromHeader)
          .single();
        
        if (sessionData) {
          setCurrentSession(sessionData);
          setCurrentStage(sessionData.current_stage);
        }
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      const toolCallsMap = new Map<number, any>();

      const processChunk = async () => {
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

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
                  const index = toolCall.index ?? 0;
                  if (!toolCallsMap.has(index)) {
                    toolCallsMap.set(index, {
                      id: toolCall.id || "",
                      type: toolCall.type || "function",
                      function: {
                        name: toolCall.function?.name || "",
                        arguments: toolCall.function?.arguments || "",
                      },
                    });
                  } else {
                    const existing = toolCallsMap.get(index);
                    if (toolCall.function?.arguments) {
                      existing.function.arguments += toolCall.function.arguments;
                    }
                    if (toolCall.function?.name && !existing.function.name) {
                      existing.function.name = toolCall.function.name;
                    }
                  }
                }
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                buffer = line + "\n" + buffer;
                break;
              }
              console.warn("解析SSE数据失败:", e);
            }
          }
        }

        // 处理工具调用
        if (toolCallsMap.size > 0) {
          const completedToolCalls = Array.from(toolCallsMap.values());
          
          for (const toolCall of completedToolCalls) {
            try {
              const toolArgs = JSON.parse(toolCall.function.arguments);
              
              if (currentSession) {
                await updateSessionStage(currentSession.id, toolCall.function.name, toolArgs);
              }

              if (toolCall.function.name === "generate_communication_briefing") {
                const briefingData = toolArgs as CommunicationBriefingData;
                const finalBriefingData = {
                  ...briefingData,
                  communication_difficulty: userDifficulty || briefingData.communication_difficulty
                };
                
                const formattedBriefing = formatCommunicationBriefing(finalBriefingData);
                assistantMessage += formattedBriefing;
                
                setMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg?.role === "assistant") {
                    return [...prev.slice(0, -1), { role: "assistant", content: assistantMessage }];
                  }
                  return [...prev, { role: "assistant", content: assistantMessage }];
                });

                const savedBriefingId = await saveCommunicationBriefing(convId!, finalBriefingData);
                if (savedBriefingId) {
                  setLastBriefingId(savedBriefingId);
                }
                
                // 标记会话完成
                if (currentSession) {
                  await supabase
                    .from("communication_coaching_sessions")
                    .update({ status: 'completed' })
                    .eq("id", currentSession.id);
                }
              }
            } catch (e) {
              console.error("处理工具调用失败:", e);
            }
          }
        }

        if (assistantMessage.trim().length > 0) {
          await saveMessage(convId!, "assistant", assistantMessage);
        }
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
    setUserMessageCount(0);
    setCurrentSession(null);
    setCurrentStage(0);
  };

  return {
    messages,
    isLoading,
    currentConversationId,
    userMessageCount,
    lastBriefingId,
    currentStage,
    sendMessage,
    resetConversation,
  };
};