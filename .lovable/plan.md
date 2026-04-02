

# 调整 CoachHeader 导航栏布局：移动有劲AI圆形按钮

## 问题

在 `CoachHeader` 组件中，"主页"、"有劲AI圆形logo"、"菜单(教练)" 三个元素挤在同一行左侧，导致移动端"教练"下拉按钮与菜单图标重叠（第二张图片所示）。

## 影响范围

`CoachHeader` 被 `CoachLayout` 使用，出现在以下页面：
- `/`（Index.tsx — 情绪教练）
- `/coach/:coachKey`（DynamicCoach.tsx — 各类教练，含财富教练）
- `/parent-coach`（ParentCoach.tsx）
- `/communication-coach`（CommunicationCoach.tsx）
- `/wealth-coach-chat`（WealthCoachChat.tsx）

## 方案

只需修改 **1 个文件**：`src/components/coach/CoachHeader.tsx`

### 布局调整

将 header 从单行改为两行结构：

```text
第一行（原导航行）：
  左侧：主页 | ☰菜单 | 教练▼    右侧：生活馆 | 日记 | 🔔通知
  （移除有劲AI logo，三个按钮均匀排列）

第二行（新增）：
  左上角：有劲AI圆形logo（小尺寸，如 w-7 h-7）
```

### 具体改动

1. 从第一行的左侧区域移除有劲AI logo（第134-150行）
2. 在 header 底部新增一行，将 logo 放在左上角，尺寸缩小
3. 调整第一行左侧元素（主页、菜单、教练）的间距，使其排列整齐不重叠

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/components/coach/CoachHeader.tsx` | 修改布局为双行，logo 移至第二行左上角 |

