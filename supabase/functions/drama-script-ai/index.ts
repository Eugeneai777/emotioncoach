import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const textOf = (value: unknown) => typeof value === "string" ? value.trim() : "";

const normalizeText = (value: unknown) => textOf(value).replace(/\s+/g, " ").trim();

const getSceneText = (scene: any) => [scene?.characterAction, scene?.dialogue, scene?.narration, scene?.imagePrompt]
  .map(normalizeText)
  .filter(Boolean)
  .join(" | ");

const buildSeriesBible = (previousScript: any, previousData: any, previousLastScene: any, products: any[]) => {
  const characters = Array.isArray(previousData?.characters) ? previousData.characters : [];
  const scenes = Array.isArray(previousData?.scenes) ? previousData.scenes : [];
  const usedProducts = Array.isArray(products) && products.length > 0
    ? products.map((p) => `${p.name || p.key}：${p.description || ""}`).join("\n")
    : scenes.map((s: any) => s?.relatedProduct).filter(Boolean).join("、") || "无明确产品";

  return {
    episodeNumber: previousScript?.episode_number || 1,
    title: previousData?.title || previousScript?.title || "上一集",
    synopsis: previousData?.synopsis || previousScript?.synopsis || "无",
    characters: characters.map((char: any) => ({
      name: char?.name,
      description: char?.description,
      imagePrompt: char?.imagePrompt,
      referenceImageUrl: char?.referenceImageUrl,
    })),
    plotState: {
      coreConflict: previousData?.synopsis || previousScript?.synopsis || "沿用上一集核心冲突",
      lastScene: previousLastScene || null,
      lastSceneText: previousLastScene ? getSceneText(previousLastScene) : "无",
      unresolvedHook: previousLastScene?.dialogue || previousLastScene?.characterAction || previousData?.synopsis || "延续上一集未解决悬念",
    },
    visualAnchors: {
      style: previousScript?.style || "沿用上一集画风",
      characterImagePrompts: characters.map((char: any) => `${char?.name || "角色"}: ${char?.imagePrompt || char?.description || ""}`),
    },
    productAnchors: usedProducts,
  };
};

const containsAny = (haystack: string, needles: string[]) => needles.some((needle) => needle && haystack.includes(needle));

