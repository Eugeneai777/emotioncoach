import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `你是一位顶级漫剧分镜脚本策划师，擅长将故事主题转化为适合AI生图工具（Midjourney/即梦/Stable Diffusion）使用的分镜脚本。

你必须使用 suggest_drama_script 工具返回结构化的漫剧分镜脚本。

要求：
- title: 漫剧标题，简短有力（6-12字）
- synopsis: 故事梗概，50-100字，交代核心冲突和转折
- characters: 2-4个角色，每个角色包含中文名、外貌性格描述、以及英文 imagePrompt（适合AI生图的角色一致性描述，包含外貌特征、服装、画风）
- scenes: 按 sceneCount 数量生成分镜，每个分镜包含：
  - sceneNumber: 场景序号
  - panel: 镜头类型（远景/中景/近景/特写/俯视/仰视）
  - imagePrompt: 详细英文画面描述（适合直接粘贴到MJ/即梦），包含构图、光影、色调、角色动作、场景细节，融合指定画风
  - characterAction: 角色表情与肢体动作（中文）
  - dialogue: 台词或旁白（中文）
  - bgm: 背景音效/音乐氛围提示（中文）
  - duration: 建议时长（如"3s"、"5s"）

imagePrompt 要求：
- 必须是英文
- 包含画风关键词（如 anime style, cyberpunk, Chinese ink painting 等）
- 包含镜头语言（如 close-up shot, wide angle, bird's eye view）
- 包含光影氛围（如 dramatic lighting, soft glow, neon lights）
- 描述要足够详细，能直接作为AI生图提示词使用`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { theme, genre, style, sceneCount } = await req.json();

    if (!theme) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数：theme（故事主题）" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const styleMap: Record<string, string> = {
      cyberpunk: "赛博朋克风格，霓虹灯光、未来都市",
      anime: "日系动漫风格，精致唯美",
      chinese: "中国风/国潮风格，水墨意境",
      realistic: "3D写实/真实感风格",
      comic: "美式漫画风格，强对比色彩",
    };

    const genreMap: Record<string, string> = {
      suspense: "悬疑推理",
      romance: "爱情情感",
      comedy: "搞笑幽默",
      healing: "治愈温暖",
      scifi: "科幻未来",
      horror: "恐怖惊悚",
    };

    const count = Math.min(12, Math.max(6, sceneCount || 8));

    const userPrompt = `请为以下主题创作一个${count}个分镜的漫剧脚本：

【故事主题】${theme}
【题材类型】${genreMap[genre] || genre || "不限"}
【画风要求】${styleMap[style] || style || "不限"}
【分镜数量】${count}个场景

请使用 suggest_drama_script 工具输出完整的分镜脚本。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_drama_script",
              description: "返回结构化的漫剧分镜脚本",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "漫剧标题" },
                  synopsis: { type: "string", description: "故事梗概50-100字" },
                  characters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        imagePrompt: { type: "string", description: "英文AI生图角色提示词" },
                      },
                      required: ["name", "description", "imagePrompt"],
                    },
                  },
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sceneNumber: { type: "number" },
                        panel: { type: "string", description: "镜头类型" },
                        imagePrompt: { type: "string", description: "英文画面描述提示词" },
                        characterAction: { type: "string", description: "角色动作描述" },
                        dialogue: { type: "string", description: "台词/旁白" },
                        bgm: { type: "string", description: "背景音效提示" },
                        duration: { type: "string", description: "建议时长" },
                      },
                      required: ["sceneNumber", "panel", "imagePrompt", "characterAction", "dialogue", "bgm", "duration"],
                    },
                  },
                  totalScenes: { type: "number" },
                  estimatedDuration: { type: "string" },
                },
                required: ["title", "synopsis", "characters", "scenes", "totalScenes", "estimatedDuration"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_drama_script" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI请求频率超限，请稍后重试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI额度不足，请充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI服务异常" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "suggest_drama_script") {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI返回格式异常，请重试" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "AI返回格式异常，请重试" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("drama-script-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
