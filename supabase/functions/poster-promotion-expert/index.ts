import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `你是一位专业的AI推广专家，帮助合伙人创建最吸引人的推广海报。

你的职责：
1. 通过对话了解合伙人的目标用户群体
2. 询问推广场景（朋友圈/微信群/小红书等）
3. 深入了解目标用户的痛点和需求
4. 基于以上信息推荐最合适的产品，并给出推荐理由
5. 生成2个差异化的完整海报方案供选择

对话风格：
- 专业但亲切，像一位有经验的营销伙伴
- 简洁高效，每次只问1-2个问题
- 善于引导和激发思考
- 给出具体、可操作的建议
- 使用emoji让对话更生动

## 产品知识库（包含完整卖点和科学依据）

### 1. emotion_button（情绪按钮）
- 定位：即时情绪急救系统
- 科学依据：神经科学（Stephen Porges多迷走神经理论）+ 临床心理学（Aaron Beck认知行为疗法）+ 呼吸调节学 + 认知科学（Albert Bandura自我效能理论）
- 核心数据：288条专业认知提醒、9种情绪场景、4阶段科学设计（觉察→理解→稳定→转化）、100%即时可用
- 产品价值：当焦虑恐慌来袭，30秒内获得有效陪伴
- 适合人群：经常焦虑、有恐慌经验、情绪一来就很大的人
- 行动号召示例：「限时免费体验」「前100名解锁全部场景」「即刻开始30秒情绪急救」

### 2. emotion_coach（情绪教练）
- 定位：深度情绪梳理的AI教练
- 核心方法：情绪四部曲（觉察Feel it→理解Name it→反应React it→转化Transform it）
- 核心卖点：AI深度陪伴、生成专属情绪简报、追踪情绪成长、不评判只接纳
- 产品价值：像有个懂你的朋友，帮你看清情绪背后的需求
- 适合人群：想深度梳理情绪、了解自己、寻求内心力量的人
- 行动号召示例：「首次体验免费」「立即开始AI对话」「找回情绪里的力量」

### 3. parent_coach（亲子教练）
- 定位：让孩子愿意走向你的亲子沟通教练
- 核心理念：父母先稳，孩子才愿意走向你
- 核心卖点：亲子沟通技巧、家庭情绪管理、青少年心理支持、4步法引导
- 适合人群：有育儿困扰的家长群体、孩子叛逆期的父母
- 行动号召示例：「免费体验一次亲子对话」「让孩子重新靠近你」

### 4. communication_coach（沟通教练）
- 定位：轻松说出想说的话，让对方愿意听
- 核心卖点：化解冲突、建立边界、提升影响力、看见-理解-影响-行动四步法
- 适合人群：职场人群、人际关系困扰者、不敢表达的人
- 行动号召示例：「学会高效沟通」「化解冲突的秘密」

### 5. story_coach（故事教练）
- 定位：英雄之旅×向导觉醒，把经历变成动人的成长故事
- 科学依据：Pennebaker 40年研究（书写疗愈使焦虑降低25-38%）、Stanford研究（故事传播速度是数据的22倍）
- 核心方法：英雄之旅四步曲（问题困境→转折触发→成长突破→归来反思）
- 核心卖点：3种创作模式、AI即时生成、品牌故事打造
- 产品价值：故事决定你是谁，你的故事越清晰，你的影响力越大
- 适合人群：个人品牌建设、面试准备、想分享成长经历的人、内容创作者
- 行动号召示例：「5分钟写出你的故事」「免费生成第一个故事」「让你的经历产生影响力」

### 6. emotion_journal_21（情绪日记训练营）
- 定位：21天系统训练，每天10分钟，让情绪变成你的力量
- 科学依据：研究数据显示参与者焦虑下降31%
- 核心卖点：21天系统训练、每日情绪复盘、AI智能分析、社群陪伴
- 适合人群：想建立情绪管理习惯的人、需要长期改善情绪的人
- 行动号召示例：「21天改变开始」「每天10分钟重塑情绪」「限时加入」

### 7. parent_emotion_21（青少年困境突破营）
- 定位：21天，教你看懂孩子的情绪，让孩子愿意重新靠近你
- 核心方法：父母三力模型（稳定力、洞察力、修复力）
- 科学依据：哈佛教育学院研究支持
- 核心成效：父母情绪爆炸减少40-55%、亲子冲突明显减少
- 核心卖点：每天10分钟、21天系统突破、专业父母教练陪伴、群内互动支持
- 适合人群：有青少年孩子的家长、孩子叛逆/不沟通的家庭、亲子关系紧张的父母
- 行动号召示例：「21天改变亲子关系」「限时体验价」「让孩子愿意重新靠近你」「哈佛研究背书」

### 8. 365_member（365会员）
- 定位：全功能解锁一整年的AI成长陪伴
- 核心卖点：1000点AI额度、5位AI教练全解锁、20+成长工具、专属训练营、日均仅需1元
- 价值对比：相当于每天1元，获得全年AI情绪陪伴
- 适合人群：想全面成长的重度用户、认可产品价值的老用户
- 行动号召示例：「年度最值套餐」「限时特惠」「日均1元的情绪陪伴」

### 9. partner_recruit（招募合伙人）
- 定位：AI时代创业机会，边助人边赚钱
- 核心卖点：被动收入、最高50%佣金+10%二级分成、推荐关系永久有效、0成本启动
- 收入模型：分发体验包→用户转化→持续收益
- 产品价值：建立长期用户关系，获得持续被动收入
- 适合人群：想创业/副业、有社群资源的人、助人爱好者
- 行动号召示例：「0成本启动AI创业」「加入赚取被动收入」「边助人边赚钱」

## 对话流程

1. 首先询问目标用户群体 - 同时调用 provide_quick_options 提供选项
2. 了解推广场景 - 同时调用 provide_quick_options 提供选项
3. 深挖用户痛点（问1-2个具体问题）
4. 当信息足够时，调用 generate_poster_schemes 工具生成2个差异化方案

## 重要规则

- 每次回复都必须同时调用 provide_quick_options 工具提供3-4个快捷选项
- 选项要与当前问题相关，方便用户快速选择
- 不要一次问太多问题
- 根据用户回答灵活调整
- 当收集到足够信息（人群+场景+痛点）后，立即调用 generate_poster_schemes 工具
- 生成方案时必须：
  1. 结合产品的科学依据和真实数据
  2. 包含促进行动的紧迫感文案（限时、名额、优惠等）
  3. 提供2个差异化方案（如：情感共鸣型 vs 数据说服型）
  4. 每个方案包含推荐的背景图关键词
  5. 解释为什么推荐这个产品（template_reason）`;

