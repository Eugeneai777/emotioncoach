

## 手机端文字换行问题修复（第二批）

从截图中发现以下 4 处文字换行/挤压问题：

### 问题清单

| # | 页面 | 问题 | 截图对应 |
|---|------|------|---------|
| 1 | 有劲生活馆（EnergyStudio） | 4宫格快捷入口中"教练空间"和"学习课程"各换两行显示 | IMG_9045 |
| 2 | 线上课程（Courses） | 标题"线上课程"用 `text-3xl`，在与返回按钮同行 flex 布局中被挤压换行为"线上课\n程" | IMG_9046 |
| 3 | 训练营列表（CampList） | 大标题"选择你的成长之旅" 用 `text-4xl`，手机端"旅"字被挤到第二行 | IMG_9047 |
| 4 | 训练营列表（CampList） | 分类描述"培养每日成长习惯，积累点滴进步" 换行，"步"字掉到第二行 | IMG_9048 |

### 修改方案

**1. `src/pages/EnergyStudio.tsx`（第183行）**

快捷入口标签 4 个字挤在窄格中换行。给 label 加 `whitespace-nowrap` 并略缩字号：

```tsx
// 之前
<span className="text-xs font-medium">{entry.label}</span>

// 之后
<span className="text-[11px] font-medium whitespace-nowrap">{entry.label}</span>
```

**2. `src/pages/Courses.tsx`（第241行）**

标题 `text-3xl` 在手机端太大，与左右元素挤在一行。改为响应式字号：

```tsx
// 之前
<h1 className="text-3xl font-bold ...">线上课程</h1>

// 之后
<h1 className="text-2xl sm:text-3xl font-bold ...">线上课程</h1>
```

**3. `src/pages/CampList.tsx`（第243行）**

"选择你的成长之旅" 标题 `text-4xl` 在手机端一行放不下。缩小手机端字号：

```tsx
// 之前
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold ... leading-tight">

// 之后
<h1 className="text-3xl md:text-5xl lg:text-6xl font-bold ... leading-tight">
```

**4. `src/pages/CampList.tsx`（第312行）**

分类描述 `text-lg` 在手机端偏大，导致"步"字换行。改为响应式字号：

```tsx
// 之前
<p className="text-muted-foreground text-lg">{currentCategory.description}</p>

// 之后
<p className="text-muted-foreground text-base sm:text-lg">{currentCategory.description}</p>
```

### 涉及文件

- `src/pages/EnergyStudio.tsx` -- 快捷入口标签防换行
- `src/pages/Courses.tsx` -- 标题响应式字号
- `src/pages/CampList.tsx` -- 大标题和描述文字响应式字号

