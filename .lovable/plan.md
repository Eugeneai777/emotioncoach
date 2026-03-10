

# 协同抗压套餐 — 完整转化流程设计

## 现状分析

当前 `SynergyPromoPage` 的购买按钮直接打开 `UnifiedPayDialog`，支付成功后仅关闭弹窗，没有后续流程。用户购买的是"训练营 + 知乐胶囊"的组合套餐，需要：
1. 收集收货地址（寄送知乐胶囊）
2. 注册/登录账号
3. 进入训练营开始学习

## 完整转化流程设计

```text
用户点击购买
  ↓
① 收货信息表单（姓名、电话、地址）
  ↓
② 支付（UnifiedPayDialog）
  ↓
③ 注册/登录（如未登录 → QuickRegisterStep；已登录跳过）
  ↓
④ 成功页 — 显示两个入口：
   • "进入训练营" → /camp-intro/workplace_stress_21（或对应训练营）
   • "关注公众号" → 接收提醒
```

## 实现方案

### 1. 改造 `SynergyPromoPage.tsx`

将当前的简单支付流程替换为多步骤流程：

- **新增状态管理**：`step` 状态（`'checkout' | 'payment' | 'register' | 'success'`）
- **Step 1 — 收货信息**：复用现有 `CheckoutForm` 组件（已有姓名、电话、地址字段），收集后进入支付
- **Step 2 — 支付**：`UnifiedPayDialog`，支付成功后检查登录状态
- **Step 3 — 注册**：未登录时显示 `QuickRegisterStep`（已有微信扫码/手机号注册），已登录跳过
- **Step 4 — 成功引导页**：新建一个内联的成功面板，显示订单确认 + 两个CTA按钮

### 2. 支付成功后存储订单

在 `handlePaySuccess` 中：
- 将收货信息写入 `store_orders` 表（复用现有商城订单逻辑）
- 或写入 `orders` 表并附带 `metadata` 包含收货信息
- 自动开通训练营权限（通过后端 `check-order-status` 的 provisioning 逻辑）

### 3. 成功页引导

成功页使用深色风格（与页面一致），包含：
- ✅ 支付成功确认
- 📦 "知乐胶囊将在3个工作日内寄出"
- 🧠 "进入抗压训练营" 大按钮 → 跳转到训练营介绍/打卡页
- 📱 关注公众号二维码（可选）

### 4. 需要确认的训练营类型

目前系统已有 `wealth_camp`（财富训练营）、`parent_emotion_21`（亲子训练营）等。需要为此套餐创建一个新的训练营模板（如 `workplace_stress_21`），或复用现有模板。这需要在数据库 `camp_templates` 表中配置。

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `src/pages/SynergyPromoPage.tsx` | 改造：加入多步骤流程（收货→支付→注册→成功引导） |
| 数据库 `camp_templates` | 新增 `workplace_stress_21` 训练营模板（如需） |
| 数据库 `packages` | 新增 `synergy_bundle` 套餐记录，关联训练营权限 |

## 跳转链接总结

- 购买成功后主CTA：`/camp-intro/workplace_stress_21`（训练营介绍页）
- 训练营介绍页 → `/camp-checkin/workplace_stress_21`（每日打卡）
- 打卡页包含课程学习内容

