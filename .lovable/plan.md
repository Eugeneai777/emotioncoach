

# SBTI 测评记录可见性 + 题库随机化（待实现）

## 当前状态

- 历史按钮仅在 `hasHistory && onShowHistory` 时显示，未登录用户永远看不到
- mini-app「学习」跳转 `/camps?filter=my`（训练营），与测评无关
- 题库扩充和随机抽题尚未实现

## 方案

### 1. DynamicAssessmentIntro 历史入口增强

**文件：`src/components/dynamic-assessment/DynamicAssessmentIntro.tsx`**

- 已登录有记录：保持现有「查看历史记录」按钮
- 已登录无记录：不显示（正常）
- 未登录（SBTI 等免费测评）：显示「登录后可保存记录」提示文字，点击跳转 `/auth`

### 2. mini-app 添加「我的测评」入口

**文件：`src/pages/MiniAppEntry.tsx`**

在 `exploreBlocks` 中新增一个「我的测评」卡片，路由指向一个汇总页（或直接跳转 `/my-page` 的测评 tab）。这样用户能从 mini-app 首页找到自己的测评记录。

### 3. 题库扩充至 61 题（数据库）

**数据库 `partner_assessment_templates`**：将 SBTI 的 `questions` JSON 从 31 题扩充至 61 题（每维度 4 题，15×4=60 + 1 DRUNK_TRIGGER）。新题延续自嘲扎心风格，维度映射和评分权重不变。

### 4. 前端随机抽题

**文件：`src/pages/DynamicAssessmentPage.tsx`**

当 `scoringType === 'sbti'` 时：
- 按 `dimension` 分组，每组随机选 2 题，DRUNK_TRIGGER 保留 1 题
- 整体打乱顺序，确保每次答题 31 道
- 用 `useMemo` + `phase` 依赖保证同一次做题不变，下次进入重新随机

### 涉及文件

| 文件/资源 | 改动 |
|-----------|------|
| 数据库 `partner_assessment_templates` | SBTI questions 扩充至 61 题 |
| `src/pages/DynamicAssessmentPage.tsx` | SBTI 随机抽题逻辑 |
| `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx` | 未登录时显示登录引导 |
| `src/pages/MiniAppEntry.tsx` | 新增「我的测评」入口卡片 |

### 不影响范围

- 评分逻辑（`sbti-scoring.ts`）不变
- 其他测评不受影响
- 人格匹配（汉明距离）不变

