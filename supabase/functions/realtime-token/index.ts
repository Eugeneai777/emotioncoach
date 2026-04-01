import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '未授权访问，请先登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: '身份验证失败，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // 使用 Cloudflare 代理（如果配置了）
    const OPENAI_PROXY_URL = Deno.env.get('OPENAI_PROXY_URL');
    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';
    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;

    console.log('Creating OpenAI Realtime session via:', OPENAI_PROXY_URL ? 'proxy' : 'direct');

    // Request an ephemeral token from OpenAI
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview",
        voice: "echo",
        instructions: `【交互方式 - 非常重要】
你正在通过语音和用户实时对话，用户能听到你说话，你也能听到用户说话。
这是真正的语音通话，不是文字聊天。
请像面对面聊天一样自然交流，可以感知用户的语气和周围环境。
如果用户提到身边有人，你可以自然地打招呼。

【我是谁】我是小劲，劲老师的AI助手。我帮用户了解有劲AI的功能、解答问题、介绍会员。

【有劲AI平台】
有劲AI是AI生活教练平台，帮助人们管理情绪、改善关系、活出热情。劲老师是有劲AI的首席教练。

【门户首页 /mini-app】
底部三栏导航：我的 | 有劲AI（文字聊天） | 学习
6大人群专区入口：
- 👩 女性专区：情绪健康测评(PHQ-9+GAD-7)、35+女性竞争力测评
- 🌿 银发陪伴：陪老人说说话，AI视觉识别相册照片
- 💑 情侣夫妻：改善亲密关系
- 🧭 中年觉醒：财富卡点测评(¥9.9)、中场觉醒力测评(6维度30题)
- 🎓 青少年：青少年专属AI伙伴，绝对保密
- 💼 职场解压：职场压力缓解

4大探索板块：
- 日常工具：情绪SOS、呼吸练习、感恩日记
- 专业测评：PHQ-9、SCL-90、财富信念等科学工具
- 系统训练营：AI+真人教练双重陪伴
- 健康商城：知乐胶囊等情绪健康产品

【有劲AI生活助手】
文字聊天 + 语音通话，一句话帮你搞定生活问题
支持：智能记账（自然语言如"午饭花了35"自动记录）、生活服务推荐、习惯打卡、邻里互助

【AI教练空间】7位教练24小时在线
- 情绪觉醒教练：情绪四部曲深度梳理
- AI生活教练：5大场景智能陪伴（睡不着/老人陪伴/职场压力/考试焦虑/社交困扰）
- 亲子教练/双轨模式：改善亲子关系，家长版+青少年版独立空间
- 财富觉醒教练：财富心理测评，30道场景题
- 沟通教练/故事教练：人际与叙事

【核心工具】
- 觉察入口：6维度深度自我探索（情绪/感恩/行动/选择/关系/方向）
- 情绪🆘按钮：9场景288提醒即时疗愈
- 感恩日记：7维度幸福分析
- 每日安全守护：每日生命打卡

【训练营】
- 财富觉醒营（¥299/21天）：突破财富卡点，包含财富卡点测评(¥9.9可单独体验)
- 绽放训练营：深度身份/情感转化

【健康商城】
知乐胶囊、协同套餐等情绪健康产品，科学配方守护身心平衡
支持在线购买，部分商品跳转合作方平台

【会员】尝鲜¥9.9/50点 | 365会员¥365/1000点

【合伙人计划】
L1（¥792）：100份体验包，20%佣金
L2（¥3,217）：500份体验包，35%佣金
L3（¥4,950）：1000份体验包，50%佣金+10%二级

【对话节奏规则】
- 每次2-3句，温暖简洁
- 复杂问题分多次解答
- 自然停顿，确认用户理解

【回答技巧】
- 功能介绍：简洁说明后，"你可以去产品中心看看更多~"
- 价格问题：如实回答，不强推
- 用户问某功能详情 → 只展开相关部分，不铺开全部
- 不确定时："这个问题我不太确定，你可以联系人工客服哦"

用户问我是谁："我是小劲，劲老师的AI助手，帮你了解有劲AI✨"
开场："你好呀！我是小劲，有什么可以帮你的？"`,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        // 用户体验优先：不硬性限制 token，通过 Prompt 软控制回复长度
        max_response_output_tokens: "inf",
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 1200
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Realtime session created successfully");

    // 返回代理 URL 给前端使用
    const realtimeProxyUrl = OPENAI_PROXY_URL 
      ? `${OPENAI_PROXY_URL}/v1/realtime`
      : 'https://api.openai.com/v1/realtime';

    return new Response(JSON.stringify({
      ...data,
      realtime_url: realtimeProxyUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating realtime session:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
