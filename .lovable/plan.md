
## 添加测评顶部标题、进度条和提示文案

### 需求理解

用户希望在答题页面顶部显示：
1. **测评名称**：财富卡点测评
2. **进度条**：显示当前答题进度
3. **提示文案**：告知用户完成后将获得专业分析报告

---

### 当前问题

| 现状 | 期望效果 |
|------|---------|
| 进度条位于退出按钮下方 | 进度条置于顶部显眼位置 |
| 没有测评标题 | 显示"财富卡点测评"标题 |
| 没有完成提示 | 提醒用户完成后获取专业分析报告 |

---

### 修改方案

#### 文件: `src/components/wealth-block/WealthBlockQuestions.tsx`

在答题区域顶部添加一个固定的头部区域：

```text
┌──────────────────────────────────────┐
│  [固定头部区域]                       │
│  ┌────────────────────────────────┐  │
│  │ ← 财富卡点测评         1/30 →  │  │ ← 标题 + 进度数字
│  ├────────────────────────────────┤  │
│  │ ████████░░░░░░░░░░░░░░░░░░░░░░ │  │ ← 进度条
│  ├────────────────────────────────┤  │
│  │ ✨ 完成测评后将获得专业分析报告 │  │ ← 激励提示
│  └────────────────────────────────┘  │
│                                      │
│  [题目卡片区域]                       │
│  ┌────────────────────────────────┐  │
│  │         第 X 题               │  │
│  │      题目内容...               │  │
│  │      选项 1-5                  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

### 具体修改

#### 1. 重构头部区域（约第 358-391 行）

**修改前：**
- 退出按钮 + 进度信息在同一行
- 进度条在下方

**修改后：**
- 添加固定顶部容器
- 第一行：返回按钮 + 测评标题（居中） + 进度数字
- 第二行：进度条（全宽）
- 第三行：激励提示文案

```tsx
{/* 固定顶部区域 */}
<div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-3 -mx-4 px-4 pt-2">
  {/* 第一行：返回 + 标题 + 进度 */}
  <div className="flex items-center justify-between mb-2">
    {/* 左侧：退出按钮 */}
    <Button variant="ghost" size="icon" ...>
      <ArrowLeft className="w-5 h-5" />
    </Button>
    
    {/* 中间：标题 */}
    <h1 className="font-semibold text-lg">财富卡点测评</h1>
    
    {/* 右侧：进度 */}
    <span className="text-sm font-medium text-amber-600">
      {currentIndex + 1}/{questions.length}
    </span>
  </div>
  
  {/* 第二行：进度条 */}
  <Progress value={progress} className="h-1.5 mb-2" />
  
  {/* 第三行：激励提示 */}
  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
    <Sparkles className="w-3 h-3 text-amber-500" />
    <span>完成测评后将获得专业分析报告</span>
  </div>
</div>
```

#### 2. 调整容器布局

- 主容器添加 `overflow-y-auto` 确保滚动正常
- 移除原有的进度区域代码

---

### 视觉效果

| 元素 | 样式 |
|------|------|
| 标题 | `font-semibold text-lg`，居中显示 |
| 进度数字 | `text-sm font-medium text-amber-600`，右对齐 |
| 进度条 | 高度 1.5，渐变颜色继承 Progress 组件 |
| 提示文案 | `text-xs text-muted-foreground`，配合 Sparkles 图标 |
| 背景 | `bg-background/95 backdrop-blur-sm`，半透明毛玻璃效果 |

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/wealth-block/WealthBlockQuestions.tsx` | 修改 | 重构顶部头部区域，添加标题和激励提示 |

---

### 技术细节

1. **Sticky 定位**：头部使用 `sticky top-0` 确保滚动时固定在顶部
2. **层级**：`z-10` 确保头部在题目卡片之上
3. **背景**：半透明背景 + 毛玻璃效果，保持视觉层次
4. **响应式**：标题和进度在移动端也能正常显示
5. **图标**：复用已导入的 `Sparkles` 图标
