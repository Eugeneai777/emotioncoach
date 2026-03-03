

# 中场觉醒力测评 — 加入 AI 深度分析

## 目标

在测评结果页加入 AI 生成的个性化深度分析，实现四个核心价值：
1. 即时觉察 — 让用户在报告中被"看见"，击中痛点
2. 深度启发 — AI 基于六维数据生成有深度的洞察，而非模板文案
3. 精准引流 — 基于分析结果自然推荐教练/活动/训练营
4. 数据沉淀 — AI 分析结果存入数据库，供后续产品迭代参考

## 实现方案

### 1. 创建 Edge Function: `midlife-ai-analysis`

新建后端函数，接收用户的测评数据（六维得分、人格类型、核心指标、原始答案），调用 Lovable AI（Gemini Flash）生成个性化分析报告。

AI 输出结构化 JSON，包含以下模块：

| 模块 | 内容 | 用途 |
|------|------|------|
| `coreInsight` | 1段话，精准描述用户当前状态 | 让用户感到"被看见" |
| `painPoint` | 击中用户核心痛点的一句话 | 制造共鸣 |
| `blindSpot` | 用户可能忽略的盲区 | 深度启发 |
| `breakthrough` | 个性化突破路径（3步） | 可操作性 |
| `microAction` | 今天就能做的一件小事 | 立即行动 |
| `coachInvite` | 温和的深聊邀请语 | 引流到 AI 教练 |
| `recommendedActivity` | 推荐的训练营/活动类型 | 精准匹配活动 |
| `userTags` | 3-5个用户画像标签 | 数据沉淀，用户分类 |

### 2. 数据库：扩展现有表

在 `midlife_awakening_assessments` 表新增 `ai_analysis` (JSONB) 列，将 AI 分析结果和用户画像标签一并存储，便于后续数据分析和产品迭代。

### 3. 前端：结果页新增 AI 分析卡片

在 `MidlifeAwakeningResult.tsx` 中，在人格类型卡片和雷达图之间插入 AI 分析区域：

- **加载态**：答题完成后自动触发 AI 分析，显示"AI正在为你生成深度洞察..."的动画
- **展示态**：以卡片组形式展示各模块
  - "看见你" 卡片 — `coreInsight` + `painPoint`（渐变背景，视觉突出）
  - "盲点提醒" 卡片 — `blindSpot`
  - "突破路径" 卡片 — 3步 `breakthrough`，带序号
  - "今日微行动" 卡片 — `microAction`，可打勾完成
  - "深聊邀请" 卡片 — `coachInvite`，带"开始对话"按钮

### 4. 流程调整

```text
答题完成 --> 保存结果到数据库
               |
               +--> 同时调用 AI 分析（异步，不阻塞结果展示）
               |
         显示结果页（人格类型 + 雷达图）
               |
         AI 分析完成 --> 插入分析卡片 + 更新数据库
```

结果页先展示基础数据（人格类型、雷达图），AI 分析加载完成后平滑插入，用户不需要等待。

### 5. 引流逻辑

AI 分析中的 `recommendedActivity` 和 `coachInvite` 将与现有的推荐系统联动：
- 根据人格类型和 AI 分析结果，精准推荐训练营
- "深聊邀请"按钮直接跳转到 AI 教练对话，携带分析上下文

---

## 技术细节

**新建文件：**
- `supabase/functions/midlife-ai-analysis/index.ts` — Edge Function
- `src/components/midlife-awakening/MidlifeAIAnalysis.tsx` — AI 分析展示组件

**修改文件：**
- `src/pages/MidlifeAwakeningPage.tsx` — 在 `handleComplete` 中异步调用 AI 分析
- `src/components/midlife-awakening/MidlifeAwakeningResult.tsx` — 嵌入 AI 分析组件

**数据库迁移：**
- `ALTER TABLE midlife_awakening_assessments ADD COLUMN ai_analysis JSONB DEFAULT NULL;`

**Edge Function 核心逻辑：**
- 使用 `google/gemini-2.5-flash` 模型
- System prompt 注入六维得分、人格类型、核心指标
- 要求输出结构化 JSON（通过 prompt 约束）
- 处理 429/402 错误并返回友好提示
- 分析结果回写数据库

