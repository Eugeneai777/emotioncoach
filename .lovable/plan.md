
# SCL-90 开始页设计优化计划
## 目标：对齐财富卡点测评风格

---

## 一、当前差异分析

通过对比 `SCL90StartScreen.tsx` 与 `AssessmentStartScreen.tsx`（财富卡点测评），发现以下关键差异：

| 维度 | SCL-90 当前状态 | 财富卡点测评风格 |
|-----|----------------|-----------------|
| **背景** | 普通 `space-y-4` 白底 | 全屏渐变 `from-amber-50 to-orange-50` |
| **布局** | 内容向下堆叠 | 垂直居中 `flex-col items-center justify-center` |
| **卡片** | 普通边框卡片 | 毛玻璃效果 `bg-white/80 backdrop-blur-sm` |
| **动画** | 单一入场动画 | 多层级延迟动画，元素依次浮现 |
| **按钮** | 方形渐变按钮 | 圆角胶囊按钮 + 呼吸动画 |
| **评分预览** | 标签形式紧凑排列 | 圆形数字 + hover 交互动效 |
| **情感设计** | 无明显情感缓冲 | 有"放轻松"鼓励卡片 |

---

## 二、优化方案

### 2.1 背景与布局重构

```
┌─────────────────────────────────────────┐
│   ← 返回                    (渐变紫色背景) │
│                                         │
│              🧠                         │
│        SCL-90 心理健康自评               │
│      专业自测，了解情绪状态               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📝 答题指南                      │   │
│  │ • 安静环境，10-15分钟            │   │
│  │ • 根据最近7天感受作答            │   │
│  │ • 第一直觉，如实选择             │   │
│  │ ─────────────────────────       │   │
│  │  没有          中等        严重   │   │
│  │   ①  ②  ③  ④  ⑤              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💜 放轻松                        │   │
│  │ 这不是考试，只是帮你了解自己       │   │
│  └─────────────────────────────────┘   │
│                                         │
│      ╭──────────────────────────╮      │
│      │   🧠  开始测评            │      │  ← 呼吸动画
│      ╰──────────────────────────╯      │
│                                         │
│         🔒 数据保密，仅供自我参考        │
└─────────────────────────────────────────┘
```

**技术实现：**
- 背景改为 `min-h-screen bg-gradient-to-b from-violet-50 to-purple-50`（紫色调匹配心理健康主题）
- 使用 `flex flex-col items-center justify-center` 实现垂直居中
- 限制内容宽度 `max-w-md`

### 2.2 分层动画系统

采用与财富测评一致的动画节奏：

| 元素 | 延迟时间 | 动画类型 |
|-----|---------|---------|
| 标题区域 | 0.1s | scale + opacity |
| 答题指南卡片 | 0.2s | x 方向滑入 |
| 评分预览数字 | 0.35s-0.5s | 依次缩放出现 |
| 放轻松卡片 | 0.4s | x 方向滑入 |
| 继续答题提示 | 0.45s | y 方向上移 |
| 开始按钮 | 0.5s | y 方向 + 呼吸循环 |
| 隐私提示 | 0.6s | 淡入 |

**所有动画使用 `opacity: 0.01` 和 `transform: 'translateZ(0)'` 确保微信兼容性。**

### 2.3 卡片视觉升级

**答题指南卡片：**
```tsx
<Card className="border-violet-200 bg-white/80 backdrop-blur-sm shadow-sm">
```

**放轻松鼓励卡片：**
```tsx
<Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 shadow-sm">
```

### 2.4 评分预览交互化

将当前的标签式评分说明改为圆形按钮预览：

```tsx
<div className="flex gap-2 justify-center">
  {scl90ScoreLabels.map((score, index) => (
    <motion.div
      key={score.value}
      initial={{ scale: 0.8, opacity: 0.01 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.35 + index * 0.04 }}
      whileHover={{ scale: 1.1, y: -2 }}
      className={cn(
        "w-10 h-10 rounded-full flex flex-col items-center justify-center",
        "cursor-pointer transition-all duration-200",
        score.color // 使用已有的颜色配置
      )}
    >
      <span className="text-sm font-bold">{score.value}</span>
      <span className="text-[8px]">{score.label}</span>
    </motion.div>
  ))}
</div>
```

### 2.5 CTA 按钮升级

```tsx
<motion.div
  animate={{ scale: [1, 1.02, 1] }}
  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
>
  <Button
    onClick={onStart}
    className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-500 
               hover:from-violet-600 hover:to-purple-600 
               text-white font-medium text-base rounded-full shadow-lg"
  >
    <Brain className="mr-2 h-5 w-5" />
    开始测评
  </Button>
</motion.div>
```

### 2.6 内容精简

**移除折叠式 Accordion**，改为更直接的展示：
- 痛点共鸣、适合人群、自测提示等次要信息整合到答题指南卡片内
- 10个维度的 badge 展示移到答题页面而非开始页

---

## 三、技术细节

### 3.1 色彩系统

为 SCL-90 定义专属紫色主题（区别于财富测评的琥珀色）：

```tsx
const scl90ThemeColors = {
  gradient: "from-violet-50 to-purple-50",
  card: "border-violet-200 bg-white/80 backdrop-blur-sm",
  accent: "from-violet-500 to-purple-500",
  text: "text-violet-700",
  muted: "text-violet-600/70",
};
```

### 3.2 文件修改清单

| 文件 | 修改内容 |
|-----|---------|
| `src/components/scl90/SCL90StartScreen.tsx` | 完全重构布局、动画、样式 |

### 3.3 动画硬化规范

所有 `motion.div` 必须包含：
```tsx
initial={{ opacity: 0.01, y: 20 }}  // 不用 opacity: 0
style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
```

---

## 四、预期效果对比

| 指标 | 优化前 | 优化后 |
|-----|-------|-------|
| 首屏信息密度 | 高（需滚动） | 精简（一屏展示） |
| 视觉层次 | 扁平 | 分层毛玻璃效果 |
| 动画流畅度 | 单调 | 多层级延迟动画 |
| 情感设计 | 无 | "放轻松"情感垫 |
| 品牌一致性 | 与其他模块差异大 | 与财富测评同家族风格 |
| 按钮吸引力 | 普通 | 呼吸动画引导点击 |

---

## 五、注意事项

1. **保留继续答题功能**：若有未完成进度，显示继续提示卡片
2. **保留历史记录入口**：底部保留"查看历史记录"按钮
3. **暗色模式兼容**：所有颜色需包含 `dark:` 变体
4. **微信小程序兼容**：严格遵循动画硬化规范
