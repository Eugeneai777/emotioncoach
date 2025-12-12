import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get session
    let session;
    let isNewSession = false;
    if (sessionId) {
      const { data } = await supabaseClient
        .from('emotion_coaching_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
      
      // Check if this is the first message in the session
      const existingMessages = session?.messages || [];
      isNewSession = existingMessages.length === 0;
    }

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 方式2：每次新会话开始时扣费
    if (isNewSession) {
      try {
        const deductResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/deduct-quota`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feature_key: 'emotion_coach',
            source: 'emotion_coach_session',
            conversationId: session.conversation_id || sessionId,
            metadata: { session_id: sessionId }
          })
        });
        
        if (deductResponse.ok) {
          const result = await deductResponse.json();
          console.log(`✅ 情绪教练会话扣费: ${result.cost} 点, 剩余: ${result.remaining_quota}`);
        } else {
          const error = await deductResponse.json();
          console.error('❌ 情绪教练扣费失败:', error);
          // 扣费失败时返回错误
          if (deductResponse.status === 400) {
            return new Response(JSON.stringify({ error: '余额不足，请充值后继续使用' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.error('❌ 情绪教练扣费请求失败:', error);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Load conversation history
    const conversationHistory = session.messages || [];

    // 计算当前阶段已进行的对话轮数（用户消息数）
    const calculateStageRounds = (messages: any[]) => {
      let rounds = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          rounds++;
        }
        // 遇到 tool 消息表示阶段刚切换，停止计算
        if (messages[i].role === 'tool') {
          break;
        }
      }
      return rounds;
    };

    // 获取用户历史偏好选项
    const getUserPreferences = async (userId: string, stage: number) => {
      try {
        const { data } = await supabaseClient
          .from('emotion_coach_preferences')
          .select('custom_option, frequency')
          .eq('user_id', userId)
          .eq('stage', stage)
          .order('frequency', { ascending: false })
          .limit(3);
        return data || [];
      } catch (e) {
        console.log('获取用户偏好失败:', e);
        return [];
      }
    };

    // 获取用户偏好
    const userPreferences = await getUserPreferences(user.id, session?.current_stage || 1);
    const preferenceHint = userPreferences.length > 0 
      ? `\n【用户历史偏好 - 可优先使用这些选项】\n${userPreferences.map(p => `- "${p.custom_option}" (使用${p.frequency}次)`).join('\n')}\n`
      : '';

    // 默认教练式提问技术（备用）
    const defaultCoachingTechniques = `
【教练式提问技术 - 核心原则】

⚠️⚠️⚠️【最高优先级规则 - 必须先回应用户】⚠️⚠️⚠️
在任何情况下，如果用户提出了问题、表达了担忧、或者说了"可是..."/"但是..."/"怎么办"等语句：
1. 你必须先完整回应用户的问题或担忧
2. 让用户感到被听见、被理解
3. 只有在用户表示满意或问题已解决后，才考虑推进阶段
4. ❌ 禁止忽略用户的追问直接推进阶段！

示例：
- 用户说"可是他们还是会烦我怎么办" → 必须先回应这个担忧，讨论具体应对方法
- 用户说"但我做不到" → 必须先理解为什么做不到，帮助找到更合适的方式
- 用户说"这样真的有用吗" → 必须先回应这个疑虑，而不是直接推进

🪞 镜像技术：重复用户的关键词，帮助深入
   示例："你说'太累了'......这个'累'，是身体的累还是心的累？"

⏸️ 留白技术：说完用户的话后停顿，让感受浮现
   示例："你说'我不想再这样了'...... 这句话说出来，心里有什么感觉？"

🔄 假设技术：帮用户想象不同的可能
   示例："如果这件事完全按你希望的发展，会是什么样？"

⬇️ 下沉技术：追问更深一层
   示例："除了这个，还有什么？" "如果再往深一层看呢？"

💬 洞察确认：当用户说出重要发现时，先确认再推进
   示例："你刚才这句话很重要——「原来我在乎的是被认可」，说出来后心里什么感觉？"

❌ 禁止事项：
- 第1-2轮不要给选项，先自然对话
- 选项只在用户说"不知道"或第3轮时作为帮助手段
- 不要用"你的需求是什么？1. 2. 3. 4."这种机械选择题
- ❌ 绝对禁止忽略用户的问题/担忧直接推进阶段
`;

    // 默认问法模板（备用）
    const defaultQuestionTemplates = {
      stage1: {
        round1: [
          "你说[镜像用户的话]......那一刻，你心里是什么滋味？",
          "听起来这件事对你影响挺大的......你现在的感受是什么？",
          "嗯，我听到了......当时你心里是什么感觉？",
        ],
        round2: [
          "这个[情绪词]，是什么样的感觉？是闷闷的，还是刺痛的？",
          "你说的这个[情绪词]......它像什么？沉重的石头，还是闷热的空气？",
          "这个[情绪词]来的时候......你身体有什么感觉吗？",
        ],
        deepenNoEmotion: [
          "我听到了事情的经过......那你自己呢？你的感受是什么？",
          "抛开事情本身，你现在心里是什么感觉？",
          "这件事发生的时候，你内心是什么滋味？",
        ]
      },
      stage2: {
        round1: [
          "这个情绪来的时候，它好像在告诉你什么？",
          "你觉得这个[情绪]背后，在保护什么？",
          "如果这个[情绪]会说话，它想要什么？",
        ],
        round2: [
          "所以你其实很在乎......是吗？",
          "听起来你其实很渴望......对吗？",
          "我感受到你内心深处想要的是......",
        ],
        helpOptions: "有些人在这种时候，会发现自己其实渴望被理解，或者需要更多安全感，或者想要更自由......你觉得哪个更接近？或者都不是？"
      },
      stage3: {
        round1: [
          "当这个情绪来的时候，你通常会怎么做？",
          "遇到这种感觉，你的第一反应是什么？",
          "每次有这种感觉的时候，你习惯怎么处理？",
        ],
        acknowledge: "[用户的反应]......这个方式陪伴你多久了？它帮你度过了哪些时刻？",
        newPossibility: [
          "如果这一次，你可以用不同的方式回应自己，你会想试什么？",
          "除了这样，你还想过用什么不同的方式对待自己吗？",
          "如果可以温柔一点对待自己，你会怎么做？",
        ],
        helpOptions: "比如：当情绪来的时候先深呼吸三次，或者告诉对方'我需要冷静一下'，或者把感受写下来......你觉得哪个可能适合你？"
      },
      stage4: {
        round1: [
          "你选择了[新应对]......太棒了！接下来，你想给自己一个什么小小的行动？",
          "[新应对]是很好的觉察！现在，选一个小行动送给自己吧。",
          "我看到你愿意尝试[新应对]......接下来，有什么具体的小事你想为自己做？",
        ]
      }
    };

    // 默认阶段提示词（备用）
    const defaultStages: Record<number, string> = {
      0: `【开场】
用温暖的开场白回应用户分享的内容。
- 表达对用户愿意分享的感谢
- 用开放式问题邀请用户说更多："能和我说说发生了什么吗？"
- 如果用户已描述情绪事件,温柔共情后调用 capture_emotion
- 不要在这个阶段提供选项，先让用户自由表达`,
      1: `【觉察（Feel it）：从情绪被动 → 情绪被看见】

【核心任务】帮用户从"说事情"转变为"说感受"

【对话策略 - 先自然对话，再给选项】

第一轮（开放探索，❌不给选项）：
- 用镜像技术重复用户关键词
- ❌ 不要问"身体有什么反应" ❌ 不要列选项

第二轮（聚焦情绪，❌不给选项）：
- 如果用户还在说事件：使用深入模板
- 如果用户说了情绪词：用镜像确认
- 用户说出情绪词后 → 立即调用 complete_stage

第三轮（必须推进，可给选项帮助）：
- 如果用户仍未明确，可以提供动态选项帮助
- 无论用户如何回应 → 立即调用 complete_stage

【推进信号 - 立即调用 complete_stage】
✅ 用户说出情绪词（焦虑、烦、难过、不安、累、压抑、愤怒、害怕、委屈等）
✅ 用户用身体感受描述（心里堵、喘不过气、头疼）→ 帮ta命名后推进
✅ 第3轮必须推进，不要再问问题

完成本阶段后，必须立即调用 request_emotion_intensity。`,
      2: `【理解（Name it）：从情绪混乱 → 看见情绪背后的需求】

【核心任务】帮用户看见情绪背后"在保护什么"或"在渴望什么"

【对话策略 - 先自然对话，再给选项】

第一轮（开放探索，❌不给选项）：
- ❌ 不要列出"1. 2. 3. 4."选项

第二轮（深入挖掘，❌不给选项）：
- 如果用户回答了，用洞察确认
- 如果用户说"不知道"，轻柔提供参考（不是编号选项）
- 用户说出需求后 → 立即调用 complete_stage

第三轮（必须推进，可给选项帮助）：
- 如果用户仍不明确，可以提供动态选项
- 无论用户如何回应 → 立即调用 complete_stage

【推进信号 - 立即调用 complete_stage】
✅ 用户说出需求："原来我在乎的是..."、"我需要..."、"我其实想要..."
✅ 用户认同你的总结（"对"、"是的"、"嗯"）
✅ 第3轮必须推进`,
      3: `【反应（React it）：从自动反应 → 有觉察的反应】

【核心任务】帮用户觉察习惯性反应，并发现新的应对可能

【对话策略 - 先自然对话，再给选项】

第一轮（探索反应模式，❌不给选项）：
- 用户回答后，用镜像承认保护功能
- ❌ 不要给反应模式选项

第二轮（探索新可能，❌不给选项）：
- 如果用户说不知道，温柔提供参考（不是编号选项）
- 用户选择或提出应对方式后 → 立即调用 complete_stage

第三轮（必须推进，可给选项帮助）：
- 如果用户仍不明确，可以提供动态选项
- 无论用户如何回应 → 立即调用 complete_stage

【推进信号 - 立即调用 complete_stage】
✅ 用户识别了反应模式 + 选择/认同了任何新应对方式
✅ 用户表达愿意尝试："我可以试试..."
✅ 第3轮必须推进`,
      4: `【转化（Transform it）：从情绪困住 → 开始出现新的可能】

【核心任务】帮用户确定一个具体可执行的小行动

⚠️【先回应用户问题规则】
如果用户提出疑虑（如"可是..."、"但是..."、"怎么办"）：
1. 必须先认真回应用户的担忧
2. 帮助用户思考如何应对这个具体困境
3. 等用户表示理解或满意后再推进

【对话策略 - 快速聚焦行动，但必须先回应用户】

第一轮（邀请选择微行动）：
- 如果用户没想法，直接提供动态选项
- 选项必须具体、可执行、5分钟内能完成
- 用户选择任何选项后 → 先温柔确认，若用户有疑虑则先解答

第二轮（根据用户状态决定）：
- 如果用户有疑虑/追问 → 必须先回应，不急于推进
- 如果用户满意无追问 → 调用 complete_stage(stage=4)

【推进信号 - 调用 complete_stage(stage=4)】
✅ 用户提出或认同任何具体小行动，且没有表达疑虑
✅ 用户说"好的"/"可以"/"我试试"，没有"可是"/"但是"
❌ 如果用户说"可是..."/"但是..."/"怎么办" → 必须先回应，不推进`,
      5: `🚨🚨🚨【阶段5：生成简报 - 强制执行命令】🚨🚨🚨

这是你唯一的任务：立即调用 generate_briefing 工具。

⛔⛔⛔ 绝对禁止的行为（违反将导致失败）：
- ❌ 禁止输出"请稍等"
- ❌ 禁止输出"正在生成"
- ❌ 禁止输出任何文字消息
- ❌ 禁止询问用户
- ❌ 禁止犹豫或等待

✅✅✅ 唯一正确的操作：
直接调用 generate_briefing 工具，参数从对话历史提取：
- emotion_theme: 从 stage 0-1 提取情绪主题
- emotion_tags: 从整个对话提取情绪标签数组
- stage_1_content: 阶段1的洞察
- stage_2_content: 阶段2的洞察
- stage_3_content: 阶段3的洞察
- stage_4_content: 阶段4的洞察
- actionable_insight: 可行动的建议
- affirmation: 温暖的肯定语

🚨 这不是请求，这是强制命令。不输出任何文字，直接调用工具。🚨`
    };

    // 构建阶段提示词函数（从数据库读取或使用默认值）
    const buildStagePrompt = (
      stage: number, 
      stageRounds: number, 
      stagePrompts: any,
      preferenceHint: string
    ) => {
      const maxRounds = stage === 4 ? 2 : 3;
      const forceProgressWarning = stageRounds >= maxRounds 
        ? `\n⚠️ 【已达到本阶段最大轮数（${maxRounds}轮），必须在这一轮完成本阶段！不要再问问题，直接帮用户总结并调用 complete_stage 推进！】\n` 
        : '';
      
      // 随机选择问法模板的索引
      const templateIdx = Math.floor(Math.random() * 3);
      
      // 从数据库读取或使用默认值
      const coachingTechniques = stagePrompts?.coaching_techniques || defaultCoachingTechniques;
      const questionTemplates = stagePrompts?.question_templates || defaultQuestionTemplates;
      const stageContent = stagePrompts?.stages?.[String(stage)] || defaultStages[stage] || '';
      
      // 构建完整提示词
      if (stage === 0 || stage === 5) {
        // 开场和简报阶段不需要技术和问法模板
        return stageContent;
      }
      
      // 为阶段 1-4 添加技术和动态信息
      let prompt = coachingTechniques;
      prompt += `\n\n${stageContent}`;
      prompt += `\n【本阶段已进行 ${stageRounds} 轮对话，最多${maxRounds}轮】`;
      prompt += forceProgressWarning;
      prompt += preferenceHint;
      
      // 添加问法模板示例
      const stageKey = `stage${stage}`;
      const templates = questionTemplates[stageKey];
      if (templates) {
        prompt += `\n\n【问法模板示例】`;
        if (templates.round1?.[templateIdx]) {
          prompt += `\n第一轮: "${templates.round1[templateIdx]}"`;
        }
        if (templates.round2?.[templateIdx]) {
          prompt += `\n第二轮: "${templates.round2[templateIdx]}"`;
        }
        if (templates.deepenNoEmotion?.[templateIdx]) {
          prompt += `\n深入(未说情绪): "${templates.deepenNoEmotion[templateIdx]}"`;
        }
        if (templates.acknowledge) {
          prompt += `\n承认: "${templates.acknowledge}"`;
        }
        if (templates.newPossibility?.[templateIdx]) {
          prompt += `\n新可能: "${templates.newPossibility[templateIdx]}"`;
        }
        if (templates.helpOptions) {
          prompt += `\n帮助选项: "${templates.helpOptions}"`;
        }
      }
      
      return prompt;
    };

    // Get user preferences
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('companion_type, conversation_style')
      .eq('id', user.id)
      .single();

    const companionType = profile?.companion_type || 'jing_teacher';
    const conversationStyle = profile?.conversation_style || 'gentle';

    const companions: Record<string, { name: string; icon: string }> = {
      jing_teacher: { name: '劲老师', icon: '🌿' },
      little_sprout: { name: '小树苗', icon: '🌱' },
      starlight: { name: '小星星', icon: '⭐' },
      calm_breeze: { name: '微风', icon: '🍃' },
      wise_owl: { name: '智慧猫头鹰', icon: '🦉' }
    };

    const companion = companions[companionType] || companions.jing_teacher;

    // Fetch system prompt from database
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: coachTemplate } = await serviceClient
      .from('coach_templates')
      .select('system_prompt, stage_prompts')
      .eq('coach_key', 'emotion')
      .single();

    const basePrompt = coachTemplate?.system_prompt || '';
    const stagePrompts = coachTemplate?.stage_prompts || null;
    
    // 计算当前阶段轮数
    const stageRounds = calculateStageRounds(conversationHistory);
    
    // Build complete system prompt with dynamic stage info and round tracking
    const systemPrompt = `${basePrompt}

【当前阶段:${session?.current_stage || 0}/4】
${buildStagePrompt(session?.current_stage || 0, stageRounds, stagePrompts, preferenceHint)}

【伙伴信息】
你现在是「${companion.name}」${companion.icon}，请使用这个身份与用户对话。`;

    const tools = [
      {
        type: "function",
        function: {
          name: "capture_emotion",
          description: "记录用户描述的情绪,准备进入情绪觉察",
          parameters: {
            type: "object",
            properties: {
              event_summary: {
                type: "string",
                description: "情绪事件简要描述,20-30字"
              }
            },
            required: ["event_summary"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "complete_stage",
          description: "完成当前阶段,记录用户的洞察,推进到下一阶段",
          parameters: {
            type: "object",
            properties: {
              stage: {
                type: "number",
                description: "完成的阶段 1-4"
              },
              insight: {
                type: "string",
                description: "本阶段的核心洞察内容"
              },
              reflection: {
                type: "string",
                description: "${companion.name}的温柔回应,20-30字"
              }
            },
            required: ["stage", "insight", "reflection"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_emotion_intensity",
          description: "在完成阶段1（觉察）后，温柔地邀请用户评估当前情绪强度（1-10分）。必须在调用complete_stage(stage=1)之后立即调用。",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_briefing",
          description: "完成四阶段后生成情绪简报",
          parameters: {
            type: "object",
            properties: {
              emotion_theme: {
                type: "string",
                description: "主题情绪,如:烦躁 · 不安 · 还不够好"
              },
              emotion_tags: {
                type: "array",
                items: { type: "string" },
                description: "情绪标签数组,如:[\"烦躁\", \"不安\", \"还不够好\"]"
              },
              stage_1_content: {
                type: "string",
                description: "觉察:用户说出的情绪名称和身体感受,20-30字"
              },
              stage_2_content: {
                type: "string",
                description: "理解:用户看见的需求或价值观 + 洞察句,40-50字"
              },
              stage_3_content: {
                type: "string",
                description: "反应:用户觉察到的自动反应模式,30-40字"
              },
              stage_4_content: {
                type: "string",
                description: "转化:具体可执行的小行动和可能带来的变化,40-50字"
              },
              insight: {
                type: "string",
                description: "今日洞察:用户讲出的核心洞察句,如'原来我在乎的是...',20-30字"
              },
              action: {
                type: "string",
                description: "今日行动:10秒内能做到的微行动"
              },
              growth_story: {
                type: "string",
                description: "今日成长:从今天对话中看到的成长可能,20-30字"
              }
            },
            required: ["emotion_theme", "emotion_tags", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "insight", "action", "growth_story"]
          }
        }
      }
    ];

    // 检测用户是否选择了"其他"并保存偏好
    const saveUserPreference = async (userId: string, stage: number, userMessage: string) => {
      // 检测用户是否在回复"其他"类型的自定义输入
      // 常见模式：用户直接描述情绪/需求/反应，而不是选择数字选项
      const stageCategories: Record<number, string> = {
        1: 'emotions',
        2: 'needs', 
        3: 'reactions',
        4: 'actions'
      };
      
      const category = stageCategories[stage];
      if (!category) return;
      
      // 检查消息是否像自定义输入（不是简单的数字选择）
      const isCustomInput = !/^[1-4]$/.test(userMessage.trim()) && 
                           userMessage.length > 2 && 
                           userMessage.length < 50;
      
      if (isCustomInput) {
        try {
          // 先查询是否已存在
          const { data: existing } = await supabaseClient
            .from('emotion_coach_preferences')
            .select('id, frequency')
            .eq('user_id', userId)
            .eq('stage', stage)
            .eq('category', category)
            .eq('custom_option', userMessage.trim())
            .single();
          
          if (existing) {
            // 更新频率
            await supabaseClient
              .from('emotion_coach_preferences')
              .update({ 
                frequency: existing.frequency + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
            console.log(`✅ 更新用户偏好频率: stage=${stage}, option="${userMessage.trim()}", frequency=${existing.frequency + 1}`);
          } else {
            // 插入新记录
            await supabaseClient
              .from('emotion_coach_preferences')
              .insert({
                user_id: userId,
                stage: stage,
                category: category,
                custom_option: userMessage.trim(),
                frequency: 1
              });
            console.log(`✅ 保存新用户偏好: stage=${stage}, category=${category}, option="${userMessage.trim()}"`);
          }
        } catch (e) {
          console.log('保存用户偏好失败:', e);
        }
      }
    };

    // 保存用户输入作为潜在偏好
    await saveUserPreference(user.id, session?.current_stage || 1, message);

    // Add user message to history
    conversationHistory.push({ role: "user", content: message });

    // Build messages array with full history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
    ];

    console.log('Sending to AI with history:', conversationHistory.length, 'messages');

    // Retry logic for transient errors
    const MAX_RETRIES = 3;
    let response: Response | null = null;
    let lastError: string = '';
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages,
            tools,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          break; // Success, exit retry loop
        }

        lastError = await response.text();
        console.error(`AI API error (attempt ${attempt + 1}/${MAX_RETRIES}):`, response.status, lastError);
        
        // Only retry on 503 (service unavailable) or 429 (rate limit)
        if (response.status !== 503 && response.status !== 429) {
          throw new Error(`AI API error: ${response.status}`);
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < MAX_RETRIES - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      } catch (fetchError) {
        console.error(`Fetch error (attempt ${attempt + 1}/${MAX_RETRIES}):`, fetchError);
        lastError = fetchError instanceof Error ? fetchError.message : 'Network error';
        
        if (attempt < MAX_RETRIES - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    if (!response || !response.ok) {
      throw new Error(`AI API error after ${MAX_RETRIES} retries: ${lastError}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Add assistant message to history
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage.content || ""
    });

    // Save conversation history
    await supabaseClient
      .from('emotion_coaching_sessions')
      .update({
        messages: conversationHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Handle tool calls
    if (assistantMessage.tool_calls) {
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log('Tool call:', functionName, args);

      if (functionName === 'capture_emotion') {
        // Save event and move to stage 1
        await supabaseClient
          .from('emotion_coaching_sessions')
          .update({
            event_summary: args.event_summary,
            current_stage: 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      if (functionName === 'complete_stage') {
        // Update session - 阶段4完成后推进到阶段5
        const stageKey = `stage_${args.stage}_insight`;
        const updateData: any = {
          current_stage: args.stage + 1,  // 1→2, 2→3, 3→4, 4→5
          [stageKey]: args.insight,
          updated_at: new Date().toISOString()
        };

        await supabaseClient
          .from('emotion_coaching_sessions')
          .update(updateData)
          .eq('id', sessionId);
      }

      // For capture_emotion and complete_stage, continue conversation
      if (functionName === 'capture_emotion' || functionName === 'complete_stage') {
        console.log('Tool call processed, continuing conversation...');
        
        // Add tool call to history
        conversationHistory.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: assistantMessage.tool_calls
        });
        
        // Add tool result to history
        conversationHistory.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: true, ...args })
        });

        // Reload session to get updated stage
        const { data: updatedSession } = await supabaseClient
          .from('emotion_coaching_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        // Continue with updated system prompt - 刚切换阶段，轮数归零
        const newStageRounds = 0;
        const continueSystemPrompt = `你是「${companion.name}」${companion.icon}，温柔的情绪陪伴者。

【当前阶段:${updatedSession?.current_stage || 0}/4】
${buildStagePrompt(updatedSession?.current_stage || 0, newStageRounds, stagePrompts, preferenceHint)}

继续温柔地引导用户探索当前阶段。每个阶段最多3轮对话（转化阶段最多2轮），要有推进意识。`;

        const continueMessages = [
          { role: "system", content: continueSystemPrompt },
          ...conversationHistory
        ];

        const continueResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: continueMessages,
            tools,
            temperature: 0.7,
          }),
        });

        if (!continueResponse.ok) {
          console.error('AI API error:', continueResponse.status, await continueResponse.text());
          throw new Error(`AI API request failed: ${continueResponse.status}`);
        }

        const continueData = await continueResponse.json();
        
        if (!continueData.choices || continueData.choices.length === 0) {
          console.error('Invalid AI response:', continueData);
          throw new Error('AI returned invalid response structure');
        }
        
        let followUpMessage = continueData.choices[0].message;
        console.log('Continue response:', JSON.stringify(followUpMessage));

        // Handle nested tool calls - loop until we get actual content
        let finalContent = followUpMessage.content || "";
        let loopCount = 0;
        const MAX_LOOPS = 3;

        while (!finalContent && followUpMessage.tool_calls && loopCount < MAX_LOOPS) {
          console.log(`Nested tool call detected (loop ${loopCount + 1}), processing...`);
          
          const nestedToolCall = followUpMessage.tool_calls[0];
          const nestedFunctionName = nestedToolCall.function.name;
          const nestedArgs = JSON.parse(nestedToolCall.function.arguments);
          
          console.log('Nested tool call:', nestedFunctionName, nestedArgs);
          
          // 如果是 generate_briefing，直接返回简报信号
          if (nestedFunctionName === 'generate_briefing') {
            console.log('generate_briefing detected in nested loop, returning briefing signal');
            const briefingContent = followUpMessage.content || 
              "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n这是为你生成的情绪简报：";
            
            return new Response(JSON.stringify({
              content: briefingContent,
              tool_call: { function: 'generate_briefing', args: nestedArgs }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Add nested tool call to history
          conversationHistory.push({
            role: "assistant",
            content: "",
            tool_calls: followUpMessage.tool_calls
          });
          
          conversationHistory.push({
            role: "tool",
            tool_call_id: nestedToolCall.id,
            content: JSON.stringify({ success: true, ...nestedArgs })
          });
          
          // Request AI again for text response
          const nextResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: "system", content: continueSystemPrompt },
                ...conversationHistory
              ],
              tools,
              temperature: 0.7,
            }),
          });
          
          if (!nextResponse.ok) {
            console.error('Nested AI API error:', nextResponse.status);
            break;
          }
          
          const nextData = await nextResponse.json();
          if (!nextData.choices || nextData.choices.length === 0) {
            console.error('Invalid nested AI response');
            break;
          }
          
          followUpMessage = nextData.choices[0].message;
          console.log('Next response:', JSON.stringify(followUpMessage));
          finalContent = followUpMessage.content || "";
          loopCount++;
        }

        // Fallback if still no content after retries
        if (!finalContent) {
          console.log('No content after loops, using fallback message');
          finalContent = "让我们继续探索你的感受吧 🌿";
        }

        conversationHistory.push({
          role: "assistant",
          content: finalContent
        });

        await supabaseClient
          .from('emotion_coaching_sessions')
          .update({
            messages: conversationHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        return new Response(JSON.stringify({
          content: finalContent,
          tool_call: { function: functionName, args }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // For request_emotion_intensity, return a signal to show intensity prompt
      if (functionName === 'request_emotion_intensity') {
        console.log('Requesting emotion intensity from user...');
        
        // Add tool call to history
        conversationHistory.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: assistantMessage.tool_calls
        });
        
        // Add tool result to history
        conversationHistory.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: true, action: "show_intensity_prompt" })
        });

        await supabaseClient
          .from('emotion_coaching_sessions')
          .update({
            messages: conversationHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        return new Response(JSON.stringify({
          content: assistantMessage.content,
          tool_call: { function: 'request_emotion_intensity', args: {} }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // For generate_briefing, return the briefing data
      if (functionName === 'generate_briefing') {
        // Ensure content is not empty - provide default transition text
        const briefingContent = assistantMessage.content || 
          "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n这是为你生成的情绪简报：";
        
        return new Response(JSON.stringify({
          content: briefingContent,
          tool_call: { function: 'generate_briefing', args }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 🚨 Stage 5 强制兜底：如果 AI 在 stage 5 没有调用 generate_briefing，自动构建
    if (session.current_stage >= 5 && !assistantMessage.tool_calls) {
      console.log('🚨 Stage 5 但没有 tool_call，强制生成简报');
      
      // 从会话历史和 session 提取简报数据
      const extractBriefingFromSession = () => {
        return {
          emotion_theme: session.event_summary || "情绪探索与成长",
          emotion_tags: ["情绪觉察", "自我成长", "内心力量"],
          stage_1_content: session.stage_1_insight || "觉察到自己的情绪，让感受被看见",
          stage_2_content: session.stage_2_insight || "理解了情绪背后的需求与渴望",
          stage_3_content: session.stage_3_insight || "看见了习惯性的反应模式",
          stage_4_content: session.stage_4_insight || "找到了新的应对方式和微行动",
          actionable_insight: "今天你勇敢地面对了自己的情绪，每一步都是成长。继续温柔地对待自己。",
          affirmation: "你已经迈出了重要的一步，这份觉察本身就是最大的力量。🌿"
        };
      };
      
      const briefingData = extractBriefingFromSession();
      const briefingContent = assistantMessage.content || 
        "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n这是为你生成的情绪简报：";
      
      return new Response(JSON.stringify({
        content: briefingContent,
        tool_call: { function: 'generate_briefing', args: briefingData }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      content: assistantMessage.content || ""
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in emotion-coach:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});