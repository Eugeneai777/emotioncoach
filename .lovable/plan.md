

## 移除问答页面的火箭快捷键

### 问题分析

火箭快捷菜单（`FloatingQuickMenu`）组件在页面右下角显示一个 🚀 按钮。该组件已经有一个路由排除列表 `EXCLUDED_ROUTES`，但 `/wealth-assessment-lite` 未被包含在内。

### 当前排除路由列表

```tsx
// src/components/FloatingQuickMenu.tsx 第14行
const EXCLUDED_ROUTES = ['/auth', '/login', '/register', '/onboarding', '/wealth-block', '/coach-space', '/awakening'];
```

可以看到 `/wealth-block`（支付后测评）已经被排除，但 `/wealth-assessment-lite`（测评后支付）没有被排除。

---

### 解决方案

将 `/wealth-assessment-lite` 添加到排除路由列表中。

### 修改文件

#### 文件: `src/components/FloatingQuickMenu.tsx`

**修改第14行：**

```tsx
// 修改前
const EXCLUDED_ROUTES = ['/auth', '/login', '/register', '/onboarding', '/wealth-block', '/coach-space', '/awakening'];

// 修改后
const EXCLUDED_ROUTES = ['/auth', '/login', '/register', '/onboarding', '/wealth-block', '/wealth-assessment-lite', '/coach-space', '/awakening'];
```

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/FloatingQuickMenu.tsx` | 修改 | 添加 `/wealth-assessment-lite` 到排除路由列表 |

---

### 技术要点

| 要点 | 说明 |
|------|------|
| 单行修改 | 仅需修改 `EXCLUDED_ROUTES` 数组 |
| 工作原理 | 组件会检查 `location.pathname.startsWith(route)`，匹配时返回 `null` |
| 影响范围 | 仅影响 `/wealth-assessment-lite` 页面 |

