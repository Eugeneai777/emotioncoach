

## Plan: 仅显示已购买/领取/完成的测评

**目标**：`/assessment-picker` 页面只展示当前用户已拥有的测评内容。

### 判断规则

| 测评 | 判断方式 |
|------|---------|
| 情绪健康、SCL-90、财富卡点 | orders 表中存在 `status='paid'` 的对应 package_key 记录 |
| 中场觉醒力、女性竞争力、家长应对能力、亲子沟通(家长/青少年版) | awakening_entries 表中存在对应 type 的记录（完成过才显示） |

### 映射表

```text
assessment_id → package_key (付费) 或 awakening_entries type (免费)

emotion-health     → orders: emotion_health_assessment
scl90              → orders: scl90_report
wealth-block       → orders: wealth_block_assessment
midlife-awakening  → awakening_entries: midlife_awakening
women-competitiveness → awakening_entries: women_competitiveness
parent-ability     → awakening_entries: parent_ability
communication-parent → awakening_entries: communication_parent
communication-teen → awakening_entries: communication_teen
```

### 修改文件：`src/pages/AssessmentPicker.tsx`

1. **新增 `useOwnedAssessments` hook**（在同一文件内）：
   - 查询 orders 表：获取当前用户 `status='paid'` 且 `package_key in ('emotion_health_assessment', 'scl90_report', 'wealth_block_assessment')` 的记录
   - 复用已有的 `useCompletedAssessments` hook 结果（awakening_entries 查询）
   - 合并两个来源，返回 `Set<assessment_id>` 表示用户拥有的测评

2. **过滤显示逻辑**：
   - 用 `ownedSet` 过滤每个 category 的 assessments
   - 如果某个 category 过滤后无测评，则整个 category 不显示
   - 如果用户未登录或全部 category 为空，显示空状态提示

3. **更新页面文案**：
   - 标题从"选一个最想了解的方向"改为"我的测评"
   - 副标题从"每个测评都免费，结果即时生成"改为"已购买和已完成的测评"
   - 空状态提示："暂无可用测评，购买套餐或完成体验后将在此显示"

### 技术实现要点

- package_key 到 assessment_id 的反向映射：`{ emotion_health_assessment: 'emotion-health', scl90_report: 'scl90', wealth_block_assessment: 'wealth-block' }`
- 免费测评直接复用已有 `completedMap`：有记录即表示拥有
- 两个查询并行加载，合并后过滤

