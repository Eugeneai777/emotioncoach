

## 财富觉醒训练营兑换码兑换页面

### 目标

创建一个独立的训练营兑换页面（`/wealth-camp-activate`），允许用户通过兑换码免费开通财富觉醒训练营，流程与现有的财富测评激活码页面（`/wealth-block-activate`）保持一致的交互模式。

### 整体流程

```text
用户访问 /wealth-camp-activate
  -> 输入兑换码
  -> 未登录？弹窗提示登录，暂存兑换码到 localStorage
  -> 已登录？调用后端验证兑换码
  -> 后端验证通过 -> 创建 user_camp_purchases 记录（price=0, 免费开通）
  -> 标记兑换码为已使用
  -> 前端跳转到训练营介绍页（/wealth-camp-intro）开始训练
```

### 需要的变更

#### 1. 新建数据库表：`wealth_camp_activation_codes`

复用现有 `wealth_assessment_activation_codes` 的结构，新建一张训练营专用的兑换码表：

| 列名 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | text | 兑换码（唯一） |
| batch_name | text | 批次名称 |
| source_channel | text | 来源渠道 |
| is_used | boolean | 是否已使用 |
| redeemed_by | uuid | 兑换用户 ID |
| redeemed_at | timestamptz | 兑换时间 |
| expires_at | timestamptz | 过期时间 |
| created_at | timestamptz | 创建时间 |

#### 2. 新建后端函数：`redeem-camp-activation-code`

核心逻辑（参考现有 `redeem-activation-code`）：

- 验证用户身份（JWT）
- 验证兑换码有效性（存在、未使用、未过期）
- 检查用户是否已购买训练营（查询 `user_camp_purchases`）
- 创建购买记录（`user_camp_purchases` 表，price=0, payment_method='activation_code'）
- 标记兑换码为已使用
- 返回成功信息

#### 3. 新建前端页面：`/wealth-camp-activate`

参考现有 `WealthBlockActivate.tsx` 的 UI 和交互模式：

- 主题色保持琥珀/橙色渐变（与训练营风格统一）
- 输入框：兑换码输入（自动大写，tracking-widest 等宽字体）
- 登录检测：未登录用户先引导登录，兑换码暂存 `localStorage`
- 兑换成功：显示成功动画，2 秒后跳转到 `/wealth-camp-intro`
- 信息卡片：展示训练营核心权益（7天冥想、财富教练对话、打卡社区等）

#### 4. 路由注册

在 `App.tsx` 中添加 `/wealth-camp-activate` 路由。

### 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| 数据库迁移 | 新建 | 创建 `wealth_camp_activation_codes` 表 + RLS 策略 |
| `supabase/functions/redeem-camp-activation-code/index.ts` | 新建 | 训练营兑换码后端验证和开通 |
| `src/pages/WealthCampActivate.tsx` | 新建 | 训练营兑换页面 |
| `src/App.tsx` | 修改 | 添加路由和懒加载 |
| `supabase/config.toml` | 修改 | 注册新 Edge Function |

### 技术细节

**Edge Function: `redeem-camp-activation-code`**

- 使用 `service_role` 客户端绕过 RLS 进行数据库操作
- 查询 `wealth_camp_activation_codes` 表验证兑换码
- 成功后写入 `user_camp_purchases`：
  - `camp_type`: `'wealth_block_7'`
  - `camp_name`: `'财富觉醒训练营（兑换码）'`
  - `purchase_price`: `0`
  - `payment_method`: `'activation_code'`
  - `payment_status`: `'completed'`
- 订单号前缀使用 `CAMP-ACT`

**前端页面: `WealthCampActivate.tsx`**

- 复用 `WealthBlockActivate.tsx` 的交互逻辑（输入、登录检测、localStorage 暂存）
- 兑换成功后跳转到 `/wealth-camp-intro`（已购买状态，可直接开始训练营）
- 已拥有训练营权限的用户直接提示并跳转

**数据库 RLS 策略**

- `wealth_camp_activation_codes` 表不开放前端直接访问
- 所有操作通过 Edge Function 的 `service_role` 客户端完成

