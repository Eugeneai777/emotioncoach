

## 财富测评语音解说教练

### 概述
在财富卡点测评完成后的结果页，新增一个"语音解说"入口按钮。用户点击后，启动与 AI 财富教练的实时语音对话，教练已掌握用户的完整测评数据（分数、卡点类型、AI 分析结果），可以回答用户关于测评结果的任何问题，并以教练引领的方式带领用户觉醒，自然过渡到训练营。

### 用户体验流程

```text
完成测评 → 查看结果页
                ↓
      看到"语音解说"按钮（带麦克风图标）
                ↓
         点击 → 启动语音对话
                ↓
   AI 教练主动开场（基于测评结果）
   "你好，我看到你的测评结果了，你的财富健康度是XX分，
    主要卡在[嘴穷/心穷...]这个模式上..."
                ↓
     用户可以随意提问测评中任何问题
                ↓
   教练通过 4 轮对话自然引领觉醒
   R1: 精准共情 → R2: 觉醒洞察 → R3: 即时价值 → R4: 自然过渡
                ↓
       用户感受到训练营的价值和必要性
```

### 实现方案

#### 1. 新建 Edge Function: `wealth-assessment-realtime-token`

创建专属的 Realtime Token 端点，复用现有 `vibrant-life-realtime-token` 的架构模式（OpenAI Realtime API），注入财富测评专属 prompt：

- 接收测评数据（healthScore、reactionPattern、dominantPoor、dominantEmotionBlock、dominantBeliefBlock、各维度分数、AI 分析结果）
- 构建"劲老师-财富觉醒教练"人设 prompt，包含：
  - 用户的完整测评画像（分数 + 卡点类型 + AI 洞察）
  - 4 阶段引领策略（共情 → 觉醒洞察 → 即时价值 → 自然转化）
  - 严格的行为规则（中文回复、2-4 句控制、不做销售而是教练引领）
  - 告别检测逻辑
- 返回 OpenAI Realtime session token + prompt

#### 2. 新建组件: `AssessmentVoiceCoach`

在 `src/components/wealth-block/` 下创建，作为结果页的语音入口：

- 一个醒目的 CTA 按钮（如渐变色 + 麦克风图标 + "和 AI 教练聊聊你的测评"）
- 点击后调用 `CoachVoiceChat` 组件，传入：
  - `tokenEndpoint="wealth-assessment-realtime-token"`
  - `coachEmoji="💎"`
  - `coachTitle="财富觉醒教练"`
  - `featureKey="realtime_voice_wealth_assessment"`
  - `mode="wealth_assessment"` 
- 将测评数据作为 query params 或 body 传递给 token 端点

#### 3. 修改 `WealthBlockResult.tsx`

在结果页合适位置（健康度仪表盘下方、三层分析之前）插入 `AssessmentVoiceCoach` 组件：

- 传入当前测评结果（result）、AI 洞察（aiInsight）、健康度分数
- 仅在 AI 分析加载完成后显示按钮（确保教练有完整数据）

#### 4. 修改 `CoachVoiceChat` 或 Token 端点

在现有的 `vibrant-life-realtime-token` 中新增 `wealth_assessment` mode，或创建独立端点（推荐独立端点，prompt 差异较大）：

- 教练开场白基于测评数据动态生成（如"我看到你的财富健康度是 65 分，主要卡在嘴穷模式..."）
- 工具调用可复用 `navigate_to`（引导用户跳转训练营页面）

#### 5. 注册 feature_key 和计费

- 在 `feature_definitions` 表中注册 `realtime_voice_wealth_assessment`
- 配置对应的时长限制和积分消耗规则

### 技术细节

#### Prompt 设计核心

```text
你是"劲老师"，专业的财富觉醒教练。
用户刚完成财富卡点测评，以下是他的完整画像：

【测评数据】
- 财富健康度：{healthScore}/100
- 反应模式：{patternName}
- 行为层主导卡点：{dominantPoor}（{behaviorScore}/50）
- 情绪层主导卡点：{dominantEmotion}（{emotionScore}/50）
- 信念层主导卡点：{dominantBelief}（{beliefScore}/50）

【AI 深度分析】
- 根因分析：{rootCauseAnalysis}
- 镜像陈述：{mirrorStatement}
- 核心卡点：{coreStuckPoint}

【你的任务】
1. 主动开场，用一句话点明用户最核心的卡点
2. 回答用户关于测评结果的任何问题
3. 通过对话引领用户看见自己的财富模式
4. 自然过渡到训练营（不是销售，是教练引领）

【对话风格】
- 温暖、口语化、2-4 句
- 每次回复都要有洞察力
- 始终使用简体中文
```

#### 数据传递流程

```text
WealthBlockResult (测评数据 + AI 洞察)
  → AssessmentVoiceCoach (封装数据)
    → CoachVoiceChat (UI 层)
      → wealth-assessment-realtime-token (Edge Function)
        → OpenAI Realtime API (带完整测评上下文的 prompt)
```

### 需要创建/修改的文件

| 文件 | 操作 |
|------|------|
| `supabase/functions/wealth-assessment-realtime-token/index.ts` | 新建 |
| `src/components/wealth-block/AssessmentVoiceCoach.tsx` | 新建 |
| `src/components/wealth-block/WealthBlockResult.tsx` | 修改（插入语音入口） |
| `supabase/config.toml` | 修改（注册新 function） |

### 数据库变更

- 在 `feature_definitions` 中插入 `realtime_voice_wealth_assessment` 记录（通过 SQL migration）

