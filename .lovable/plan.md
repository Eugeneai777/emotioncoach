

## 影响分析与方案选择

### 现有业务逻辑梳理

当前 `/camps` 页面有两种模式：
1. **无 filter 参数**：公开目录，显示所有 `camp_templates`（按分类标签切换），任何人可见
2. **`?filter=active` 或 `?filter=completed`**：查 `training_camps` 表，只显示用户自己的训练营实例

`/my-page` 的"训练营"入口当前指向 `/camps`（无参数），即进入公开目录。

### 方案对比

| 方案 | 改动内容 | 对现有逻辑的影响 |
|------|---------|----------------|
| **A：新增 `?filter=my` 模式** | 在 CampList.tsx 的 `filterParam` 分支中新增 `my` 处理，MyPage 入口改为 `/camps?filter=my` | **无影响**。原有无参数（公开目录）、`active`、`completed` 三种模式完全不动，只是多加一个分支 |
| **B：新建独立页面 `/my-camps`** | 新建 `MyCamps.tsx`，新增路由，MyPage 入口改为 `/my-camps` | **无影响**。完全独立页面，不碰 CampList.tsx |
| **C：改造 CampList 默认行为** | 让 `/camps` 默认根据登录态自动切换显示"我的"或"全部" | **有影响**。改变了现有公开目录的默认行为，可能影响从推广页、分享链接等入口进入的体验 |

### 推荐

**方案 A**（新增 `?filter=my`）：零影响现有逻辑，改动最小，复用现有组件。

- `src/pages/MyPage.tsx`：训练营 route 从 `/camps` → `/camps?filter=my`
- `src/pages/CampList.tsx`：在 `if (filterParam)` 分支中增加 `my` 的处理逻辑
  - 查询 `user_camp_purchases`（已购）+ `training_camps`（active/completed），合并去重
  - 每项显示状态标签（已购未开营 / 进行中 Day X / 已完成）
  - 底部加"浏览更多训练营"按钮跳转 `/camps`

现有的无参数公开目录、`?filter=active`、`?filter=completed` 三种模式完全不受影响。

