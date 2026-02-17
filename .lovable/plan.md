

## /camps 页面手机端设计优化方案

### 当前问题分析

在 390px 手机端实际截图中发现以下排版问题：

| 问题 | 原因 | 影响 |
|------|------|------|
| 三个统计卡片垂直堆叠，占满一屏 | 使用了 `grid-cols-1 xs:grid-cols-3`，但 `xs:` 不是 Tailwind 默认断点 | 用户需滚动很远才能看到训练营卡片 |
| Hero 区域过于宽松 | `py-12`、`space-y-8`、`mb-12` 间距过大 | 首屏完全被标题和统计信息占据 |
| 训练营卡片过高 | 渐变头图 `h-36`、CardHeader/CardContent 内边距 `p-4 sm:p-6 md:p-8` 偏大 | 每张卡片占满半屏以上，浏览效率低 |
| 卡片单列排列 | `grid-cols-1 md:grid-cols-2`，手机端只有1列 | 信息密度太低 |
| 副标题换行 | "专业导师陪伴，社群共同成长，科学系统的学习路径" 在手机端换2行 | 视觉不紧凑 |

### 修改方案

**1. 统计卡片：改为手机端 3 列横排**

`src/pages/CampList.tsx` 第253行

```tsx
// 之前
<div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">

// 之后：直接用 grid-cols-3
<div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
```

**2. Hero 区域间距压缩**

`src/pages/CampList.tsx`

- 第228行：`py-12` -> `py-6 sm:py-12`
- 第230行：`space-y-8 mb-12` -> `space-y-4 sm:space-y-8 mb-6 sm:mb-12`
- 第247行：副标题缩小字号 `text-lg md:text-xl` -> `text-sm sm:text-lg md:text-xl`

**3. 训练营卡片紧凑化**

`src/components/camp/CampTemplateCard.tsx`

- 第75行：渐变头图高度 `h-36` -> `h-28 sm:h-36`
- 第119行：icon 字号 `text-6xl` -> `text-4xl sm:text-6xl`
- 第124行：CardHeader `pt-4` -> `pt-3`（减少顶部内边距）
- 第132行：描述文字 `min-h-[3rem]` -> `min-h-0 sm:min-h-[3rem]`（手机端不强制最小高度）
- 第131行：CardContent `space-y-4` -> `space-y-2 sm:space-y-4`

**4. 卡片网格：手机端也用 2 列**

`src/pages/CampList.tsx` 第341行

```tsx
// 之前
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">

// 之后
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 items-stretch">
```

**5. Tab 切换区域间距优化**

`src/pages/CampList.tsx`

- 第271行：Tab 列表 `mb-10` -> `mb-4 sm:mb-10`
- 第310行：筛选区 `mb-8` -> `mb-4 sm:mb-8`

### 涉及文件

- `src/pages/CampList.tsx` -- Hero 间距压缩、统计卡片改为 3 列、卡片网格改 2 列、Tab 间距优化
- `src/components/camp/CampTemplateCard.tsx` -- 卡片头图高度、icon 大小、内部间距紧凑化

### 预期效果

优化后手机端首屏即可看到：标题 + 统计（横排）+ Tab 切换 + 至少 1 行训练营卡片（2 个并排），大幅提升浏览效率和信息密度。

