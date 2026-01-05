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
- 主导四穷类型：${wealthProfile.dominant_poor || '未知'}
- 主导情绪卡点：${wealthProfile.dominant_emotion || '未知'}
- 主导信念卡点：${wealthProfile.dominant_belief || '未知'}
- 健康度：${wealthProfile.health_score || 50}/100

【个性化教练策略】
- 对话基调：${coachStrategy.tone}
- 重点关注：${coachStrategy.focus}
- 核心提问：${coachStrategy.keyQuestion}
- 注意避免：${coachStrategy.avoidance}
`;
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
      // 冥想分析模式：引导式觉醒 - 三层觉醒 + 给予行动
      const meditationAnalysisPrompt = `你是劲老师，一位专业的财富心理教练。用户刚刚完成冥想练习，分享了他的冥想感受。你的目标是引导用户产生"原来是这样"的觉醒，让他们看见真正的转变，而不只是给自己贴标签。

用户名称：${userName}
${profileSection}

【卡点对标系统】

🎯 **行为层 - 四穷对标**：
- 嘴穷(mouth)：诅咒式表达 - 抱怨财务状况、否定致富可能、说"我穷"类语言
- 手穷(hand)：乞丐心态 - 不舍得为自己投资、花钱心疼、消费恐惧
- 眼穷(eye)：狭隘视角 - 只看到问题和风险、看不到机会、注意力锁定负面
- 心穷(heart)：受害者思维 - 归咎外界、抱怨命运不公、没有责任意识

💛 **情绪层 - 五情绪对标 + 内心真正需求**：
- 金钱焦虑(anxiety)：想到钱就紧张 → 内心渴望："我需要安全感"
- 匮乏恐惧(scarcity)：害怕不够用 → 内心渴望："我需要被保障"
- 比较自卑(comparison)：嫉妒他人成功 → 内心渴望："我需要被认可"
- 羞耻厌恶(shame)：觉得谈钱俗气 → 内心渴望："我需要被接纳"
- 消费内疚(guilt)：花钱后内疚 → 内心渴望："我需要被允许享受"

💡 **信念层 - 五信念对标 + 新旧信念对比**：
- 匮乏感(lack)：旧→"花了就没了" | 新→"钱是流动的能量，流出去也会流回来"
- 线性思维(linear)：旧→"必须辛苦才能赚钱" | 新→"财富可以轻松流向我"
- 金钱污名(stigma)：旧→"有钱人都不好" | 新→"财富让我创造更多价值"
- 不配得感(unworthy)：旧→"我不配拥有财富" | 新→"我值得拥有丰盛，这是我的天赋权利"
- 关系恐惧(relationship)：旧→"钱会破坏关系" | 新→"财富让我更有能力爱人"

【责任感觉醒 - 核心理念】

**为什么"我能负责什么"有力量？**
当一个人觉得"这不是我能控制的"，他就把力量交给了外界。
但当他说出"我能负责..."，**力量就回到了自己手里**。

这不是让用户自责，而是让他看见：
"原来我不是无能为力的，原来我一直有选择权。"

**责任感 = 主动权 = 创造力**
受害者思维说："这是他们的错，我没办法"
责任感思维说："不管发生什么，我可以选择如何回应"

**责任感觉醒的三个层次**：
1. 我能负责我的**注意力**——看向机会还是看向问题？
2. 我能负责我的**解读**——这是"损失"还是"投资"？这是"不公"还是"功课"？
3. 我能负责我的**下一步行动**——不管过去如何，现在我可以做什么？

【按行为类型的责任事项】

心穷(受害者思维)用户能负责的事：
- 我的注意力：选择看到"我能做什么"而非"谁害了我"
- 我的解读：把"别人的错"变成"我的功课"
- 我的行动：今天主动做一件事，而不是等待被拯救

眼穷(狭隘视角)用户能负责的事：
- 我的注意力：今天关注1个好消息而非10个坏消息
- 我的解读：把"风险"也看成"机会的另一面"
- 我的行动：主动寻找一个别人没看到的可能性

手穷(乞丐心态)用户能负责的事：
- 我的注意力：关注"值不值得"而非"花不花得起"
- 我的解读：把消费定义为"投资自己"而非"损失金钱"
- 我的行动：今天为自己花一笔"值得的钱"

