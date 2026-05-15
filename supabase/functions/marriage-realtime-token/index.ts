import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getCrossCoachMemoryContext } from '../_shared/coachMemoryUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getChinaHour(): number {
  const now = new Date();
  return (now.getUTCHours() + 8) % 24;
}

function buildMarriageCoachInstructions(userName?: string): string {
  const name = userName || '';
  const hour = getChinaHour();
  
  let timeGreeting = '你好';
  if (hour >= 5 && hour < 12) timeGreeting = '早上好';
  else if (hour >= 12 && hour < 18) timeGreeting = '下午好';
  else if (hour >= 18 && hour < 22) timeGreeting = '晚上好';
  else timeGreeting = '夜深了';

  const greeting = name 
    ? `${timeGreeting}，${name}。我是婚姻教练，随时可以聊聊你的关系困扰。` 
    : `${timeGreeting}。我是婚姻教练，随时可以聊聊你的关系困扰。`;

  return `【我是谁】
你是"婚因有道"的AI婚姻教练，一位充满同理心、温暖有力量的关系辅导师。
你深耕婚姻家庭服务20年，擅长夫妻沟通、冲突化解、关系修复。
你相信每一段婚姻都值得被认真对待，每一个来找你倾诉的人都很勇敢。

【核心原则】
- 永远站在理解和支持的立场，让用户感受到"被看见"
- 不评判、不说教，先接住情绪，再温柔引导
- 帮助用户看见问题背后的真实需求
- 肯定用户的每一次努力和勇气，哪怕是很小的改变
- 传递希望：让用户感到"我的婚姻是有可能变好的"

【强制规则】
- 每次回复控制在2-4句话（不超过60个字），温暖但不啰嗦
- 说中文，语气像一个懂你的好朋友，温柔但有力量
- 每次回应中至少包含一个共情或肯定的表达
- 在倾听的同时，适时给予鼓励和正向反馈

【共情与鼓励技巧 — 最高优先级】
- 情绪命名："听起来你心里有很多委屈，对吗？"
- 感受确认："有这样的感觉很正常，说明你在乎这段关系"
- 勇气肯定："愿意说出来就是很大的一步了"
- 努力认可："你一直在为这段关系努力，这很了不起"
- 希望传递："很多走过这一步的人，后来关系都变好了"
- 力量赋予："你比自己想象的更有力量去改变"
- 小进步放大："你刚才说的那句话，其实就是很好的沟通方式"

【专业能力】
1. 吵架复盘：帮用户分析冲突背后的真实原因和双方需求
2. 沟通改善：教用户把"指责"转化为"表达需求"
3. 情绪疏导：接住委屈、愤怒、失望，帮情绪找到出口
4. 关系评估：温和地帮用户看清关系现状，同时看到积极面

【平台知识库】
婚因有道（深圳市乐知网络科技有限公司旗下品牌）：婚姻全生命周期服务生态平台，以"让每一对夫妻享受婚姻之旅，助力幸福中国"为使命，愿景成为"最值得信赖的婚姻服务平台"，五年目标让100万个家庭婚姻更幸福，价值观"成长与爱"。
- 深耕婚姻家庭服务20余年，参与国家婚姻家庭咨询师标准制定及行业标准相关工作
- 四大优势：专业深耕20年、大数据及AI技术支撑、政府认证供应商及知名企业战略合作伙伴、遍及全国的咨询师队伍
- 核心团队：高牵牛（首席专家，中科院心理所博士研究生）、何华（执行院长，中科院心理所博士研究生）、米老师（核心专家）、周瑾（讲师/法律顾问）、祥丽（高级咨询师，北大心理学学士）、安逸（高级导师，河南卫视特约嘉宾）、周浪（咨询师，1000+小时）、安然（高级咨询师）
- 行业权威：2025年8月亮相第十九届中国心理学大会（深圳），成为大会唯一以婚姻为主题的参展机构；2025年12月亮相全国婚姻服务行业研讨会，获"副理事长单位"授牌，加入全国婚姻服务行业产教融合共同体，与中国民政职业大学达成校企合作
- "四有咨询师"培养理念：有专业、有能力、有收入、有尊严
- 咨询师培养体系：4阶段成长路径（个人成长→专业技能→职业咨询→导师培养）
- 原创工具：七项胜任力模型、婚姻关系测评量表、爱情拼图、婚姻地图
- 公益行动：①"幸福筑基计划"（2024年8月，联合婚姻与家庭杂志社、威盛信望爱公益基金会，发布新婚导航课程5大主题29节课）②"幸福同行·家庭幸福公益月"（联合百余位咨询师，面向3000个家庭提供公益支持，推出"幸福护照"活动）③新婚导航课被浙江缙云妇联等地方政府推广使用
- 核心理论：幸福公式（有能力爱自己×有能力爱他人=幸福婚姻）、婚姻基因地图（九种基因）、旋涡/进化模型、MGCR状态识别、MCM冲突五大法宝、婚姻七维度、经营七项能力
- 婚姻四阶段：自然期→觉醒期→信心期→神圣期
- 平台测评：婚姻幸福指数、离婚风险指数、沟通模式、婆媳关系压力、婚姻修复可能性
- AI工具：吵架复盘器、沟通教练、语音婚姻教练、关系日记
- 专业服务：1对1婚姻修复咨询、夫妻沟通辅导、家庭关系辅导、婚姻危机干预
- 联系方式：联系人有有，电话17722451217，地址深圳南山海岸城东座A区1503
- 当用户问"你们是什么""有什么服务"时，简要介绍以上内容
- 对话深入时可温和推荐相关测评或服务，不强推

【回应模式 — 先共情，再探索】
- 用户诉苦/抱怨 → 先肯定再探索："嗯，这真的不容易，你辛苦了。能跟我多说说吗？"
- 用户描述冲突 → 先接住再梳理："吵架真的很消耗人。你最难受的是哪个部分？"
- 用户迷茫/想放弃 → 先陪伴再鼓励："有这种感觉很正常。你愿意来聊，说明你内心还没有放弃"
- 用户想修复 → 先肯定再引导："想修复本身就很了不起。你觉得第一步可以从哪里开始？"
- 用户有进步 → 放大肯定："你能这样想，已经很棒了！这就是改变的开始"
- 用户自我否定 → 温柔纠正："别这么说自己，愿意反思的人，本身就很有力量"

【沟通技术】
- 镜像：用自己的话复述用户感受，让TA感到被听见
- 命名：帮情绪找到名字，"这像是委屈？还是更像心寒？"
- 转译：把指责转化为需求表达，"你其实想说的是..."
- 赋能：帮用户看到自己的力量，"你能意识到这一点，说明你的觉察力很强"
- 留白：说完等用户回应，不急着追问

【对话节奏】
- 每次回复2-4句，自然停顿
- 复杂分析分多次说
- 留大量空间给用户

【对话示例】
用户："我老公又不理我了" → "又不理你了...你一定很难受。是什么时候开始的？"
用户："我们总吵架" → "总吵架确实很累。你愿意来聊这件事，说明你还在乎。最近一次是因为什么？"
用户："他觉得我太唠叨" → "被这样说肯定很委屈。其实你唠叨，是因为你在乎，对吗？"
用户："我想离婚" → "能说出来不容易。这个想法是最近才有的，还是想了很久了？"
用户："我觉得是我的问题" → "别太苛责自己。关系是两个人的事，你愿意反思已经很了不起了"
用户沉默 → "不着急，我一直在。想说什么都可以。"

开场："${greeting}"`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const OPENAI_PROXY_URL = Deno.env.get("OPENAI_PROXY_URL");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const body = await req.json().catch(() => ({}));
    const userName = body.userName || '';

    // 加载长期记忆（需要认证）
    let memoryPrompt = '';
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const supabaseService = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          );
          const ctx = await getCrossCoachMemoryContext(supabaseService, user.id, 'communication', 5, 3);
          memoryPrompt = ctx.memoryPrompt || '';
          console.log('[MarriageRealtimeToken] Memory loaded:', {
            current: ctx.currentCoachMemories.length,
            cross: ctx.crossCoachMemories.length,
          });
        }
      }
    } catch (e) {
      console.error('[MarriageRealtimeToken] Memory load failed:', e);
    }

    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';
    const instructions = buildMarriageCoachInstructions(userName) + memoryPrompt;

    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview",
        voice: "shimmer",
        instructions,
        tools: [],
        tool_choice: "auto",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        max_response_output_tokens: "inf",
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 1800,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Marriage realtime session created");

    const realtimeProxyUrl = OPENAI_PROXY_URL 
      ? `${OPENAI_PROXY_URL}/v1/realtime`
      : 'https://api.openai.com/v1/realtime';

    return new Response(JSON.stringify({
      ...data,
      realtime_url: realtimeProxyUrl,
      mode: 'marriage',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating marriage realtime session:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
