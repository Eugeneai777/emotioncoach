# 职场场景同时推荐两个测评

## 问题

当前 `career` topic 只映射了一个测评（35+女性竞争力），AI 只会推荐一个。需求是：如果用户两个都没买，应该同时推荐「35+女性竞争力测评」和「中场觉醒力测评」。

## 改动

### 1. `supabase/functions/youjin-life-chat/index.ts`

- 新增 `midlife` 条目到 `TOPIC_ASSESSMENT_MAP`：
  ```typescript
  midlife: { title: "中场觉醒力测评", route: "/assessment/midlife_awakening", desc: "6维度·30题·8分钟", price: "专业版", packageKey: "midlife_awakening_assessment" },
  ```
- 修改 `buildTopicPrompt`：当 `topic === 'career'` 时，收集 `career` 和 `midlife` 两个测评中未完成的，全部推荐。具体逻辑：
  - 两个都未完成 → prompt 要求 AI 同时推荐两个，输出两个 `[ASSESSMENT]` 标记
  - 只剩一个未完成 → 只推荐那一个
  - 都完成 → 推荐【7天有劲】训练营

### 2. `src/pages/YoujinLifeChat.tsx`

- `ASSESSMENT_PACKAGE_KEYS` 数组增加 `"midlife_awakening_assessment"`，确保查询已购状态时覆盖此测评。

## 涉及文件


| 文件                                             | 操作                                                     |
| ---------------------------------------------- | ------------------------------------------------------ |
| `supabase/functions/youjin-life-chat/index.ts` | 增加 midlife 映射，career 场景支持双测评推荐                         |
| `src/pages/YoujinLifeChat.tsx`                 | ASSESSMENT_PACKAGE_KEYS 加 midlife_awakening_assessment |
