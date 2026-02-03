
## 问答页面重新设计 - 匹配参考图片布局

### 需求理解

根据用户提供的参考图片，需要将问答页面重新设计为垂直排列的选项按钮样式，类似于专业量表的布局。

---

### 当前 vs 目标对比

| 元素 | 当前设计 | 目标设计（参考图） |
|------|----------|-------------------|
| 进度显示 | 固定头部 + 进度条 | 卡片内顶部 "即将获取专业的分析报告" + 百分比 + 细进度条 |
| 选项样式 | 水平1-5圆形数字按钮 | 垂直排列的胶囊形按钮（没有/很轻/中等/偏重/严重） |
| 题目标题 | 顶部"财富卡点测评" | 顶部独立标题区（如"国际专业版症状自评量表"）+ 标签徽章 |
| 导航按钮 | "上一题"/"下一题" 普通样式 | "← 上一题"(outline) / "下一题 →"(填充橙色) 胶囊按钮 |
| 背景 | 渐变白色卡片 | 纯白卡片 + 柔和阴影 |

---

### 修改文件

#### 文件: `src/components/wealth-block/WealthBlockQuestions.tsx`

**1. 修改页面顶部区域**

移除固定头部，改为类似参考图的简洁头部：
- 标题："财富卡点测评"
- 可选徽章（如"专业版"）

**2. 修改问题卡片结构**

```tsx
<Card className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden">
  <CardContent className="p-5 sm:p-6">
    {/* 顶部信息栏 */}
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm text-muted-foreground">
        即将获取专业的分析报告
      </span>
      <span className="text-xl font-semibold text-amber-600">
        {Math.round(progress)}%
      </span>
    </div>
    
    {/* 进度条 - 细长橙色 */}
    <Progress value={progress} className="h-1 mb-6" />
    
    {/* 题目文本 */}
    <p className="text-lg font-medium leading-relaxed mb-6 px-2">
      {currentQuestion.text}
    </p>
    
    {/* 垂直选项列表 */}
    <div className="space-y-3">
      {scoreLabels.map((option) => (
        <button
          key={option.value}
          onClick={() => handleAnswer(option.value)}
          className={cn(
            "w-full py-4 px-6 rounded-full text-left transition-all",
            isSelected 
              ? "bg-amber-500 text-white shadow-md" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  </CardContent>
</Card>
```

**3. 修改选项标签**

更新 `scoreLabels` 使用更符合量表风格的文案：

```tsx
// 在组件内定义或从 wealthBlockData 导入更新后的标签
const verticalScoreLabels = [
  { value: 1, label: "没有" },
  { value: 2, label: "很轻" },
  { value: 3, label: "中等" },
  { value: 4, label: "偏重" },
  { value: 5, label: "严重" },
];
```

**4. 修改导航按钮样式**

```tsx
{/* 导航按钮 - 参考图样式 */}
<div className="flex gap-4 pt-6 pb-safe">
  {/* 上一题 - outline 胶囊 */}
  <Button
    variant="outline"
    className="flex-1 h-14 rounded-full border-2 border-amber-400 text-amber-600 hover:bg-amber-50"
    disabled={currentIndex === 0}
    onClick={handlePrev}
  >
    <ArrowLeft className="w-5 h-5 mr-2" />
    上一题
  </Button>
  
  {/* 下一题 - 填充橙色胶囊 */}
  <Button
    className="flex-1 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
    disabled={!hasAnswer}
    onClick={handleNext}
  >
    下一题
    <ArrowRight className="w-5 h-5 ml-2" />
  </Button>
</div>
```

**5. 修改页面背景**

添加柔和的渐变背景：

```tsx
<div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
```

---

### 布局效果（匹配参考图）

```text
┌────────────────────────────────────────┐
│                                        │
│       财富卡点测评                      │
│   ┌──────────────┐                     │
│   │ 🌐 专业版     │                    │
│   └──────────────┘                     │
│                                        │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 即将获取专业的分析报告        1%   │ │
│ │ ━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │                                    │ │
│ │  朋友分享好消息时，你脱口而出的    │ │
│ │  第一句话是'现在经济不好，       │ │
│ │  小心点'，而不是真心祝福         │ │
│ │                                    │ │
│ │  ┌──────────────────────────────┐ │ │
│ │  │ 没有                          │ │ │
│ │  └──────────────────────────────┘ │ │
│ │  ┌──────────────────────────────┐ │ │
│ │  │ 很轻                          │ │ │
│ │  └──────────────────────────────┘ │ │
│ │  ┌──────────────────────────────┐ │ │
│ │  │ 中等                          │ │ │
│ │  └──────────────────────────────┘ │ │
│ │  ┌──────────────────────────────┐ │ │
│ │  │ 偏重                          │ │ │
│ │  └──────────────────────────────┘ │ │
│ │  ┌──────────────────────────────┐ │ │
│ │  │ 严重                          │ │ │
│ │  └──────────────────────────────┘ │ │
│ └────────────────────────────────────┘ │
│                                        │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ ← 上一题    │  │   下一题 →     │  │
│  └─────────────┘  └─────────────────┘  │
│       (outline)        (filled)        │
│                                        │
│  ─────────────────────────────────     │
│  我们将根据您的答题数据进行维度分析... │
│                                        │
└────────────────────────────────────────┘
```

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/wealth-block/WealthBlockQuestions.tsx` | 修改 | 重构问答页面布局：垂直选项、卡片内进度、胶囊按钮 |
| `src/components/wealth-block/wealthBlockData.ts` | 修改 | 更新 `scoreLabels` 为量表风格文案（没有/很轻/中等/偏重/严重） |

---

### 技术要点

| 要点 | 说明 |
|------|------|
| 卡片样式 | `rounded-3xl shadow-lg bg-white` 纯白圆角卡片 |
| 选项按钮 | `rounded-full py-4` 全宽胶囊形按钮，垂直排列 |
| 进度显示 | 移入卡片内，左侧文案 + 右侧百分比 |
| 导航按钮 | `rounded-full h-14` 大号胶囊按钮，上一题 outline / 下一题填充 |
| 背景渐变 | 柔和的橙色/粉色渐变背景 |
| 选中状态 | 橙色填充 + 白色文字 + 阴影 |
