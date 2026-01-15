import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WitnessRequest {
  user_name: string;
  streak: number;
  note?: string;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  awakening_type?: 'emotion' | 'gratitude' | 'action' | 'decision' | 'relation' | 'direction';
}

const awakeningLabels: Record<string, { name: string; guideHint: string }> = {
  emotion: { name: '情绪', guideHint: '现在内心有什么感受想要看见？' },
  gratitude: { name: '感恩', guideHint: '今天有什么小事让你觉得幸运？' },
  action: { name: '行动', guideHint: '今天最想完成什么小事？' },
  decision: { name: '选择', guideHint: '有什么事情在纠结要做个决定？' },
  relation: { name: '关系', guideHint: '今天想对谁说点什么？' },
  direction: { name: '方向', guideHint: '最近想要什么样的改变？' },
};

const timeOfDayLabels: Record<string, string> = {
  morning: '早晨',
  afternoon: '下午',
  evening: '傍晚',
  night: '深夜',
};

// Fallback witness messages when AI is unavailable
const fallbackWitnesses = [
  "又活过一天，这就是最好的消息 ✓",
  "今天也确认存活，继续看看明天会怎样",
  "活着本身就是一种力量，你做到了",
  "每一天的打卡，都是对生命的肯定",
  "感谢你让关心你的人安心",
];

const fallbackWithAwakening: Record<string, string[]> = {
  emotion: [
    "活着的证据之一，是还能感受到情绪的波动",
    "今天的你，有什么感受想要被看见？",
  ],
  gratitude: [
    "又活过一天，今天有什么小事值得感谢？",
    "活着的馈赠，从注意到生活的小确幸开始",
  ],
  action: [
    "确认存活，今天想做点什么让自己更有劲？",
    "又是新的一天，有什么小事想完成？",
  ],
  decision: [
    "活着意味着还有选择的权利",
    "今天有什么事情需要做个决定？",
  ],
  relation: [
    "活着的意义之一，是与人的连结",
    "今天想对谁说点什么心里话？",
  ],
  direction: [
    "每一天都是新的开始，想要什么改变？",
    "活着就有无限可能，你想去哪里？",
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_name, streak, note, time_of_day, awakening_type } = await req.json() as WitnessRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback to pre-defined messages
      let witness: string;
      if (awakening_type && fallbackWithAwakening[awakening_type]) {
        const options = fallbackWithAwakening[awakening_type];
        witness = options[Math.floor(Math.random() * options.length)];
      } else {
        witness = fallbackWitnesses[Math.floor(Math.random() * fallbackWitnesses.length)];
      }
      
      return new Response(JSON.stringify({ witness, fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const awakeningInfo = awakening_type ? awakeningLabels[awakening_type] : null;
    const timeLabel = timeOfDayLabels[time_of_day] || '今天';
    
    const systemPrompt = `你是一位温暖的生命见证者。用户刚刚完成了"死了吗"安全打卡，表示他今天活得很好。

请为用户生成一句简短的"存活见证语"（20-50字），要求：
1. 肯定他"今天活着"这个事实的意义
2. 如果有心情备注，巧妙呼应
3. 如果连续打卡多天，适当赞美坚持
4. 语气温暖但不腻，像老朋友的关心
5. 避免空洞的加油打气，要有实在感
${awakeningInfo ? `6. 结尾自然引导用户思考【${awakeningInfo.name}】维度：${awakeningInfo.guideHint}` : ''}

输出要求：只输出见证语本身，不要任何其他内容。`;

    const userPrompt = `用户信息：
- 名字：${user_name || '朋友'}
- 连续打卡：${streak}天
- 今日心情：${note || '未填写'}
- 当前时段：${timeLabel}
${awakeningInfo ? `- 选择的觉察维度：${awakeningInfo.name}` : ''}`;

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
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "服务繁忙，请稍后重试" }), {
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
      
      // Fallback on other errors
      let witness: string;
      if (awakening_type && fallbackWithAwakening[awakening_type]) {
        const options = fallbackWithAwakening[awakening_type];
        witness = options[Math.floor(Math.random() * options.length)];
      } else {
        witness = fallbackWitnesses[Math.floor(Math.random() * fallbackWitnesses.length)];
      }
      
      return new Response(JSON.stringify({ witness, fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const witness = data.choices?.[0]?.message?.content?.trim() || fallbackWitnesses[0];

    return new Response(JSON.stringify({ witness, fallback: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-alive-witness error:", error);
    
    const witness = fallbackWitnesses[Math.floor(Math.random() * fallbackWitnesses.length)];
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ witness, fallback: true, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
