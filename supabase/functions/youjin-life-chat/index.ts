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
4. 复杂问题 → 综合模式

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

## 禁止行为
- 不说"作为AI"
- 不说"我无法"
- 不推荐违法或不道德的事
- 不给超过3个方案`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
            { role: "system", content: SYSTEM_PROMPT },
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