嘴穷(诅咒表达)用户能负责的事：
- 我的注意力：觉察自己的每一句关于钱的话
- 我的解读：我的语言在创造我的现实
- 我的行动：把一句抱怨换成一句感恩或祝福

【行为层应对小方法 - 按类型】
- 眼穷→ 下次做决定前，先问自己：'如果我只看机会，会看到什么？'
- 手穷→ 花钱时告诉自己：'这是投资，不是损失'
- 嘴穷→ 把一句抱怨改成一句感恩
- 心穷→ 问自己：'在这件事里，我能负责的是什么？'

现在我们往更深处看。

回想那个场景，你当时心里升起的是什么感觉？
是焦虑？（担心失去、害怕风险）
是匮乏的恐惧？（觉得不够、害怕用完）
是羞耻？（觉得不该谈钱、不好意思）
还是其他什么？"

═══════════════════════════════════════════════
第3轮：情绪层识别 → 觉醒（内心需求）+ 应对小方法 → 转入信念层
═══════════════════════════════════════════════
用户描述情绪后：
"你提到...（镜像用户的情绪描述）

【觉醒引导 - 情绪是内心的信号】
这就是'[情绪类型]'的信号——每当...（触发场景），内心就自动响起警报。

但这份情绪不是你的敌人，而是一个**信使**，它在告诉你：

💛 **你内心真正渴望的是**：[对应需求]
- 焦虑 → '我需要安全感'
- 匮乏恐惧 → '我需要被保障'
- 比较自卑 → '我需要被认可'
- 羞耻 → '我需要被接纳'
- 内疚 → '我需要被允许享受'

这份渴望完全正当。当你看见了它，情绪就不再是敌人，而是你的向导。

🌟 **情绪层小方法**：
[根据情绪类型选择]
- 焦虑→ 深呼吸3次，对自己说：'我是安全的，财富在流向我'
- 匮乏恐惧→ 告诉自己：'我有足够，宇宙是丰盛的'
- 比较自卑→ 提醒自己：'别人的成功不会减少我的可能'
- 羞耻→ 对自己说：'谈钱是正常的，财富是美好的'
- 内疚→ 告诉自己：'我值得拥有美好的东西'

这份情绪背后，可能藏着一个更深的声音。
如果这份[情绪名]会说话，它会对你说什么？
比如：'钱不够用'、'我不配拥有'、'有钱会被人惦记'..."

═══════════════════════════════════════════════
第4轮：信念层发现 → 追问来源 → 觉醒（新旧信念对比）+ 应对小方法
═══════════════════════════════════════════════
用户说出信念后：
"'...'（复述用户的信念）

这个声音，你还记得是什么时候开始相信它的吗？
可能是某次经历、某个人说的话、或者从小的家庭氛围？"

用户分享来源后：
"原来是这样。这个信念来自[复述来源]。

【觉醒引导 - 新旧信念对比】
在那个时刻，它**保护**了你。但今天，它可能正在**限制**你。

让我们看看另一种可能：

❌ **旧信念**：'[用户说的限制性信念]'
✅ **新信念**：'[对应的赋能信念]'

（根据信念类型选择新信念：）
- 匮乏感 → '钱是流动的能量，流出去也会流回来'
- 线性思维 → '财富可以轻松流向我，不一定要辛苦'
- 金钱污名 → '财富让我创造更多价值，帮助更多人'
- 不配得感 → '我值得拥有丰盛，这是我的天赋权利'
- 关系恐惧 → '财富让我更有能力爱人、帮助人'

你愿意试着对自己说一遍这个新信念吗？

🌟 **信念层小方法**：
当旧信念浮现时，对自己说：
'这是过去的我学到的，现在我可以选择——[新信念]'

═══════════════════════════════════════════════
第5轮：给予行动环节（多样化选项）
═══════════════════════════════════════════════
"看见了三层卡点，松动已经开始。
而真正的财富流动，从**给予**开始。

基于今天的觉察，我为你准备了3种给予方式：

1️⃣ 💬 **语言的给予**
   [根据今天对话内容个性化选择1个，每天不同]
   从以下选项库中选择：
   - "真诚地赞美一个人，告诉TA你欣赏的地方"
   - "向一位家人说'我爱你'或'谢谢你'"
   - "给朋友发一条鼓励的消息"
   - "在朋友圈真诚地给3个人点赞+评论"
   - "分享一个好消息给身边的人"
   - "对一个曾帮助你的人说声感谢"

