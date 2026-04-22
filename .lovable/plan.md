

## 问题：15228901521（365会员）在情绪教练被限 5 分钟

### 根本原因

`get_voice_max_duration` RPC 优先级有 bug，它把 `subscriptions` 表里的**任意 active 行**当作「主套餐」，导致 365 会员被一次性测评订阅顶替。

具体到该用户：
- ✅ `orders` 有 2 笔 `member365`（真正的 365 会员）→ 应不限时
- ❌ `subscriptions` 有一行 `package_key='emotion_health_assessment'`（¥9.9 测评，被错误写入了 `subscriptions` 表）`status='active'`
- RPC 第 1 步命中 `emotion_health_assessment`，直接返回 → `package_feature_settings` 中该套餐没有针对 `realtime_voice_emotion` 的配置 → 走默认 **5 分钟**

数据验证：
- `member365` 套餐对 `realtime_voice_emotion` 配置 = `NULL`（不限时）✅
- `basic` 套餐 = 5 分钟（应该就是非会员的体验限制）
- `emotion_health_assessment` 无配置（被误用为最高优先级）

不影响其它教练的核心逻辑（统一走同一 RPC，但其它教练用户多数没有这种"测评订阅污染"），但本质上是同类风险。

### 修复方案

**只改后端 RPC `get_voice_max_duration`，不动前端**：让会员/付费套餐永远高于一次性测评订阅。

新优先级（从高到低）：
1. `subscriptions.status='active'`，且 package 是「会员/订阅类」（`member365`、`custom` 等真正承载权益的套餐）
2. `orders.status='paid'`，按以下优先级匹配 `package_key`：
   - 会员级：`member365` → `custom`
   - 高级单买：`premium_99` → `standard_49`
   - 体验：`basic` / `trial`
   - 其它一次性产品（如 `emotion_health_assessment`、`scl90_report`、`wealth_block_assessment`、`store_product_*`）**全部跳过**，不参与时长判定
3. 最后回退 `basic`（5 分钟）

具体实现：
- 在 RPC 中维护一个白名单数组 `MEMBERSHIP_PACKAGES = ['member365','custom']` 和 `ENTITLEMENT_PACKAGES = ['member365','custom','premium_99','standard_49','basic','trial']`
- 第 1 步：`subscriptions` 仅认 `MEMBERSHIP_PACKAGES`
- 第 2 步：`orders` 用 `ORDER BY array_position(ENTITLEMENT_PACKAGES, package_key)` 取最高级，过滤掉非权益类一次性订单

### 数据修复（一次性）

对该用户（`a77c8c50-4c21-4f47-be9d-2b6e29a61f8f`）的脏数据：
- `subscriptions` 中 `subscription_type='emotion_health_assessment'` 的行 → 标记 `status='completed'`（避免 RPC 再误命中）

并广播一次清理：把 `subscriptions` 中所有 `subscription_type` 在「测评 / 单次产品」白名单内、且 `status='active'` 的记录全部归档为 `completed`（这些本就不应出现在 `subscriptions`）。

### 影响面（确认安全）

- ✅ 365 会员的所有 AI 教练（情绪 / 亲子 / 有劲生活 / 财富 / 青少年 / 沟通）：均通过同一 RPC + `realtime_voice_*` feature key 判定，会员套餐对所有这些 feature 的配置都是 `NULL`（不限时），修复后恢复正常
- ✅ 训练营在前端 `checkQuota` 里已直接 `return true` 跳过限制（416-425 行），不受影响
- ✅ 非会员、未购套餐用户：仍回退 `basic` = 5 分钟，行为不变
- ✅ 一次性测评购买者：本就不应享语音教练权益，修复后回退 basic 5 分钟，符合产品定价

### 改动文件

| 类型 | 路径 | 改动 |
|---|---|---|
| DB Migration | 新建 | 重写 `get_voice_max_duration` RPC + 一次性 UPDATE 清理 subscriptions 脏数据 |
| 前端 | 无 | 不动 |

### 工时
0.4 天（RPC 重写 + 数据清理 + 6 个教练入口回归）

