## 背景

后台「测评管理」(`src/components/admin/AssessmentsManagement.tsx`) 只读取 `partner_assessment_templates` 表 —— 那是统一引擎 DynamicAssessmentPage 的模板库。而「情绪健康测评」(28 题三层诊断 + AI 教练 + 刚加的领取码 PDF) 是老硬编码页面 `EmotionHealthPage` (`/emotion-health`)，从未注册到该表，所以列表里没有。

截图里的「情绪健康快速筛查」是另一份 16 题 PHQ-9+GAD-7 模板 (`emotion_health_screening`)，跟你正在投放的不是同一个测评。

按你的选择：**不入库，仅在后台加快捷入口**，投放链接为 `/emotion-health`。

## 改动

### 1. AssessmentsManagement.tsx 顶部新增「内置测评」区块

在动态加载的合伙人模板卡片列表上方，加入一个写死的卡片数组(目前一项)：

- **情绪健康测评** 💚 — 内置 / 28 题 / 三层诊断
- 链接：`https://wechat.eugenewe.net/emotion-health`
- 复制链接按钮(复用现有 `handleCopy` 逻辑)
- 「在外部打开」按钮
- 「数据洞察」按钮 → 暂时跳转 `/admin/users-and-orders` 或显示 toast「数据洞察规划中」(取决于是否已有专门看板)
- 不显示「编辑」「上下线开关」(因为是硬编码)
- 用一个区分性的 Badge 「内置 · 硬编码」，与「统一引擎」区分

### 2. 视觉与代码组织

- 新建本地常量 `BUILT_IN_ASSESSMENTS`，方便后续追加(如 SCL90 旧版、家长测评 Lite 等)
- 抽一个轻量的 `BuiltInAssessmentCard` 内部子组件复用卡片样式，避免和动态卡片代码耦合
- 加一行小标题分隔：`「内置测评(硬编码页面，不可编辑)」` 与 `「合伙人模板(统一引擎)」`

### 3. 不动的部分

- 不向 `partner_assessment_templates` 写任何数据
- 不动 `EmotionHealthPage` 的题目/算分逻辑
- 不动路由
- 不动 `assessment_key=emotion_health_screening` 那条快速筛查记录

## 技术细节

```ts
const BUILT_IN_ASSESSMENTS = [
  {
    id: 'builtin-emotion-health',
    title: '情绪健康测评',
    emoji: '💚',
    description: '28 题三层诊断 + AI 教练解读 + 专属 PDF 领取码，专为 35+ 女性优化',
    question_count: 28,
    path: '/emotion-health',
  },
];

const getBuiltInUrl = (path: string) => `https://wechat.eugenewe.net${path}`;
```

「数据洞察」入口先指向已有的 `/admin/users-and-orders` 并附带 `?source=emotion_health` query(若该页未支持也无妨，后续再做)；如果你希望直接 disabled 也可以，只需告诉我偏好。

## 验证

- 后台「测评管理」页顶部出现「情绪健康测评」卡片，可复制 `wechat.eugenewe.net/emotion-health`、外部打开
- 现有合伙人模板列表渲染不受影响
- 没有数据库迁移
