## 问题根因
当前后台点击「下载 PDF 报告」打开的是：
`/assessment/male_midlife_vitality?recordId=小王子的结果ID&autoSave=pdf&adminPdf=1`

但结果页里有两处仍然默认使用当前登录用户（管理员炯谦）的上下文：

1. `DynamicAssessmentResult` 会用 `useAuth()` 的当前用户去查 `profiles`，所以 PDF 报告页眉姓名显示成管理员「炯谦」。
2. 外跳加载历史记录时仍走 `calculateScore(scoringType, record.answers, allQuestions, ...)`，而「男人有劲状态」答题时题目会随机打乱；历史答案如果按当时题序保存，再用当前重新洗过的题序重算，就可能把分数/维度也算错，看起来像导出了当前管理员/当前页面的报告。

## 修复方案

### 1. 给管理员 PDF 链接带上被下载用户身份
在 `AssessmentRespondentDrawer.tsx` 生成下载链接时追加只用于展示的参数：
- `subjectUserId=row.userId`
- `subjectName=row.displayName`
- `subjectAvatar=row.avatarUrl`

按钮 toast 改成「已打开报告并自动下载 PDF」。

### 2. 结果页区分“报告所属用户”和“当前登录用户”
在 `DynamicAssessmentPage.tsx` 中解析上述参数，并传给 `DynamicAssessmentResult`。

在 `DynamicAssessmentResult.tsx` 中新增 `subjectProfile` 入参：
- 分享卡、PDF 报告、领取卡优先使用 `subjectProfile`
- 只有没有 `subjectProfile` 时，才回退到当前登录用户 `useAuth()` 的 profile

这样管理员打开小王子报告时，PDF 页眉会显示小王子，而不是炯谦。

### 3. 管理员/历史记录导出不再重新洗题重算
`handleViewHistoryRecord(record)` 增加逻辑：
- 如果数据库记录已有 `dimension_scores / total_score / primary_pattern`，优先直接用数据库保存的结果组装 `ScoringResult`
- 只有旧记录缺少这些字段时，才回退到用答案重新计算

这能避免随机题序造成的二次计算偏差，确保导出的就是该条 `recordId` 对应的原始测评报告。

### 4. 自动下载只在目标记录加载完成后触发
保留当前 `autoSave=pdf` 自动下载机制，但它会基于第 2、3 步后的正确 subject/profile/result 执行，避免抢在他人记录替换完成前导出当前用户数据。

## 涉及文件
- `src/components/admin/AssessmentRespondentDrawer.tsx`
- `src/pages/DynamicAssessmentPage.tsx`
- `src/components/dynamic-assessment/DynamicAssessmentResult.tsx`

## 验收标准
后台选择「小王子」这一行点击「下载 PDF 报告」后：
- 新页面打开的是 `recordId=小王子结果ID`
- 页面/导出 PDF 的姓名为「小王子」
- 分数、主导类型、维度分数来自该条记录本身
- 不会再导出当前管理员「炯谦」的报告