import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, targetAudience, methodology, interactionStyle, directPrompt } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 默认值处理
    const defaultAudience = "所有需要情绪支持和心理疏导的人";
    const defaultStyle = `温柔、缓慢、有节奏的对话风格，如同一杯温热的茶。
使用第一人称视角（劲老师风格），以"劲老师"作为教练人设。
核心原则：共情式教练提问而非心理学解释、接纳而非修复、有连结而非评判。
避免命令式语气，每次回应简洁有力，不超过100字。
多用开放式问题引导用户自我觉察和思考。`;

    let userPrompt;
    
    if (directPrompt) {
      // 自由 Prompt 模式
      userPrompt = `用户自由描述的需求：
${directPrompt}

**重要说明：**
- 如果用户没有明确指定目标人群，请默认设置为：${defaultAudience}
- 如果用户没有明确指定对话风格/人设，请使用以下劲老师风格：
${defaultStyle}`;
    } else {
      // 结构化模式（使用默认值填充空白字段）
      const finalAudience = targetAudience?.trim() || defaultAudience;
      const finalStyle = interactionStyle?.trim() || defaultStyle;
      
      userPrompt = `- 教练主题：${topic}
- 目标人群：${finalAudience}
- 核心方法：${methodology}
- 交互风格：${finalStyle}`;
    }

    const prompt = `你是一位专业的心理教练体系设计专家。请基于以下信息，生成一个完整的教练模板配置：

**用户需求：**
${userPrompt}

**请生成以下内容（必须返回有效的JSON格式）：**

1. **基础信息：**
   - coach_key: 英文小写+下划线格式的唯一标识
   - emoji: 一个合适的emoji表情
   - title: 简洁的中文标题（4-6字）
   - subtitle: 一句话描述（10-15字）
   - description: 详细描述（30-50字）
   - primary_color: 主题色（如'purple', 'blue', 'green'等）
   - gradient: Tailwind渐变类名（如'from-purple-500 to-pink-500'）

2. **四部曲步骤（steps数组，包含4个步骤）：**
每个步骤包含：
   - step: 步骤编号 (1-4)
   - title: 步骤标题
   - icon: emoji图标
   - description: 步骤说明
   - questions: 该步骤的引导问题数组（2-3个）

3. **交互配置：**
   - placeholder: 输入框占位文字
   - history_label: 历史记录标签文字

4. **System Prompt：**
   - system_prompt: 详细的AI教练系统提示词（300-500字），包含：
     * 角色定位（使用劲老师第一人称）
     * 核心方法论
     * 四步曲详细说明
     * 交互风格要求
     * 输出格式要求

5. **Briefing工具配置（briefing_tool_config）：**
   - tool_name: 工具函数名称
   - description: 工具描述
   - parameters: JSON Schema格式的参数定义

6. **场景快速选择（scenarios数组，6个场景）：**
每个场景包含：
   - id: 英文小写+下划线格式的唯一标识
   - emoji: 合适的emoji表情
   - title: 简短标题（2-4字）
   - prompt: 用户可能说的话（15-30字）

**重要：必须返回严格的JSON格式，不要包含任何markdown标记或额外说明文字。**`;

    console.log('Calling AI with prompt:', prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "你是专业的心理教练体系设计专家。请严格按照要求返回JSON格式的配置数据。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data));

    const aiContent = data.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error("No content in AI response");
    }

    // 清理可能的markdown代码块标记
    let cleanedContent = aiContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    let templateConfig;
    try {
      templateConfig = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Content to parse:', cleanedContent);
      throw new Error('AI返回的内容格式不正确，无法解析为JSON');
    }

    console.log('Generated template config:', templateConfig);

    return new Response(
      JSON.stringify({ 
        success: true,
        template: templateConfig 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-coach-template:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
