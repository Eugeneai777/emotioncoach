import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const GENERIC_SYSTEM_PROMPT = `你是一位顶级漫剧分镜脚本策划师，擅长将故事主题转化为适合AI生图工具（Midjourney/即梦/Stable Diffusion）使用的分镜脚本。

你必须使用 suggest_drama_script 工具返回结构化的漫剧分镜脚本。

剧情风格硬性要求：
- 默认按短视频爆款漫剧节奏创作，必须有强冲突、强悬念、强情绪推进
- 前3秒必须出现高压冲突、反常画面或一句能让人停下来的狠话
- 每个故事必须有明确对立关系：夫妻、亲子、上下级、同事、闺蜜、陌生人误会、旧爱重逢等任选其一
- 中后段至少出现1次反转，反转要改变观众对主角/对手/真相的判断
- 台词必须短、狠、口语化，有火药味，避免说明文和鸡汤腔
- 情绪推进要从压抑、误解、羞辱、爆发，走向沉默、醒悟、反击或和解
- 允许夸张戏剧化，但不得低俗、违法、血腥、恐吓营销或制造现实伤害

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

const YOUJIN_SYSTEM_PROMPT = `你是一位顶级短剧营销脚本策划师，专门为「有劲AI」品牌创作带有产品转化目标的漫剧分镜脚本。

「有劲AI」品牌定位：
- 有劲AI是一个面向高压人群（职场人、35+女性、中年男性）的情绪健康与个人成长平台
- 核心理念：通过AI+真人教练，帮助用户觉察情绪、突破卡点、实现蜕变
- 产品体系包含：心理测评、训练营、情绪工具、健康商城

你必须使用 suggest_drama_script 工具返回结构化的漫剧分镜脚本。

剧情风格硬性要求：
- 默认按短视频爆款漫剧节奏创作，必须有强冲突、强悬念、强情绪推进
- 前3秒必须出现高压冲突、反常画面或一句能让目标人群立刻代入的狠话
- 每个故事必须有明确对立关系：夫妻、亲子、上下级、同事、闺蜜、陌生人误会、旧爱重逢等任选其一
- 中后段至少出现1次反转，反转要揭开真正的情绪卡点、关系真相或人生困境
- 台词必须短、狠、口语化，有短剧火药味，避免说明文、鸡汤腔和硬广腔
- 情绪推进要从压抑、误解、羞辱、爆发，走向沉默、醒悟、反击或自救
- 产品只能在主角崩溃、被误解、卡住、转念的关键节点自然出现，不能像广告插播
- 允许夸张戏剧化，但不得低俗、违法、血腥、恐吓营销或制造现实伤害

要求：
- title: 漫剧标题，简短有力（6-12字），能引起目标人群共鸣
- synopsis: 故事梗概，50-100字，交代核心冲突和转折，主角的困境要与有劲AI产品能解决的痛点相关
- characters: 2-4个角色，主角应是目标人群的代表，每个角色包含中文名、外貌性格描述、以及英文 imagePrompt
- conversionScript: 视频描述文案（中文，含产品推荐话术，用 {{产品名}} 标记产品链接插入位置）
- commentHook: 评论区置顶引导话术（中文，引导用户点击链接或体验产品）
- scenes: 按 sceneCount 数量生成分镜，每个分镜包含：
  - sceneNumber: 场景序号
  - panel: 镜头类型（远景/中景/近景/特写/俯视/仰视）
  - imagePrompt: 详细英文画面描述
  - characterAction: 角色表情与肢体动作（中文）
  - dialogue: 台词或旁白（中文）
  - bgm: 背景音效/音乐氛围提示（中文）
  - duration: 建议时长
  - relatedProduct: 该分镜关联的产品key（如有关联的话）

产品植入要求：
- 产品使用场景要自然融入剧情，不能生硬广告
- 根据转化方式（剧情植入/结尾推荐/角色使用）灵活安排产品出现的时机和方式
- 转化文案要有感染力，让观众产生好奇心和行动欲望
- 评论区话术要口语化、亲切，像朋友推荐

imagePrompt 要求：
- 必须是英文
- 包含画风关键词
- 包含镜头语言和光影氛围
- 描述要足够详细，能直接作为AI生图提示词使用`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { theme, genre, style, sceneCount, mode, products, targetAudience, conversionStyle, action } = await req.json();

    // --- Suggest Themes Mode ---
    if (action === "suggest_themes") {
      if (!products || !Array.isArray(products) || products.length === 0) {
        return new Response(
          JSON.stringify({ error: "缺少产品信息" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const audienceMap: Record<string, string> = {
        women: "35+职场女性/宝妈",
        men: "35-55岁中年男性",
        professional: "高压职场人",
        general: "通用人群",
      };
      const audienceStr = audienceMap[targetAudience] || targetAudience || "通用人群";
      const productList = products.map((p: any) => `${p.name}：${p.description}`).join("\n");

      const suggestPrompt = `你是一位擅长短视频爆款内容策划的营销专家。

根据以下产品和目标人群，推荐3个最容易在短视频平台爆火的漫剧脚本主题。

