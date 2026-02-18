

# 35+女性竞争力测评（含AI元素）

## 产品定位
面向35岁以上女性，评估她们在职场、个人品牌、情绪韧性、财务独立、关系经营等维度的综合竞争力。通过场景化题目激发自我觉察，AI 深度解读个性化报告并提供突破建议。

## 测评维度设计（5大维度，25-30题）

| 维度 | 英文Key | 核心测量 | 示例场景题 |
|------|---------|----------|-----------|
| 职场生命力 | career | 职场信心、跳槽勇气、谈薪能力、学习力 | "面试官问'你35岁了还换工作？'，你内心..." |
| 个人品牌力 | brand | 表达能力、专业影响力、社交资产 | "同事升职做了你曾做的岗位，你会..." |
| 情绪韧性 | resilience | 抗压、自我修复、边界感 | "被领导当众批评后，你需要多久恢复..." |
| 财务掌控力 | finance | 理财认知、消费独立、被动收入意识 | "你的收入来源有几个？如果失业..." |
| 关系经营力 | relationship | 家庭平衡、社交圈质量、求助能力 | "遇到困难时，你能想到3个以上可以求助的人吗" |

## AI元素设计（3个层次）

### AI层次1：智能追问（答题中）
在关键题目（高分/低分触发），AI 实时追问一个开放式问题，获取用户真实想法。
- 例：用户选了"完全不敢谈加薪" -> AI追问："你觉得不敢谈的原因是什么？"
- 复用现有 `FollowUpDialog` 组件和 `smart-question-followup` Edge Function 的模式

### AI层次2：AI深度解读报告（结果页）
调用 Lovable AI 生成个性化分析报告，包含：
- 竞争力画像（你是哪种类型：蛰伏者/觉醒者/绽放者/引领者）
- 最大优势维度 + 最需突破维度
- 基于用户原话的精准洞察
- 3条个性化行动建议
- 复用 `analyze-wealth-blocks` 的 Edge Function 模式

### AI层次3：AI教练对话（结果页后）
测评完成后可进入"AI竞争力教练"对话，复用 `AssessmentCoachChat` 的流式对话模式，针对测评结果进行深入探索和指导。

## 技术架构（复用现有模式）

### 新建文件清单

**数据与类型**
- `src/components/women-competitiveness/competitivenessData.ts` — 题目、维度定义、计分逻辑、结果类型

**页面组件**
- `src/pages/WomenCompetitiveness.tsx` — 主页面（管理状态、Tab切换）
- `src/components/women-competitiveness/CompetitivenessStartScreen.tsx` — 开始介绍页
- `src/components/women-competitiveness/CompetitivenessQuestions.tsx` — 答题组件
- `src/components/women-competitiveness/CompetitivenessResult.tsx` — 结果展示页

**Edge Functions**
- `supabase/functions/analyze-competitiveness/index.ts` — AI 深度解读（非流式，调用 Lovable AI）

### 修改文件
- `src/App.tsx` — 添加路由 `/women-competitiveness`
- `supabase/config.toml` — 注册新 Edge Function

### 数据库
- 复用现有 `assessment_results` 表，`assessment_type` 设为 `women_competitiveness`
- 无需新建表

## 实现步骤

### 步骤1：数据层（competitivenessData.ts）
- 定义 5 大维度类型和 25-30 道场景化题目
- 每题关联维度，使用 1-5 分制（同财富测评标签风格）
- 计分函数：按维度汇总，生成竞争力指数（0-100）和竞争力类型
- 竞争力类型：蛰伏期（0-40）、觉醒期（41-60）、绽放期（61-80）、引领期（81-100）

### 步骤2：开始页（CompetitivenessStartScreen.tsx）
- 标题、痛点描述、测评亮点
- "开始测评"按钮
- 复用 `AssessmentStartScreen` 的设计风格

### 步骤3：答题组件（CompetitivenessQuestions.tsx）
- 逐题展示 + 进度条 + 维度标签
- 选项点击 300ms 自动跳转
- 关键题触发 AI 追问（复用 FollowUpDialog 模式）
- 完成后计算结果并回调

### 步骤4：结果页（CompetitivenessResult.tsx）
- 竞争力雷达图（5维度，使用 Recharts RadarChart）
- 竞争力指数仪表盘
- 竞争力类型卡片（蛰伏/觉醒/绽放/引领）
- AI 深度解读区域（调用 Edge Function 生成）
- "进入AI教练"按钮（可后续扩展）

### 步骤5：AI解读 Edge Function（analyze-competitiveness）
- 接收维度得分、竞争力类型、用户追问原话
- 通过 Lovable AI（google/gemini-3-flash-preview）生成个性化报告
- 提示词针对35+女性群体优化，使用温暖共情的语气
- 返回 markdown 格式的分析报告

### 步骤6：路由注册
- App.tsx 添加 `/women-competitiveness` 路由
- config.toml 注册 `analyze-competitiveness` 函数

## 题目风格示例

```text
维度：职场生命力
题目：公司裁员名单里出现了和你同龄的同事，你的第一反应是——
选项：
1 完全不是我 - "跟我没关系"
2 偶尔这样 - "有点担心但很快忘了"
3 有时会 - "会想想自己的处境"
4 经常这样 - "开始焦虑地刷招聘网站"
5 太像我了 - "整晚睡不着，觉得下一个就是自己"

维度：个人品牌力
题目：有人邀请你在行业活动上做分享，你的第一反应是——
选项：
1 完全不是我 - "好机会，马上答应"
2 偶尔这样 - "有点紧张但愿意试试"
3 有时会 - "犹豫，觉得自己没什么好分享的"
4 经常这样 - "直接拒绝，觉得自己不够格"
5 太像我了 - "光想想就手心出汗，绝对不行"
```

## 变现路径（可选后续）
- 免费版：看基础雷达图 + 竞争力类型
- 付费版：AI深度解读报告 + AI教练对话
- 复用现有 `AssessmentPayDialog` 组件，`packageKey` 设为 `women_competitiveness`

