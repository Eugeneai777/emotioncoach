

## 确保底部信息需要滚动才能看见

### 问题分析

当前底部信息（付费提示、公司备案）使用 `mt-8`（32px）的顶部间距，可能仍然会在某些手机上显示在首屏内。

### 解决方案

增加底部信息的顶部间距，确保它始终在首屏之外，用户需要滚动才能看到。

### 修改文件

#### 文件: `src/components/wealth-block/WealthBlockQuestions.tsx`

**修改第 514 行：**

```tsx
// 修改前
<div className="mt-8 pt-6 border-t border-border/30 space-y-3 text-center pb-[env(safe-area-inset-bottom)]">

// 修改后 - 增加顶部间距，确保需要滚动才能看到
<div className="mt-16 pt-6 border-t border-border/30 space-y-3 text-center pb-[env(safe-area-inset-bottom)]">
```

将 `mt-8`（32px）改为 `mt-16`（64px），增加 32px 的间距，确保底部信息在视口之外。

---

### 修改总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/wealth-block/WealthBlockQuestions.tsx` | 修改 | 增加底部信息顶部间距 `mt-8` → `mt-16` |

---

### 技术要点

| 要点 | 说明 |
|------|------|
| 单行修改 | 仅修改 `mt-8` 为 `mt-16` |
| 效果 | 底部信息距离导航按钮更远，确保首屏不可见 |
| 用户体验 | 首屏专注于问答内容，滚动后才看到底部信息 |

