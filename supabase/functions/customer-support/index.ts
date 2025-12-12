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
    const { messages, sessionId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 获取用户信息（可选）
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    // 实时查询动态数据
    const [packagesRes, coachesRes, campsRes, videosRes, knowledgeRes] = await Promise.all([
      supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
      supabase.from('coach_templates').select('*').eq('is_active', true).order('display_order'),
      supabase.from('camp_templates').select('*').eq('is_active', true).order('display_order'),
      supabase.from('video_courses').select('id, title, description, category, keywords').limit(50),
      supabase.from('support_knowledge_base').select('*').eq('is_active', true).order('display_order'),
    ]);

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

const systemPrompt = `你是"有劲"智能客服，一个温暖、专业、耐心的客服助手。

## 回复格式要求【重要】
- 使用纯文本回复，禁止使用任何Markdown格式（禁止使用 **加粗**、*斜体*、# 标题、- 列表符号等）
- 需要强调时用「」或【】包裹
- 列表使用 • 或数字 1. 2. 3.
- 段落之间用空行分隔

## 工具使用规则【必须遵守】
当用户的问题涉及以下场景时，你【必须】调用对应的工具展示卡片，让用户可以直接点击操作：

1. 套餐/价格/会员/购买/充值 → 【必须】调用 recommend_packages 工具
2. 教练/想聊天/情绪问题/倾诉 → 【必须】调用 recommend_coaches 工具  
3. 训练营/21天/系统训练 → 【必须】调用 recommend_camps 工具
4. 投诉/问题 → 使用 submit_ticket 工具
5. 建议/反馈 → 使用 submit_feedback 工具

调用工具后，用简短的文字说明即可，卡片会自动展示给用户。

## 你的职责
1. 解答疑问：回答用户关于产品功能、使用方法的问题
2. 推荐产品：根据用户需求推荐合适的套餐、教练或训练营
3. 处理投诉：耐心倾听用户的不满，记录投诉并表达歉意
4. 收集反馈：接收用户的建议和意见，帮助产品改进
5. 引导使用：指导新用户如何开始使用各项功能

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

## 核心功能介绍
• 情绪教练：通过情绪四部曲(觉察→理解→反应→转化)帮助用户深度梳理情绪
• 情绪按钮：9种情绪场景，288条认知提醒，即时情绪疗愈工具
• 沟通教练：帮助用户改善人际沟通
• 亲子教练：专注亲子关系的情绪管理
• 训练营：21天系统化情绪管理训练

## 对话原则
• 语气温暖友善，像朋友一样交谈
• 回答简洁明了，避免冗长
• 遇到无法解答的问题，诚实告知并记录
• 当用户有投诉时，先表达理解和歉意，再记录问题
• 当用户有建议时，表示感谢并认真记录`;

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
              package_ids: {
                type: 'array',
                items: { type: 'string' },
                description: '推荐的套餐ID列表'
              },
              highlight_reason: {
                type: 'string',
                description: '推荐说明'
              }
            },
            required: ['package_ids']
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
      packages?: { package_ids: string[]; highlight_reason: string };
      camps?: Array<{ camp_type: string; reason: string }>;
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
            const { error: ticketError } = await supabase.from('customer_tickets').insert({
              user_id: userId,
              ticket_no: ticketNo,
              ticket_type: args.ticket_type || 'issue',
              category: args.category || 'other',
              subject: args.subject,
              description: args.description,
              priority: args.priority || 'normal',
            });
            result = ticketError 
              ? `工单创建失败：${ticketError.message}` 
              : `工单已创建，编号：${ticketNo}。我们会尽快处理您的问题。`;
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
              package_ids: args.package_ids,
              highlight_reason: args.highlight_reason || ''
            };
            result = `已为用户展示套餐卡片：${args.package_ids.join('、')}`;
            break;

          case 'recommend_camps':
            recommendations.camps = args.camps;
            result = `已为用户展示训练营卡片：${args.camps.map((c: any) => c.camp_type).join('、')}`;
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