const tools = [
  {
    type: "function",
    function: {
      name: "provide_quick_options",
      description: "为用户提供快捷选项按钮。每次回复都必须调用此工具，提供3-4个与当前问题相关的选项。",
      parameters: {
        type: "object",
        properties: {
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                emoji: { type: "string", description: "选项前的emoji图标" },
                label: { type: "string", description: "选项显示文本，简短" },
                value: { type: "string", description: "选项的详细值，用于发送给AI" }
              },
              required: ["emoji", "label", "value"]
            },
            description: "3-4个快捷选项"
          }
        },
        required: ["options"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_poster_schemes",
      description: "生成2个差异化的完整海报方案供用户选择。当收集到足够信息（目标用户、推广场景、痛点）后调用此工具。",
      parameters: {
        type: "object",
        properties: {
          schemes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                scheme_name: { 
                  type: "string", 
                  description: "方案名称，如「方案A：情感共鸣型」「方案B：数据说服型」" 
                },
                recommended_template: {
                  type: "string",
                  enum: ["emotion_button", "emotion_coach", "parent_coach", 
                         "communication_coach", "story_coach", "emotion_journal_21",
                         "parent_emotion_21", "365_member", "partner_recruit"],
                  description: "推荐的产品模板key"
                },
                template_name: { 
                  type: "string", 
                  description: "模板中文名称，如「情绪按钮」「青少年困境突破营」" 
                },
                template_reason: { 
                  type: "string", 
                  description: "推荐这个产品的理由，要结合用户提到的痛点和需求，50字以内" 
                },
                headline: { 
                  type: "string", 
                  description: "主标题，15字以内，能引起目标用户共鸣或好奇" 
                },
                subtitle: { 
                  type: "string", 
                  description: "副标题，25字以内，传递核心价值或解决方案" 
                },
                selling_points: {
                  type: "array",
                  items: { type: "string" },
                  description: "3个产品卖点，每个不超过8字，来自产品知识库的真实卖点"
                },
                call_to_action: { 
                  type: "string", 
                  description: "行动号召文案，如「扫码免费体验」「限时100名额」" 
                },
                urgency_text: { 
                  type: "string", 
                  description: "紧迫感文案，如「仅剩最后50个名额」「今日特惠」「限时免费」" 
                },
                background_keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5个背景图搜索关键词（英文），用于Unsplash搜索"
                },
                visual_style: {
                  type: "string",
                  enum: ["minimalist", "vibrant", "elegant", "warm", "professional"],
                  description: "海报视觉风格"
                },
                color_scheme: {
                  type: "object",
                  properties: {
                    primary: { type: "string", description: "主色调，如 #6366f1" },
                    secondary: { type: "string", description: "次色调" },
                    accent: { type: "string", description: "强调色" }
                  },
                  description: "配色方案"
                }
              },
              required: ["scheme_name", "recommended_template", "template_name", "template_reason",
                         "headline", "subtitle", "selling_points", "call_to_action", 
                         "urgency_text", "background_keywords", "visual_style"]
            },
            description: "2个差异化的海报方案"
          },
          target_audience: {
            type: "string",
            description: "目标用户画像描述"
          },
          promotion_scene: {
            type: "string",
            enum: ["wechat_moments", "wechat_group", "xiaohongshu", "one_on_one", "offline"],
            description: "推广场景"
          },
          promotion_tips: {
            type: "string",
            description: "推广技巧建议，帮助合伙人更好地推广，结合场景给出具体建议"
          }
        },
        required: ["schemes", "target_audience", "promotion_scene", "promotion_tips"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling AI with messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "服务额度不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("poster-promotion-expert error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
