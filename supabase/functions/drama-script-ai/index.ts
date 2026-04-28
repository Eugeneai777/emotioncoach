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
- coverPoster: 本集封面海报草案，包含中文封面主标题、辅助文案、封面钩子、英文图片提示词，方便直接制作短视频封面
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
- coverPoster: 本集封面海报草案，包含中文封面主标题、辅助文案、封面钩子、英文图片提示词，适合小红书/抖音封面制作
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

    const { theme, genre, style, sceneCount, mode, products, targetAudience, conversionStyle, conflictIntensity, action, avoidTitles, previousScript } = await req.json();

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
      const conflictMap: Record<string, string> = {
        standard: "标准冲突：清晰矛盾、温和反转、情绪真实",
        strong: "强冲突：高压开场、人物对立明显、情绪层层升级",
        viral: "爆款夸张：极限误会、强羞辱/强压迫场景、结尾必须反转，但避免低俗和违法伤害",
      };
      const conflictStr = conflictMap[conflictIntensity] || conflictMap.strong;
      const avoidTitleList = Array.isArray(avoidTitles)
        ? avoidTitles.filter((item) => typeof item === "string" && item.trim()).slice(0, 12)
        : [];
      const avoidTitlePrompt = avoidTitleList.length > 0
        ? `\n【本次必须避开的旧主题】\n${avoidTitleList.map((item) => `- ${item}`).join("\n")}\n请不要复用以上标题、冲突对象和反转套路，换一批完全不同的场景。`
        : "";

      const suggestPrompt = `你是一位擅长短视频爆款内容策划的营销专家。

根据以下产品和目标人群，推荐3个最容易在短视频平台爆火的漫剧脚本主题。

【目标人群】${audienceStr}
【冲突强度】${conflictStr}
【产品列表】
${productList}${avoidTitlePrompt}

要求：
- 每个主题要有明确的故事冲突和情感共鸣点
- 标题必须像短视频钩子，带冲突、悬念或反常识，不要平淡
- description 必须写清楚：冲突对象 + 情绪痛点 + 反转点
- 主题要与产品卖点自然关联，但不能太像广告
- 优先选择容易引起 ${audienceStr} 共鸣的情感场景
- 冲突可以夸张，但不能低俗、违法、血腥或恐吓营销

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

    const conflictIntensityMap: Record<string, string> = {
      standard: "标准冲突：矛盾清晰，情绪真实，中后段有一次温和反转",
      strong: "强冲突：前3秒高压开场，人物对立鲜明，情绪层层升级，中后段必须有反转",
      viral: "爆款夸张：前3秒必须反常/羞辱/逼迫式开场，制造极限误会或强压迫感，结尾必须强反转；可夸张但不得低俗、违法、血腥或恐吓营销",
    };
    const conflictStr = conflictIntensityMap[conflictIntensity] || conflictIntensityMap.strong;

    const count = Math.min(12, Math.max(6, sceneCount || 8));
    const isYoujin = mode === "youjin";

    const isSequel = action === "generate_sequel" && previousScript?.script_data;
    const previousData = isSequel ? previousScript.script_data : null;
    const previousLastScene = previousData?.scenes?.[previousData.scenes.length - 1];

    let userPrompt = `请为以下主题创作一个${count}个分镜的漫剧脚本：

【故事主题】${theme}
【题材类型】${genreMap[genre] || genre || "不限"}
【画风要求】${styleMap[style] || style || "不限"}
【冲突强度】${conflictStr}
【分镜数量】${count}个场景`;

    if (isSequel) {
      userPrompt += `

【续集创作要求】
这是一个系列短剧的第 ${(previousScript.episode_number || 1) + 1} 集，不是新故事。必须承接上一集继续写。
上一集标题：${previousData.title || previousScript.title}
上一集梗概：${previousData.synopsis || previousScript.synopsis || "无"}
上一集角色设定：${JSON.stringify(previousData.characters || [])}
上一集最后分镜：${previousLastScene ? JSON.stringify(previousLastScene) : "无"}

【生成续集前必须先做一致性检查】
在创作前先在内部完成检查，不要把检查过程输出给用户：
- 角色一致性：逐一核对上一集每个核心角色的姓名、年龄感、外貌特征、服装风格、性格、关系立场，续集中不得改名、换身份、换外貌或突然改变动机。
- 关键剧情点一致性：核对上一集的核心矛盾、已揭示真相、未解决悬念、最后一个动作/台词，本集必须承接这些事实，不得推翻已发生剧情。
- 关系状态一致性：上一集已经破裂、和解、误会加深、被揭穿或被压迫的关系状态，本集开头必须保持一致，再在此基础上升级。
- 产品植入一致性：如果上一集已有产品或工具出现，本集只能延续其自然作用，不能突然换成硬广或与上一集用途矛盾。
- 画面一致性：characters.imagePrompt 必须延续上一集角色识别特征；scene.imagePrompt 中同一角色也要保持相同外观关键词。
- 跑偏拦截：如果新冲突会导致角色人设、关系、时间线或核心主题跑偏，必须换一个冲突设计。

续集硬性要求：
1. 延续同一批核心角色、外貌特征、人物关系和画风，不要重启世界观。
2. 第1个分镜必须承接上一集最后一个动作、悬念或台词，并立即制造新压力。
3. 不要重复上一集的冲突套路，要升级为新的误会、新对手、新证据或更大的情绪爆点。
4. 中后段必须出现比上一集更强的反转，让观众重新判断人物动机。
5. 结尾必须留下下一集钩子，但本集也要有一个明确情绪落点。
6. title 要体现“续集感”和新冲突，不要直接复用上一集标题。
7. 输出前再次自查：角色设定、关键剧情点、人物关系、产品植入、画面提示词是否与上一集一致；如不一致，必须自行修正后再输出。`;
    }

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

    userPrompt += `

剧情执行要求：
1. 标题要像短视频爆款钩子，强悬念、强冲突，避免温吞标题
2. synopsis 必须写出核心矛盾、对立关系和中后段反转
3. 第1个分镜必须是冲突爆点，不要铺垫世界观；如果是续集，必须承接上一集结尾
4. 每个分镜的 dialogue 控制在1-2句，短句、狠话、口语化，避免解释过多
5. 场景之间要逐步升级：误会/压迫 → 失控/爆发 → 反转/醒悟 → 行动/转化
6. imagePrompt 要强化镜头压迫感：close-up tense expression, dramatic backlight, split composition, high contrast lighting, cinematic tension 等
7. bgm 要配合短剧节奏：心跳、低频鼓点、突然静音、反转音效、压迫感弦乐等
8. 必须生成本集 coverPoster：封面主标题要比剧名更有点击欲，辅助文案补充冲突对象或反转点，封面钩子控制在12字以内；posterImagePrompt 必须是英文，直接可用于AI生图，包含竖屏短视频封面构图、主角表情、冲突道具、醒目留白区、戏剧化光影与指定画风。

请使用 suggest_drama_script 工具输出完整的分镜脚本。`;

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
      coverPoster: {
        type: "object",
        properties: {
          headline: { type: "string", description: "封面主标题，中文，强冲突强点击欲" },
          subheadline: { type: "string", description: "封面辅助文案，中文，补充冲突对象/反转点" },
          hookText: { type: "string", description: "封面短钩子，中文，12字以内" },
          posterImagePrompt: { type: "string", description: "英文封面海报AI生图提示词" },
        },
        required: ["headline", "subheadline", "hookText", "posterImagePrompt"],
      },
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
    const toolRequired = ["title", "synopsis", "coverPoster", "characters", "scenes", "totalScenes", "estimatedDuration"];

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
