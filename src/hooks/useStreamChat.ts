import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from "date-fns";
import { getTodayInBeijing, getTodayStartCST, parseDateCST } from "@/utils/dateUtils";

type Message = {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "intensity_prompt";
};

interface BriefingData {
  emotion_theme: string;
  stage_1_content: string;
  stage_2_content: string;
  stage_3_content: string;
  stage_4_content: string;
  insight: string;
  action: string;
  growth_story: string;
  emotion_intensity?: number;
  intensity_reasoning?: string;
  intensity_keywords?: string[];
  emotion_tags?: string[];
}

export const useStreamChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [videoRecommendations, setVideoRecommendations] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const { toast } = useToast();

  const EMOTION_COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emotion-coach`;

  // 加载现有对话和会话
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversation = async (convId: string) => {
    try {
      // Load emotion coaching session
      const { data: sessionData } = await supabase
        .from("emotion_coaching_sessions")
        .select("*")
        .eq("conversation_id", convId)
        .eq("status", "active")
        .maybeSingle();

      if (sessionData) {
        setCurrentSession(sessionData);
        setCurrentStage(sessionData.current_stage || 0);
        // ✅ 只有当数据库中有消息时才覆盖 UI 消息，避免新建对话时清空刚输入的消息
        if (sessionData.messages && Array.isArray(sessionData.messages) && sessionData.messages.length > 0) {
          setMessages(sessionData.messages.map((msg: any) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          })));
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const createConversation = async (): Promise<{ convId: string; session: any } | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Create conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: "新的情绪梳理"
        })
        .select()
        .single();

      if (convError) throw convError;

      // Create emotion coaching session
      const { data: sessionData, error: sessionError } = await supabase
        .from("emotion_coaching_sessions")
        .insert({
          user_id: user.id,
          conversation_id: convData.id,
          current_stage: 0,
          status: "active"
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setCurrentSession(sessionData);
      setCurrentStage(0);
      
      return { convId: convData.id, session: sessionData };
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

🌿 《情绪四部曲简报》


🎭 主题情绪
${data.emotion_theme}


📖 情绪四部曲旅程

1️⃣ 觉察（Feel it）
${data.stage_1_content}

2️⃣ 理解（Name it）
${data.stage_2_content}

3️⃣ 反应（React it）
${data.stage_3_content}

4️⃣ 转化（Transform it）
${data.stage_4_content}


💫 今日洞察
${data.insight}


✅ 今日行动
${data.action}


🌸 今日成长故事
${data.growth_story}


💾 简报已自动保存到你的历史记录中`;
  };

  // 根据标签名判断情绪类别并返回对应颜色
  const getTagColor = (tagName: string): string => {
    const EMOTION_CATEGORIES = {
      negative: ["焦虑", "不安", "失落", "压力", "无力", "发火", "生气", "伤心", "孤单", "难过", "紧张", "撑不住", "不够好", "后悔", "担心", "自卑"],
      positive: ["被认可", "感谢", "温暖", "被帮助", "轻松", "感动", "安心", "平静", "成功", "顺利", "被理解", "感恩", "被表扬", "放松"],
      mixed: ["又想又怕", "怀念", "矛盾", "纠结", "自责", "内疚", "惊讶", "哇", "没想到", "过去", "想起", "愧疚"],
      growth: ["我明白", "我想尝试", "我成长了", "其实", "原来", "我懂了", "我发现", "我变了", "我决定", "我相信", "我要改变"],
    };

    if (EMOTION_CATEGORIES.negative.includes(tagName)) {
      return "#6b7280"; // 灰色 (gray-500)
    } else if (EMOTION_CATEGORIES.positive.includes(tagName)) {
      return "#10b981"; // 绿色 (emerald-500)
    } else if (EMOTION_CATEGORIES.mixed.includes(tagName)) {
      return "#f97316"; // 橙色 (orange-500)
    } else if (EMOTION_CATEGORIES.growth.includes(tagName)) {
      return "#3b82f6"; // 蓝色 (blue-500)
    }
    
    // 默认颜色
    return "#10b981";
  };

  const saveBriefing = async (convId: string, briefingData: BriefingData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      // 保存简报
      const { emotion_tags, ...briefingDataWithoutTags } = briefingData;
      const { data: briefing, error: briefingError } = await supabase
        .from("briefings")
        .insert({
          conversation_id: convId,
          ...briefingDataWithoutTags
        })
        .select()
        .single();

      if (briefingError) throw briefingError;

      // 确保每个简报都有标签：如果AI没有返回标签或标签为空，使用默认标签
      let tagsToUse = emotion_tags && emotion_tags.length > 0 ? emotion_tags : ["情绪梳理"];
      
      // 处理情绪标签
      if (briefing) {
        for (const tagName of tagsToUse) {
          // 查找或创建标签
          let { data: existingTag } = await supabase
            .from("tags")
            .select("id")
            .eq("user_id", user.id)
            .eq("name", tagName)
            .single();

          let tagId: string;
          
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            // 创建新标签，使用智能配色
            const tagColor = getTagColor(tagName);
            const { data: newTag, error: tagError } = await supabase
              .from("tags")
              .insert({
                user_id: user.id,
                name: tagName,
                color: tagColor
              })
              .select("id")
              .single();

            if (tagError) {
              console.error("Error creating tag:", tagError);
              continue;
            }
            tagId = newTag.id;
          }

          // 关联标签到简报
          await supabase
            .from("briefing_tags")
            .insert({
              briefing_id: briefing.id,
              tag_id: tagId
            });
        }
      }

      toast({
        title: "简报已保存 🌿",
        description: "你可以在历史记录中查看",
      });

      // Auto check-in for training camps
      const { data: activeCamps } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (activeCamps && activeCamps.length > 0) {
        const today = getTodayInBeijing();
        
        for (const camp of activeCamps) {
          // Check if already checked in today
          const { data: existingProgress } = await supabase
            .from('camp_daily_progress')
            .select('is_checked_in')
            .eq('camp_id', camp.id)
            .eq('progress_date', today)
            .maybeSingle();

          const alreadyCheckedIn = existingProgress?.is_checked_in || false;

          // Update emotion logs count and perform auto check-in
          await supabase
            .from('camp_daily_progress')
            .upsert({
              camp_id: camp.id,
              user_id: user.id,
              progress_date: today,
              emotion_logs_count: 1,
              last_emotion_log_at: new Date().toISOString(),
              is_checked_in: true,
              checked_in_at: new Date().toISOString(),
              checkin_type: 'auto',
              validation_passed: true
            }, {
              onConflict: 'camp_id,progress_date'
            });

          // Only update camp if this is a new check-in
          if (!alreadyCheckedIn) {
            const checkInDates = Array.isArray(camp.check_in_dates) 
              ? camp.check_in_dates 
              : [];

            if (!checkInDates.includes(today)) {
              checkInDates.push(today);

              await supabase
                .from('training_camps')
                .update({
                  completed_days: camp.completed_days + 1,
                  check_in_dates: checkInDates,
                  updated_at: new Date().toISOString()
                })
                .eq('id', camp.id);

              // Trigger check-in success event
              // 使用正确的天数计算：从训练营开始日期到今天的天数差 + 1
              const campStartDate = parseDateCST(camp.start_date);
              const todayDate = getTodayStartCST();
              const calculatedCampDay = Math.max(1, differenceInDays(todayDate, campStartDate) + 1);
              
              window.dispatchEvent(new CustomEvent('camp-checkin-success', {
                detail: {
                  campId: camp.id,
                  campName: camp.camp_name,
                  campDay: calculatedCampDay,  // 使用正确计算的天数
                  briefingId: briefing.id,
                  briefingData: briefingData
                }
              }));
            }
          }
        }
      }

      // 触发简报完成后的鼓励通知
      try {
        await supabase.functions.invoke('generate-smart-notification', {
          body: {
            scenario: 'after_briefing',
            context: {
              emotion_theme: briefingData.emotion_theme,
              emotion_intensity: briefingData.emotion_intensity || 5
            }
          }
        });
      } catch (notificationError) {
        console.error("Error triggering notification:", notificationError);
        // 不影响主流程，仅记录错误
      }

      // 获取视频课程推荐
      try {
        const { data: recommendationsData, error: recError } = await supabase.functions.invoke('recommend-courses', {
          body: {
            briefing: {
              emotion_theme: briefingData.emotion_theme,
              emotion_tags: tagsToUse,
              insight: briefingData.insight,
              action: briefingData.action
            }
          }
        });

        if (!recError && recommendationsData?.recommendations) {
          setVideoRecommendations(recommendationsData.recommendations);
        }
      } catch (recommendError) {
        console.error("Error getting video recommendations:", recommendError);
        // 不影响主流程，仅记录错误
      }
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

    // ✅ 立即添加用户消息，避免页面闪烁
    const userMsg: Message = { role: "user", content: trimmedInput };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // 如果没有对话ID，创建新对话和会话
    let convId = currentConversationId;
    let emotionSession = currentSession;

    if (!convId) {
      const result = await createConversation();
      if (result) {
        convId = result.convId;
        emotionSession = result.session;
        setCurrentConversationId(convId);
      }
    }

    // Ensure we have a session
    if (!emotionSession) {
      toast({ title: "会话创建失败", variant: "destructive" });
      setIsLoading(false);
      setMessages((prev) => prev.slice(0, -1)); // 回滚消息
      return;
    }

    let assistantContent = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("未登录");
      }

      // Call emotion-coach function with retry for WeChat WebView stability
      const fetchWithRetry = async (retries = 2): Promise<Response> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            return await fetch(EMOTION_COACH_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ 
                sessionId: emotionSession.id,
                message: trimmedInput
              }),
            });
          } catch (fetchError: any) {
            const isNetworkError = fetchError.message?.includes('Load failed') || 
                                   fetchError.message?.includes('Failed to fetch') ||
                                   fetchError.name === 'TypeError';
            if (isNetworkError && attempt < retries) {
              console.warn(`[EmotionCoach] 网络请求失败，重试 ${attempt + 1}/${retries}...`);
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              continue;
            }
            throw fetchError;
          }
        }
        throw new Error('网络请求失败');
      };

      const resp = await fetchWithRetry();

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const responseData = await resp.json();
      
      // Update assistant message - only add if content is not empty
      assistantContent = responseData.content || "";
      if (assistantContent) {
        setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
      } else {
        console.warn('Received empty assistant content from API');
      }

      // Handle tool calls
      if (responseData.tool_call) {
        const { function: functionName, args } = responseData.tool_call;
        
        if (functionName === 'capture_emotion' || functionName === 'complete_stage') {
          // Reload session to get updated stage
          const { data: updatedSession } = await supabase
            .from('emotion_coaching_sessions')
            .select('*')
            .eq('id', emotionSession.id)
            .single();
          
          if (updatedSession) {
            setCurrentSession(updatedSession);
            setCurrentStage(updatedSession.current_stage || 0);
          }
        }

        if (functionName === 'request_emotion_intensity') {
          // Add intensity prompt message, but skip adding AI text response to avoid duplication
          setMessages((prev) => [...prev, { 
            role: "assistant", 
            content: "", 
            type: "intensity_prompt" 
          }]);
          setIsLoading(false);
          return; // Exit early to prevent adding duplicate text message
        }

        if (functionName === 'generate_briefing' && convId) {
          // Format and display briefing
          const briefingText = formatBriefing(args);
          const introText = assistantContent || "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n";
          
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            // If last message is assistant, append briefing to it
            if (last?.role === "assistant" && last.content) {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: m.content + briefingText } : m
              );
            }
            // Otherwise, create a new assistant message with briefing
            return [...prev, { role: "assistant", content: introText + briefingText }];
          });
          
          // Save briefing
          await saveBriefing(convId, args);
        }
      }

      setIsLoading(false);
    } catch (e) {
      console.error("发送消息失败:", e);
      toast({
        title: "发送失败",
        description: e instanceof Error ? e.message : "请稍后重试",
        variant: "destructive",
      });
      setIsLoading(false);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setCurrentConversationId(undefined);
    setVideoRecommendations([]);
    setCurrentSession(null);
    setCurrentStage(0);
  };

  const removeIntensityPrompt = () => {
    setMessages((prev) => prev.filter(msg => msg.type !== 'intensity_prompt'));
  };

  return { 
    messages, 
    isLoading, 
    sendMessage, 
    resetConversation,
    removeIntensityPrompt,
    conversationId: currentConversationId,
    videoRecommendations,
    currentStage
  };
};
