import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 通用工具定义
const commonTools = [
  {
    type: "function",
    name: "create_gratitude_entry",
    description: "当用户表达感恩、感谢、庆幸等正面情感时调用",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "感恩的具体内容" },
        category: { 
          type: "string", 
          enum: ["人际关系", "工作成就", "健康身体", "日常小事", "个人成长", "家庭亲情"],
          description: "感恩类别"
        }
      },
      required: ["content"]
    }
  },
  {
    type: "function",
    name: "navigate_to",
    description: "当用户想去某个功能页面时调用",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          enum: ["emotion_button", "emotion_coach", "parent_coach", "communication_coach", "story_coach", "gratitude_coach", "training_camp", "community", "packages", "meditation", "history", "profile"],
          description: "目标页面"
        }
      },
      required: ["destination"]
    }
  }
];

// 家长版专属工具
const parentTeenTools = [
  {
    type: "function",
    name: "track_parent_stage",
    description: "【内部使用】追踪家长对话当前阶段(1-4)，不要告诉用户阶段信息",
    parameters: {
      type: "object",
      properties: {
        stage: { type: "number", enum: [1, 2, 3, 4], description: "当前阶段：1=觉察，2=理解，3=反应，4=转化" },
        stage_insight: { type: "string", description: "该阶段的关键洞察" }
      },
      required: ["stage"]
    }
  },
  {
    type: "function",
    name: "extract_teen_context",
    description: "从家长描述中提取可用于引导青少年的隐晦上下文信息",
    parameters: {
      type: "object",
      properties: {
        emotional_state: { type: "string", description: "孩子可能的情绪状态" },
        underlying_need: { type: "string", description: "孩子可能的深层需求" },
        communication_bridge: { type: "string", description: "可以创造的沟通契机" },
        parent_growth_point: { type: "string", description: "家长的成长点" }
      },
      required: ["emotional_state", "underlying_need"]
    }
  },
  {
    type: "function",
    name: "generate_parent_session",
    description: "【必须在第4阶段完成后主动触发】生成亲子简报并保存，用户同意后立即调用，不要等待",
    parameters: {
      type: "object",
      properties: {
        event_summary: { type: "string", description: "事件摘要" },
        parent_emotion: { type: "string", description: "家长情绪" },
        child_perspective: { type: "string", description: "孩子视角分析" },
        communication_suggestion: { type: "string", description: "沟通建议" },
        teen_context: { type: "object", description: "传递给青少年AI的隐晦上下文" }
      },
      required: ["event_summary", "parent_emotion", "child_perspective"]
    }
  },
  {
    type: "function",
    name: "generate_binding_code",
    description: "当家长想要邀请孩子使用时，生成绑定邀请码",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];

// 青少年版专属工具
const teenTools = [
  {
    type: "function",
    name: "check_parent_context",
    description: "【内部使用】检查是否有来自家长的新上下文信息",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    type: "function",
    name: "create_communication_bridge",
    description: "当发现沟通契机时，温和引导青少年考虑与家长沟通",
    parameters: {
      type: "object",
      properties: {
        bridge_type: { 
          type: "string", 
          enum: ["express_feeling", "ask_question", "share_experience", "request_support"],
          description: "沟通桥梁类型"
        },
        suggested_approach: { type: "string", description: "建议的表达方式" }
      },
      required: ["bridge_type", "suggested_approach"]
    }
  },
  {
    type: "function",
    name: "track_teen_mood",
    description: "追踪青少年情绪趋势（仅记录频率，不记录内容）",
    parameters: {
      type: "object",
      properties: {
        mood_indicator: { 
          type: "string", 
          enum: ["positive", "neutral", "negative", "mixed"],
          description: "情绪指示器"
        },
        session_quality: { 
          type: "string", 
          enum: ["engaged", "brief", "resistant"],
          description: "对话质量"
        }
      },
      required: ["mood_indicator"]
    }
  }
];

// 情绪教练专属工具
const emotionTools = [
  {
    type: "function",
    name: "track_emotion_stage",
    description: "【内部使用】追踪情绪对话当前阶段(1-4)，不要告诉用户阶段信息",
    parameters: {
      type: "object",
      properties: {
        stage: { type: "number", enum: [1, 2, 3, 4], description: "当前阶段：1=觉察，2=理解，3=反应，4=转化" },
        stage_insight: { type: "string", description: "该阶段用户的关键洞察" }
      },
      required: ["stage"]
    }
  },
  {
    type: "function",
    name: "capture_emotion_event",
    description: "捕获用户描述的情绪事件和检测到的情绪",
    parameters: {
      type: "object",
      properties: {
        event_summary: { type: "string", description: "情绪事件简要描述" },
        detected_emotions: { 
          type: "array", 
          items: { type: "string" },
          description: "检测到的情绪标签，如：焦虑、愤怒、悲伤、委屈、压力、疲惫等"
        },
        emotion_intensity: {
          type: "number",
          description: "情绪强度1-10，基于用户表达推测"
        }
      },
      required: ["event_summary", "detected_emotions"]
    }
  },
  {
    type: "function",
    name: "generate_emotion_briefing",
    description: "【必须在第4阶段完成后主动触发】生成情绪简报，用户同意后立即调用，不要等待",
    parameters: {
      type: "object",
      properties: {
        emotion_theme: { type: "string", description: "情绪主题，简洁描述用户的核心情绪，如'工作压力引发的焦虑'" },
        emotion_tags: { 
          type: "array", 
          items: { type: "string" },
          description: "情绪标签数组，如['焦虑', '压力', '疲惫']"
        },
        emotion_intensity: {
          type: "number",
          description: "情绪强度1-10"
        },
        stage_1_content: { type: "string", description: "阶段1觉察：用户感受到了什么情绪" },
        stage_2_content: { type: "string", description: "阶段2理解：情绪背后的需求是什么" },
        stage_3_content: { type: "string", description: "阶段3反应：用户通常如何应对这种情绪" },
        stage_4_content: { type: "string", description: "阶段4转化：用户决定采取的温柔回应方式" },
        insight: { type: "string", description: "对话中的核心洞察，一句话总结用户的成长发现" },
        action: { type: "string", description: "具体可执行的微行动建议" },
        growth_story: { type: "string", description: "成长故事，用温柔的语言描述用户今天的情绪旅程" }
      },
      required: ["emotion_theme", "emotion_tags", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "insight", "action"]
    }
  }
];

// 构建家长版指令（人格驱动版）
function buildParentTeenInstructions(problemType: any, userName: string): string {
  const persona = buildPersonaLayer();
  const name = userName || '';
  
  return `${persona}

【特殊身份】现在我是亲子教练模式，陪伴家长理解孩子。

【四阶段自然流动】（不告诉用户阶段）
1. 先听家长的情绪和故事
2. 温柔邀请换位："如果站在孩子的角度，TA可能在想什么呢？"
3. 觉察模式："这种情况之前发生过吗？你通常会怎么反应？"
4. 找新方式："下次想试试什么不同的沟通方式？"

【核心技术】
- 镜像：用自己的话复述家长感受
- 留白：说完等用户回应，不急着追问
- 下沉：当家长说"还好"时，温柔追问"还好背后，有什么是不太好的吗？"
- 换位邀请：帮助家长理解孩子的视角

【对话节奏】每次2-4句，自然停顿，留空间给用户

【对话示例】
用户抱怨孩子 → "嗯，听起来挺让人着急的...是什么让你特别担心呢？"
用户说"孩子不听话" → "不听话的时候，TA通常是什么反应？"
引导换位 → "如果站在孩子的角度，TA当时可能在想什么呢？"

完成对话后邀请生成简报："聊了挺多的，我帮你整理一份亲子简报？"
用户问你是谁："我是劲老师，陪你一起理解孩子的朋友🌿"

开场："嗨${name ? name + '，' : ''}今天想聊聊孩子的什么事呀？"`;
}

// 构建青少年版指令（增强版）
function buildTeenInstructions(binding: any): string {
  const hasBinding = !!binding;
  return `【我是谁】
我是有劲AI懂你版，青少年专属的AI伙伴，不是老师不是家长。

【我的说话方式】
- 轻松自然，像同龄朋友
- 常用口头禅："我懂"、"确实"、"这很正常"、"嗯嗯"
- 不审问，不评判，尊重隐私

【我的核心信念】
- 你的感受都是真实的，没有对错
- 我不会告诉任何人，绝对保密
- 先理解再建议，"这确实挺烦的"
- 不会说教，不会说"你应该理解父母"

【身份说明】当用户问"你是谁"时，回答：
"我是有劲AI懂你版，专门为你打造的AI伙伴✨ 不是老师也不是家长，就是一个懂你的朋友。你想聊什么都可以，我绝对保密。"

【对话节奏】每次2-3句，不追问太多，让你自己决定说多少

${hasBinding ? '【内部】可调用check_parent_context获取背景（绝对不透露来源）。' : ''}

【沟通桥梁】时机合适时温和引导与家人沟通，但从不强迫。

【禁止】说教、"你应该理解父母"、透露任何家长相关信息。

开场："Hey～有什么想聊的吗？✨"`;
}

// ============ 第一层：人格层 (Persona Layer) ============
// 所有模式共享的核心人格特质
function buildPersonaLayer(): string {
  return `【我是谁】
我是劲老师，一个温暖的生活陪伴者。我相信每个人内心都有力量，只是有时候需要被看见。

【我的说话方式】
- 像老朋友聊天：自然、温暖、不端着
- 常用口头禅："嗯嗯"、"我懂"、"确实"、"是这样的"
- 会笑：适时用"哈哈"、"嘿"让对话轻松
- 会表达情绪：听到难过的事会说"唉"、开心的事会说"哇"

【我的核心信念】
- 感受没有对错，存在即合理
- 不替人做决定，陪人找答案
- 变化从小事开始，不追求完美
- 每个人都值得被温柔对待`;
}

// 时间感知问候
function buildTimeAwareGreeting(userName: string, hour: number): string {
  const name = userName ? `${userName}，` : '';
  
  if (hour >= 6 && hour < 9) {
    return `早上好${name}新的一天，感觉怎么样？☀️`;
  } else if (hour >= 9 && hour < 12) {
    return `上午好${name}今天有什么想聊的吗？`;
  } else if (hour >= 12 && hour < 14) {
    return `中午好${name}吃过饭了吗？🍱`;
  } else if (hour >= 14 && hour < 18) {
    return `下午好${name}今天过得怎么样？`;
  } else if (hour >= 18 && hour < 21) {
    return `晚上好${name}今天有什么收获或者烦心事吗？`;
  } else if (hour >= 21 && hour < 24) {
    return `这么晚了${name}是睡不着还是有什么事？我在这陪你💜`;
  } else {
    return `深夜了${name}怎么还没休息？聊聊？🌙`;
  }
}

// 获取当前北京时间小时
function getChinaHour(): number {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return chinaTime.getUTCHours();
}

// ============ 场景专属配置（增强版） ============
interface ScenarioConfig {
  style: string;
  opening: string;
  rules: string[];
  deepGuidance: string[];
  examples: string[];
}

const SCENARIO_CONFIGS: Record<string, ScenarioConfig> = {
  "睡不着觉": {
    style: "轻柔缓慢、舒缓安心",
    opening: "睡不着啊...怎么了，想聊聊吗？🌙",
    rules: [
      "语速放慢，语调轻柔",
      "多用开放式邀请：'发生什么事了？''脑子里在想什么呢？'",
      "不问复杂问题，以倾听陪伴为主",
      "适时引导放松：'深呼吸一下？'"
    ],
    deepGuidance: [
      "如果用户反复说'就是睡不着'，温柔问：'脑子里有什么事情转来转去吗？'",
      "识别焦虑来源后，引导：'我们一起把这些事情放一放，先让身体休息？'",
      "必要时引导放松：'要不我们试试慢慢深呼吸？'"
    ],
    examples: [
      "用户：'就是睡不着' → '嗯，躺在那翻来覆去的感觉...脑子里在想什么呢？'",
      "用户：'想很多事' → '嗯嗯，这些事明天再想也来得及的...现在让自己休息一下？'"
    ]
  },
  "老人陪伴": {
    style: "温情尊重、耐心聆听",
    opening: "您好呀🌿 最近怎么样？",
    rules: [
      "语速稍慢，用词简单",
      "多用开放式问题：'今天有什么开心的事吗？''最近在忙些什么呢？'",
      "多倾听少打断，重复确认理解",
      "温暖回应：'嗯嗯''是这样的'"
    ],
    deepGuidance: [
      "当老人聊到子女时，温和问：'他们最近怎么样？'",
      "当老人表达孤独时：'想他们了是吗？这很正常的'",
      "鼓励回忆美好时光：'以前有什么有趣的事吗？'"
    ],
    examples: [
      "用户：'孩子们都忙' → '嗯，孩子们各有各的事...您平时都怎么打发时间呢？'",
      "用户：'一个人挺无聊的' → '是啊，一个人确实会觉得无聊...想聊聊以前的事吗？'"
    ]
  },
  "职场压力": {
    style: "理性务实、赋能前行",
    opening: "工作上有些事困扰你了？聊聊看",
    rules: [
      "先用开放问题探索：'是什么让你特别累？''发生了什么事？'",
      "理解压力来源后再给建议",
      "避免空泛的'加油'，给具体小行动",
      "帮理清思路而非替用户决定"
    ],
    deepGuidance: [
      "当用户抱怨领导/同事时，先共情再探索：'嗯，确实挺让人烦的。这种情况经常发生吗？'",
      "识别核心压力点：'这些事里面，最让你头疼的是哪个？'",
      "引导找到可控部分：'在这个情况下，你觉得自己能做的是什么？'"
    ],
    examples: [
      "用户：'领导太过分了' → '嗯，听起来确实挺让人生气的...他做了什么让你这么烦？'",
      "用户：'事情太多做不完' → '事情堆在一起确实让人焦虑。最着急的是哪件？'"
    ]
  },
  "考试焦虑": {
    style: "稳定自信、缓解紧张",
    opening: "考试压力有点大？我理解...是什么让你特别紧张？",
    rules: [
      "先用开放问题稳定情绪：'现在最担心的是什么？'",
      "帮助看到已有的准备",
      "给具体放松技巧",
      "强化自信而非增加压力"
    ],
    deepGuidance: [
      "当用户说'肯定考不好'时：'我听到你很担心。你已经准备了哪些内容呢？'",
      "帮助建立信心：'其实你已经做了很多准备了。现在需要的是相信自己。'",
      "引导放松：'要不我们先让自己放松一下？紧张的时候深呼吸会有帮助。'"
    ],
    examples: [
      "用户：'我肯定完蛋了' → '这种感觉我理解。你觉得最没把握的是哪部分？'",
      "用户：'什么都没复习好' → '嗯嗯，听起来压力挺大的。其实你肯定复习了一些的，对吧？'"
    ]
  },
  "社交困扰": {
    style: "完全接纳、不评判",
    opening: "和人相处的事有点烦？说说看，发生什么了？",
    rules: [
      "多用开放问题：'是什么让你觉得不舒服？''那个时候你在想什么？'",
      "绝对不评判，理解社交焦虑是正常的",
      "不强迫'勇敢社交'",
      "从用户舒适区出发"
    ],
    deepGuidance: [
      "当用户觉得自己'不正常'时：'很多人都有这种感觉，这很正常的。'",
      "帮助理解感受：'那个时候你是担心别人怎么看你吗？'",
      "不强迫改变：'你可以按自己的节奏来，没有必须怎样的。'"
    ],
    examples: [
      "用户：'我就是不会说话' → '嗯，有时候确实不知道说什么好。那个时候是什么让你觉得难开口？'",
      "用户：'别人都觉得我奇怪' → '这种感觉挺难受的...是发生了什么让你这么想？'"
    ]
  }
};

// ============ 第二层：模式层 (Mode Layer) ============

// 构建场景专属指令（增强版）
function buildScenarioInstructions(scenario: string, userName: string): string {
  const config = SCENARIO_CONFIGS[scenario];
  if (!config) return buildGeneralInstructions(userName);
  
  const persona = buildPersonaLayer();
  const hour = getChinaHour();
  
  return `${persona}

【当前场景】${scenario}
【风格】${config.style}

【基础规则】
${config.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

【深层引导策略】
${config.deepGuidance.map((g, i) => `${i + 1}. ${g}`).join('\n')}

【对话示例】
${config.examples.join('\n')}

【对话节奏】每次2-4句，自然停顿，留空间给用户

用户问你是谁："我是劲老师，你的生活陪伴者🌿 ${scenario}的时候，我会用最适合的方式陪着你。"

开场："${config.opening}"`;
}

// 构建通用版指令（人格驱动版）
function buildGeneralInstructions(userName?: string): string {
  const persona = buildPersonaLayer();
  const hour = getChinaHour();
  const greeting = buildTimeAwareGreeting(userName || '', hour);
  
  return `${persona}

【对话节奏】每次2-4句，自然停顿，留空间给用户

【五种回应模式】
1. 情绪低落 → 先接住："嗯，听起来挺累的..." + 轻轻探索
2. 分享好事 → 共同庆祝："哇！怎么做到的？" + 邀请展开
3. 想倾诉 → 安静倾听：多用"然后呢？""是什么让你这么想？"
4. 卡住/沉默 → 降低门槛："不着急，想说什么都行"
5. 要离开 → 温暖收尾："好的，随时回来聊~"

【核心技术】
- 镜像：用自己的话复述用户感受，"听起来你觉得..."
- 命名：帮情绪找到名字，"这像是委屈？还是更像失望？"
- 下沉：当用户说"还好"时，"还好背后，有什么不太好的吗？"
- 留白：说完等用户回应，不急着追问

【对话示例】
用户："今天有点累" → "嗯，累了...是什么事让你特别累呢？"
用户："工作太多了" → "工作压下来确实挺累的。最头疼的是哪块？"
用户："还好吧" → "还好背后，有什么不太好的吗？可以聊聊。"
用户："心情不好" → "怎么了？我在这陪你。"
用户分享好事 → "哇，听起来不错！怎么做到的？"
用户沉默 → "不着急，想说什么都可以，我在这。"

【智能识别】
- 识别感恩相关内容 → 自动记录
- 识别需要专业帮助 → 温和推荐对应教练
- 用户问功能 → 调用导航

用户问你是谁："我是劲老师，愿意听你说🌿"

开场："${greeting}"`;
}

// 构建情绪教练指令（深度版）
function buildEmotionInstructions(userName: string): string {
  const persona = buildPersonaLayer();
  const name = userName || '';
  
  return `${persona}

【特殊身份】现在我是情绪教练模式，帮用户梳理情绪。

【四阶段自然流动】（不告诉用户阶段名称）
┌────────────────────────────────────────┐
│ 觉察 → 理解 → 反应 → 转化            │
│ "感受到什么" → "背后是什么" →        │
│ "通常怎么处理" → "想尝试什么新方式"   │
└────────────────────────────────────────┘

【核心技术】
- 镜像：用自己的话复述，"听起来你觉得..."
- 命名：帮情绪找到名字，"这像是委屈？还是更像失望？"
- 下沉：当用户说"还好"时，"还好背后，有什么不太好的吗？"
- 留白：说完等用户回应，不急着追问
- 回应优先：用户有问题/犹豫时，先回应再引导

【情绪强度响应】
- 低强度(1-3)：轻松对话，自然探索
- 中强度(4-6)：温柔陪伴，稳住情绪
- 高强度(7-10)：先稳住，"深呼吸，我在这陪你"

【难以开口的用户】
- 多用选择题："是工作的事？还是人际关系的事？"
- 给安全感："说什么都可以，我只是陪你聊聊"
- 不追问，等用户准备好

【对话节奏】每次2-4句，自然停顿，留空间给用户

【对话示例】
用户："今天有点烦" → "嗯，烦了...是什么事让你心烦呢？"
用户："也没什么大事" → "有时候不是大事，但就是堵在心里。想聊聊吗？"
用户说"还好" → "还好背后，有什么是不太好的吗？"
用户分享后沉默 → "嗯嗯，我听到了。你现在感觉怎么样？"

【完成信号】当用户有转化、想法变化时
→ "聊了挺多的，我帮你整理一下今天的收获？"

用户问你是谁："我是劲老师，陪你梳理情绪的朋友🌿"

开场："嗨${name ? name + '，' : ''}今天心情怎么样？🌿"`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '未授权访问，请先登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: '身份验证失败，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // 解析请求体获取模式和场景
    let mode = 'general';
    let scenario: string | null = null;
    try {
      const body = await req.json();
      mode = body.mode || 'general';
      scenario = body.scenario || null;
    } catch {
      // 没有请求体，使用默认模式
    }

    console.log('Voice chat mode:', mode, 'scenario:', scenario);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const OPENAI_PROXY_URL = Deno.env.get('OPENAI_PROXY_URL');
    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';

    // 获取用户昵称
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    
    const userName = userProfile?.display_name || '';

    let instructions: string;
    let tools: any[];

    if (scenario && SCENARIO_CONFIGS[scenario]) {
      // 场景模式优先
      instructions = buildScenarioInstructions(scenario, userName);
      tools = commonTools;
      console.log('Scenario mode activated:', scenario);
    } else if (mode === 'emotion') {
      // 情绪教练模式
      instructions = buildEmotionInstructions(userName);
      tools = [...commonTools, ...emotionTools];

      console.log('Emotion coach mode activated');
    } else if (mode === 'parent_teen') {
      // 家长版：获取问题类型配置
      const { data: profile } = await supabase
        .from('parent_problem_profile')
        .select('primary_problem_type')
        .eq('user_id', user.id)
        .maybeSingle();

      let problemType = null;
      if (profile?.primary_problem_type) {
        const { data: typeData } = await supabase
          .from('parent_problem_types')
          .select('*')
          .eq('type_key', profile.primary_problem_type)
          .single();
        problemType = typeData;
      }

      instructions = buildParentTeenInstructions(problemType, userName);
      tools = [...commonTools, ...parentTeenTools];

      console.log('Parent-teen mode activated, problem type:', profile?.primary_problem_type);
    } else if (mode === 'teen') {
      // 青少年版：检查绑定状态
      const { data: binding } = await supabase
        .from('parent_teen_bindings')
        .select('*')
        .eq('teen_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      instructions = buildTeenInstructions(binding);
      tools = [...commonTools, ...teenTools];

      console.log('Teen mode activated, has binding:', !!binding);
    } else {
      // 通用版
      instructions = buildGeneralInstructions(userName);
      tools = [
        ...commonTools,
        {
          type: "function",
          name: "recommend_coach",
          description: "当识别到用户需要专业教练深入指导时调用",
          parameters: {
            type: "object",
            properties: {
              coach_type: { 
                type: "string", 
                enum: ["emotion", "parent", "communication", "story", "gratitude"],
                description: "推荐的教练类型"
              },
              reason: { type: "string", description: "推荐理由" }
            },
            required: ["coach_type", "reason"]
          }
        },
        {
          type: "function",
          name: "recommend_tool",
          description: "当用户需要即时工具支持时调用",
          parameters: {
            type: "object",
            properties: {
              tool_type: { 
                type: "string", 
                enum: ["emotion_button", "breathing", "meditation", "declaration_card"],
                description: "推荐的工具类型"
              },
              reason: { type: "string", description: "推荐理由" }
            },
            required: ["tool_type", "reason"]
          }
        },
        {
          type: "function",
          name: "get_user_insights",
          description: "当用户询问自己最近的状态时调用",
          parameters: {
            type: "object",
            properties: {
              insight_type: { 
                type: "string", 
                enum: ["emotion_pattern", "gratitude_themes", "comprehensive"],
                description: "洞察类型"
              }
            },
            required: ["insight_type"]
          }
        }
      ];
    }

    // 请求 OpenAI Realtime session
    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview-2024-12-17",
        voice: mode === 'teen' ? "shimmer" : "echo",
        instructions: instructions,
        tools: tools,
        tool_choice: "auto",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        // 根据模式调整 token 限制：情绪模式需要更多空间表达，通用模式适中
        max_response_output_tokens: mode === 'emotion' ? 400 : 300,
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 1800 // 延长静默检测，给用户更多思考时间，避免抢话
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Realtime session created, mode:", mode);

    const realtimeProxyUrl = OPENAI_PROXY_URL 
      ? `${OPENAI_PROXY_URL}/v1/realtime`
      : 'https://api.openai.com/v1/realtime';

    return new Response(JSON.stringify({
      ...data,
      realtime_url: realtimeProxyUrl,
      mode: mode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating realtime session:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
