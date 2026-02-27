

# 青少年家长 · 亲子沟通模式测评

## 概述

构建一套双视角（家长 + 青少年）亲子沟通模式测评系统，包含 24 道专业量表题目，识别沟通模式类型，输出多维度雷达图、AI 个性化建议，并引导进入亲子教练对话。

---

## 一、测评设计

### 沟通模式分类（4 种类型）
| 类型 | 标签 | 特征 |
|------|------|------|
| controlling | 控制指令型 | 高要求、低回应，习惯命令和说教 |
| dismissive | 忽视回避型 | 低参与、情感疏离，回避冲突 |
| anxious | 焦虑过度型 | 高焦虑、过度保护，边界模糊 |
| democratic | 民主共情型 | 高回应、高引导，尊重与倾听 |

### 评估维度（6 维度，用于雷达图）
- **倾听能力** - 是否真正听到孩子的声音
- **情感回应** - 对孩子情绪的回应质量
- **边界设定** - 规则与自由的平衡
- **表达方式** - 沟通中的语言和态度
- **冲突处理** - 分歧时的应对方式
- **共情理解** - 站在对方角度理解的能力

### 题目结构（24 题）
- 家长版 24 题 + 青少年版 24 题（对应同一维度，不同视角措辞）
- 每维度 4 题，0-3 四级评分（从不/偶尔/经常/总是）
- 双视角完成后可生成"认知差异分析"

---

## 二、数据库

### 新建表：`communication_pattern_assessments`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| perspective | TEXT | 'parent' 或 'teen' |
| linked_assessment_id | UUID | 关联对方的测评 ID（双视角匹配） |
| listening_score | INT | 倾听能力得分 |
| empathy_score | INT | 情感回应得分 |
| boundary_score | INT | 边界设定得分 |
| expression_score | INT | 表达方式得分 |
| conflict_score | INT | 冲突处理得分 |
| understanding_score | INT | 共情理解得分 |
| primary_pattern | TEXT | 主要沟通模式 |
| secondary_pattern | TEXT | 次要沟通模式 |
| answers | JSONB | 原始答案 |
| ai_analysis | JSONB | AI 分析结果 |
| invite_code | TEXT | 邀请码（家长生成，青少年输入后匹配） |
| created_at | TIMESTAMPTZ | 创建时间 |

RLS 策略：用户只能查看/创建自己的记录。

---

## 三、前端组件

### 1. 数据配置文件
**`src/components/communication-assessment/communicationAssessmentData.ts`**
- 4 种沟通模式的详细配置（名称、描述、emoji、改善建议）
- 6 个维度的定义
- 家长版 24 题 + 青少年版 24 题
- 计算逻辑：维度得分 -> 模式识别 -> 结果对象

### 2. 介绍页
**`src/components/communication-assessment/CommAssessmentStartScreen.tsx`**
- 复用情绪健康测评的介绍页模式（痛点共鸣 + 权威背书 + 产出预览）
- 聚焦亲子沟通场景的痛点（"明明是为TA好，为什么TA不听？"）
- 视角选择入口（我是家长 / 我是青少年）

### 3. 答题组件
**`src/components/communication-assessment/CommAssessmentQuestions.tsx`**
- 复用 EmotionHealthQuestions 的答题模式（四级评分按钮、层间过渡动画）
- 适配家长/青少年两套题库

### 4. 结果页
**`src/components/communication-assessment/CommAssessmentResult.tsx`**
- **沟通模式卡片**：主模式 + 次模式识别
- **六维雷达图**：使用 recharts RadarChart（复用现有雷达图模式）
- **维度详解**：每个维度的得分解读
- **双视角对比**（如有）：家长 vs 青少年认知差异可视化
- **CTA**：引导进入亲子教练对话

### 5. AI 个性化建议
**`src/components/communication-assessment/CommAssessmentAIInsight.tsx`**
- 调用 Edge Function 基于测评结果生成个性化沟通改善建议
- 3 条针对性建议 + 1 个本周练习

### 6. 邀请码组件
**`src/components/communication-assessment/InviteCodeSection.tsx`**
- 家长完成后生成 6 位邀请码
- 青少年输入邀请码关联双方测评

### 7. 页面路由
**`src/pages/CommunicationAssessment.tsx`**
- 路由：`/communication-assessment`
- 整合上述组件的主页面，管理流程状态

---

## 四、Edge Function

### `generate-comm-assessment-insight`
- 接收测评结果（维度得分 + 模式类型 + 视角）
- 使用 AI 生成个性化沟通改善建议
- 如有双视角数据，额外生成认知差异分析
- 返回结构化 JSON（建议 + 练习 + 差异分析）

---

## 五、实现顺序

1. 数据库迁移（创建表 + RLS）
2. 数据配置文件（题库 + 模式定义 + 计算逻辑）
3. 介绍页 + 答题组件
4. 结果页（雷达图 + 模式卡片）
5. Edge Function（AI 建议生成）
6. 邀请码 + 双视角对比
7. 路由注册 + 入口集成

