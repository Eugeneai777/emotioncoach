import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "未授权访问" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { scenario, context, user_id: providedUserId } = await req.json();

    // 支持两种调用方式：
    // 1. 用户直接调用（通过JWT获取user_id）
    // 2. 后端批量调用（通过请求体传入user_id + service role key）
    let userId: string;
    
    // 检查是否是 service role key 调用（批量触发场景）
    const isServiceRole = authHeader.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'never-match');
    
    if (isServiceRole && providedUserId) {
      // 批量触发模式：使用提供的 user_id
      userId = providedUserId;
      console.log(`批量触发模式: 为用户 ${userId} 生成通知`);
    } else {
      // 用户直接调用模式：从 JWT 获取用户
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "身份验证失败" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    }

    // 使用 service role 创建客户端以确保有权限操作
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 🛡️ 恢复去重逻辑：检查最近5分钟内是否已有相同 scenario 的通知
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentSameScenario } = await supabase
      .from('smart_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('scenario', scenario)
      .gte('created_at', fiveMinutesAgo)
      .limit(1);

    if (recentSameScenario && recentSameScenario.length > 0) {
      console.log(`⏭️ 5分钟内已有 ${scenario} 通知，跳过生成`);
      return new Response(JSON.stringify({ 
        success: false,
        message: "去重：近期已有相同场景通知"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 获取用户偏好设置
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_encouragement_style, companion_type, display_name, notification_frequency, smart_notification_enabled, wecom_enabled, wechat_enabled')
      .eq('id', userId)
      .single();

    // 获取用户集成密钥（从独立的安全表中获取）
    const { data: integrationSecrets } = await supabase
      .from('user_integration_secrets')
      .select('wecom_webhook_url')
      .eq('user_id', userId)
      .maybeSingle();

    // 检查用户是否启用了智能通知
    if (!context?.preview && profile?.smart_notification_enabled === false) {
      return new Response(JSON.stringify({ 
        success: false,
        message: "用户已关闭智能通知"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    type EncouragementStyle = 'gentle' | 'cheerful' | 'motivational';
    type CompanionType = 'jing_teacher' | 'friend' | 'coach';
    type NotificationFrequency = 'minimal' | 'balanced' | 'frequent';
    type Scenario = 'after_briefing' | 'after_story' | 'after_gratitude_analysis' | 'after_gratitude_sync' | 'after_communication' | 'after_parent' | 'after_vibrant_life' | 'goal_milestone' | 'emotion_improvement' | 'consistent_checkin' | 'inactivity' | 'sustained_low_mood' | 'encouragement' | 'checkin_success' | 'checkin_streak_milestone' | 'checkin_reminder' | 'checkin_streak_break_warning' | 'camp_day_complete' | 'weekly_summary' | 'pending_action_reminder' | 'action_completion_celebration' | 'after_wealth_coaching' | 'wealth_weekly_summary' | 'profile_completion' | 'emotion_trend_warning' | 'upcoming_milestone' | 'weekly_rhythm_care' | 'pattern_breakthrough' | 'cycle_low_prevention' | 'morning_intention' | 'evening_reflection' | 'memory_connection' | 'incomplete_emotion_session' | 'incomplete_coach_session' | 'wechat_bind_reminder';
    // 维度名称映射
    const dimensionNames: Record<string, string> = {
      'CREATION': '创造',
      'RELATIONSHIPS': '关系', 
      'MONEY': '财富',
      'HEALTH': '健康',
      'INNER': '内在',
      'JOY': '体验',
      'IMPACT': '贡献'
    };
    const getDimensionName = (key: string): string => dimensionNames[key] || key;

    const encouragementStyle = (context?.style || profile?.preferred_encouragement_style || 'gentle') as EncouragementStyle;
    const companionType = (profile?.companion_type || 'jing_teacher') as CompanionType;
    const displayName = profile?.display_name || '朋友';
    const notificationFrequency = (context?.frequency || profile?.notification_frequency || 'balanced') as NotificationFrequency;
    const scenarioTyped = scenario as Scenario;
    const isPreview = context?.preview === true;

    // 获取最近的对话历史
    const { data: recentConversations } = await supabase
      .from('conversations')
      .select('id, messages(content, role, created_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // 获取最近的情绪记录
    const { data: recentBriefings } = await supabase
      .from('briefings')
      .select('emotion_theme, emotion_intensity, created_at')
      .eq('conversation_id', recentConversations?.[0]?.id || '')
      .order('created_at', { ascending: false })
      .limit(5);

    // 获取活跃目标
    const { data: activeGoals } = await supabase
      .from('emotion_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // 获取用户记忆用于个性化通知 - 增强版多维度记忆
    const { data: userMemories } = await supabase
      .from('user_coach_memory')
      .select('content, memory_type, layer, coach_type, created_at')
      .eq('user_id', userId)
      .order('importance_score', { ascending: false })
      .limit(5);

    // 获取最近对话主题用于更深层次的个性化
    const { data: recentSessions } = await supabase
      .from('vibrant_life_sage_briefings')
      .select('user_issue_summary, insight, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // 构建深度记忆上下文
    let memoryHint = '';
    if (userMemories && userMemories.length > 0) {
      const insights = userMemories.filter((m: any) => m.memory_type === 'insight');
      const patterns = userMemories.filter((m: any) => m.memory_type === 'pattern');
      const stickingPoints = userMemories.filter((m: any) => m.memory_type === 'sticking_point');
      
      memoryHint = `\n【用户深度记忆 - 请在通知中自然引用，让用户感受到被理解】`;
      if (insights.length > 0) {
        memoryHint += `\n💡 觉察洞察：\n${insights.map((m: any) => `- "${m.content}"`).join('\n')}`;
      }
      if (patterns.length > 0) {
        memoryHint += `\n🔄 识别的模式：\n${patterns.map((m: any) => `- ${m.content}`).join('\n')}`;
      }
      if (stickingPoints.length > 0) {
        memoryHint += `\n🎯 关注的卡点：\n${stickingPoints.map((m: any) => `- ${m.content}`).join('\n')}`;
      }
      memoryHint += `\n\n记忆引用技巧：使用"记得你说过..."、"上次你提到的..."、"我一直记得你..."让用户感受到被记住和理解。`;
    }
    
    // 添加最近对话上下文
    if (recentSessions && recentSessions.length > 0) {
      const recentIssues = recentSessions.map((s: any) => s.user_issue_summary).filter(Boolean);
      if (recentIssues.length > 0) {
        memoryHint += `\n\n【最近关注的话题】：${recentIssues.slice(0, 2).join('、')}`;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 根据场景定制AI提示词
    const scenarioPrompts: Record<Scenario, string> = {
      after_briefing: `用户刚完成了一次情绪对话。他们分享的情绪是"${context?.emotion_theme}"，强度${context?.emotion_intensity}/10。请给予温暖的肯定和鼓励。`,
      after_story: `用户刚刚创作并发布了一个成长故事"${context?.title}"${context?.emotionTag ? `，情绪标签是"${context.emotionTag}"` : ''}。请肯定他们把经历转化为故事的勇气，鼓励他们继续用英雄之旅的方法讲述自己的成长。`,
      after_gratitude_analysis: `用户完成了感恩日记的AI分析，发现了${context?.dimensions_count || 7}个幸福维度的分布。${context?.highlight_dimension ? `其中"${context.highlight_dimension}"是主要亮点。` : ''}请肯定他们坚持记录感恩的习惯，鼓励他们继续发现生活中的微光。`,
      after_gratitude_sync: `用户刚完成感恩日记的同步分析，成功分析了${context?.analyzed_count || 0}条记录。
${context?.top_dimension ? `主要幸福来源是"${getDimensionName(context.top_dimension)}"维度。` : ''}
${context?.weak_dimension ? `"${getDimensionName(context.weak_dimension)}"维度还有提升空间。` : ''}

请生成温暖鼓励 + 一个具体的"幸福提升小方法"：
1. 首先肯定用户坚持记录感恩的习惯（已分析${context?.analyzed_count || 0}条）
2. 温柔提醒他们可以查看标签分布了解幸福来源
3. **必须**给出一个具体的2分钟内可做的"幸福小行动"建议，根据弱势维度选择：
   - RELATIONSHIPS弱：今天给一个重要的人发一条感谢消息
   - INNER弱：闭眼做3次深呼吸，感受此刻的平静
   - HEALTH弱：现在站起来伸个懒腰，喝杯温水
   - JOY弱：回忆今天让你微笑的一个小瞬间
   - CREATION弱：花2分钟写下一个小想法或灵感
   - MONEY弱：记录今天的一笔小收入或节省
   - IMPACT弱：想一个明天能帮助别人的小事
   
这个小行动要具体、即时可做、有温度。`,
      after_communication: `用户刚完成了一次沟通技能对话，主题是"${context?.communication_theme}"${context?.communication_difficulty ? `，难度${context.communication_difficulty}/10` : ''}。请肯定他们愿意学习和练习沟通技巧的勇气，给予实用的鼓励。`,
      after_parent: `用户刚完成了一次亲子关系对话，主题是"${context?.parent_theme}"${context?.emotion_intensity ? `，情绪强度${context.emotion_intensity}/10` : ''}。请温暖地肯定他们作为家长愿意学习和成长的努力，给予支持性的鼓励。`,
      after_vibrant_life: `用户刚刚与有劲AI进行了一次对话${context?.user_issue_summary ? `，探讨了"${context.user_issue_summary}"` : ''}。请肯定他们主动寻求帮助的态度，温暖地鼓励他们继续探索和成长。`,
      goal_milestone: `用户在目标"${context?.goal_description || '情绪记录目标'}"上取得了${context?.progress_percentage}%的里程碑进展${context?.is_final ? '，目标已完成！' : ''}。当前进度：${context?.actual_count || 0}/${context?.target_count || 0}。${context?.is_final ? '请热烈庆祝这个成就！' : '请为他们庆祝这个阶段性成功，鼓励继续加油。'}`,
      emotion_improvement: `用户的情绪趋势正在改善！最近的平均强度从${context?.baseline_intensity}降低到${context?.current_intensity}。请给予积极的反馈。`,
      consistent_checkin: `用户已经连续${context?.streak_days}天坚持记录情绪。这是很了不起的坚持！请给予认可和鼓励。`,
      inactivity: context?.inactivity_level === 'severe'
        ? `用户已经${context?.days_inactive}天没有使用了。这是一次温暖的回访，请用关怀但不施压的语气，询问他们最近的状态，让他们知道我们一直记得他们、一直在这里陪伴。不要责怪，只是温柔地表达思念和关心。`
        : context?.inactivity_level === 'moderate'
        ? `用户已经${context?.days_inactive}天没有记录情绪了${context?.active_goals_count ? `，还有${context.active_goals_count}个活跃目标` : ''}。请用温柔关心的方式询问他们是否一切安好，轻轻提醒记录情绪对自我了解的帮助，但不要制造压力。`
        : `用户已经${context?.days_inactive}天没有来了${context?.active_goals_count ? `，有${context.active_goals_count}个目标等待他们` : ''}。请用温柔、轻松的语气打个招呼，就像老朋友问候"最近怎么样"，让他们感受到陪伴而非催促。`,
      sustained_low_mood: `用户最近${context?.consecutive_days}天的情绪持续低落（平均强度${context?.avg_intensity}/10）${context?.dominant_emotions?.length ? `，主要情绪包括"${context.dominant_emotions.join('、')}"` : ''}。请用温暖、关怀的语气给予支持，提醒他们可以寻求帮助，但不要让他们感到被评判。`,
      encouragement: `这是一条常规的鼓励通知，展示你的陪伴风格。用户当前${activeGoals?.length || 0}个活跃目标${activeGoals?.length ? '正在进行中' : ''}。`,
      checkin_success: `用户刚刚完成今日情绪打卡！${context?.streak_days ? `已连续打卡${context.streak_days}天。` : ''}请给予即时的肯定和鼓励，让他们感受到坚持的价值。`,
      checkin_streak_milestone: `恭喜！用户达到了连续打卡${context?.milestone_days}天的里程碑！这是非常了不起的成就。请热烈庆祝这个特殊时刻，并鼓励继续坚持。`,
      checkin_reminder: `今天是新的一天，用户还没有完成情绪打卡。${context?.streak_days ? `当前已连续${context.streak_days}天。` : ''}请用温柔且不带压力的方式提醒他们记录今天的情绪。`,
      checkin_streak_break_warning: `用户已连续打卡${context?.streak_days}天，但今天还未打卡，连续记录即将中断！请用关心但不施压的语气提醒，强调坚持的不易和价值。`,
      camp_day_complete: `用户完成了训练营第${context?.camp_day}天的学习内容${context?.camp_name ? `（${context.camp_name}）` : ''}。请肯定他们今天的付出，鼓励明天继续坚持。`,
      weekly_summary: `这是用户的周度成长总结。本周他们记录了${context?.briefings_count || 0}次情绪简报${context?.checkins_count ? `，完成了${context.checkins_count}次打卡` : ''}${context?.stories_count ? `，创作了${context.stories_count}个故事` : ''}。请给予综合性的肯定和对下周的温柔期待。`,
      pending_action_reminder: `用户在财富训练营第${context?.day_number}天有一个未完成的给予行动："${context?.giving_action}"，已经${context?.hours_pending}小时未完成。请用温和、鼓励但不施压的方式提醒用户完成这个小小的给予行动，强调行动的意义（打破"心穷"模式、建立"给予"习惯）而非催促。提醒他们这个小行动只需要几分钟，却能带来心态的转变。`,
      action_completion_celebration: `恭喜！用户刚刚完成了财富训练营第${context?.day_number}天的给予行动："${context?.giving_action}"${context?.witness_message ? `。AI见证语是"${context.witness_message}"` : ''}${context?.reflection ? `。用户的反思是："${context.reflection}"` : ''}。请热烈肯定用户完成这次"给予"的勇气和行动力，庆祝这个"心穷→心富"的转变时刻，强调每一次小小的给予都在重塑他们与财富的关系，鼓励继续保持这种"富足心态"的行动！`,
      after_wealth_coaching: `用户刚完成了一次财富教练对话，探索了关于财富的卡点和觉醒。
${context?.behavior_insight ? `行为层洞察："${context.behavior_insight}"` : ''}
${context?.emotion_insight ? `情绪层洞察："${context.emotion_insight}"` : ''}
${context?.belief_insight ? `信念层洞察："${context.belief_insight}"` : ''}
${context?.giving_action ? `给予行动建议："${context.giving_action}"` : ''}
请肯定用户愿意觉察和转化财富卡点的勇气，鼓励他们继续这个"从穷到富"的内在觉醒之旅。`,
      wealth_weekly_summary: `这是用户的财富训练营周报总结。

📊 本周数据：
- 训练天数：${context?.days_completed || 0}天（第${context?.start_day || 1}-${context?.end_day || 7}天）
- 觉醒指数变化：${(context?.awakening_change || 0) > 0 ? '↑' : (context?.awakening_change || 0) < 0 ? '↓' : '→'}${Math.abs(context?.awakening_change || 0)}分（${context?.last_week_index || 0} → ${context?.current_index || 0}）

🏃 行动完成：
- 完成给予行动：${context?.actions_completed || 0}个
${context?.completed_actions?.length ? `- 包括：${context.completed_actions.slice(0, 3).join('、')}` : ''}

✨ 觉醒亮点：
- 行为层平均：${context?.avg_behavior?.toFixed?.(1) || 0}分（${context?.behavior_trend || '稳定'}）
- 情绪层平均：${context?.avg_emotion?.toFixed?.(1) || 0}分（${context?.emotion_trend || '稳定'}）
- 信念层平均：${context?.avg_belief?.toFixed?.(1) || 0}分（${context?.belief_trend || '稳定'}）

💎 新信念：
${context?.new_beliefs?.length ? context.new_beliefs.slice(0, 2).map((b: string) => `- "${b}"`).join('\n') : '- 本周暂无新信念记录'}

请生成一条温暖的周报通知：
1. 总结本周的成长亮点（用具体数据说话）
2. 肯定用户在最强维度上的突破
3. 温柔提醒下周可以关注的改进方向
4. 给予继续训练的信心和期待`,
      profile_completion: `用户还没有完善个人资料${context?.missing_name ? '（缺少昵称）' : ''}${context?.missing_avatar ? '（缺少头像）' : ''}。

请温暖地邀请他们完善资料，强调以下好处：
1. 对话中AI会亲切地称呼他们的名字
2. 分享卡片会显示个性化头像和昵称
3. 让AI更好地认识他们，提供更贴心的陪伴
4. 开启智能消息后，在关键时刻收到温暖问候

语气要温柔、邀请式的，不是催促。可以用"为了让我更好地认识你..."或"期待看到你的样子..."开头。`,
      // ========== 前瞻性预测场景 ==========
      emotion_trend_warning: `用户最近${context?.consecutive_days}天的情绪呈现上升趋势（平均强度${context?.avg_intensity}/10）${context?.dominant_emotions?.length ? `，主要情绪包括"${context.dominant_emotions.join('、')}"` : ''}。这是一个预警信号。请用温暖关怀的语气给予支持，表达理解和陪伴，提醒他们可以来倾诉，但不要让他们感到被评判或有压力。`,
      upcoming_milestone: `用户在目标"${context?.goal_description}"上已达到${context?.progress_percentage}%的进度，距离完成只差${context?.remaining_count || '一点点'}了！请给予冲刺鼓励，表达对他们坚持的敬佩，激励他们完成最后一步。`,
      weekly_rhythm_care: context?.rhythm_type === 'monday_morning' 
        ? `周一早晨，新的一周开始了。请给用户一个温暖的问候和能量加持，帮助他们以积极的心态开启这一周。可以简单询问他们这周有什么期待。`
        : `周五晚上，辛苦了一周。请给用户一个放松的问候，肯定他们这一周的付出，祝愿他们度过愉快的周末。语气要轻松愉快。`,
      pattern_breakthrough: `恭喜！检测到用户有积极的突破：${context?.improvement_detail}（${context?.comparison}）。这是值得庆祝的正向变化！请热烈地肯定这个突破，表达真诚的欣喜，鼓励他们继续保持。`,
      cycle_low_prevention: `根据历史数据分析，用户${context?.historical_pattern}。${context?.predicted_low_day}可能是情绪较低的时期。请在用户进入低谷前给予预防性的温暖关怀，提供一些应对建议："${context?.preventive_suggestion}"，但语气要轻松，不要让用户感到焦虑。`,
      morning_intention: `早安问候时刻。${context?.yesterday_summary ? `用户昨天的情绪主题是"${context.yesterday_summary}"。` : ''}${context?.memory_hint ? `用户曾经说过："${context.memory_hint}"。` : ''}请给用户一个温暖的早安问候，设定今天的积极意向，可以包含一个小小的今日建议。`,
      evening_reflection: `晚间回顾时刻。用户今天有${context?.today_activities || 0}次活动记录。${context?.positive_moment ? `今天有平静的时刻。` : ''}请给用户一个温暖的晚间问候，肯定他们今天的付出，引导一个简单的反思："${context?.reflection_prompt}"`,
      memory_connection: `这是一个记忆连接场景。${context?.days_ago}天前，用户分享了一个重要的洞察："${context?.connected_memory}"。请温暖地引用这个记忆，表达"我一直记得你说过..."，让用户感受到被记住和理解，并询问他们现在对这个话题有什么新的想法。`,
      incomplete_emotion_session: `用户有一个未完成的情绪觉察对话，已进行到第${context?.current_stage || 0}阶段（共4阶段），当前情绪模式是"${context?.patternName || '情绪探索'}"。已经进行了${context?.message_count || 0}条消息的对话。请温暖地提醒他们回来继续这段对话，强调：1. 已有的进展不会丢失；2. 继续完成可以获得专属情绪简报；3. 语气轻松，不施压，像朋友轻轻提醒。`,
      incomplete_coach_session: `用户有一个未完成的AI教练对话（${context?.coachKey || '教练'}），已经进行了${context?.message_count || 0}条消息。请温暖地提醒他们回来继续这段对话，强调：1. 之前的对话进展都还在；2. 继续完成可以获得专属简报和洞察；3. 语气轻松，不施压，像朋友轻轻提醒。`,
      wechat_bind_reminder: `用户通过手机号注册了账号，但尚未绑定微信公众号。
绑定微信的好处包括：
1. 忘记密码时可通过微信验证码重置
2. 接收打卡提醒、情绪报告等智能消息
3. 获取专属活动通知和福利
4. 更安全的账号保障

请用温暖、邀请式的语气提醒他们绑定微信，
强调"密码找回"这个实用价值，让用户感受到这是为了保护他们的账号安全。`
    };

    const styleDescriptions: Record<EncouragementStyle, string> = {
      gentle: '语气温柔、平和，像知心朋友般的关怀。使用"慢慢来"、"我陪着你"、"一步一步"等温暖词汇',
      cheerful: '语气活泼、积极，充满正能量。使用"太棒了"、"真厉害"、"继续加油"等欢快词汇，可以适当使用emoji',
      motivational: '语气激励、有力，激发行动力。使用"你能做到"、"坚持下去"、"突破自我"等激励词汇'
    };

    const frequencyDescriptions: Record<NotificationFrequency, string> = {
      minimal: '这位用户偏好最少打扰，只希望在关键时刻收到通知。你的消息要格外精准、重要和有价值。',
      balanced: '这位用户偏好适度关怀，希望在重要时刻得到提醒和鼓励。保持适度的关注频率。',
      frequent: '这位用户希望密切陪伴，喜欢频繁的关注和鼓励。你可以更主动地表达关心和庆祝小进步。'
    };

    const companionDescriptions: Record<CompanionType, string> = {
      jing_teacher: '像一位温和的心理咨询师',
      friend: '像一个贴心的好朋友',
      coach: '像一位专业的成长教练'
    };

    const promptText = `你是一位${companionDescriptions[companionType]}，正在为用户${displayName}生成个性化的通知消息。

场景：${scenarioPrompts[scenarioTyped] || scenarioPrompts.encouragement}

用户风格偏好：${styleDescriptions[encouragementStyle]}

用户通知频率偏好：${frequencyDescriptions[notificationFrequency]}

用户最近情绪：${recentBriefings?.map(b => `${b.emotion_theme}(${b.emotion_intensity}/10)`).join('、') || '暂无数据'}

用户活跃目标数：${activeGoals?.length || 0}
${memoryHint}
${isPreview ? '**这是预览模式**，请生成一条展示你陪伴风格的示例通知。' : ''}

请生成一条温暖、个性化的通知消息，以JSON格式返回：
{
  "title": "通知标题（8-15字，吸引注意但不夸张，**不要包含用户名称**）",
  "message": "通知正文（以温暖的称呼开头，根据风格调整长度：gentle 50-80字，cheerful 40-60字，motivational 35-55字）",
  "icon": "emoji图标（如🌸、✨、💪、🎉、🌿等，根据风格选择合适的）",
  "action_text": "行动按钮文字（4-8字，可选）",
  "action_type": "行动类型（navigate/open_dialog/dismiss）"
}

风格要求：
- **${encouragementStyle}风格**：${styleDescriptions[encouragementStyle]}
- **标题中不要包含用户名称**，保持标题简洁通用
- 正文开头使用温暖的称呼，从以下方式中随机选择一种（用户名称为"${displayName}"）：
  * "亲爱的${displayName}"
  * "${displayName}，亲爱的"
  * "嗨，${displayName}"
  * "最亲爱的${displayName}"
  * "${displayName}宝贝"（仅限cheerful风格）
  * "亲爱的${displayName}朋友"
- 称呼后加逗号或句号，然后开始正文内容
- 结合用户的实际情况，给出具体的肯定或建议
- 避免空洞的赞美，要真诚和有温度
- 保持积极但不过度乐观
- 如果是提醒类型，要温柔而不带责备
- 根据**${notificationFrequency}**频率偏好调整语气和内容密度

请确保返回纯JSON格式，不要包含任何markdown标记。`;

    // AI 调用带超时和重试
    const callAI = async (attempt: number): Promise<any> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
      
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: promptText }],
            temperature: 0.8,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return resp;
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if ((fetchErr as Error).name === 'AbortError') {
          console.error(`[generate-smart-notification] AI调用超时 (attempt ${attempt})`);
          if (attempt < 2) {
            console.log(`[generate-smart-notification] 重试第${attempt + 1}次...`);
            return callAI(attempt + 1);
          }
        }
        throw fetchErr;
      }
    };

    const response = await callAI(1);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`[generate-smart-notification] AI生成失败: status=${response.status}, body=${errBody.slice(0, 200)}`);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "API请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API配额不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "通知生成服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const notificationText = aiResponse.choices[0].message.content;
    
    let notificationData;
    try {
      notificationData = JSON.parse(notificationText);
    } catch {
      const jsonMatch = notificationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        notificationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI返回的通知数据");
      }
    }

    // 确定通知类型和优先级（根据频率偏好调整优先级）
    const baseNotificationTypeMap: Record<Scenario, { type: string; priority: number }> = {
      after_briefing: { type: 'encouragement', priority: 2 },
      after_story: { type: 'celebration', priority: 3 },
      after_gratitude_analysis: { type: 'insight', priority: 2 },
      after_gratitude_sync: { type: 'encouragement', priority: 3 },
      after_communication: { type: 'encouragement', priority: 2 },
      after_parent: { type: 'encouragement', priority: 2 },
      after_vibrant_life: { type: 'encouragement', priority: 2 },
      goal_milestone: { type: 'celebration', priority: 4 },
      emotion_improvement: { type: 'insight', priority: 3 },
      consistent_checkin: { type: 'encouragement', priority: 3 },
      inactivity: { type: 'reminder', priority: 2 },
      sustained_low_mood: { type: 'care', priority: 5 },
      encouragement: { type: 'encouragement', priority: 1 },
      checkin_success: { type: 'celebration', priority: 3 },
      checkin_streak_milestone: { type: 'celebration', priority: 5 },
      checkin_reminder: { type: 'reminder', priority: 2 },
      checkin_streak_break_warning: { type: 'reminder', priority: 4 },
      camp_day_complete: { type: 'encouragement', priority: 3 },
      weekly_summary: { type: 'insight', priority: 3 },
      pending_action_reminder: { type: 'reminder', priority: 3 },
      action_completion_celebration: { type: 'celebration', priority: 4 },
      after_wealth_coaching: { type: 'encouragement', priority: 3 },
      wealth_weekly_summary: { type: 'insight', priority: 4 },
      profile_completion: { type: 'reminder', priority: 2 },
      // 前瞻性预测场景
      emotion_trend_warning: { type: 'care', priority: 4 },
      upcoming_milestone: { type: 'celebration', priority: 4 },
      weekly_rhythm_care: { type: 'encouragement', priority: 3 },
      pattern_breakthrough: { type: 'celebration', priority: 5 },
      cycle_low_prevention: { type: 'care', priority: 4 },
      morning_intention: { type: 'encouragement', priority: 3 },
      evening_reflection: { type: 'insight', priority: 3 },
      memory_connection: { type: 'insight', priority: 4 },
      incomplete_emotion_session: { type: 'reminder', priority: 3 },
      incomplete_coach_session: { type: 'reminder', priority: 3 },
      wechat_bind_reminder: { type: 'reminder', priority: 3 }
    };

    // 场景到教练类型的映射
    const scenarioCoachTypeMap: Record<Scenario, string> = {
      after_briefing: 'emotion_coach',
      after_story: 'story_coach',
      after_gratitude_analysis: 'gratitude_coach',
      after_gratitude_sync: 'gratitude_coach',
      after_communication: 'communication_coach',
      after_parent: 'parent_coach',
      after_vibrant_life: 'life_coach',
      goal_milestone: 'emotion_coach',
      emotion_improvement: 'emotion_coach',
      consistent_checkin: 'emotion_coach',
      inactivity: 'general',
      sustained_low_mood: 'emotion_coach',
      encouragement: 'general',
      checkin_success: 'emotion_coach',
      checkin_streak_milestone: 'emotion_coach',
      checkin_reminder: 'emotion_coach',
      checkin_streak_break_warning: 'emotion_coach',
      camp_day_complete: 'parent_coach',
      weekly_summary: 'general',
      pending_action_reminder: 'wealth_coach_4_questions_coach',
      action_completion_celebration: 'wealth_coach_4_questions_coach',
      after_wealth_coaching: 'wealth_coach_4_questions_coach',
      wealth_weekly_summary: 'wealth_coach_4_questions_coach',
      profile_completion: 'general',
      // 前瞻性预测场景
      emotion_trend_warning: 'emotion_coach',
      upcoming_milestone: 'general',
      weekly_rhythm_care: 'general',
      pattern_breakthrough: 'general',
      cycle_low_prevention: 'emotion_coach',
      morning_intention: 'general',
      evening_reflection: 'general',
      memory_connection: 'general',
      incomplete_emotion_session: 'emotion_coach',
      incomplete_coach_session: context?.coachKey ? `${context.coachKey}_coach` : 'general',
      wechat_bind_reminder: 'general'
    };

    let { type, priority } = baseNotificationTypeMap[scenarioTyped] || { type: 'encouragement', priority: 1 };
    const coachType = scenarioCoachTypeMap[scenarioTyped] || 'general';

    // 根据通知频率偏好调整优先级
    if (notificationFrequency === 'frequent') {
      priority = Math.min(priority + 1, 5); // 提高优先级，但不超过5
    } else if (notificationFrequency === 'minimal') {
      priority = Math.max(priority - 1, 1); // 降低优先级，但不低于1
    }

    // 如果是预览模式，不保存到数据库，直接返回
    if (isPreview) {
      return new Response(JSON.stringify({ 
        success: true,
        notification: {
          title: notificationData.title,
          message: notificationData.message,
          icon: notificationData.icon,
          action_text: notificationData.action_text,
          action_type: notificationData.action_type,
          notification_type: type,
          priority: priority
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 构建 action_data - 特殊场景需要导航路径
    let actionData = context || {};
    if (scenarioTyped === 'incomplete_emotion_session' && context?.sessionId) {
      actionData = {
        path: '/assessment-coach',
        sessionId: context.sessionId,
        pattern: context.pattern,
        patternName: context.patternName
      };
      notificationData.action_type = 'navigate';
      if (!notificationData.action_text) {
        notificationData.action_text = '继续对话';
      }
    } else if (scenarioTyped === 'wechat_bind_reminder') {
      actionData = { path: '/settings?tab=notifications' };
      notificationData.action_type = 'navigate';
      if (!notificationData.action_text) {
        notificationData.action_text = '去绑定';
      }
    } else if (scenarioTyped === 'incomplete_coach_session' && context?.sessionId) {
      // 根据 coachKey 映射到正确的路由
      const coachRouteMap: Record<string, string> = {
        'vibrant_life_sage': 'vibrant_life_sage',
        'communication': 'communication',
        'gratitude_coach': 'gratitude_coach',
        'parent': 'parent',
        'wealth_coach_4_questions': 'wealth_coach_4_questions',
      };
      const routeKey = coachRouteMap[context.coachKey] || context.coachKey;
      actionData = {
        path: `/coach/${routeKey}`,
        sessionId: context.sessionId,
      };
      notificationData.action_type = 'navigate';
      if (!notificationData.action_text) {
        notificationData.action_text = '继续对话';
      }
    }

    // 保存通知到数据库
    const { data: notification, error: insertError } = await supabase
      .from('smart_notifications')
      .insert({
        user_id: userId,
        notification_type: type,
        scenario: scenario,
        title: notificationData.title,
        message: notificationData.message,
        icon: notificationData.icon,
        action_text: notificationData.action_text,
        action_type: notificationData.action_type,
        action_data: actionData,
        context: context,
        priority: priority,
        coach_type: coachType
      })
      .select()
      .single();

    if (insertError) {
      console.error("保存通知失败:", insertError);
      throw insertError;
    }

    // 如果用户启用了企业微信推送，同时发送到企业微信
    if (profile?.wecom_enabled && integrationSecrets?.wecom_webhook_url) {
      try {
        await supabase.functions.invoke('send-wecom-notification', {
          body: {
            webhookUrl: integrationSecrets.wecom_webhook_url,
            notification: {
              title: notificationData.title,
              message: notificationData.message,
              icon: notificationData.icon,
            },
          },
        });
        console.log('通知已同步发送到企业微信');
      } catch (wecomError) {
        console.error('企业微信推送失败:', wecomError);
        // 企业微信推送失败不影响主流程，仅记录日志
      }
    }

    // 如果用户启用了微信公众号推送，同时发送模板消息
    if (profile?.wechat_enabled) {
      try {
        await supabase.functions.invoke('send-wechat-template-message', {
          body: {
            userId: userId,
            scenario: scenario,
            notification: {
              id: notification.id,
              title: notificationData.title,
              message: notificationData.message,
              scenario: scenario,
              inactivity_level: context?.inactivity_level,
              days_inactive: context?.days_inactive,
            },
          },
        });
        console.log('通知已同步发送到微信公众号');
      } catch (wechatError) {
        console.error('微信公众号推送失败:', wechatError);
        // 微信公众号推送失败不影响主流程，仅记录日志
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      notification
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("生成通知错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "生成通知过程出现错误，请稍后再试" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
