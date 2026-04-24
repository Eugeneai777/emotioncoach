import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 60s in-memory 知识库缓存（同一进程内复用，减少每条消息 5 张表全量 SELECT）
const KB_CACHE_TTL_MS = 60_000;
let kbCache: { ts: number; data: any } | null = null;

async function loadKnowledgeBase(supabase: any) {
  if (kbCache && Date.now() - kbCache.ts < KB_CACHE_TTL_MS) return kbCache.data;
  const [packagesRes, coachesRes, campsRes, videosRes, knowledgeRes] = await Promise.all([
    supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
    supabase.from('coach_templates').select('*').eq('is_active', true).order('display_order'),
    supabase.from('camp_templates').select('*').eq('is_active', true).order('display_order'),
    supabase.from('video_courses').select('id, title, description, category, keywords').limit(50),
    supabase.from('support_knowledge_base').select('*').eq('is_active', true).order('display_order'),
  ]);
  const data = { packagesRes, coachesRes, campsRes, videosRes, knowledgeRes };
  kbCache = { ts: Date.now(), data };
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取用户信息（可选）
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id ?? null;
    }

    // 滑窗：保留首条 user 消息（锚定意图）+ 最近 10 条
    const truncatedMessages = (() => {
      if (!Array.isArray(messages) || messages.length <= 11) return messages;
      const firstUserIdx = messages.findIndex((m: any) => m.role === 'user');
      const tail = messages.slice(-10);
      if (firstUserIdx >= 0 && firstUserIdx < messages.length - 10) {
        return [messages[firstUserIdx], ...tail];
      }
      return tail;
    })();

    // 检测当前用户未读工单回复（用于 AI 主动播报）
    let unreadTickets: Array<{ ticket_no: string; subject: string; ticket_id: string; unread: number }> = [];
    if (userId) {
      const { data: unreadRows } = await supabase
        .from('customer_tickets')
        .select('id, ticket_no, subject, unread_user_count')
        .eq('user_id', userId)
        .gt('unread_user_count', 0)
        .order('last_message_at', { ascending: false })
        .limit(3);
      unreadTickets = (unreadRows ?? []).map((t: any) => ({
        ticket_no: t.ticket_no,
        subject: t.subject,
        ticket_id: t.id,
        unread: t.unread_user_count,
      }));
    }

    // 读取（带缓存）
    const { packagesRes, coachesRes, campsRes, knowledgeRes } = await loadKnowledgeBase(supabase);

    // 构建知识库内容
    const packagesInfo = packagesRes.data?.map(p => 
      `【${p.package_name}】价格:${p.price}元, AI对话额度:${p.ai_quota}次, 有效期:${p.duration_days}天, 描述:${p.description || '无'}`
    ).join('\n') || '暂无套餐信息';

    const coachesInfo = coachesRes.data?.map(c => 
      `【${c.emoji} ${c.title}】coach_key:${c.coach_key}, ${c.subtitle || ''} - ${c.description || ''}`
    ).join('\n') || '暂无教练信息';

    const campsInfo = campsRes.data?.map(c => 
      `【${c.icon} ${c.camp_name}】camp_type:${c.camp_type}, ${c.camp_subtitle || ''}, ${c.duration_days}天, 价格:${c.price}元`
    ).join('\n') || '暂无训练营信息';

    const faqContent = knowledgeRes.data?.filter(k => k.category === 'faq')
      .map(k => `Q: ${k.title}\nA: ${k.content}`).join('\n\n') || '';
    
    const guideContent = knowledgeRes.data?.filter(k => k.category === 'guide')
      .map(k => `【${k.title}】\n${k.content}`).join('\n\n') || '';
    
    const policyContent = knowledgeRes.data?.filter(k => k.category === 'policy')
      .map(k => `【${k.title}】\n${k.content}`).join('\n\n') || '';

    // 未读工单注入提示（仅当首轮且用户没问具体问题才主动播报，避免打断用户）
    const isFirstUserTurn = Array.isArray(messages) && messages.filter((m: any) => m.role === 'user').length <= 1;
    const unreadBroadcastBlock = (unreadTickets.length > 0 && isFirstUserTurn)
      ? `\n\n## 🔔 未读工单回复（必须主动播报）
当前用户有 ${unreadTickets.length} 个工单收到了客服回复但还未查看：
${unreadTickets.map(t => `- 工单 ${t.ticket_no}「${t.subject}」未读 ${t.unread} 条`).join('\n')}

【铁律】你的第一句话必须主动告知用户："你之前的工单 ${unreadTickets[0].ticket_no} 客服已回复，点下方卡片查看"，并立刻调用 submit_ticket_recall 工具展示该工单卡片（不要重新建工单，只是展示已有的）。然后再处理用户当前问题。如果用户当前消息确实需要新建工单，先播报已有工单，再处理。`
      : '';

