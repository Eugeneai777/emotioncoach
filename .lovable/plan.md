

## 修复首页跳转逻辑 - 让有活跃训练营的用户也能进入财富教练

### 问题分析

`SmartHomeRedirect` 中的路由优先级导致问题：

```text
条件1: 活跃合伙人 + 已购测评 → /coach/wealth_coach_4_questions
条件2: 有活跃训练营        → /wealth-camp-checkin (直接跳到打卡页)
条件3: 其他              → /wealth-coach-intro
```

当用户有活跃训练营但不是活跃合伙人时，首页直接跳到打卡页，跳过了财富教练。

### 修改方案

**文件：`src/components/SmartHomeRedirect.tsx`**

调整路由优先级，让有活跃训练营的用户也进入财富教练页面，而非直接跳到打卡页：

```text
改动前:
  条件1: 活跃合伙人 + 已购测评 → /coach/wealth_coach_4_questions
  条件2: 有活跃训练营          → /wealth-camp-checkin
  条件3: 其他                → /wealth-coach-intro

改动后:
  条件1: 活跃合伙人 + 已购测评 → /coach/wealth_coach_4_questions
  条件2: 有活跃训练营          → /coach/wealth_coach_4_questions  (改为教练页)
  条件3: 其他                → /wealth-coach-intro
```

用户仍然可以从教练页面通过"我的日记"按钮手动进入打卡页面，不会丢失入口。

### 影响范围
- 仅影响首页 `/` 的跳转逻辑
- 不影响 Auth.tsx 中的登录后重定向逻辑
- 不影响其他页面的导航

