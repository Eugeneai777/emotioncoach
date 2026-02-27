
# 修复亲子沟通测评：清理重复数据 + 对齐财富卡点架构

## 问题

数据库中有 9 条记录，但用户只做过 1 次测评。原因：
1. React StrictMode 导致 `saveResult` 被调用两次（每次产生 2 条）
2. 多次进入结果页（调试/重试）累积了更多重复

## 修改方案

### 第一步：清理数据库重复记录

通过数据操作工具删除重复记录，保留每组相同分数中最早的一条。当前 9 条将精简为 2 条（两组不同分数各保留 1 条）。

### 第二步：保存逻辑从 CommAssessmentResult 移到父页面

**对齐财富测评模式**：在 `CommunicationAssessment.tsx` 的 `handleComplete` 中完成数据库保存，`CommAssessmentResult` 变为纯展示组件。

**`src/pages/CommunicationAssessment.tsx`**：
- `handleComplete` 中自动保存到数据库（参考财富测评 `handleComplete`）
- 新增 `inviteCode`、`isSaved` 状态，作为 props 传给 `CommAssessmentResult`
- 新增 `handleViewDetail` 函数，支持从历史记录查看完整结果

**`src/components/communication-assessment/CommAssessmentResult.tsx`**：
- 移除 `saveResult`、`useEffect`、`saveCalledRef`、`saving` 等所有保存逻辑
- 新增 props：`inviteCode`（从父组件传入）
- 移除骨架屏（保存在进入结果页前已完成）
- 变为纯展示组件，不再直接操作数据库

### 第三步：历史记录添加"查看详情"

**`src/components/communication-assessment/CommAssessmentHistory.tsx`**：
- 新增 `onViewDetail` prop
- 每条记录增加"查看详情"按钮（对齐 `WealthBlockHistory`）

**`src/pages/CommunicationAssessment.tsx`**：
- 实现 `handleViewDetail`：从历史记录的 `answers` 字段重建 result 对象，切换到结果页展示

### 第四步：趋势图优化

**`src/components/communication-assessment/CommAssessmentTrend.tsx`**：
- 增加六维分层折线显示（倾听/共情/边界/表达/冲突/理解），对齐财富测评趋势图风格

## 涉及文件

| 文件 | 操作 |
|------|------|
| `communication_pattern_assessments` 表数据 | 删除 7 条重复记录 |
| `src/pages/CommunicationAssessment.tsx` | 重构：保存逻辑移入 + handleViewDetail |
| `src/components/communication-assessment/CommAssessmentResult.tsx` | 简化为纯展示组件 |
| `src/components/communication-assessment/CommAssessmentHistory.tsx` | 新增查看详情按钮 |
| `src/components/communication-assessment/CommAssessmentTrend.tsx` | 增强趋势图 |
