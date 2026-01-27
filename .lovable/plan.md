

# 情绪健康测评问题优化计划 - 一题一页设计

## 当前问题

现有 `EmotionHealthQuestions.tsx` 每页显示 **4 题**（`QUESTIONS_PER_PAGE = 4`），存在以下体验问题：

1. **注意力分散** - 多题并存降低用户专注度
2. **滚动干扰** - 移动端需要频繁滚动
3. **动效缺失** - 缺少题目切换的流畅过渡
4. **交互延迟** - 需手动点击"下一页"按钮

## 目标

参照 `WealthBlockQuestions.tsx` 的"一题一页"模式重构：

```text
用户体验流程：
选择答案 → 0.3s 动画过渡 → 自动显示下一题
                ↓
          层级过渡时显示过渡卡片
```

---

## 实现方案

### 第一步：核心状态重构

将分页逻辑改为单题索引：

```text
// 移除
const QUESTIONS_PER_PAGE = 4;
const currentPage, setCurrentPage
const currentQuestions = slice(...)

// 新增
const [currentIndex, setCurrentIndex] = useState(0);
const currentQuestion = emotionHealthQuestions[currentIndex];
const isLastQuestion = currentIndex === emotionHealthQuestions.length - 1;
```

### 第二步：答题自动推进

选择答案后自动跳转下一题：

```text
const handleAnswer = (value: number) => {
  onAnswerChange(currentQuestion.id, value);
  
  // 非最后一题时自动推进
  if (!isLastQuestion) {
    setTimeout(() => {
      // 检查层级过渡
      const nextLayerInfo = getLayerProgress(currentIndex + 2);
      if (nextLayerInfo.isLayerTransition && nextLayerInfo.transitionKey) {
        setPendingTransitionKey(nextLayerInfo.transitionKey);
        setShowTransition(true);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  }
};
```

### 第三步：添加流畅过渡动画

使用 Framer Motion 实现题目切换动效：

```text
<AnimatePresence mode="wait">
  <motion.div
    key={currentQuestion.id}
    initial={{ opacity: 0.01, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0.01, x: -50 }}
    transition={{ duration: 0.2 }}
    style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
  >
    {/* 单题卡片内容 */}
  </motion.div>
</AnimatePresence>
```

### 第四步：优化单题卡片设计

采用全屏居中的沉浸式设计：

```text
全屏布局结构：
┌────────────────────────────────────────┐
│  [层级标签]     情绪能量 · 状态筛查     │  顶部固定
│  ━━━━━━━━━━━━━━━━━━━━ 75%               │  进度条
├────────────────────────────────────────┤
│                                        │
│              ① 第1题/32题              │  题号徽章
│                                        │
│    最近两周，我对很多事情提不起兴趣      │  题目文本 (居中)
│                                        │
│   ┌──────────┬──────────┐              │
│   │ 几乎没有  │ 有时如此  │              │  2x2 选项网格
│   ├──────────┼──────────┤              │  (触摸优化 56px)
│   │ 经常如此  │ 几乎每天  │              │
│   └──────────┴──────────┘              │
│                                        │
├────────────────────────────────────────┤
│  [← 上一题]            [下一题 / 查看结果] │  底部固定导航
└────────────────────────────────────────┘
```

### 第五步：选项按钮优化

增大触摸区域，添加选中动效：

```text
选项按钮规格：
- 高度: 56px (移动端触摸友好)
- 圆角: 12px
- 选中态: 渐变边框 + 轻微缩放动画
- 颜色语义:
  · 几乎没有 → 绿色系 (积极)
  · 有时如此 → 蓝色系 (中性偏好)
  · 经常如此 → 琥珀色系 (中性偏差)
  · 几乎每天 → 玫瑰色系 (需关注)
```

### 第六步：进度与层级指示器优化

简化顶部信息，突出当前进度：

```text
顶部布局:
┌─────────────────────────────────────┐
│ [层级图标]  状态筛查        5 / 32  │
│ ━━━━━━━━━━━━━━━○━━━━━━━━━━━━━━━━━━━ │  渐变进度条
│ 情绪能量                            │  当前维度标签
└─────────────────────────────────────┘
```

---

## 完整文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/emotion-health/EmotionHealthQuestions.tsx` | 重构 | 单题显示 + 动画过渡 |

---

## 技术细节

### 层级过渡逻辑

```text
题目分布:
- 状态筛查: 1-12 题 (共12题)
- 反应模式: 13-28 题 (共16题)  
- 行动阻滞: 29-32 题 (共4题)

过渡触发点:
- 第12题答完 → 显示 "screening-pattern" 过渡卡片
- 第28题答完 → 显示 "pattern-blockage" 过渡卡片
```

### 进度计算

```text
// 全局进度
const progress = ((currentIndex + 1) / emotionHealthQuestions.length) * 100;

// 层级内进度
const layerStart = layerConfig[currentLayer].questions.start;
const layerEnd = layerConfig[currentLayer].questions.end;
const layerTotal = layerEnd - layerStart + 1;
const layerCurrent = currentQuestion.id - layerStart + 1;
const layerProgress = (layerCurrent / layerTotal) * 100;
```

### 动画配置

```text
// GPU 加速配置 (防止安卓掉帧)
style={{ 
  transform: 'translateZ(0)', 
  willChange: 'transform, opacity' 
}}

// 入场/出场动画
initial: { opacity: 0.01, x: 50 }    // 从右侧淡入
animate: { opacity: 1, x: 0 }
exit: { opacity: 0.01, x: -50 }      // 向左侧淡出
transition: { duration: 0.2 }
```

---

## 预期效果

| 优化项 | 改进前 | 改进后 |
|--------|--------|--------|
| 每页题数 | 4题 | 1题 |
| 切换动画 | 无 | 滑动过渡 |
| 答题推进 | 手动翻页 | 自动推进 |
| 选项高度 | 40px | 56px |
| 专注度 | 分散 | 沉浸式 |

