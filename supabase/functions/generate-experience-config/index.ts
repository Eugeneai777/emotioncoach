import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth: verify user is admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: '需要管理员权限' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { package_name, description, price } = await req.json();

    if (!package_name) {
      return new Response(JSON.stringify({ error: '缺少 package_name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'AI 服务未配置' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `你是一个体验包配置助手。根据以下产品信息，生成体验包的展示配置。

产品名称：${package_name}
产品描述：${description || '无'}
产品价格：¥${price ?? '未知'}

请参考以下已有配置风格：
- 尝鲜会员：icon=🎫, value=50点, description=体验有劲AI教练的入门权益，含50点AI对话额度，开启你的情绪成长之旅, features=["AI教练深度对话","情绪记录与分析","专业成长建议","限时体验特权"]
- 情绪健康测评：icon=💚, value=1次, description=56道专业题目全面评估你的情绪健康状态，生成个性化分析报告与改善建议, features=["56道专业评估题目","多维度情绪分析","个性化改善建议","完整PDF报告"]
- SCL-90心理测评：icon=🧠, value=1次, description=国际通用90题心理健康筛查量表，全方位评估心理状态，生成专业解读报告, features=["国际标准量表","90题全面筛查","9大症状维度","专业解读报告"]
- 财富卡点评估：icon=💎, value=1次, description=深度探索影响你财富流动的潜意识信念，发现并转化限制性模式, features=["财富信念诊断","潜意识模式分析","个性化转化建议","专属行动计划"]

请返回严格的 JSON 格式（不要包含任何其他文字、不要用 markdown 代码块包裹）：
{"icon":"一个最贴切的emoji","value":"如1次、50点等","description":"30-50字的一句话描述","features":["亮点1","亮点2","亮点3","亮点4"],"color_theme":"blue或green或amber或purple之一"}`;

    console.log('Calling Lovable AI for package:', package_name);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'AI 请求频率过高，请稍后重试' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI 额度不足，请充值' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI 生成失败' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty AI response');
      return new Response(JSON.stringify({ error: 'AI 返回为空' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('AI raw response:', content);

    // Parse JSON from response - handle potential markdown wrapping
    let cleanContent = content.trim();
    // Remove markdown code block if present
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let config;
    try {
      config = JSON.parse(cleanContent);
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', cleanContent);
      return new Response(JSON.stringify({ error: 'AI 返回格式错误，请重试' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and normalize
    const validThemes = ['blue', 'green', 'amber', 'purple'];
    const result = {
      icon: typeof config.icon === 'string' ? config.icon : '🎁',
      value: typeof config.value === 'string' ? config.value : '1次',
      description: typeof config.description === 'string' ? config.description : '',
      features: Array.isArray(config.features) ? config.features.slice(0, 4) : [],
      color_theme: validThemes.includes(config.color_theme) ? config.color_theme : 'blue',
    };

    console.log('Generated config:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-experience-config error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : '未知错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