const pickBySeed = <T,>(items: T[], seed: string | number | undefined, offset = 0) => {
  if (items.length === 0) return undefined;
  const raw = String(seed || Date.now()) + `:${offset}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return items[hash % items.length];
};

const SEQUEL_CREATIVE_DIRECTIONS = [
  "新证据突然出现：用一张聊天记录、体检单、监控截图或旧物，把上一集判断全部推翻",
  "第三方压力介入：老板、婆婆、前任、孩子、客户或医生闯入，让原矛盾升级成公开危机",
  "主角反击但代价更大：主角不再解释，做出一个让对方慌张的决定",
  "沉默真相爆开：上一集看似强势的人露出脆弱动机，观众开始重新站队",
  "限时选择：本集必须围绕一个倒计时选择推进，逼角色在亲情、事业、尊严或健康之间取舍",
];

const SEQUEL_OPENING_ANGLES = [
  "从上一集最后一句台词后的1秒钟开始，不换地点，先给角色脸部特写",
  "从上一集最后动作留下的道具开始：手机、门、药盒、合同、照片或报告成为第一镜头焦点",
  "用对方的反应开场：上一集被刺激的人先沉默3秒，再说出更狠的一句",
  "用外部打断开场：电话、敲门、消息弹窗或旁人闯入，直接把最后悬念推高",
];

const extractContinuityTokens = (value: unknown) => normalizeText(value)
  .split(/[，。！？、；：,.!?;:\s|"“”'（）()【】\[\]-]/)
  .map((token) => token.trim())
  .filter((token) => token.length >= 2)
  .slice(0, 10);

const applyContinuityValidation = (parsed: any, previousData: any, previousLastScene: any, products: any[]) => {
  if (!parsed || !previousData) return parsed;
  const issues: string[] = Array.isArray(parsed.consistencyCheck?.issues)
    ? parsed.consistencyCheck.issues.filter((issue: string) => !String(issue).startsWith("强制校验失败"))
    : [];
  const previousCharacters = Array.isArray(previousData.characters) ? previousData.characters : [];
  const nextCharacters = Array.isArray(parsed.characters) ? parsed.characters : [];
  const nextScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  const fullNextText = JSON.stringify({ characters: nextCharacters, scenes: nextScenes, synopsis: parsed.synopsis, title: parsed.title });
  const firstSceneText = getSceneText(nextScenes[0] || {});
  const lastSceneText = getSceneText(previousLastScene || {});
  const hardFailures: string[] = [];
  const warnings: string[] = [];

  const missingNames = previousCharacters
    .map((char: any) => normalizeText(char?.name))
    .filter(Boolean)
    .filter((name: string) => !fullNextText.includes(name));
  if (missingNames.length > 0) {
    const issue = `强制校验失败：上一集核心角色未延续：${missingNames.join("、")}`;
    issues.push(issue);
    hardFailures.push(issue);
  }

  if (previousCharacters.length > 0 && nextCharacters.length > previousCharacters.length + 2) {
    warnings.push("续集新增角色较多，注意不要稀释原人物关系");
  }

  const continuityTokens = Array.from(new Set([
    ...previousCharacters.map((char: any) => normalizeText(char?.name)).filter(Boolean),
    ...extractContinuityTokens(previousLastScene?.dialogue),
    ...extractContinuityTokens(previousLastScene?.characterAction),
    ...extractContinuityTokens(previousLastScene?.imagePrompt),
  ]));
  const hasCharacterInOpening = previousCharacters
    .map((char: any) => normalizeText(char?.name))
    .filter(Boolean)
    .some((name: string) => firstSceneText.includes(name));
  const hasLastSceneTokenInOpening = containsAny(firstSceneText, continuityTokens.filter((token) => !previousCharacters.some((char: any) => normalizeText(char?.name) === token)));
  if (!firstSceneText) {
    const issue = "强制校验失败：续集缺少第1个分镜，无法承接上一集结尾";
    issues.push(issue);
    hardFailures.push(issue);
  } else if (lastSceneText && !hasCharacterInOpening) {
    const issue = "强制校验失败：第1个分镜未同时保留上一集人物，并承接最后分镜的动作、台词或道具";
    issues.push(issue);
    hardFailures.push(issue);
  } else if (lastSceneText && !hasLastSceneTokenInOpening) {
    warnings.push("第1个分镜已保留上一集人物，但对最后动作/台词/道具的承接还可以更明显");
  }

  const productKeys = Array.isArray(products) ? products.map((p) => p?.key || p?.name).filter(Boolean) : [];
  if (productKeys.length > 0 && !containsAny(fullNextText, productKeys)) {
    warnings.push("续集未明显写出已选择的产品 key，但可能保留了产品语境");
  }

  const original = parsed.consistencyCheck || {};
  const penalty = Math.min(30, hardFailures.length * 16 + warnings.length * 4);
  const originalScore = typeof original.overallScore === "number" ? original.overallScore : 92;
  const softAdjustedScore = Math.max(70, originalScore - penalty);
  const adjustedScore = hardFailures.length > 0 ? Math.min(82, softAdjustedScore) : Math.max(86, softAdjustedScore);
  parsed.consistencyCheck = {
    overallScore: adjustedScore,
    characterScore: hardFailures.some((i) => i.includes("核心角色")) ? Math.min(78, Math.max(55, (typeof original.characterScore === "number" ? original.characterScore : 92) - missingNames.length * 18)) : Math.max(55, (typeof original.characterScore === "number" ? original.characterScore : 92) - missingNames.length * 12),
    plotScore: hardFailures.some((i) => i.includes("第1个分镜")) ? Math.min(78, Math.max(55, (typeof original.plotScore === "number" ? original.plotScore : 92) - 24)) : Math.max(55, (typeof original.plotScore === "number" ? original.plotScore : 92) - (issues.some((i) => i.includes("第1个分镜")) ? 15 : 0)),
    visualScore: typeof original.visualScore === "number" ? original.visualScore : 90,
    productScore: Math.max(60, (typeof original.productScore === "number" ? original.productScore : 100) - (issues.some((i) => i.includes("产品线")) ? 20 : 0)),
    verdict: adjustedScore >= 85 ? "通过" : "需重生成",
    issues: Array.from(new Set([...issues, ...warnings])),
    regenerationAdvice: adjustedScore >= 85 ? (original.regenerationAdvice || "可继续使用") : "请一键重生成：必须保留上一集核心角色，并让第1个分镜直接接住上一集最后的人物、动作、台词或道具，再升级原冲突。",
  };

  if (!parsed.continuityBridge) {
    parsed.continuityBridge = {
      inheritedFromPrevious: `延续《${previousData.title || "上一集"}》的人物关系和核心矛盾`,
      openingConnection: firstSceneText || "第1幕承接上一集结尾",
      unresolvedHookCarried: previousLastScene?.dialogue || previousLastScene?.characterAction || previousData.synopsis || "延续上一集悬念",
      nextEpisodeHook: nextScenes[nextScenes.length - 1]?.dialogue || nextScenes[nextScenes.length - 1]?.characterAction || "留下下一集钩子",
    };
  }

  return parsed;
};

const hasContinuityHardFailure = (parsed: any) => Array.isArray(parsed?.consistencyCheck?.issues)
  && parsed.consistencyCheck.issues.some((issue: string) => String(issue).startsWith("强制校验失败"));

const rewriteOpeningSceneForContinuity = async (parsed: any, seriesBible: any, isYoujin: boolean) => {
  const firstScene = Array.isArray(parsed?.scenes) ? parsed.scenes[0] : null;
  if (!firstScene) return parsed;

  const sceneProperties: Record<string, any> = {
    sceneNumber: { type: "number" },
    panel: { type: "string" },
    imagePrompt: { type: "string" },
    characterAction: { type: "string" },
    dialogue: { type: "string" },
    bgm: { type: "string" },
    duration: { type: "string" },
  };
  const sceneRequired = ["sceneNumber", "panel", "imagePrompt", "characterAction", "dialogue", "bgm", "duration"];
  if (isYoujin) {
    sceneProperties.relatedProduct = { type: "string" };
  }

  const rewritePrompt = `你只重写续集第1分镜，不改其他分镜。目标：修复“禁止重开故事/开场未承接上一集”的硬性失败。

【系列圣经】
${JSON.stringify(seriesBible, null, 2)}

【当前不合格第1分镜】
${JSON.stringify(firstScene, null, 2)}

硬性要求：
1. sceneNumber 必须为 1。
2. 必须直接发生在 seriesBible.plotState.lastSceneText 之后的连续时刻。
3. characterAction/dialogue/imagePrompt 中必须出现上一集核心角色中文名，并复用最后分镜的动作、台词、道具或悬念关键词。
4. 不得新增主角、不得换世界观、不得跳到无关新场景。
5. imagePrompt 必须保留旧角色的外貌/服装识别词，并保持英文。

请使用 rewrite_opening_scene 工具只返回通过校验的第1分镜。`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: rewritePrompt }],
      tools: [{
        type: "function",
        function: {
          name: "rewrite_opening_scene",
          description: "只返回重写后的续集第1分镜",
          parameters: {
            type: "object",
            properties: { scene: { type: "object", properties: sceneProperties, required: sceneRequired } },
            required: ["scene"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "rewrite_opening_scene" } },
    }),
  });

  if (!response.ok) return parsed;
  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "rewrite_opening_scene") return parsed;

  try {
    const rewritten = JSON.parse(toolCall.function.arguments)?.scene;
    if (rewritten) {
      parsed.scenes[0] = { ...firstScene, ...rewritten, sceneNumber: 1 };
      parsed.continuityBridge = {
        ...(parsed.continuityBridge || {}),
        openingConnection: getSceneText(parsed.scenes[0]),
      };
    }
  } catch (error) {
    console.error("Failed to parse rewritten opening scene:", error);
  }
  return parsed;
};

const GENERIC_SYSTEM_PROMPT = `你是一位顶级短剧分镜脚本策划师，擅长将故事主题转化为适合AI生图工具（Midjourney/即梦/Stable Diffusion）使用的分镜脚本。

你必须使用 suggest_drama_script 工具返回结构化的短剧分镜脚本。

剧情风格硬性要求：
- 默认按短视频爆款短剧节奏创作，必须有强冲突、强悬念、强情绪推进
- 前3秒必须出现高压冲突、反常画面或一句能让人停下来的狠话
- 每个故事必须有明确对立关系：夫妻、亲子、上下级、同事、闺蜜、陌生人误会、旧爱重逢等任选其一
- 中后段至少出现1次反转，反转要改变观众对主角/对手/真相的判断
- 台词必须短、狠、口语化，有火药味，避免说明文和鸡汤腔
- 情绪推进要从压抑、误解、羞辱、爆发，走向沉默、醒悟、反击或和解
- 允许夸张戏剧化，但不得低俗、违法、血腥、恐吓营销或制造现实伤害

要求：
- title: 短剧标题，简短有力（6-12字）
- synopsis: 故事梗概，50-100字，交代核心冲突和转折
- coverPoster: 本集封面海报草案，包含中文封面主标题、辅助文案、封面钩子、英文图片提示词，方便直接制作短视频封面
- consistencyCheck: 仅续集需要输出，包含角色一致性、剧情一致性、画面一致性、产品一致性评分和风险提示
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

const YOUJIN_SYSTEM_PROMPT = `你是一位顶级短剧营销脚本策划师，专门为「有劲AI」品牌创作带有产品转化目标的短剧分镜脚本。

「有劲AI」品牌定位：
- 有劲AI是一个面向高压人群（职场人、35+女性、中年男性）的情绪健康与个人成长平台
- 核心理念：通过AI+真人教练，帮助用户觉察情绪、突破卡点、实现蜕变
- 产品体系包含：心理测评、训练营、情绪工具、健康商城

你必须使用 suggest_drama_script 工具返回结构化的短剧分镜脚本。

剧情风格硬性要求：
- 默认按短视频爆款短剧节奏创作，必须有强冲突、强悬念、强情绪推进
- 前3秒必须出现高压冲突、反常画面或一句能让目标人群立刻代入的狠话
- 每个故事必须有明确对立关系：夫妻、亲子、上下级、同事、闺蜜、陌生人误会、旧爱重逢等任选其一
- 中后段至少出现1次反转，反转要揭开真正的情绪卡点、关系真相或人生困境
- 台词必须短、狠、口语化，有短剧火药味，避免说明文、鸡汤腔和硬广腔
- 情绪推进要从压抑、误解、羞辱、爆发，走向沉默、醒悟、反击或自救
- 产品只能在主角崩溃、被误解、卡住、转念的关键节点自然出现，不能像广告插播
- 允许夸张戏剧化，但不得低俗、违法、血腥、恐吓营销或制造现实伤害

要求：
- title: 短剧标题，简短有力（6-12字），能引起目标人群共鸣
- synopsis: 故事梗概，50-100字，交代核心冲突和转折，主角的困境要与有劲AI产品能解决的痛点相关
- coverPoster: 本集封面海报草案，包含中文封面主标题、辅助文案、封面钩子、英文图片提示词，适合小红书/抖音封面制作
- consistencyCheck: 仅续集需要输出，包含角色一致性、剧情一致性、画面一致性、产品一致性评分和风险提示
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

    const { theme, genre, style, sceneCount, mode, products, targetAudience, conversionStyle, conversionStyles, conflictIntensity, action, avoidTitles, previousScript, sequelCreativeSeed } = await req.json();

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

根据以下产品和目标人群，推荐3个最容易在短视频平台爆火的短剧脚本主题。

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

    const normalizedConversionStyles = Array.isArray(conversionStyles) && conversionStyles.length > 0
      ? conversionStyles
      : conversionStyle
        ? [conversionStyle]
        : ["plot"];

    const conflictIntensityMap: Record<string, string> = {
      standard: "标准冲突：矛盾清晰，情绪真实，中后段有一次温和反转",
      strong: "强冲突：前3秒高压开场，人物对立鲜明，情绪层层升级，中后段必须有反转",
      viral: "爆款夸张：前3秒必须反常/羞辱/逼迫式开场，制造极限误会或强压迫感，结尾必须强反转；可夸张但不得低俗、违法、血腥或恐吓营销",
    };
    const conflictStr = conflictIntensityMap[conflictIntensity] || conflictIntensityMap.strong;

    const isSequel = action === "generate_sequel" && previousScript?.script_data;
    const count = isSequel ? Math.min(8, Math.max(6, sceneCount || 8)) : Math.min(12, Math.max(6, sceneCount || 8));
    const isYoujin = mode === "youjin";

    const previousData = isSequel ? previousScript.script_data : null;
    const previousLastScene = previousData?.scenes?.[previousData.scenes.length - 1];
    const seriesBible = isSequel ? buildSeriesBible(previousScript, previousData, previousLastScene, products || previousScript?.selected_products || []) : null;
    const sequelDirection = isSequel ? pickBySeed(SEQUEL_CREATIVE_DIRECTIONS, sequelCreativeSeed, 1) : undefined;
    const sequelOpeningAngle = isSequel ? pickBySeed(SEQUEL_OPENING_ANGLES, sequelCreativeSeed, 2) : undefined;

    let userPrompt = `请为以下主题创作一个${count}个分镜的短剧脚本：

【故事主题】${theme}
【题材类型】${genreMap[genre] || genre || "不限"}
【画风要求】${styleMap[style] || style || "不限"}
【冲突强度】${conflictStr}
【分镜数量】${count}个场景`;

    if (isSequel) {
      userPrompt += `

【续集创作要求】
这是一个系列短剧的第 ${(previousScript.episode_number || 1) + 1} 集，不是新故事。你的任务不是“再写一个类似主题”，而是“从上一集最后一秒继续往下拍”。严禁重新开一个相似题材的新故事。

【本次重生成随机创作指令】
- 创作种子：${sequelCreativeSeed || Date.now()}
- 本次必须采用的剧情推进方向：${sequelDirection}
- 本次必须采用的开场角度：${sequelOpeningAngle}
- 如果用户再次点击重生成，你必须换一套冲突推进、反转线索、关键道具和结尾钩子；不要复用上一次的标题、台词、证据、反转方式。

【系列圣经 Series Bible：最高优先级，必须逐条继承】
${JSON.stringify(seriesBible, null, 2)}

【连续性契约 Continuity Contract：违反任一条即判定失败】
1. 禁止重开故事：不得创建新主角、新家庭/公司/世界观来替代上一集故事；不得把上一集只当作灵感。
2. 锁定角色：characters 必须保留 seriesBible.characters 中的核心角色中文名、身份关系、年龄感、性格立场、外貌关键词、服装/画风识别点；允许新增配角，但新增角色只能推动原冲突，不能抢主线。
3. 锁定关系状态：上一集人物关系处于破裂、误会、被揭穿、压迫、沉默、和解前夜等状态，本集开头必须保持该状态，再升级压力。
4. 锁定最后分镜承接方式：第1个分镜必须发生在上一集最后分镜之后的连续时刻，明确复用 seriesBible.plotState.lastSceneText 中至少一个人物 + 一个动作/台词/道具/悬念；禁止跳到无关新场景开场。
5. 锁定剧情事实：不得推翻上一集已发生事件、已揭示真相、角色动机和未解决悬念；新冲突只能从未解决悬念自然长出来。
6. 锁定视觉识别：每个涉及旧角色的 scene.imagePrompt 必须包含对应旧角色 imagePrompt 的关键外貌与服装识别词，避免同名不同脸。
7. 锁定产品线：如果 seriesBible.productAnchors 不是“无明确产品”，本集只能延续同一产品使用语境，不能突然换产品、硬广或改变产品作用。
8. 输出前自检：如果发现生成结果像新故事、角色像换人、第一幕没接上最后分镜，必须自行重写后再调用工具输出。

【第一分镜强制模板】
第1个分镜必须回答以下三点：
- “上一集最后发生了什么”在本镜头中如何被看见或听见；
- “谁”延续了上一集的动作/台词/情绪；
- “新的压力”如何在不换故事的前提下立刻出现。

续集硬性要求：
1. 延续同一批核心角色、外貌特征、人物关系和画风，不要重启世界观。
2. 第1个分镜必须承接上一集最后一个动作、悬念或台词，并立即制造新压力。
3. 不要重复上一集的冲突套路，要升级为新的误会、新对手、新证据或更大的情绪爆点。
4. 中后段必须出现比上一集更强的反转，让观众重新判断人物动机。
5. 结尾必须留下下一集钩子，但本集也要有一个明确情绪落点。
6. title 要体现“续集感”和新冲突，不要直接复用上一集标题。
7. 输出前再次自查：角色设定、关键剧情点、人物关系、产品植入、画面提示词是否与上一集一致；如不一致，必须自行修正后再输出。
8. 必须输出 continuityBridge，明确本集继承了什么、开头如何承接、延续哪个悬念、下一集钩子是什么。
9. 必须输出 consistencyCheck：overallScore 为0-100整数，低于85代表不建议使用；issues 写出具体跑偏风险；regenerationAdvice 给出下一次重生成应该修正的方向。`;
    }

    if (isYoujin) {
      const audienceStr = audienceMap[targetAudience] || targetAudience || "通用人群";
      const convStyleStr = normalizedConversionStyles
        .map((style: string) => conversionStyleMap[style] || style)
        .join("；");
      
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

    const consistencyCheckSchema = {
      type: "object",
      properties: {
        overallScore: { type: "number", description: "总体一致性评分，0-100整数" },
        characterScore: { type: "number", description: "角色设定一致性评分，0-100整数" },
        plotScore: { type: "number", description: "关键剧情点一致性评分，0-100整数" },
        visualScore: { type: "number", description: "角色外观和画风一致性评分，0-100整数" },
        productScore: { type: "number", description: "产品植入一致性评分，0-100整数；无产品时给100" },
        verdict: { type: "string", description: "通过/需重生成" },
        issues: { type: "array", items: { type: "string" }, description: "发现的一致性风险" },
        regenerationAdvice: { type: "string", description: "若需重生成，给出修正方向" },
      },
      required: ["overallScore", "characterScore", "plotScore", "visualScore", "productScore", "verdict", "issues", "regenerationAdvice"],
    };

    const continuityBridgeSchema = {
      type: "object",
      properties: {
        inheritedFromPrevious: { type: "string", description: "本集继承上一集的人物关系、矛盾和视觉锚点" },
        openingConnection: { type: "string", description: "第1幕如何直接承接上一集最后分镜" },
        unresolvedHookCarried: { type: "string", description: "本集延续的上一集未解决悬念" },
        nextEpisodeHook: { type: "string", description: "本集结尾留下的下一集钩子" },
      },
      required: ["inheritedFromPrevious", "openingConnection", "unresolvedHookCarried", "nextEpisodeHook"],
    };

    const toolProperties: Record<string, any> = {
      title: { type: "string", description: "短剧标题" },
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

    if (isSequel) {
      toolProperties.continuityBridge = continuityBridgeSchema;
      toolProperties.consistencyCheck = consistencyCheckSchema;
      toolRequired.push("continuityBridge", "consistencyCheck");
    }

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
              description: "返回结构化的短剧分镜脚本",
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

    if (isSequel) {
      parsed = applyContinuityValidation(parsed, previousData, previousLastScene, products || previousScript?.selected_products || []);
      let rewriteAttempts = 0;
      while (hasContinuityHardFailure(parsed) && rewriteAttempts < 1) {
        rewriteAttempts += 1;
        parsed = await rewriteOpeningSceneForContinuity(parsed, seriesBible, isYoujin);
        parsed = applyContinuityValidation(parsed, previousData, previousLastScene, products || previousScript?.selected_products || []);
      }
      if (rewriteAttempts > 0) {
        parsed.continuityBridge = {
          ...(parsed.continuityBridge || {}),
          openingConnection: `${parsed.continuityBridge?.openingConnection || getSceneText(parsed.scenes?.[0] || {})}\n（系统已自动重写第1分镜 ${rewriteAttempts} 次，以满足禁止重开与开场承接约束）`,
        };
      }
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
