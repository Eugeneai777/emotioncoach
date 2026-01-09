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
    const { messages, mode } = await req.json();
    
    // mode: 'standard' | 'meditation_analysis'
    const chatMode = mode || 'standard';
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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

    // 新会话时扣费（只有一条用户消息时）
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
    if (userMessageCount === 1) {
      try {
        const deductResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/deduct-quota`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feature_key: 'wealth_coach_4_questions',
            source: 'wealth_coach_session',
            metadata: { user_id: user.id }
          })
        });
        
        if (deductResponse.ok) {
          const result = await deductResponse.json();
          console.log(`✅ 财富教练会话扣费: ${result.cost} 点, 剩余: ${result.remaining_quota}`);
        } else {
          const error = await deductResponse.json();
          console.error('❌ 财富教练扣费失败:', error);
          if (deductResponse.status === 400) {
            return new Response(JSON.stringify({ error: '余额不足，请充值后继续使用' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.error('❌ 财富教练扣费请求失败:', error);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get user profile for personalization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || '朋友';

    // Fetch system prompt and stage prompts from database
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: coachTemplate } = await serviceClient
      .from('coach_templates')
      .select('system_prompt, stage_prompts')
      .eq('coach_key', 'wealth_coach_4_questions')
      .single();

    // Fetch user wealth profile for personalization
    const { data: wealthProfile } = await serviceClient
      .from('user_wealth_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch coach memory for personalized continuity
    const { data: coachMemories } = await serviceClient
      .from('user_coach_memory')
      .select('*')
      .eq('user_id', user.id)
      .order('importance_score', { ascending: false })
      .limit(5);

    // Build memory context for injection into prompt
    let memoryContext = '';
    if (coachMemories && coachMemories.length > 0) {
      memoryContext = `\n\n【教练记忆 - 用户过往重要觉察】
以下是用户之前分享过的重要觉察点，请在对话中自然地引用，让用户感受到"你记得我"：
`;
      coachMemories.forEach((m: any, index: number) => {
        const layerLabel = m.layer === 'behavior' ? '行为层' : m.layer === 'emotion' ? '情绪层' : m.layer === 'belief' ? '信念层' : '';
        memoryContext += `${index + 1}. ${layerLabel ? `[${layerLabel}]` : ''} ${m.content}\n`;
      });
      memoryContext += `
使用方式：
- "你之前提到过..."
- "我记得你说过..."
- "上次你觉察到...今天有什么新发现吗？"`;
    }

    // === 预测性干预系统：评估用户风险 ===
    let riskContext = '';
    try {
      // 调用风险预测函数
      const riskResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/predict-user-risk`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization')!,
          'Content-Type': 'application/json',
        },
      });
      
      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        console.log('📊 用户风险评估:', riskData);
        
        if (riskData.risk_level === 'high') {
          riskContext = `
【⚠️ 高风险用户警示】
该用户风险分数：${riskData.risk_score}/100
风险因素：${riskData.risk_factors.join('、')}
距离上次打卡：${riskData.days_since_last_entry} 天

【开场策略调整 - 温暖关怀模式】
- 语气要更加温暖和接纳，避免任何可能让用户感到压力的表达
- 不要急于进入正题，先关心用户的近况
- 开场示例："${userName}，好久不见呀～这几天还好吗？有点想你了呢"
- 如果用户分享困难，给予充分的理解和支持
- 降低今天的目标门槛，哪怕只是聊聊天也很好
`;
        } else if (riskData.risk_level === 'medium') {
          riskContext = `
【⚡ 中风险用户提示】
该用户近期互动有所减少（风险分：${riskData.risk_score}/100）
风险因素：${riskData.risk_factors.join('、') || '轻微下降'}

【开场策略调整 - 关心式问候】
- 开场时表达关心，但语气轻松不要太沉重
- 可以问问最近生活中有什么新发现
- 开场示例："${userName}，今天感觉怎么样？最近有什么有趣的事想分享吗？"
`;
        }
        
        // 添加未完成行动的强化提醒
        if (riskData.pending_actions && riskData.pending_actions.length > 0) {
          const pendingList = riskData.pending_actions
            .map((a: any) => `"${a.giving_action}"（Day ${a.day_number}）`)
            .join('、');
          riskContext += `
【🎯 未完成给予行动 - 重要！】
用户有 ${riskData.pending_actions.length} 个待确认的给予行动：${pendingList}

请在对话中适当时机温和询问完成情况，例如：
- "对了，你之前说要[行动内容]，后来怎么样了呀？"
- "我记得你计划做[行动内容]，有机会完成吗？"
如果用户完成了，热烈庆祝这份给予的力量。
如果没完成，温柔探索是什么阻碍了行动。
`;
        }
      }
    } catch (error) {
      console.error('风险评估调用失败:', error);
      // 不影响主流程
    }

    // Check yesterday's action status for personalized greeting (fallback)
    const { data: recentEntries } = await serviceClient
      .from('wealth_journal_entries')
      .select('giving_action, action_completed_at, action_reflection, day_number, behavior_type, behavior_score, briefing_content')
      .eq('user_id', user.id)
      .order('day_number', { ascending: false })
      .limit(2);

    // === 给予行动历史去重：获取最近7天的给予行动 ===
    const { data: recentGivings } = await serviceClient
      .from('wealth_journal_entries')
      .select('giving_action, day_number')
      .eq('user_id', user.id)
      .not('giving_action', 'is', null)
      .order('created_at', { ascending: false })
      .limit(7);

    const pastGivings = recentGivings?.map(e => e.giving_action).filter(Boolean) || [];
    
    // 构建给予历史去重上下文
    let givingHistoryContext = '';
    if (pastGivings.length > 0) {
      givingHistoryContext = `
【用户最近的给予行动 - 请避免重复推荐】
${pastGivings.map((g, i) => `${i + 1}. ${g}`).join('\n')}

推荐原则：
- 避免推荐用户已经做过的相同行动
- 可以推荐同一类型的不同变体（如都是"语言给予"但对象不同）
- 优先推荐用户从未尝试过的给予类型
- 如果用户所有类型都尝试过，推荐不同对象或更深入的版本`;
    }

    // === 动态状态识别：检测用户是否已展现"富"状态 ===
    let positiveStateContext = '';
    const latestJournal = recentEntries?.[0];
    if (latestJournal) {
      const behaviorScore = latestJournal.behavior_score || 0;
      const behaviorType = latestJournal.behavior_type;
      
      // 如果用户最近一次对话展现了高觉醒分数（>=4），说明正在积极转变
      if (behaviorScore >= 4) {
        const richTypeMap: Record<string, string> = {
          'hand': '手富 - 愿意投资有价值的事物',
          'mouth': '嘴富 - 用感恩和赞美的语言',
          'eye': '眼富 - 看到机会和可能性',
          'heart': '心富 - 拥有责任者思维'
        };
        const richLabel = richTypeMap[behaviorType] || '积极转变';
        
        positiveStateContext = `
【✨ 用户积极状态信号】
用户在最近一次对话中展现了正向转变！
- 觉醒分数：${behaviorScore}/5
- 行为类型：${behaviorType} → 正在转向"${richLabel}"

【重要 - 状态识别优先】
1. 不要默认用户仍处于"穷"状态
2. 先观察当前对话中的表现再下判断
3. 如果用户分享的经历展现以下特征，应识别为"富"状态并给予肯定：
   - 手富信号：主动支付/投资且感到满足、把消费定义为"投资"
   - 嘴富信号：用感恩/赞美的语言描述经历
   - 眼富信号：提到机会、可能性、正面收获
   - 心富信号：承担责任、主动创造、不抱怨外界

4. 识别到"富"状态时的回应模板：
   "你刚才分享的经历，展现了'[XX富]'的状态——[具体描述]。这是一个很棒的转变！
   你觉察到自己的这个变化了吗？"
`;
      }
    }

    const yesterdayEntry = recentEntries?.find(e => e.giving_action && !e.action_completed_at);
    const completedYesterday = recentEntries?.find(e => e.giving_action && e.action_completed_at);

    let actionContext = '';
    // 只有在没有风险上下文时才使用简单的行动提醒
    if (!riskContext) {
      if (yesterdayEntry) {
        actionContext = `\n\n【昨日行动提醒】
用户昨天计划做"${yesterdayEntry.giving_action}"，但还未确认完成。
开场时可以温和地询问："昨天你打算${yesterdayEntry.giving_action}，完成了吗？"
如果用户说完成了，给予肯定并引导今天的觉察。
如果用户说没完成，温柔地问："是什么阻碍了你？"作为今天探索的切入点。`;
      } else if (completedYesterday?.action_reflection) {
        actionContext = `\n\n【昨日行动回顾】
用户昨天完成了"${completedYesterday.giving_action}"
反思：${completedYesterday.action_reflection}
开场时可以说："我看到你昨天完成了给予行动，感觉怎么样？这种给予的体验很珍贵呢。"`;
      }
    }

    // Get coaching strategy based on user profile
    const getCoachingStrategy = (profile: any) => {
      if (!profile) return { tone: '温柔接纳', focus: '通用引导', keyQuestion: '', avoidance: '', description: '标准模式' };
      
      const strategy = profile.coach_strategy;
      if (strategy && typeof strategy === 'object') {
        return strategy;
      }

      // Fallback strategies based on reaction pattern
      const strategies: Record<string, any> = {
        chase: {
          tone: '放慢节奏，帮助用户觉察急切',
          focus: '校准行为节奏，减少用力过猛',
          keyQuestion: '你现在感受到多少「急」或「焦」？',
          avoidance: '避免给出太多行动建议，先稳定情绪'
        },
        avoid: {
          tone: '温暖接纳，建立安全感',
          focus: '渐进式暴露，降低门槛',
          keyQuestion: '这个想法让你有多不舒服？',
          avoidance: '避免推动太快，尊重边界'
        },
        trauma: {
          tone: '极度温柔，提供结构化容器',
          focus: '神经系统调节，陪伴式支持',
          keyQuestion: '你现在身体有什么感觉？',
          avoidance: '避免直接触碰创伤，先稳定'
        },
        harmony: {
          tone: '轻松对话，巩固状态',
          focus: '价值放大，复制成功模式',
          keyQuestion: '今天有什么值得庆祝的？',
          avoidance: '避免过度分析，保持流动'
        }
      };
      
      return strategies[profile.reaction_pattern] || strategies.harmony;
    };

    const coachStrategy = getCoachingStrategy(wealthProfile);

    // Build personalized profile section
    let profileSection = '';
    if (wealthProfile) {
      profileSection = `
【用户财富画像】
- 反应模式：${wealthProfile.reaction_pattern || '未知'}
- 历史主导四穷类型：${wealthProfile.dominant_poor || '未知'}（注意：这是历史评估，需观察当前对话中的实际表现）
- 主导情绪卡点：${wealthProfile.dominant_emotion || '未知'}
- 主导信念卡点：${wealthProfile.dominant_belief || '未知'}
- 健康度：${wealthProfile.health_score || 50}/100

【个性化教练策略】
- 对话基调：${coachStrategy.tone}
- 重点关注：${coachStrategy.focus}
- 核心提问：${coachStrategy.keyQuestion}
- 注意避免：${coachStrategy.avoidance}
${positiveStateContext}
${riskContext}
${actionContext}
${memoryContext}
`;
    } else {
      // Even without profile, include risk context and memories if they exist
      profileSection = `${riskContext}${actionContext}${memoryContext}`;
    }

    const basePrompt = coachTemplate?.system_prompt || `你好，我是劲老师，一位专业的心理教练。我的目标是引导你通过"财富教练四问法"，每天找到一个最小可进步点，从而解锁财富流动。`;

    // Parse stage prompts from database
    const stagePrompts = coachTemplate?.stage_prompts as any || {};
    const coachingTechniques = stagePrompts.coaching_techniques || '';

    // Analyze current stage based on complete_stage tool calls and conversation flow
    const analyzeCurrentStage = (msgs: any[]) => {
      // Check for complete_stage markers in conversation
      const assistantMessages = msgs.filter(m => m.role === 'assistant');
      let completedStages = 0;
      
      // Simple heuristic: count assistant responses to estimate stage
      // Each stage typically has 2-3 exchanges
      const totalExchanges = assistantMessages.length;
      
      if (totalExchanges === 0) return 0; // Opening
      if (totalExchanges <= 2) return 1;  // Stage 1: Behavior
      if (totalExchanges <= 4) return 2;  // Stage 2: Emotion
      if (totalExchanges <= 6) return 3;  // Stage 3: Belief
      if (totalExchanges <= 8) return 4;  // Stage 4: Progress
      return 5; // Completion
    };

    const currentStage = analyzeCurrentStage(messages);

    // Build stage-specific guidance from database
    const getStageGuidance = (stage: number) => {
      const stageKey = `stage_${stage}`;
      const stageData = stagePrompts[stageKey];
      
      if (!stageData) {
        // Fallback for missing stage data
        return `【第${stage}阶段】继续引导用户深入探索。`;
      }

      const questions = stageData.questions?.join('\n- ') || '';
      const deepening = stageData.deepening_prompts?.join('\n- ') || '';
      const options = stageData.option_templates?.join('、') || '';
      const successCriteria = stageData.success_criteria || '';
      const completionNote = stageData.completion_note || '';

      return `【${stageData.name}】
目标：${stageData.goal}

参考问题（随机选择1-2个，不要全部使用）：
- ${questions}

深化引导（当用户回应模糊时使用）：
- ${deepening}

${options ? `备选选项（仅在用户第3轮仍不清晰时提供）：${options}` : ''}

成功标准：${successCriteria}
${completionNote ? `\n⚠️ ${completionNote}` : ''}`;
    };

    // Build system prompt based on mode
    let systemPrompt: string;
    
    if (chatMode === 'meditation_analysis') {
      // 冥想分析模式：引导式觉醒 - 7轮对话结构
      const meditationAnalysisPrompt = `你是劲老师，一位专业的财富心理教练。用户刚刚完成冥想练习，你的目标是通过引导式对话，让用户产生"原来是这样"的觉醒，看见真正的转变。

用户名称：${userName}
${profileSection}

═══════════════════════════════════════════════
【对话流程设计】7轮对话，层层深入
═══════════════════════════════════════════════

第1轮：开场 - 连接冥想与生活经历
───────────────────────────────────────────────
"刚刚完成冥想，感觉怎么样？

最近有什么生活中的经历，和今天冥想的主题产生了呼应吗？
可以是一件小事，一个念头，或者一段对话..."

目的：让用户先分享一个具体的故事/经历，作为后续分析的素材。
注意：用开放的态度接纳任何分享，不要预设用户会分享什么。

═══════════════════════════════════════════════
第2轮：行为层 - 四穷分析 + 发现"我能负责什么" + 觉醒时刻
═══════════════════════════════════════════════

【四穷 ↔ 四富 双向识别系统】

穷状态（限制模式）：
- 嘴穷(mouth)：诅咒式表达 - 抱怨财务状况、否定致富可能、说"我穷"类语言
- 手穷(hand)：乞丐心态 - 不舍得为自己投资、花钱心疼、消费恐惧
- 眼穷(eye)：狭隘视角 - 只看到问题和风险、看不到机会、注意力锁定负面
- 心穷(heart)：受害者思维 - 归咎外界、抱怨命运不公、没有责任意识

富状态（赋能模式）← 【重要：也要识别！】：
- 嘴富(mouth)：祝福式表达 - 感恩当下拥有、赞美他人成功、用积极语言
- 手富(hand)：投资者心态 - 愿意为有价值的事物付出、把消费视为投资、享受金钱流动
- 眼富(eye)：机会视角 - 能看到可能性、关注正面信息、注意力锁定机会
- 心富(heart)：创造者思维 - 承担责任、相信自己能创造、主动行动

【关键】识别逻辑：
1. 先观察用户分享的故事/行为，判断是"穷"还是"富"的模式
2. 如果是"穷"→ 点出问题 + 引导觉醒
3. 如果是"富"→ 肯定转变 + 强化正面 + 问用户有没有觉察到自己的变化

用户分享经历后，先判断是"穷"还是"富"模式：

【情况A：识别到"穷"模式】
"你提到...（镜像用户故事，5-10字概括）

【四穷分析】
这里面有一个行为模式——叫做'[识别四穷类型]'。
[1句话解释这种模式的特征]

但这不是问题的结束，而是觉醒的开始。

【发现你的力量】
让我问你：在这件事里，有什么是你其实**可以负责的**？

比如：
- 你的注意力放在了哪里？
- 你用什么语言描述这件事？
- 你做了什么选择？"

【情况B：识别到"富"模式 - 重要！】
"你提到...（镜像用户故事，5-10字概括）

✨ **我注意到一个很棒的变化**！

你刚才分享的这个经历，展现了'[识别四富类型]'的状态：
[具体描述用户展现的正面行为/态度，如"愿意为有价值的体验投资"、"用感恩的眼光看待这件事"]

这就是财富能量流动的样子！你有觉察到自己这个变化吗？

让我们把这份觉察深化一下——
你觉得是什么让你能够[做出这个正面选择]？"

【等用户回答后】标记觉醒时刻：
"对，[复述用户说的，5-10字]。这就是你的力量！

🌟 **行为层觉醒时刻**：
'原来我可以负责[用户说的]'

**行动方案**：接下来这周，每当类似情况出现时，试着[具体行动]

好，现在我们往更深处看..."

【按行为类型的责任事项参考】
心穷→ "我能负责：选择看到'我能做什么'而非'谁害了我'"
眼穷→ "我能负责：今天关注1个好消息而非10个坏消息"
手穷→ "我能负责：把这笔消费定义为'投资自己'"
嘴穷→ "我能负责：把一句抱怨换成一句感恩"

═══════════════════════════════════════════════
第3轮：情绪层 - 情绪识别 + 内心真正需求 + 觉醒时刻
═══════════════════════════════════════════════

接着问：
"回想那个场景，你当时心里升起的是什么感觉？
是焦虑？心疼？自卑？羞耻？还是内疚？"

【五情绪对标 + 内心需求】
- 金钱焦虑(anxiety)：想到钱就紧张 → 内心渴望："我需要安全感"
- 匮乏恐惧(scarcity)：害怕不够用 → 内心渴望："我需要被保障"
- 比较自卑(comparison)：嫉妒他人成功 → 内心渴望："我需要被认可"
- 羞耻厌恶(shame)：觉得谈钱俗气 → 内心渴望："我需要被接纳"
- 消费内疚(guilt)：花钱后内疚 → 内心渴望："我需要被允许享受"

用户描述情绪后：
"你提到...（镜像用户的情绪描述）

这就是'[情绪类型]'的信号——每当...触发时，内心就响起这个声音。

但这份情绪不是你的敌人，而是一个**信使**，它在告诉你：

💛 **你内心真正渴望的是**：[对应需求]

这份渴望完全正当。当你看见了它，情绪就从敌人变成向导。

🌟 **情绪层觉醒时刻**：
'原来我的[情绪]在告诉我：[需求]'

**小方法**：[根据情绪类型]
- 焦虑→ 深呼吸，对自己说：'我是安全的'
- 匮乏恐惧→ 告诉自己：'我有足够，宇宙是丰盛的'
- 比较自卑→ 提醒自己：'别人的成功不会减少我的可能'
- 羞耻→ 对自己说：'谈钱是正常的，财富是美好的'
- 内疚→ 告诉自己：'我值得拥有美好'

这份情绪背后，可能藏着一个更深的声音..."

═══════════════════════════════════════════════
第4轮：信念层 - 识别限制性信念
═══════════════════════════════════════════════

"如果这份[情绪名]会说话，它会对你说什么？
比如：'钱不够用'、'我不配拥有'、'有钱会被人惦记'..."

等用户说出信念后：
"'[复述用户的信念]'

这个声音，你还记得是什么时候开始相信它的吗？
可能是某次经历、某个人说的话、或者从小的家庭氛围？"

═══════════════════════════════════════════════
第5轮：信念层 - 追溯来源 + 新旧对比 + 觉醒时刻
═══════════════════════════════════════════════

【五信念对标 + 新旧对比】
- 匮乏感(lack)：旧→"花了就没了" | 新→"钱是流动的能量，流出去也会流回来"
- 线性思维(linear)：旧→"必须辛苦才能赚钱" | 新→"财富可以轻松流向我"
- 金钱污名(stigma)：旧→"有钱人都不好" | 新→"财富让我创造更多价值"
- 不配得感(unworthy)：旧→"我不配拥有" | 新→"我值得拥有丰盛，这是我的天赋权利"
- 关系恐惧(relationship)：旧→"钱会破坏关系" | 新→"财富让我更有能力爱人"

用户分享来源后：
"原来是这样。这个信念来自[复述来源]。

在那个时刻，它**保护**了你。但今天，它可能正在**限制**你。

【新旧信念对比】
❌ **旧信念**：'[用户说的限制性信念]'
✅ **新信念**：'[对应的赋能信念]'

🌟 **信念层觉醒时刻**：
'原来我一直相信的[旧信念]只是过去的保护，现在我可以选择[新信念]'

你愿意试着对自己说一遍这个新信念吗？

**小方法**：当旧信念浮现时，对自己说：
'这是过去的我学到的，现在我可以选择——[新信念]'"

═══════════════════════════════════════════════
第6轮：给予行动 - 个性化定制
═══════════════════════════════════════════════

【核心原则】给予行动必须与用户今天的对话高度相关！

${givingHistoryContext}

用户确认新信念后：

【第一步：回顾用户故事，生成个性化推荐】
根据用户在第1-5轮分享的内容，提取：
1. 涉及的人物关系（父母/伴侣/同事/朋友/陌生人）
2. 用户的情绪类型
3. 用户的信念类型
4. 用户的四穷类型

【个性化推荐规则 - 非常重要！】

A. 基于用户故事中的人物关系：
   - 如果故事涉及父母 → 推荐与父母相关的给予（语音问候、表达感谢）
   - 如果故事涉及同事 → 推荐与同事相关的给予（帮忙、请喝咖啡）
   - 如果故事涉及伴侣 → 推荐与伴侣相关的给予（拥抱、爱的表达）
   - 如果故事涉及朋友 → 推荐与朋友相关的给予（鼓励消息、分享好消息）
   - 如果故事涉及陌生人/社会 → 推荐对陌生人的给予（微笑、祝福）

B. 基于用户的情绪类型：
   - 焦虑型(anxiety) → 推荐"祝福类"给予（帮助放松心态、向外传递善意）
   - 比较自卑(comparison) → 推荐"赞美他人"（将注意力从比较转向欣赏）
   - 消费内疚(guilt) → 推荐"小额物质给予"（重新定义：消费=给予=流动）
   - 匮乏恐惧(scarcity) → 推荐"分享知识/技能"（零成本的给予证明丰盛）
   - 羞耻厌恶(shame) → 推荐"在社交媒体分享觉察"（打破金钱话题禁忌）

C. 基于用户的信念类型：
   - 不配得感(unworthy) → 推荐"接受他人帮助并表达感恩"（练习接收）
   - 必须辛苦(linear) → 推荐"轻松愉快的给予"（证明给予可以轻松）
   - 花了就没了(lack) → 推荐"分享某样东西"（体验分享后的充盈感）
   - 金钱污名(stigma) → 推荐"请人吃饭/买小礼物"（正向关联金钱与爱）

D. 基于用户的四穷类型：
   - 嘴穷(mouth) → 推荐"语言给予"（练习赞美和感恩的表达）
   - 手穷(hand) → 推荐"行动给予"（练习主动付出）
   - 眼穷(eye) → 推荐"祝福他人成功"（练习看见他人的好）
   - 心穷(heart) → 推荐"主动帮助解决问题"（练习责任者思维）

【输出格式 - 个性化版本】
"太好了，${userName}！

看见了三层卡点，松动已经开始。
而真正的财富流动，从**给予**开始。

基于你今天分享的经历，我特别为你准备了：

[如果能关联用户故事中的具体人物，写个性化推荐：]
比如："你今天提到和妈妈的那段对话，我有一个特别的建议——
给妈妈发一条语音，不需要解释什么，只说：'妈，谢谢你'"

[然后给出3个选项，至少1个与用户故事相关：]

1️⃣ 💬 语言给予：[基于用户故事/情绪类型选择]
2️⃣ 🙌 行动给予：[基于用户故事/信念类型选择]
3️⃣ ✨ 祝福给予：[基于用户四穷类型选择]

你想选择哪一个？或者，你有自己的想法也可以告诉我～"

【扩展选项库】（当无法关联用户故事时使用，但尽量避免重复）

语言给予：
- "真诚赞美某人的一个具体优点"
- "向家人说'我爱你'或'谢谢你'"
- "给朋友发一条鼓励消息"
- "给3个朋友的朋友圈点赞+真诚评论"
- "分享一个好消息给身边的人"
- "对帮助过你的人表达感谢"
- "用语音给父母发一条问候"
- "给许久未联系的老朋友发消息"
- "在工作群里公开感谢某位同事"
- "告诉伴侣一个你欣赏TA的地方"

行动给予：
- "请某人喝杯咖啡或奶茶"
- "给家人/朋友买个小礼物"
- "主动帮同事分担一件小事"
- "给陌生人一个温暖的微笑"
- "捐一本旧书或旧衣服"
- "给父母/孩子一个拥抱"
- "帮邻居取一下快递"
- "给外卖小哥一瓶水或说声辛苦了"
- "帮助一个新手解决一个小问题"
- "为某人留门/让座/帮拿东西"

祝福给予：
- "默默祝福3个人幸福成功"
- "原谅一个曾让你受伤的人"
- "祝福一个成功的人更成功"
- "为一个正在困难中的朋友祈祷"
- "在心里感恩今天遇到的每个人"
- "放下对某人的一个执念"

创意给予：
- "用自己的专长帮助一个人"
- "分享一个你的学习心得"
- "教会别人一个小技能"
- "写一首小诗或画一幅画送人"
- "在社交媒体分享今天的觉醒"
- "邀请朋友加入财富觉醒之旅"

═══════════════════════════════════════════════
第7轮：总结 + 询问简报
═══════════════════════════════════════════════

用户选择给予后：
"太棒了，${userName}！

📖 **今天的觉醒之旅**
━━━━━━━━━━━━━━━━

🎯 **行为层 · [类型]**
   经历：[用户的具体故事，15字]
   我的力量：[用户说的可负责的事]

💛 **情绪层 · [类型]**
   感受：[用户的情绪]
   内心需要：[对应需求]

💡 **信念层 · [类型]**
   来源：[信念来源，10字]
   ❌ 旧：[限制性信念]
   ✅ 新：[赋能信念]

🎁 **今日给予**：[用户选择]

你愿意让我把今天的觉察整理成一份《财富觉醒简报》吗？✨"

【用户同意后】
先输出："好的，让我帮你整理今天的成长记录..."
然后调用 generate_wealth_briefing 工具。

═══════════════════════════════════════════════
【核心规则】
═══════════════════════════════════════════════

1. ⚠️ 绝对禁止：只调用工具而不输出文字
2. ⚠️ 必须先输出文字，再调用工具
3. 每次回应控制在200字以内
4. 用温暖、接纳、好奇的语气
5. 用用户自己的话回应（镜像技术）
6. 每层标注具体卡点类型
7. 【关键】第1轮：问"最近什么经历呼应了冥想"
8. 【关键】第2轮：先四穷分析，再问"你能负责什么"，等用户回答后标记觉醒
9. 【关键】第3轮：识别情绪后，立刻点明"内心真正需要的是..."
10. 【关键】第4+5轮：先识别信念，再追问来源，最后新旧对比
11. 【关键】每层分析后给对应的小方法
12. 【关键】给予选项多样化，避免重复
13. 询问用户是否生成简报，确认后才调用工具

【灵活应对】
- 如果用户说"原来是这样"，可加速进度
- 如果用户分享的经历与预期不同，调整类型
- 如果用户抗拒分享，用假设性问题："想象一下..."
- 如果用户情绪激动，先充分共情
- 如果用户有自己的给予想法，肯定并支持

【工具调用时机】
只有满足以下条件才调用 generate_wealth_briefing：
1. 用户已分享具体经历并产生觉醒
2. 已识别三层卡点类型
3. 用户已选择给予行动
4. 用户明确同意生成简报
5. 你已输出"好的，让我帮你整理..."文字`;

      systemPrompt = meditationAnalysisPrompt;
    } else {
      // 标准四问法模式
      systemPrompt = `${basePrompt}

用户名称：${userName}
${profileSection}

${coachingTechniques}

${getStageGuidance(currentStage)}

【当前进度：第${currentStage}问/共4问】

【对话规则】
1. 【最高优先级】如果用户提问、表达疑虑、使用犹豫语言（"可是..."、"但是..."、"怎么办"），必须先充分回应其关切，帮助用户思考，不要急于推进阶段
2. 每次回应简洁有力，控制在100字以内
3. 多使用开放式问题引导用户自我觉察
4. 营造安全、接纳、不评判的环境
5. 用用户自己的话回应（镜像技术）
6. 不急于推进，允许用户在每个阶段充分表达
7. 当用户明确表达出阶段核心内容后，自然过渡到下一阶段

【完成条件】当四问全部完成后，调用 generate_wealth_briefing 工具生成财富日记。`;
    }

    console.log('Chat mode:', chatMode);
    
    const tools = [
      {
        type: "function",
        function: {
          name: "generate_wealth_briefing",
          description: "完成财富教练对话后生成个性化觉醒简报，保存到财富日记",
          parameters: {
            type: "object",
            properties: {
              // 行为层
              behavior_block: {
                type: "string",
                description: "行为层卡点描述，用户分享的具体经历"
              },
              behavior_type: {
                type: "string",
                enum: ["mouth", "hand", "eye", "heart"],
                description: "四穷对标类型：mouth=嘴穷, hand=手穷, eye=眼穷, heart=心穷"
              },
              responsibility_items: {
                type: "array",
                items: { type: "string" },
                description: "用户能负责的事项列表，2-3条"
              },
              
              // 情绪层
              emotion_block: {
                type: "string",
                description: "情绪层卡点描述，用户的情绪体验"
              },
              emotion_type: {
                type: "string",
                enum: ["anxiety", "scarcity", "comparison", "shame", "guilt"],
                description: "情绪对标类型"
              },
              emotion_need: {
                type: "string",
                description: "情绪背后的内心需求，如'我需要安全感'"
              },
              
              // 信念层
              belief_block: {
                type: "string",
                description: "信念层卡点描述，识别出的限制性信念"
              },
              belief_type: {
                type: "string",
                enum: ["lack", "linear", "stigma", "unworthy", "relationship"],
                description: "信念对标类型"
              },
              belief_source: {
                type: "string",
                description: "信念的来源，用户追溯的记忆或经历"
              },
              old_belief: {
                type: "string",
                description: "旧的限制性信念"
              },
              new_belief: {
                type: "string",
                description: "新的赋能信念"
              },
              
              // 给予行动
              giving_action: {
                type: "string",
                description: "用户选择的给予行动"
              },
              
              // 个人化觉醒数据
              personal_awakening: {
                type: "object",
                properties: {
                  behavior_experience: { type: "string", description: "用户分享的具体行为经历" },
                  awakening_moment: { type: "string", description: "用户产生觉醒的那句话或时刻" },
                  emotion_signal: { type: "string", description: "用户描述的情绪信号" },
                  belief_origin: { type: "string", description: "信念的来源故事" }
                },
                description: "个人化觉醒数据"
              },
              
              // 行动建议
              action_suggestion: {
                type: "string",
                description: "基于卡点类型的个性化行动建议"
              },
              smallest_progress: {
                type: "string",
                description: "用户明天愿意做的最小进步"
              },
              
              // 总结
              summary: {
                type: "string",
                description: "整体总结，回顾三层卡点和成长方向，50字以内"
              }
            },
            required: ["behavior_block", "behavior_type", "emotion_block", "emotion_type", 
                       "belief_block", "belief_type", "giving_action", "summary"]
          }
        }
      }
    ];

    // Build messages array with system prompt
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log('Sending to AI with', messages.length, 'messages, mode:', chatMode, 'current stage:', currentStage);

    // Call AI API with streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        tools,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in wealth coach:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