const systemPrompt = `你是"有劲"智能客服。定位是【问题分发与转化中枢】，不是陪聊入口。

## 首轮回复铁律【最高优先级，必须遵守】
1. 用户最后一条消息如果是【具体问题】，你的第一句话必须直接回答这个问题。
2. 严禁开场寒暄。严禁出现"您好"、"很高兴为您服务"、"我是有劲AI客服"、"有什么可以帮您"这类话。
3. 严禁重复自我介绍。
4. 严禁只回复打招呼而不回答问题。
5. 如果信息确实不足，只能补一个最小必要追问，不能先泛泛欢迎。
6. 用户发的是寒暄（如"你好"、"在吗"），才可以简短回应一句并立刻引导进入正题。

## 回复结构【三段式】
每一条回复尽量按以下结构组织（如某段不需要可省略）：
1. 直接答案：用一两句直接说清楚结论或入口。
2. 可执行下一步：调用相应工具弹出卡片（教练/套餐/训练营/积分规则/页面跳转）。
3. 必要补充：规则说明、注意事项、人工/工单兜底。

## 语言策略【分层】
- 默认：用户语言，口语化，简洁自然，像人在说话。可以使用"嗯"、"好的"、"明白"。
- 涉及【支付/退款/有效期/规则说明/工单处理/隐私安全】：切到清晰、官方但仍易懂的表达，避免歧义。
- 全程严禁机器人客服套话，严禁"亲~"、"小的为您服务"等做作话术。

## 回复格式要求
- 纯文本，禁止 Markdown（无 **加粗**、# 标题、- 列表符号等）
- 强调用「」或【】
- 列表用 • 或 1. 2. 3.
- 段落之间空行分隔
- 单条回复尽量控制在 120 字内，除非用户明确要求详细说明

## 工具使用规则【必须遵守】
能调工具就调工具。能用卡片就别用文字描述。意图识别优于关键词匹配。

1. 套餐/价格/会员/购买/充值/续费 → 必须调 recommend_packages
2. 教练/想聊天/情绪问题/倾诉/找教练入口 → 必须调 recommend_coaches
3. 训练营/21天/系统训练 → 必须调 recommend_camps
4. 积分/扣费/点数/计费规则 → 必须调 show_points_rules
5. 投诉/具体故障/页面打不开/支付异常 → 用 submit_ticket，工单创建后在文末追加 [QIWEI_QR]（前端会自动展示企微二维码）
6. 建议/反馈/想要某功能 → 用 submit_feedback
7. 查订单/订单记录/购买记录 → 必须调 navigate_to_page(page_type:'orders')
8. 修改信息/个人资料/设置/头像/昵称 → 必须调 navigate_to_page(page_type:'profile')
9. 情绪按钮/情绪急救/9种情绪 → navigate_to_page(page_type:'emotion_button')
10. 感恩日记/感恩记录/幸福报告 → navigate_to_page(page_type:'gratitude')
11. 用户问"XX教练入口在哪 / 怎么进 XX教练" → 必须调 recommend_coaches，把对应教练放进卡片，不要只回文字。
12. 新手指引介绍完功能后 → 必须调 navigate_to_page 展示入口卡片

调工具后只用一两句话呼应即可，比如"已经把入口卡片放在下方了，点开就能进。"

## 你的职责
1. 解答疑问
2. 推荐合适的产品/教练/训练营
3. 处理投诉，建工单，必要时引导企微人工
4. 收集建议反馈
5. 引导新用户上手

## 产品知识库（实时更新）

### 会员套餐
${packagesInfo}

### AI教练
${coachesInfo}

### 训练营
${campsInfo}

### 常见问题(FAQ)
${faqContent}

### 使用指南
${guideContent}

### 政策说明
${policyContent}

## 核心功能（新手指引时使用，介绍完后用 navigate_to_page 展示入口卡片）
• 💙情绪教练(emotion_coach)：情绪四部曲（觉察→理解→反应→转化）
• 🎯情绪按钮(emotion_button)：9种情绪场景，288条认知提醒
• 💬沟通教练(communication_coach)：四步沟通（看见→读懂→影响→行动）
• 💜亲子教练(parent_coach)：亲子情绪四部曲
• 💖感恩教练(gratitude_coach)：感恩四部曲（看见→感受→意义→力量）
• 📝感恩日记(gratitude)：日常感恩 + 幸福报告
• ❤️有劲生活教练(vibrant_life)：智能总入口
• 📖故事教练(story_coach)：英雄之旅创作
• 🏕️训练营(training_camps)：21天系统化训练
• 🌈社区(community)：分享与交流${unreadBroadcastBlock}`;

    // 把未读工单暴露给 recall 工具用
    const _unreadCtx = unreadTickets;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'submit_ticket',
          description: '当用户提出投诉、问题或需要人工处理的请求时调用此工具，创建客服工单',
          parameters: {
            type: 'object',
            properties: {
              ticket_type: {
                type: 'string',
                enum: ['complaint', 'issue', 'inquiry'],
                description: '工单类型：complaint-投诉, issue-问题, inquiry-咨询'
              },
              category: {
                type: 'string',
                enum: ['payment', 'feature', 'account', 'content', 'other'],
                description: '问题分类'
              },
              subject: {
                type: 'string',
                description: '问题主题，简短描述'
              },
              description: {
                type: 'string',
                description: '问题详细描述'
              },
              priority: {
                type: 'string',
                enum: ['low', 'normal', 'high', 'urgent'],
                description: '优先级'
              }
            },
            required: ['ticket_type', 'subject', 'description']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'submit_feedback',
          description: '当用户提出建议、改进意见或功能请求时调用此工具',
          parameters: {
            type: 'object',
            properties: {
              feedback_type: {
                type: 'string',
                enum: ['suggestion', 'feature_request', 'improvement'],
                description: '反馈类型'
              },
              category: {
                type: 'string',
                enum: ['product', 'service', 'content', 'other'],
                description: '反馈分类'
              },
              content: {
                type: 'string',
                description: '反馈内容'
              }
            },
            required: ['feedback_type', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'query_packages',
          description: '查询最新的会员套餐信息',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'query_knowledge',
          description: '搜索知识库获取相关信息',
          parameters: {
            type: 'object',
            properties: {
              keywords: {
                type: 'string',
                description: '搜索关键词'
              }
            },
            required: ['keywords']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'recommend_coaches',
          description: '当用户询问教练相关问题时，返回教练推荐卡片供用户点击',
          parameters: {
            type: 'object',
            properties: {
              coaches: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    coach_key: { type: 'string', description: '教练标识，如 emotion, parent, communication, gratitude, vibrant-life' },
                    reason: { type: 'string', description: '推荐理由，简短说明' }
                  },
                  required: ['coach_key', 'reason']
                },
                description: '要推荐的教练列表'
              }
            },
            required: ['coaches']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'recommend_packages',
          description: '当用户询问套餐、价格、会员时，返回套餐推荐卡片供用户购买',
          parameters: {
            type: 'object',
            properties: {
              package_names: {
                type: 'array',
                items: { type: 'string' },
                description: '推荐的套餐名称列表，如 ["尝鲜会员", "365会员"]'
              },
              highlight_reason: {
                type: 'string',
                description: '推荐说明'
              }
            },
            required: ['package_names']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'recommend_camps',
          description: '当用户询问训练营时，返回训练营推荐卡片供用户了解',
          parameters: {
            type: 'object',
            properties: {
              camps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    camp_type: { type: 'string', description: '训练营类型' },
                    reason: { type: 'string', description: '推荐理由' }
                  },
                  required: ['camp_type', 'reason']
                },
                description: '要推荐的训练营列表'
              }
            },
            required: ['camps']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'show_points_rules',
          description: '当用户询问积分规则、扣费标准、点数消耗时，展示积分规则卡片',
          parameters: {
            type: 'object',
            properties: {
              show_balance: {
                type: 'boolean',
                description: '是否显示用户余额，默认false'
              }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'navigate_to_page',
          description: '引导用户跳转到特定页面，如订单、设置、感恩日记、情绪按钮等。新手指引完成后必须调用此工具展示多个功能入口卡片。',
          parameters: {
            type: 'object',
            properties: {
              navigations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    page_type: { 
                      type: 'string', 
                      enum: ['orders', 'profile', 'emotion_button', 'gratitude', 'emotion_coach', 'parent_coach', 'communication_coach', 'gratitude_coach', 'story_coach', 'vibrant_life', 'training_camps', 'community', 'packages'],
                      description: '页面类型' 
                    },
                    title: { type: 'string', description: '卡片显示标题' },
                    reason: { type: 'string', description: '推荐理由，可选' }
                  },
                  required: ['page_type', 'title']
                },
                description: '要导航的页面列表'
              }
            },
            required: ['navigations']
          }
        }
      }
    ];

    // 调用AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message;

    // 用于收集推荐数据
    let recommendations: {
      coaches?: Array<{ coach_key: string; reason: string }>;
      packages?: { package_names: string[]; highlight_reason: string };
      camps?: Array<{ camp_type: string; reason: string }>;
      points_rules?: { show_balance: boolean };
      navigations?: Array<{ page_type: string; title: string; reason?: string }>;
      ticket?: { ticket_no: string; subject?: string; ticket_id?: string };
    } = {};

    // 处理工具调用
    if (assistantMessage.tool_calls) {
      const toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        let result = '';

        switch (toolCall.function.name) {
          case 'submit_ticket':
            const ticketNo = `TK${Date.now()}`;
            const { data: insertedTicket, error: ticketError } = await supabase.from('customer_tickets').insert({
              user_id: userId,
              ticket_no: ticketNo,
              ticket_type: args.ticket_type || 'issue',
              category: args.category || 'other',
              subject: args.subject,
              description: args.description,
              priority: args.priority || 'normal',
            }).select('id').maybeSingle();
            if (ticketError) {
              result = `工单创建失败：${ticketError.message}`;
            } else {
              recommendations.ticket = {
                ticket_no: ticketNo,
                subject: args.subject,
                ticket_id: insertedTicket?.id,
              };
              result = `工单已创建，编号：${ticketNo}。已为用户展示工单卡片，可点击「查看进度」查看回复。`;
            }
            break;

          case 'submit_feedback':
            const { error: feedbackError } = await supabase.from('user_feedback').insert({
              user_id: userId,
              feedback_type: args.feedback_type || 'suggestion',
              category: args.category || 'product',
              content: args.content,
            });
            result = feedbackError 
              ? `反馈提交失败：${feedbackError.message}` 
              : '感谢您的宝贵建议！我们会认真考虑并持续改进。';
            break;

          case 'query_packages':
            result = packagesInfo;
            break;

          case 'query_knowledge':
            const keywords = args.keywords.split(/\s+/);
            const matched = knowledgeRes.data?.filter(k => 
              keywords.some((kw: string) => 
                k.title.includes(kw) || 
                k.content.includes(kw) || 
                k.keywords?.some((keyword: string) => keyword.includes(kw))
              )
            );
            result = matched?.length 
              ? matched.map(k => `【${k.title}】\n${k.content}`).join('\n\n')
              : '未找到相关信息';
            break;

          case 'recommend_coaches':
            recommendations.coaches = args.coaches;
            result = `已为用户展示教练卡片：${args.coaches.map((c: any) => c.coach_key).join('、')}`;
            break;

          case 'recommend_packages':
            recommendations.packages = {
              package_names: args.package_names,
              highlight_reason: args.highlight_reason || ''
            };
            result = `已为用户展示套餐卡片：${args.package_names.join('、')}`;
            break;

          case 'recommend_camps':
            recommendations.camps = args.camps;
            result = `已为用户展示训练营卡片：${args.camps.map((c: any) => c.camp_type).join('、')}`;
            break;

          case 'show_points_rules':
            recommendations.points_rules = { show_balance: args.show_balance || false };
            result = '已为用户展示积分规则卡片';
            break;

          case 'navigate_to_page':
            recommendations.navigations = args.navigations;
            result = `已为用户展示页面导航卡片：${args.navigations.map((n: any) => n.page_type).join('、')}`;
            break;
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: result,
        });
      }

      // 再次调用AI获取最终回复
      const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            assistantMessage,
            ...toolResults,
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices[0].message.content;

      // 保存对话历史
      if (sessionId) {
        const { data: existingConv } = await supabase
          .from('support_conversations')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        const newMessages = [
          ...messages,
          { role: 'assistant', content: finalMessage }
        ];

        if (existingConv) {
          await supabase.from('support_conversations')
            .update({ messages: newMessages, user_id: userId })
            .eq('session_id', sessionId);
        } else {
          await supabase.from('support_conversations').insert({
            session_id: sessionId,
            user_id: userId,
            messages: newMessages,
          });
        }
      }

      return new Response(JSON.stringify({ 
        reply: finalMessage,
        recommendations: Object.keys(recommendations).length > 0 ? recommendations : undefined
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 无工具调用，直接返回回复
    const reply = assistantMessage.content;

    // 保存对话历史
    if (sessionId) {
      const { data: existingConv } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      const newMessages = [
        ...messages,
        { role: 'assistant', content: reply }
      ];

      if (existingConv) {
        await supabase.from('support_conversations')
          .update({ messages: newMessages, user_id: userId })
          .eq('session_id', sessionId);
      } else {
        await supabase.from('support_conversations').insert({
          session_id: sessionId,
          user_id: userId,
          messages: newMessages,
        });
      }
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Customer support error:', error);
    return new Response(JSON.stringify({ 
      error: '客服系统暂时出现问题，请稍后再试',
      reply: '抱歉，我遇到了一些技术问题。请稍后再试，或直接联系我们的人工客服。'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