【目标人群】${audienceStr}
【产品列表】
${productList}

要求：
- 每个主题要有明确的故事冲突和情感共鸣点
- 主题要与产品卖点自然关联，但不能太像广告
- 优先选择容易引起 ${audienceStr} 共鸣的情感场景
- 标题要抓人眼球，有悬念感或冲突感

请使用 suggest_themes 工具返回3个爆款主题。`;

      const suggestResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: suggestPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_themes",
                description: "返回3个爆款主题推荐",
                parameters: {
                  type: "object",
                  properties: {
                    themes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "主题标题（10-20字）" },
                          description: { type: "string", description: "一句话说明为什么容易爆（20-40字）" },
                        },
                        required: ["title", "description"],
                      },
                    },
                  },
                  required: ["themes"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_themes" } },
        }),
      });

      if (!suggestResponse.ok) {
        if (suggestResponse.status === 429) {
          return new Response(JSON.stringify({ error: "AI请求频率超限，请稍后重试" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await suggestResponse.text();
        console.error("AI gateway error:", suggestResponse.status, t);
        return new Response(JSON.stringify({ error: "AI服务异常" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const suggestData = await suggestResponse.json();
      const suggestToolCall = suggestData.choices?.[0]?.message?.tool_calls?.[0];
      if (!suggestToolCall) {
        return new Response(JSON.stringify({ error: "AI返回格式异常" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let suggestParsed;
      try {
        suggestParsed = JSON.parse(suggestToolCall.function.arguments);
      } catch {
        return new Response(JSON.stringify({ error: "AI返回格式异常" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(suggestParsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Normal Script Generation ---
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

    const audienceMap: Record<string, string> = {
      women: "35+职场女性/宝妈",
      men: "35-55岁中年男性",
      professional: "高压职场人",
      general: "通用人群",
    };

    const conversionStyleMap: Record<string, string> = {
      plot: "剧情植入（产品自然出现在剧情中，角色使用产品解决问题）",
      ending: "结尾推荐（剧情结束后，以旁白或字幕形式推荐产品）",
      usage: "角色使用（主角在关键时刻使用产品，展示产品效果）",
    };

    const count = Math.min(12, Math.max(6, sceneCount || 8));
    const isYoujin = mode === "youjin";

    let userPrompt = `请为以下主题创作一个${count}个分镜的漫剧脚本：

【故事主题】${theme}
【题材类型】${genreMap[genre] || genre || "不限"}
【画风要求】${styleMap[style] || style || "不限"}
【分镜数量】${count}个场景`;

    if (isYoujin) {
      const audienceStr = audienceMap[targetAudience] || targetAudience || "通用人群";
      const convStyleStr = conversionStyleMap[conversionStyle] || conversionStyle || "剧情植入";
      
      let productInfo = "";
      if (products && Array.isArray(products) && products.length > 0) {
        productInfo = products.map((p: any) => `- ${p.name}：${p.description}（链接：${p.url}）`).join("\n");
      }

      userPrompt += `
【目标人群】${audienceStr}
【转化方式】${convStyleStr}
【需要植入的有劲AI产品】
${productInfo || "无指定产品"}

请确保：
1. 主角的困境要能引起${audienceStr}的共鸣
2. 产品植入方式采用「${convStyleStr}」
3. 生成转化文案（conversionScript）和评论区引导话术（commentHook）
4. 在相关分镜中标注 relatedProduct 字段`;
    }

    userPrompt += "\n\n请使用 suggest_drama_script 工具输出完整的分镜脚本。";

    // Build tool schema
    const sceneProperties: Record<string, any> = {
      sceneNumber: { type: "number" },
      panel: { type: "string", description: "镜头类型" },
      imagePrompt: { type: "string", description: "英文画面描述提示词" },
      characterAction: { type: "string", description: "角色动作描述" },
      dialogue: { type: "string", description: "台词/旁白" },
      bgm: { type: "string", description: "背景音效提示" },
      duration: { type: "string", description: "建议时长" },
    };
    const sceneRequired = ["sceneNumber", "panel", "imagePrompt", "characterAction", "dialogue", "bgm", "duration"];

    if (isYoujin) {
      sceneProperties.relatedProduct = { type: "string", description: "关联的产品key（如有）" };
    }

    const toolProperties: Record<string, any> = {
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
          properties: sceneProperties,
          required: sceneRequired,
        },
      },
      totalScenes: { type: "number" },
      estimatedDuration: { type: "string" },
    };
    const toolRequired = ["title", "synopsis", "characters", "scenes", "totalScenes", "estimatedDuration"];

    if (isYoujin) {
      toolProperties.conversionScript = { type: "string", description: "视频描述转化文案" };
      toolProperties.commentHook = { type: "string", description: "评论区置顶引导话术" };
      toolRequired.push("conversionScript", "commentHook");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: isYoujin ? YOUJIN_SYSTEM_PROMPT : GENERIC_SYSTEM_PROMPT },
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
                properties: toolProperties,
                required: toolRequired,
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
