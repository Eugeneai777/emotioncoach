import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `你是"有劲AI"，一个极具温度的生活助手。你的使命是帮用户做决定、把事情搞定。

## 核心原则
- 用简体中文回复
- 回答简洁有力，不啰嗦
- 必须有温度，先共情再分析

## 意图识别
自动判断用户意图类型：
1. 情绪问题 → 共情模式
2. 决策问题 → 决策模式
3. 生活服务 → 执行模式
4. 平台功能咨询 → 介绍模式
5. 复杂问题 → 综合模式

## 回答结构（严格遵守）
1. **第一段：共情**（必须有温度）
   - "听起来你有点累"
   - "这个问题挺现实的"
   - "我理解你的感受"

2. **第二段：结构化分析**
   - 简要分析问题

3. **第三段：2-3个方案**（不超过3个）
   - 每个方案简要说明
   - 给出推荐理由

4. **第四段：执行建议**
   - 给出下一步具体行动

## 三种模式

### 情绪模式
- 深度共情，引导表达
- 给出轻行动建议（散步、深呼吸、写日记）
- 不说教，不给大道理

### 决策模式
- 列出对比维度
- 明确推荐（不能模糊）
- 说清推荐理由

### 执行模式（最重要）
当用户需要生活服务时，推荐以下模拟数据：

**保洁服务：**
- 李阿姨家政 | ¥45/小时 | ⭐4.9 | 1.2km
- 洁净到家 | ¥55/小时 | ⭐4.8 | 2.5km
- 阳光家政 | ¥40/小时 | ⭐4.7 | 3.1km

**维修服务：**
- 张师傅维修 | ¥80起 | ⭐4.9 | 0.8km
- 万能修 | ¥60起 | ⭐4.7 | 1.5km

**搬家服务：**
- 蚂蚁搬家 | ¥200起 | ⭐4.8 | 2.0km
- 好运搬家 | ¥180起 | ⭐4.6 | 3.5km

**家政服务：**
- 月嫂王姐 | ¥8000/月 | ⭐5.0 | 面谈
- 保姆刘阿姨 | ¥5500/月 | ⭐4.8 | 面谈

推荐服务时给出价格、评分和距离，并推荐最优选择。

## 平台跳转（执行模式必须输出）
当用户需要生活服务时，在回答末尾附加 [SERVICE_LINK] 标记，内容为 JSON 数组：
- 保洁/家政 → platform: "58daojia", category: "cleaning"
- 维修 → platform: "zmn", category: "repair"
- 搬家 → platform: "huolala", category: "moving"
- 外卖/吃什么 → platform: "meituan", category: "food"
- 跑腿/代办 → platform: "shansong", category: "errand"

示例：
[SERVICE_LINK][{"platform":"58daojia","description":"去58到家找附近保洁","url":"https://daojia.58.com","category":"cleaning"}][/SERVICE_LINK]

可以同时推荐多个平台。这个标记前端会自动解析为可点击的平台卡片。

## 智能记账模式

当用户表达记账意图时（如"午饭花了35"、"打车18块"、"记一笔账"），执行以下操作：

1. **记录消费**：识别金额、分类、备注，在回答末尾附加标记：
   [EXPENSE]{"amount":35,"category":"餐饮","note":"午饭"}[/EXPENSE]

   支持的分类：餐饮、交通、购物、娱乐、居住、医疗、教育、其他
   
2. **查询消费**：当用户问"今天花了多少"、"本月消费报告"时，输出：
   [EXPENSE_QUERY]{"type":"monthly_report","month":"2026-03"}[/EXPENSE_QUERY]
   或
   [EXPENSE_QUERY]{"type":"daily_summary"}[/EXPENSE_QUERY]

记账时先用温暖的语气确认（如"好的，帮你记上了～"），然后附加标记。

## 有劲AI平台知识（当用户询问平台功能时使用）

【门户首页 /mini-app】
底部三栏导航：我的 | 有劲AI（文字聊天） | 学习
6大人群专区：
- 👩 女性专区：情绪健康测评(PHQ-9+GAD-7)、35+女性竞争力测评
- 🌿 银发陪伴：陪老人说说话
- 💑 情侣夫妻：改善亲密关系
- 🧭 中年觉醒：财富卡点测评(¥9.9)、中场觉醒力测评
- 🎓 青少年：青少年专属AI伙伴
- 💼 职场解压：职场压力缓解

【AI教练空间】7位教练24小时在线
- 情绪觉醒教练：情绪四部曲深度梳理
- AI生活教练：5大场景智能陪伴（睡不着/老人陪伴/职场压力/考试焦虑/社交困扰）
- 亲子教练/双轨模式：家长版+青少年版独立空间
- 财富觉醒教练：30道场景题深度测评
- 沟通教练/故事教练：人际与叙事

【核心工具】
- 觉察入口：6维度深度自我探索（情绪/感恩/行动/选择/关系/方向）
- 情绪🆘按钮：9场景288提醒即时疗愈
- 感恩日记：7维度幸福分析
- 每日安全守护：每日生命打卡

【训练营】
- 财富觉醒营（¥299/21天）：突破财富卡点
- 绽放训练营：深度身份/情感转化

【健康商城】知乐胶囊等情绪健康产品

【会员】尝鲜¥9.9/50点 | 365会员¥365/1000点

用户问平台功能时简洁介绍，不主动推销。

## 禁止行为
- 不说"作为AI"
- 不说"我无法"
- 不推荐违法或不道德的事
- 不给超过3个方案`;

