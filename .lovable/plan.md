

# 将有劲AI Logo 从导航栏移至页面内容区左上角

## 问题
当前 CoachHeader 采用双行布局，第二行放有劲AI logo，导致导航栏占用过多空间，不美观。

## 方案

### 1. 修改 `src/components/coach/CoachHeader.tsx`
- 删除第262-281行（Row 2: 有劲AI Logo 整个区域）
- 导航栏恢复为单行布局

### 2. 修改 `src/components/coach/CoachLayout.tsx`
- 在 `<CoachHeader>` 与 main content 之间，插入有劲AI 圆形 logo
- 位置：紧贴 header 下方、main 滚动区内顶部左上角
- 样式：与截图一致，小尺寸 `w-8 h-8`，左对齐，点击跳转逻辑保持不变（回到 `/` 或 backRoute）

布局结构：
```text
┌─────────────────────────────────┐
│ 主页 ☰ 教练▼  |  生活馆 日记 🔔 │  ← 单行导航
├─────────────────────────────────┤
│ 🟠(logo)                        │  ← main 区域内左上角
│                                 │
│       教练内容区                  │
└─────────────────────────────────┘
```

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/components/coach/CoachHeader.tsx` | 删除 Row 2 logo 区域，恢复单行 |
| `src/components/coach/CoachLayout.tsx` | 在 main 滚动区内顶部添加有劲AI logo |

影响页面：`/`、`/coach/:coachKey`、`/parent-coach`、`/communication-coach`、`/wealth-coach-chat`（所有使用 CoachLayout 的页面）。

