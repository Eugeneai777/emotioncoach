import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import confetti from 'canvas-confetti';
import { achievements as achievementConfig } from '@/config/awakeningLevelConfig';

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BriefingToolConfig {
  tool_name: string;
  description: string;
  parameters: any;
}

interface CoachRecommendation {
  coachKey: string;
  userIssueSummary: string;
  reasoning: string;
}

interface VideoRecommendation {
  topicSummary: string;
  category: string;
  learningGoal: string;
  videoId?: string;
  videoTitle?: string;
  videoUrl?: string;
}

interface ToolRecommendation {
  userNeed: string;
  toolId: string;
  usageReason: string;
}

interface EmotionButtonRecommendation {
  detectedEmotion: string;
  emotionChinese: string;
  whySuitable: string;
  howItHelps: string;
  quickTipGiven: string;
}

interface CampRecommendation {
  userGoal: string;
  recommendedCamp: string;
  whySuitable: string;
  howToStart: string;
}

export type CoachChatMode = 'standard' | 'meditation_analysis';

export const useDynamicCoachChat = (
  coachKey: string,
  edgeFunctionName: string,
  briefingTableName: string,
  briefingToolConfig?: BriefingToolConfig,
  conversationId?: string,
  onBriefingGenerated?: (briefingData: any) => void,
  initialMode?: CoachChatMode,
  contextData?: { dayNumber?: number; campId?: string }
) => {
  const [chatMode, setChatMode] = useState<CoachChatMode>(initialMode || 'standard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 用 ref 保存最新 messages，避免 sendMessage 闭包问题
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const [lastBriefingId, setLastBriefingId] = useState<string | null>(null);
  const [coachRecommendation, setCoachRecommendation] = useState<CoachRecommendation | null>(null);
  const [videoRecommendation, setVideoRecommendation] = useState<VideoRecommendation | null>(null);
  const [toolRecommendation, setToolRecommendation] = useState<ToolRecommendation | null>(null);
  const [emotionButtonRecommendation, setEmotionButtonRecommendation] = useState<EmotionButtonRecommendation | null>(null);
  const [campRecommendation, setCampRecommendation] = useState<CampRecommendation | null>(null);

  // Inline achievement checker to avoid hook dependency issues
  const checkAndAwardAchievementsInline = async (userId: string, dayNumber: number): Promise<string[]> => {
    const earned: string[] = [];
    
    try {
      // Get user's existing achievements
      const { data: existingAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_type')
        .eq('user_id', userId);
      
      const hasAchievement = (key: string) => 
        existingAchievements?.some(a => a.achievement_type === key) || false;
      
      const earnAchievement = async (key: string) => {
        const achievement = achievementConfig.find(a => a.key === key);
        if (!achievement) return;
        
        await supabase.from('user_achievements').insert({
          user_id: userId,
          achievement_type: key,
          achievement_name: achievement.name,
          icon: achievement.icon,
          achievement_description: achievement.description,
        });
      };

      // Check milestone achievements based on day number
      if (dayNumber >= 1 && !hasAchievement('day1_complete')) {
        await earnAchievement('day1_complete');
        earned.push('day1_complete');
      }
      if (dayNumber >= 3 && !hasAchievement('day3_halfway')) {
        await earnAchievement('day3_halfway');
        earned.push('day3_halfway');
      }
      if (dayNumber >= 7 && !hasAchievement('camp_graduate')) {
        await earnAchievement('camp_graduate');
        earned.push('camp_graduate');
      }

      // Check streak achievements - count journal entries
      const { count: journalCount } = await supabase
        .from('wealth_journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (journalCount && journalCount >= 3 && !hasAchievement('streak_3')) {
        await earnAchievement('streak_3');
        earned.push('streak_3');
      }
      if (journalCount && journalCount >= 7 && !hasAchievement('streak_7')) {
        await earnAchievement('streak_7');
        earned.push('streak_7');
      }

      console.log('🏆 [Achievement Check] Earned achievements:', earned);
      return earned;
    } catch (error) {
      console.error('Achievement check error:', error);
      return [];
    }
  };
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
      
      // 触发简报生成回调（用于智能通知等）
      if (onBriefingGenerated) {
        onBriefingGenerated({
          briefingId: data.id,
          ...briefingData
        });
      }
    } catch (error: any) {
      console.error("保存简报失败:", error);
    }
  };

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    console.log('[useDynamicCoachChat] sendMessage called', { 
      messageText: messageText.substring(0, 50) + '...', 
      currentMessagesCount: messagesRef.current.length 
    });

    // 用户发送新消息时清除旧推荐
    setVideoRecommendation(null);
    setToolRecommendation(null);
    setEmotionButtonRecommendation(null);
    setCampRecommendation(null);

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
    // 使用 ref 获取最新 messages，构造完整的 nextMessages
    const currentMessages = messagesRef.current;
    const nextMessages = [...currentMessages, userMessage];
    
    setMessages(nextMessages);
    messagesRef.current = nextMessages; // 立即同步 ref
    
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
            messages: nextMessages,
            mode: chatMode,
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
      let sseBuffer = ""; // 用于处理跨 chunk 的不完整行
      
      // 改进的 tool call 解析：正确处理流式 chunks
      const toolCallsMap: Record<number, { id: string; function: { name: string; arguments: string } }> = {};

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          sseBuffer += chunk;
          
          // 按换行符分割，但保留最后一个可能不完整的行
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || ""; // 保留最后一个可能不完整的行

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

              // 改进的 tool call 流式解析
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const index = tc.index ?? 0;
                  if (!toolCallsMap[index]) {
                    toolCallsMap[index] = {
                      id: tc.id || '',
                      function: { name: '', arguments: '' }
                    };
                  }
                  if (tc.id) {
                    toolCallsMap[index].id = tc.id;
                  }
                  if (tc.function?.name) {
                    toolCallsMap[index].function.name = tc.function.name;
                  }
                  if (tc.function?.arguments) {
                    toolCallsMap[index].function.arguments += tc.function.arguments;
                  }
                }
              }
            } catch (e) {
              // JSON 解析失败时静默处理，可能是不完整的数据
              console.debug("SSE 数据解析跳过:", jsonStr?.substring(0, 50));
            }
          }
        }
      }
      
      // 将 tool calls map 转为数组
      const toolCalls = Object.values(toolCallsMap);
      const hasToolCalls = toolCalls.length > 0;

      // 处理工具调用 - 如果有工具调用但没有文本内容，添加默认反馈
      if (hasToolCalls && convId) {
        try {
          const toolCall = toolCalls[0];
          
          // 处理财富日记生成工具
          if (toolCall?.function?.name === "generate_wealth_briefing") {
            // 如果 AI 没有返回文本内容，添加默认完成消息
            if (!assistantMessage) {
              assistantMessage = "✨ 好的，让我帮你整理今天的财富觉察，正在生成财富日记...";
              setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
            }
            
            const briefingData = JSON.parse(toolCall.function.arguments);
            
            // 获取当前用户
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // 使用传入的 dayNumber 和 campId，而非重新计算
              const dayNumberToUse = contextData?.dayNumber || 1;
              const campIdToUse = contextData?.campId || null;
              
              // 调用日记生成 Edge Function
              const { data: journalResult, error: journalError } = await supabase.functions.invoke('generate-wealth-journal', {
                body: {
                  user_id: user.id,
                  camp_id: campIdToUse,
                  day_number: dayNumberToUse,
                  briefing_data: briefingData,
                  conversation_history: messages,
                }
              });
              
              if (!journalError && journalResult?.success) {
                console.log('📝 [useDynamicCoachChat] 日记生成成功:', { 
                  journalId: journalResult.journal?.id, 
                  dayNumber: dayNumberToUse 
                });
                
                toast({
                  title: "📖 财富日记已生成",
                  description: `记录了 Day ${dayNumberToUse} 的财富觉察`,
                });
                
                // 更新 training_camps 表的打卡状态
                if (campIdToUse) {
                  try {
                    const today = new Date().toISOString().split('T')[0];
                    
                    // 获取当前训练营数据
                    const { data: camp } = await supabase
                      .from('training_camps')
                      .select('completed_days, check_in_dates')
                      .eq('id', campIdToUse)
                      .single();
                    
                    if (camp) {
                      const checkInDates = Array.isArray(camp.check_in_dates) 
                        ? camp.check_in_dates as string[]
                        : [];
                      
                      // 仅当今日尚未打卡时才更新
                      if (!checkInDates.includes(today)) {
                        checkInDates.push(today);
                        
                        await supabase
                          .from('training_camps')
                          .update({
                            completed_days: (camp.completed_days || 0) + 1,
                            check_in_dates: checkInDates,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', campIdToUse);
                        
                        console.log('✅ [useDynamicCoachChat] 训练营打卡状态已更新:', {
                          completed_days: (camp.completed_days || 0) + 1,
                          today
                        });
                      }
                    }
                  } catch (campUpdateError) {
                    console.error('❌ [useDynamicCoachChat] 更新训练营打卡状态失败:', campUpdateError);
                  }
                }
                
                // Extract and save coach memories for future personalization
                // Map coachKey to coach_type for memory segmentation
                const coachTypeMap: Record<string, string> = {
                  'wealth_coach_4_questions': 'wealth',
                  'emotion': 'emotion',
                  'parent': 'parent',
                  'vibrant_life_sage': 'vibrant_life',
                  'gratitude': 'gratitude',
                };
                const coachTypeForMemory = coachTypeMap[coachKey] || 'wealth';
                
                console.log('🧠 [useDynamicCoachChat] 开始提取教练记忆...', { coachType: coachTypeForMemory });
                try {
                  const { data: memoryResult, error: memoryError } = await supabase.functions.invoke('extract-coach-memory', {
                    body: {
                      conversation: messagesRef.current,
                      session_id: journalResult.journal?.id,
                      coach_type: coachTypeForMemory,
                    }
                  });
                  
                  if (memoryError) {
                    console.error('❌ [useDynamicCoachChat] 提取教练记忆失败:', memoryError);
                  } else {
                    console.log('✅ [useDynamicCoachChat] 教练记忆提取完成:', memoryResult);
                  }
                  
                  // Update wealth profile from journal data (活画像更新)
                  console.log('📊 [useDynamicCoachChat] 开始更新活画像...');
                  const { data: profileResult, error: profileError } = await supabase.functions.invoke('update-wealth-profile', {
                    body: {
                      user_id: user.id,
                      camp_id: campIdToUse,
                    }
                  });
                  
                  if (profileError) {
                    console.error('❌ [useDynamicCoachChat] 更新活画像失败:', profileError);
                  } else if (profileResult?.updated) {
                    console.log('✅ [useDynamicCoachChat] 活画像更新成功:', profileResult.evolution_insight || '');
                  } else {
                    console.log('ℹ️ [useDynamicCoachChat] 活画像无需更新:', profileResult?.reason);
                  }
                } catch (memoryError) {
                  console.error('❌ [useDynamicCoachChat] 提取教练记忆异常:', memoryError);
                }
                
                // 🎉 成就检查：日记保存后立即检查并授予成就
                console.log('🏆 [useDynamicCoachChat] 开始检查成就...');
                try {
                  const earnedAchievements = await checkAndAwardAchievementsInline(user.id, dayNumberToUse);
                  if (earnedAchievements.length > 0) {
                    // Fire confetti celebration
                    confetti({
                      particleCount: 100,
                      spread: 70,
                      origin: { y: 0.6, x: 0.5 },
                      colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'],
                    });
                    
                    // Show toast for each earned achievement
                    earnedAchievements.forEach((key, index) => {
                      const achievement = achievementConfig.find(a => a.key === key);
                      if (achievement) {
                        setTimeout(() => {
                          toast({
                            title: `🎉 成就解锁：${achievement.name}`,
                            description: achievement.description,
                          });
                        }, index * 800);
                      }
                    });
                  }
                } catch (achievementError) {
                  console.error('❌ [useDynamicCoachChat] 成就检查异常:', achievementError);
                }
                
                if (onBriefingGenerated) {
                  onBriefingGenerated({
                    journalId: journalResult.journal?.id,
                    ...briefingData
                  });
                }
              } else {
                console.error('生成财富日记失败:', journalError);
              }
            }
          }
          
          // 处理简报工具
          if (briefingToolConfig && toolCall?.function?.name === briefingToolConfig.tool_name) {
            const briefingData = JSON.parse(toolCall.function.arguments);
            await saveBriefing(convId, briefingData);
          }
          
          // 处理教练推荐工具
          if (toolCall?.function?.name === "coach_recommendation") {
            const recommendationData = JSON.parse(toolCall.function.arguments);
            setCoachRecommendation({
              coachKey: recommendationData.recommended_coach_key,
              userIssueSummary: recommendationData.user_issue_summary,
              reasoning: recommendationData.reasoning,
            });
          }
          
          // 处理视频课程推荐工具
          if (toolCall?.function?.name === "video_course_recommendation") {
            const videoData = JSON.parse(toolCall.function.arguments);
            
            // 查询真实视频
            const { data: video } = await supabase
              .from("video_courses")
              .select("id, title, video_url")
              .eq("category", videoData.recommended_category)
              .limit(1)
              .single();
            
            setVideoRecommendation({
              topicSummary: videoData.topic_summary,
              category: videoData.recommended_category,
              learningGoal: videoData.learning_goal,
              videoId: video?.id,
              videoTitle: video?.title,
              videoUrl: video?.video_url,
            });
          }
          
          // 处理工具推荐
          if (toolCall?.function?.name === "tool_recommendation") {
            const toolData = JSON.parse(toolCall.function.arguments);
            setToolRecommendation({
              userNeed: toolData.user_need,
              toolId: toolData.recommended_tool_id,
              usageReason: toolData.usage_reason,
            });
          }
          
          // 处理情绪按钮推荐
          if (toolCall?.function?.name === "emotion_button_recommendation") {
            const emotionData = JSON.parse(toolCall.function.arguments);
            setEmotionButtonRecommendation({
              detectedEmotion: emotionData.detected_emotion,
              emotionChinese: emotionData.emotion_chinese,
              whySuitable: emotionData.why_suitable,
              howItHelps: emotionData.how_it_helps,
              quickTipGiven: emotionData.quick_tip_given,
            });
          }
          
          // 处理训练营推荐
          if (toolCall?.function?.name === "camp_recommendation") {
            const campData = JSON.parse(toolCall.function.arguments);
            setCampRecommendation({
              userGoal: campData.user_goal,
              recommendedCamp: campData.recommended_camp,
              whySuitable: campData.why_suitable,
              howToStart: campData.how_to_start,
            });
          }
        } catch (e) {
          console.error("处理工具调用失败:", e, "工具调用数据:", toolCalls);
        }
      }

      // 保存最终消息
      if (assistantMessage && convId) {
        await saveMessage(convId, "assistant", assistantMessage);
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
  }, [currentConversationId, chatMode, edgeFunctionName, briefingTableName, briefingToolConfig, contextData, onBriefingGenerated]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    setCurrentConversationId(null);
    setLastBriefingId(null);
    setCoachRecommendation(null);
    setVideoRecommendation(null);
    setToolRecommendation(null);
    setEmotionButtonRecommendation(null);
    setCampRecommendation(null);
  }, []);

  return {
    messages,
    isLoading,
    lastBriefingId,
    coachRecommendation,
    videoRecommendation,
    toolRecommendation,
    emotionButtonRecommendation,
    campRecommendation,
    sendMessage,
    resetConversation,
    setVideoRecommendation,
    setToolRecommendation,
    setEmotionButtonRecommendation,
    setCampRecommendation,
    chatMode,
    setChatMode,
  };
};
