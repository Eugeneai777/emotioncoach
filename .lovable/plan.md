

# "学习"页面增加已购/已测测评板块

## 商业评估

当前"学习"按钮（底部导航）仅跳转 `/camps?filter=my`，只展示训练营。用户已购买的付费测评（情绪健康 ¥9.9、SCL-90、财富卡点等）和已完成的免费测评（中场觉醒力、女性竞争力等）**没有回看入口**，导致：

1. **付费价值感降低**：花钱买了测评却找不到在哪看结果，降低复购意愿
2. **断裂的转化闭环**：用户做完测评后无法方便地回顾结果→训练营转化缺少"再次触达"机会
3. **学习体验不完整**：训练营和测评是两大核心产品，只展示一半

**建议做法**：将 `/camps?filter=my` 页面升级为统一的"我的学习"页面，增加"已购/已测测评"板块，并保留"浏览更多测评"入口引导未购用户探索。

## 改动方案

### 1. `src/pages/CampList.tsx` — `filter=my` 模式增加测评板块

在现有"我的训练营"列表**下方**，新增"我的测评"区块：

- 查询数据源：
  - **付费测评**：`orders` 表 `status='paid'`，`package_key` in `['emotion_health_assessment', 'scl90_report', 'wealth_block_assessment', 'midlife_awakening_assessment']`
  - **免费已测**：`awakening_entries` 表，匹配 `type` in `['women_competitiveness', 'parent_ability', 'communication_parent', 'communication_teen']`（去重取最近一次）
- 每条测评卡片显示：测评名称、完成时间、状态标签（已购/已测）
- 点击跳转到对应测评页面（带历史记录 tab）
- 底部加"浏览更多测评"按钮 → `/assessment-picker`

### 2. 测评数据映射

复用 `AssessmentPicker.tsx` 中已有的映射关系：

```text
付费测评 package_key → 路由：
  emotion_health_assessment → /emotion-health
  scl90_report → /scl90
  wealth_block_assessment → /wealth-block
  midlife_awakening_assessment → /midlife-awakening

免费测评 type → 路由：
  women_competitiveness → /assessment/women_competitiveness
  parent_ability → /assessment/parent_ability
  communication_parent → /assessment/communication_parent
  communication_teen → /assessment/communication_teen
```

### 3. UI 结构（`filter=my` 模式内）

```text
┌─────────────────────────┐
│  ← 我的学习             │
├─────────────────────────┤
│ 📚 我的训练营            │
│  ┌──────────────────┐   │
│  │ 7天有劲训练营  进行中 │   │
│  └──────────────────┘   │
│  [浏览更多训练营]        │
├─────────────────────────┤
│ 📝 我的测评              │
│  ┌──────────────────┐   │
│  │ 💚 情绪健康测评 已购  │   │
│  │ 🧭 中场觉醒力   已测  │   │
│  └──────────────────┘   │
│  [浏览更多测评]          │
└─────────────────────────┘
```

### 4. 页面标题调整

`filter=my` 时标题从"我的训练营"改为"我的学习"，包含训练营+测评两个板块。

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/pages/CampList.tsx` | `filter=my` 模式增加测评查询和渲染板块 |

仅需修改一个文件，所有数据查询逻辑内联在已有的 `useQuery` 中，无需新增 hook。

