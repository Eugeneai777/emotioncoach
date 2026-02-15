

## 修复刷新页面跳转问题

### 问题分析

当前根路由 `/` 硬编码跳转到有劲AI教练：
```tsx
<Route path="/" element={<Navigate to="/coach/vibrant_life_sage" replace />} />
```

当页面刷新时，如果任何逻辑导致用户被重定向到 `/`（例如 auth 状态重新初始化、SPA 回退等），都会强制跳转到有劲AI教练，而非用户之前所在的页面。

### 解决方案

**1. 创建智能首页重定向组件 `src/components/SmartHomeRedirect.tsx`**

替代硬编码的 `Navigate to="/coach/vibrant_life_sage"`，新组件会：
- 检查用户是否已登录
- 已登录用户：根据 `profiles.preferred_coach` 字段跳转到对应教练页
  - `wealth` → `/coach/wealth_coach_4_questions`（如果是活跃绽放合伙人+已付费测评）或 `/wealth-coach-intro`
  - `emotion` → `/coach/vibrant_life_sage`（默认情绪教练）
  - 其他 → `/coach/vibrant_life_sage`
- 未登录用户：默认跳转到 `/coach/vibrant_life_sage`（保持当前行为）
- 加载中显示 loading 状态，避免闪烁

**2. 修改 `src/App.tsx`**

将根路由从：
```tsx
<Route path="/" element={<Navigate to="/coach/vibrant_life_sage" replace />} />
```
改为：
```tsx
<Route path="/" element={<SmartHomeRedirect />} />
```

### 技术细节

SmartHomeRedirect 组件逻辑：

```text
用户访问 /
  |
  ├── 未登录 → /coach/vibrant_life_sage
  |
  └── 已登录 → 查询 preferred_coach
        |
        ├── wealth → 检查合伙人+测评状态
        |     ├── 活跃合伙人+已付费测评 → /coach/wealth_coach_4_questions
        |     ├── 有活跃训练营 → /wealth-camp-checkin
        |     └── 其他 → /wealth-coach-intro
        |
        └── 其他/null → /coach/vibrant_life_sage
```

这样即使刷新时触发了 `/` 路由，用户也会被智能引导到正确的教练页面，而非总是跳到有劲AI教练。

