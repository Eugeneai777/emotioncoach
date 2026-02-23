

## 优化 Claim 页面：先展示介绍，登录后再领取

### 现状问题

当前 `/claim?partner=xxx` 页面在 `useEffect` 中立刻调用 `claimEntry()`，该函数检测到未登录就直接跳转到 `/auth`。用户完全看不到自己将获得什么，体验不友好。

### 方案

将 Claim 页面改为两阶段：

1. **阶段一（无需登录）**：展示体验套餐介绍页 -- 显示合伙人为你准备的所有权益内容，底部一个"免费领取"按钮
2. **阶段二（点击领取后）**：检测登录状态，未登录则跳转 `/auth`（带 redirect 参数），已登录则直接调用后端领取

### 数据来源

介绍页的权益列表需要从后端获取该合伙人的配置。新增一个**无需登录**的查询逻辑：
- 先查 `partners` 表获取 `selected_experience_packages`
- 再查 `partner_experience_items` 表获取对应项目的展示信息（名称、图标、描述、价值）

由于 `partners` 表有 RLS 限制，改为通过一个新的公开 Edge Function 获取预览数据，或直接在前端用 anon key 查询 `partner_experience_items`（该表已对 anon 开放 SELECT），再结合一个轻量查询获取合伙人的 `selected_experience_packages`。

考虑到安全性和简洁性，最佳方案是：**新建一个无需认证的 Edge Function `get-partner-preview`**，传入 `partner_id`，返回合伙人名称和选中的体验包列表（仅展示信息，不含敏感数据）。

### 具体改动

#### 1. 新建 Edge Function：`supabase/functions/get-partner-preview/index.ts`

- 无需 Authorization
- 接收 `partner_id` 参数
- 查询 `partners` 表获取 `selected_experience_packages` 和 `status`
- 查询 `partner_experience_items` 获取展示信息
- 按 `selected_experience_packages` 过滤，返回权益列表
- 仅返回展示数据（name, icon, description, value），不返回敏感字段

#### 2. 重构 `src/pages/Claim.tsx`

新增状态：
- `preview`：加载中 / 展示介绍页 / 领取中 / 成功/失败等
- `previewItems`：从 `get-partner-preview` 获取的权益列表

流程变更：
```text
页面加载
  |
  v
调用 get-partner-preview（无需登录）
  |
  v
展示介绍页：
  - 标题："有人送你一份成长礼物"
  - 权益卡片列表（图标 + 名称 + 简述 + 价值）
  - 底部按钮："免费领取"
  |
  用户点击"免费领取"
  |
  v
检查登录状态
  ├── 未登录 → 跳转 /auth?redirect=/claim?partner=xxx
  └── 已登录 → 调用 claim-partner-entry（现有逻辑）
        |
        v
      显示领取结果（success / already-claimed / self-claim / error）
```

#### UI 设计

介绍页样式：
- 顶部：礼物图标 + "有人送你一份成长礼物"
- 中间：权益卡片网格或列表，每项包含图标、名称、描述、价值标签
- 底部：渐变色"免费领取"大按钮
- 整体保持当前的 teal/cyan 渐变风格

### 技术细节

- `ClaimStatus` 类型新增 `'preview'` 状态
- 页面加载时默认进入 `preview` 状态（而非 `loading`）
- `useEffect` 不再自动调用 `claimEntry()`，改为调用 `loadPreview()`
- 新增 `handleClaim()` 方法，由按钮点击触发，包含登录检查 + 领取逻辑
- 对于 `type=wealth_camp` 的训练营邀请流程保持不变

