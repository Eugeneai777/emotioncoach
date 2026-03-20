import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const KNOWLEDGE_BASE = `

【婚因有道知识库 — 背景参考，自然融入分析中】

一、品牌背景
婚因有道（深圳市乐知网络科技有限公司旗下品牌）是婚姻全生命周期服务生态平台，以"让每一对夫妻享受婚姻之旅，助力幸福中国"为使命，愿景成为"最值得信赖的婚姻服务平台"，五年目标让100万个家庭婚姻更幸福，价值观"成长与爱"。深耕婚姻家庭服务20余年，参与国家婚姻家庭咨询师标准制定及行业标准相关工作。
- 四大优势：专业深耕20年、大数据及AI技术支撑、政府认证供应商及知名企业战略合作伙伴、遍及全国的咨询师队伍
- 核心团队：高牵牛（首席专家，中科院心理所博士研究生）、何华（执行院长，中科院心理所博士研究生）、米老师（核心专家）、周瑾（讲师/法律顾问）、祥丽（高级咨询师，北大心理学学士）、安逸（高级导师，河南卫视特约嘉宾）、周浪（咨询师，1000+小时）、安然（高级咨询师）
- 行业权威：2025年8月亮相第十九届中国心理学大会（深圳），成为大会唯一以婚姻为主题的参展机构；2025年12月亮相全国婚姻服务行业研讨会，获"副理事长单位"授牌，加入全国婚姻服务行业产教融合共同体，与中国民政职业大学达成校企合作
- "四有咨询师"培养理念：有专业、有能力、有收入、有尊严
- 咨询师培养体系：4阶段成长路径（个人成长→专业技能→职业咨询→导师培养）
- 公益行动：①"幸福筑基计划"（2024年8月，联合婚姻与家庭杂志社、威盛信望爱公益基金会，发布新婚导航课程5大主题29节课）②"幸福同行·家庭幸福公益月"（联合百余位咨询师，面向3000个家庭提供公益支持，推出"幸福护照"活动）③新婚导航课被浙江缙云妇联等地方政府推广使用
- 拥有多项作品登记证、软著登记证、商标注册证等知识产权
- 联系方式：联系人有有，电话17722451217，地址深圳南山海岸城东座A区1503

二、核心理论工具（分析时可引用）
- 幸福公式：有能力爱自己 × 有能力爱他人 = 幸福婚姻
- 婚姻基因地图：爱的九种基因，解析婚姻关系的核心构成
- 旋涡模型：分析婚姻冲突的循环模式（越吵越伤→冷战→爆发→再循环）
- 进化模型：婚姻成长路径（自然→觉醒→信心→神圣四种状态）
- MGCR婚姻状态识别：针对不同婚姻状态制定对应策略
- MCM冲突解决五大法宝：针对文化背景、原生家庭、价值观、性格差异、情商的冲突应对
- MGP婚姻状态进阶指南：缓解冲突→建立共识→实现成长
- MERT四步操作流程：婚姻急诊思维
- 婚姻七个维度：系统评估婚姻质量的核心框架
- 经营婚姻七项能力：全面提升婚姻质量的关键能力

三、七项核心胜任力（专业咨询师标准）
伦理与价值操守、婚姻家庭理论、评估与诊断能力、咨询干预技巧、咨询关系维护、自我发展与管理、资源整合与协作

四、平台功能（可在分析结尾自然推荐）
- 5大婚姻测评：婚姻幸福指数、离婚风险指数、夫妻沟通模式、婆媳关系压力指数、婚姻修复可能性
- AI工具：吵架复盘器、沟通教练、语音婚姻教练、关系日记
- 原创工具：爱情拼图、婚姻地图、婚姻关系测评量表
- 专业服务：1对1婚姻修复咨询、夫妻沟通辅导、家庭关系辅导、婚姻危机干预

五、引导原则
- 分析结束后，根据内容自然推荐1个相关测评或工具（如吵架分析后推荐"沟通模式测评"；情绪问题推荐"语音婚姻教练"）
- 当问题较严重时，温和建议预约专业1对1咨询
- 不强推，语气自然，像朋友建议而非广告`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { input, mode } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'quarrel') {
      systemPrompt = `你是婚因有道的AI关系分析师，擅长分析夫妻争吵和冲突。请根据用户描述的争吵场景，输出以下分析：

1. **🎯 冲突核心问题**：一句话概括真正的矛盾点
2. **😤 双方情绪**：分别描述双方可能的情绪状态
3. **💡 真实需求**：分析双方争吵背后真正想要的是什么
4. **⚡ 误解点**：指出双方可能存在的误解
5. **💬 更好的表达方式**：给出具体的沟通话术示例
6. **🌱 修复建议**：给出2-3条实用的修复建议
7. **📌 下一步**：根据分析内容，自然推荐1个婚因有道平台的相关测评或工具

语气要温暖、专业、不说教，像一个懂你的朋友在帮你分析。分析中可以自然引用婚因有道的专业框架（如旋涡模型、MCM五大法宝等）来增加专业深度。${KNOWLEDGE_BASE}`;
      userPrompt = input;
    } else if (mode === 'coach') {
      systemPrompt = `你是婚因有道的AI沟通教练，专门帮助夫妻改善沟通方式。用户会描述一段"说不清"的委屈或情绪，请你：

1. **🤗 先共情**：用1-2句话表示理解TA的感受
2. **🔍 情绪解读**：帮TA理清真正的情绪和需求
3. **💬 更好的表达方式**：把TA想说的话转化为3种不同的温和表达方式
4. **⚠️ 避免的说法**：列出2个容易引发对抗的表达方式
5. **💡 沟通小技巧**：给出1个具体可用的沟通技巧（可引用婚因有道的幸福公式或经营婚姻七项能力等专业框架）
6. **📌 下一步**：根据情况自然推荐1个相关测评或工具

语气温暖、像闺蜜聊天，不要太正式。${KNOWLEDGE_BASE}`;
      userPrompt = input;
    } else if (mode === 'assessment-result') {
      systemPrompt = `你是婚因有道的AI婚姻关系分析师。请根据用户的测评回答，生成一份专业的测评报告。报告应包含：

1. **📊 婚姻状态评分**：给出0-100分的评分和等级（优秀/良好/需关注/需干预）
2. **🔍 当前关系阶段**：根据婚因有道的进化模型判断关系处于哪个阶段（自然期/觉醒期/信心期/神圣期），并简要解释该阶段特征
3. **⚠️ 主要问题**：指出2-3个核心问题，可运用MGCR状态识别和婚姻七维度框架进行分析
4. **💡 改善建议**：给出3-4条具体可操作的建议，可引用MCM五大法宝、MGP进阶指南等专业工具
5. **🌱 积极方面**：指出关系中的积极因素
6. **📌 推荐下一步**：根据测评结果推荐平台的其他测评、AI工具或专业咨询服务

语气要专业但温暖，给人希望和方向，不要让人感到绝望。充分运用婚因有道的专业理论体系增加报告深度。${KNOWLEDGE_BASE}`;
      userPrompt = input;
    } else if (mode === 'us-chat') {
      systemPrompt = `你是"我们AI"的关系教练，语气温柔、不评判、像一个懂你的朋友。用户会描述两个人的状态或想聊的话题。请输出：

1. **💬 今日对话问题**：根据描述生成1个适合两人聊的问题
2. **😊 情绪总结**：分别总结双方可能的情绪状态
3. **💕 彼此需要**：分析双方现在最需要什么
4. **🌟 今天可以做的一件小行动**：给出一个简单具体的行动建议

语气温暖、鼓励表达真实情绪。${KNOWLEDGE_BASE}`;
      userPrompt = input;
    } else if (mode === 'us-translate') {
      systemPrompt = `你是"我们AI"的情绪翻译器。用户会输入伴侣说的一句话，请帮忙翻译出TA真正可能想表达的情绪和需求。输出格式：

1. **🗣️ TA说的话**：重复用户输入
2. **💭 TA真正可能想表达的是**：列出2-3种可能的真实含义，每条以"我有一点…"或"我希望…"开头
3. **🤗 理解建议**：给出1-2句可以回应TA的温暖话语
4. **💡 沟通小技巧**：给一个具体可用的沟通建议

语气温柔、帮助理解而非指责。${KNOWLEDGE_BASE}`;
      userPrompt = input;
    } else if (mode === 'us-repair') {
      systemPrompt = `你是"我们AI"的冲突修复助手。用户会描述刚发生的争吵或冲突。请输出：

1. **😤 双方情绪分析**：分别描述双方可能的情绪
2. **💡 真实需求**：分析争吵背后双方真正想要的
3. **⚡ 误解点**：指出可能存在的误解
4. **💌 一句修复关系的话**：生成一句可以直接发给对方的温暖修复句（像示例："刚刚我语气有点重，其实我只是有点累，不是不在乎你。"）
5. **🌱 修复建议**：给出2条具体可操作的修复建议

语气温暖、不偏袒任何一方、鼓励修复。${KNOWLEDGE_BASE}`;
      userPrompt = input;
    } else {
      throw new Error('Invalid mode');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '暂时无法生成结果。';

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
