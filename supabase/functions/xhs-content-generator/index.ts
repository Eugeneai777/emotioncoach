import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) return null;

  const { data: roles } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .limit(1);

  if (!roles || roles.length === 0) return null;
  return { user, adminClient };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await verifyAdmin(req);
    if (!auth) {
      return jsonResponse({ error: '需要管理员权限' }, 401);
    }

    const { topic, target_audience, style, task_id } = await req.json();
    const { adminClient, user } = auth;

    if (!topic || typeof topic !== 'string') {
      return jsonResponse({ error: '请输入内容主题' }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return jsonResponse({ error: 'AI 服务未配置' }, 500);
    }

    // Update task status to generating if task_id provided
    if (task_id) {
      await adminClient
        .from('xhs_content_tasks')
        .update({ status: 'generating' })
        .eq('id', task_id);
    }

    const systemPrompt = `你是一位专业的小红书内容创作者，擅长创作高互动率的爆款笔记。请严格按照以下JSON格式输出：

要求：
1. 标题：15-20字，包含1-2个emoji，有吸引力的钩子
2. 正文：300-500字，分段清晰，使用emoji点缀，包含个人化视角
3. 标签：5-8个相关话题标签
4. 配图描述：3张配图的详细描述，适合AI生成

风格要求：真实、走心、有共鸣感，避免过度营销感`;

    const userPrompt = `请为以下主题创作一篇小红书爆款笔记：

主题：${topic}
${target_audience ? `目标人群：${target_audience}` : ''}
${style ? `风格偏好：${style}` : ''}

请严格按JSON格式返回。`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_xhs_content',
            description: '生成小红书笔记内容',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: '笔记标题，15-20字，含emoji' },
                content: { type: 'string', description: '笔记正文，300-500字' },
                tags: { type: 'array', items: { type: 'string' }, description: '话题标签，5-8个' },
                image_prompts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      description: { type: 'string', description: '配图描述' },
                      style: { type: 'string', description: '图片风格' },
                    },
                    required: ['description'],
                  },
                  description: '3张配图描述',
                },
              },
              required: ['title', 'content', 'tags', 'image_prompts'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'create_xhs_content' } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return jsonResponse({ error: 'AI 请求频率过高，请稍后重试' }, 429);
      }
      if (aiResponse.status === 402) {
        return jsonResponse({ error: 'AI 额度不足，请充值' }, 402);
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      return jsonResponse({ error: 'AI 生成失败' }, 500);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      return jsonResponse({ error: 'AI 返回格式异常' }, 500);
    }

    const generated = JSON.parse(toolCall.function.arguments);

    // Save or update task
    if (task_id) {
      await adminClient
        .from('xhs_content_tasks')
        .update({
          ai_title: generated.title,
          ai_content: generated.content,
          ai_tags: generated.tags,
          ai_image_prompts: generated.image_prompts,
          status: 'ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task_id);
    } else {
      const { data: newTask, error: insertError } = await adminClient
        .from('xhs_content_tasks')
        .insert({
          user_id: user.id,
          topic,
          target_audience: target_audience || null,
          ai_title: generated.title,
          ai_content: generated.content,
          ai_tags: generated.tags,
          ai_image_prompts: generated.image_prompts,
          status: 'ready',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return jsonResponse({ error: '保存失败' }, 500);
      }

      return jsonResponse({
        success: true,
        task_id: newTask.id,
        data: generated,
      });
    }

    return jsonResponse({
      success: true,
      task_id,
      data: generated,
    });
  } catch (error) {
    console.error('[xhs-content-generator] Error:', error);
    return jsonResponse({ error: error.message || '服务器内部错误' }, 500);
  }
});
