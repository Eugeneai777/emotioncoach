

## 修复移动端顶部固定区域显示问题

### 问题分析

在移动端上，顶部区域（标题、进度条、激励提示）无法正确显示的原因：

| 问题 | 原因 |
|------|------|
| `sticky` 失效 | 滚动容器在外层 `WealthAssessmentLite.tsx`，而 `sticky` 元素在内层组件 |
| 负边距溢出 | 使用 `-mx-4` 但父容器无对应 `px-4` 内边距 |
| 内容被裁剪 | `min-h-[calc(100dvh-180px)]` 可能导致布局计算问题 |

---

### 解决方案

将 `sticky` 改为 `fixed` 定位，确保头部始终固定在视口顶部，同时添加占位元素防止内容被遮挡。

---

### 修改文件

#### 文件: `src/components/wealth-block/WealthBlockQuestions.tsx`

**修改1：外层容器添加内边距（第329行）**

```tsx
// 修改前
<div className="flex flex-col min-h-[calc(100dvh-180px)] sm:min-h-[500px]">

// 修改后
<div className="flex flex-col min-h-screen">
```

**修改2：头部改为 fixed 定位（第358-406行）**

```tsx
// 修改前
<div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-3 -mx-4 px-4 pt-2 mb-4">

// 修改后
<div className="fixed top-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-b pb-3 px-4 pt-safe">
  {/* 第一行：返回 + 标题 + 进度 */}
  <div className="flex items-center justify-between mb-2 max-w-lg mx-auto">
    ...
  </div>
  
  {/* 第二行：进度条 */}
  <div className="max-w-lg mx-auto">
    <Progress value={progress} className="h-1.5 mb-2" />
  </div>
  
  {/* 第三行：激励提示 */}
  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
    <Sparkles className="w-3 h-3 text-amber-500" />
    <span>完成测评后将获得专业分析报告</span>
  </div>
</div>

{/* 头部占位区域 - 约 80-90px */}
<div className="h-[88px]" />
```

---

### 布局结构

```text
┌─────────────────────────────────────────┐
│ [fixed 固定头部 - z-20]                  │
│  ← 财富卡点测评              1/30       │
│  ████████░░░░░░░░░░░░░░░░              │
│  ✨ 完成测评后将获得专业分析报告         │
├─────────────────────────────────────────┤
│ [占位区域 h-[88px]]                      │
├─────────────────────────────────────────┤
│                                         │
│  [题目卡片区域 - 可滚动]                 │
│                                         │
└─────────────────────────────────────────┘
```

---

### 技术要点

| 要点 | 说明 |
|------|------|
| Fixed 定位 | `fixed top-0 left-0 right-0` 确保始终固定在视口顶部 |
| 安全区域 | 使用 `pt-safe` 适配刘海屏/圆角屏 |
| 层级 | `z-20` 确保在对话框等元素之下但在内容之上 |
| 最大宽度 | `max-w-lg mx-auto` 保持内容居中对齐 |
| 占位元素 | `h-[88px]` 与头部高度匹配，防止内容被遮挡 |

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/wealth-block/WealthBlockQuestions.tsx` | 修改 | 将 sticky 改为 fixed，添加占位元素 |