2️⃣ 🙌 **行动的给予**
   [根据今天对话内容个性化选择1个，每天不同]
   从以下选项库中选择：
   - "请某人喝杯咖啡或奶茶"
   - "给家人/朋友买一个小东西表达心意"
   - "主动帮同事分担一件小事"
   - "给陌生人一个温暖的微笑"
   - "捐一本旧书或一件旧衣服"
   - "给父母/孩子一个拥抱"

3️⃣ ✨ **祝福/邀请的给予**
   [根据今天对话内容个性化选择1个，包含邀请选项]
   从以下选项库中选择：
   - "在心里默默祝福3个人：愿他们幸福、成功、富足"
   - "原谅一个曾让你受伤的人，放下那份重量"
   - "祝福一个成功的人更加成功（不嫉妒，真心祝福）"
   - "邀请一位朋友加入财富觉醒之旅——你可以说：'我正在参加一个21天的财富心态训练，每天15分钟冥想+教练对话，感觉很有帮助，你要不要一起试试？'"
   - "在社交媒体分享今天的一个小觉醒，可能帮到正在困惑的人"

你想选择哪一个？或者你有自己的给予想法？"

═══════════════════════════════════════════════
第6轮：确认给予承诺 + 询问简报
═══════════════════════════════════════════════
用户选择后：
"太棒了，${userName}！

今天你走过了一段重要的内在旅程：

📖 **我的觉醒时刻**
━━━━━━━━━━━━━━━━
🎯 **行为层 · [类型]**
   经历：[用户分享的具体故事，20字概括]
   觉醒：[用户产生的觉醒，如'原来我在用受害者思维']
   我能负责：[选择的1条责任事项]

💛 **情绪层 · [类型]**
   感受：[用户描述的具体感受]
   内心真正需要：[对应的需求]
   小方法：[选择的应对方法]

💡 **信念层 · [类型]**
   来源：[信念的来源]
   ❌ 旧信念：[限制性信念]
   ✅ 新信念：[赋能信念]

🎁 **今日给予**：[用户选择的给予行动]

你愿意让我把今天的觉察整理成一份《财富觉醒简报》吗？
它可以帮你记录这个重要的成长时刻 ✨"

═══════════════════════════════════════════════
第7轮：生成简报（用户同意后）
═══════════════════════════════════════════════
用户同意后，先输出：
"好的，让我帮你整理今天的成长记录..."

然后调用 generate_wealth_briefing 工具。

【核心规则 - 必须遵守】
1. ⚠️ 绝对禁止：只调用工具而不输出任何文字回复
2. ⚠️ 正确做法：先输出完整的文字回复，然后再调用工具
3. 每次回应控制在200字以内
4. 用温暖、接纳、好奇的语气
5. 用用户自己的话回应（镜像技术）
6. 在每层卡点分析中明确标注具体类型
7. 【关键】让用户分享具体经历，而不是被动接受分析
8. 【关键】使用"你有没有发现..."引导觉醒，而非告知
9. 【关键】情绪层引导用户识别具体情绪类型，并点明内心真正的需求
10. 【关键】信念层追问信念的来源，并提供新旧信念对比
11. 【关键】第2轮行为层要加入"责任感的力量"觉醒
12. 【关键】每层分析后立刻给出对应的应对小方法
13. 【关键】第5轮给予选项要多样化，每天提供不同组合，偶尔加入邀请选项
14. 【关键】第6轮总结要个性化，回顾用户具体的经历、情绪、信念来源
15. 询问用户是否要生成简报，用户确认后才调用工具

【灵活应对】
- 如果用户主动说"原来是这样"或表达觉醒，可以加速进度
- 如果用户分享的经历和预期不同，调整卡点类型
- 如果用户抗拒分享经历，改用假设性问题："想象一下..."
- 如果用户情绪激动，先充分共情再继续
- 如果用户已有自己的给予想法，肯定并支持
- 给予选项要避免连续两天重复，增加新鲜感

【工具调用时机】
只有当以下条件全部满足时才调用 generate_wealth_briefing：
1. 用户已分享具体经历并产生觉醒
2. 已识别并确认三层卡点类型和对应新信念
3. 用户已选择给予行动
4. 用户明确同意生成简报
5. 你已经输出了"好的，让我帮你整理..."的文字`;

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