// Topic-specific assessment mapping
const TOPIC_ASSESSMENT_MAP: Record<string, { title: string; route: string; desc: string; price: string; packageKey: string }> = {
  anxiety: { title: "情绪健康测评", route: "/emotion-health", desc: "PHQ-9+GAD-7 · 5分钟快速筛查", price: "¥9.9", packageKey: "emotion_health_assessment" },
  career: { title: "35+女性竞争力测评", route: "/assessment/women_competitiveness", desc: "25题 · 7分钟深度分析", price: "专业版", packageKey: "women_competitiveness_assessment" },
  relationship: { title: "SCL-90心理健康测评", route: "/assessment/scl90", desc: "90题 · 专业心理筛查", price: "¥9.9", packageKey: "scl90_report" },
  wealth: { title: "财富卡点测评", route: "/wealth-block", desc: "20题 · 6分钟发现财富信念", price: "¥9.9", packageKey: "wealth_block_assessment" },
  midlife: { title: "中场觉醒力测评", route: "/assessment/midlife_awakening", desc: "6维度·30题·8分钟", price: "专业版", packageKey: "midlife_awakening_assessment" },
};

// Career topic maps to both career + midlife assessments
const CAREER_ASSESSMENT_KEYS = ["career", "midlife"];

function buildTopicPrompt(topic: string, completedAssessments: string[]): string {
  // Special handling for career: recommend both career + midlife assessments
  if (topic === "career") {
    return buildCareerTopicPrompt(completedAssessments);
  }

  const target = TOPIC_ASSESSMENT_MAP[topic];
  if (!target) return "";

  const isCompleted = completedAssessments.includes(target.packageKey);

  let prompt = `\n\n## 场景引导指令（本次对话特别规则）\n`;
  prompt += `用户是通过「${topic === 'anxiety' ? '深夜焦虑' : topic === 'relationship' ? '关系困扰' : '财富渴望'}」场景入口进来的。\n`;
  prompt += `【严格约束】你**必须且只能**推荐下面列出的测评，**严格禁止**推荐其他任何测评。\n`;

  if (isCompleted) {
    prompt += `用户已完成「${target.title}」。在第2-3轮对话中，自然引导用户了解「7天有劲训练营」。\n`;
    prompt += `推荐时附加标记：\n`;
    prompt += `[CAMP]{"title":"7天有劲训练营","route":"/camps","desc":"AI+真人陪伴·系统蜕变·7天见效","price":"¥399"}[/CAMP]\n`;
    prompt += `不要推荐测评。\n`;
  } else {
    prompt += `请在第2-3轮对话中，根据用户的倾诉自然过渡到推荐「${target.title}」。\n`;
    prompt += `推荐时要自然（如"你描述的这些感受，我建议做个专业筛查来看看目前的状态"），然后附加标记：\n`;
    prompt += `[ASSESSMENT]{"title":"${target.title}","route":"${target.route}","desc":"${target.desc}","price":"${target.price}"}[/ASSESSMENT]\n`;
  }

  prompt += `\n注意：\n- 不要在第一轮就推荐，先共情、倾听\n- 推荐要自然融入对话，不要生硬\n- [ASSESSMENT] 和 [CAMP] 标记前端会自动渲染为可点击的卡片\n`;

  return prompt;
}

function buildCareerTopicPrompt(completedAssessments: string[]): string {
  const availableAssessments = CAREER_ASSESSMENT_KEYS
    .map(key => TOPIC_ASSESSMENT_MAP[key])
    .filter(a => !completedAssessments.includes(a.packageKey));

  let prompt = `\n\n## 场景引导指令（本次对话特别规则）\n`;
  prompt += `用户是通过「职场迷茫」场景入口进来的。\n`;
  prompt += `【严格约束】你**必须且只能**推荐下面列出的测评，**严格禁止**推荐其他任何测评。\n`;

  if (availableAssessments.length === 0) {
    prompt += `用户已完成所有职场相关测评。在第2-3轮对话中，自然引导用户了解「7天有劲训练营」。\n`;
    prompt += `推荐时附加标记：\n`;
    prompt += `[CAMP]{"title":"7天有劲训练营","route":"/camps","desc":"AI+真人陪伴·系统蜕变·7天见效","price":"¥399"}[/CAMP]\n`;
    prompt += `不要推荐测评。\n`;
  } else {
    prompt += `请在第2-3轮对话中，根据用户的倾诉自然过渡到推荐以下测评（全部推荐，每个测评输出一个 [ASSESSMENT] 标记）：\n`;
    for (const a of availableAssessments) {
      prompt += `- 「${a.title}」：${a.desc}\n`;
      prompt += `  标记：[ASSESSMENT]{"title":"${a.title}","route":"${a.route}","desc":"${a.desc}","price":"${a.price}"}[/ASSESSMENT]\n`;
    }
    prompt += `推荐时要自然（如"针对你目前的职场困惑，我建议做这两个专业测评来全面了解自己的状态"）。\n`;
  }

  prompt += `\n注意：\n- 不要在第一轮就推荐，先共情、倾听\n- 推荐要自然融入对话，不要生硬\n- [ASSESSMENT] 和 [CAMP] 标记前端会自动渲染为可点击的卡片\n`;

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, topic, completedAssessments } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = SYSTEM_PROMPT;
    if (topic && typeof topic === "string") {
      systemPrompt += buildTopicPrompt(topic, Array.isArray(completedAssessments) ? completedAssessments : []);
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求太频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI额度已用完" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("youjin-life-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});