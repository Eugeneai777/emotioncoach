
# 优化情绪健康测评页面设计方案

## 一、当前状态分析

通过代码审查，当前页面已有：
- 基础 framer-motion 动画（渐入、延迟动画）
- 四大人格模式的折叠卡片（`PatternDetailCard`）
- 三层洋葱图的呼吸动画

**待优化点：**
1. 三层诊断表格（模块6）信息密集，没有折叠，用户需要滚动很长
2. 模块之间缺少视觉过渡动画
3. 缺少交互反馈动画（如点击、悬停）
4. 部分内容块过于平铺，可用折叠收纳

---

## 二、优化方案

### 2.1 三层诊断模块改造为折叠手风琴

将三张表格（第一层/第二层/第三层）改为可折叠的 **Accordion** 组件：

```text
┌─────────────────────────────────────────────────────────────┐
│  🧅 三层洋葱图                                              │
│  "由外向内 · 层层剥离 · 直达情绪卡点"                        │
├─────────────────────────────────────────────────────────────┤
│  ▼ 第一层：状态筛查（科学背书层）   [展开/收起]            │
│    └─ 表格内容（收起时隐藏）                                │
├─────────────────────────────────────────────────────────────┤
│  ▼ 第二层：反应模式（卡点诊断层）   [展开/收起]            │
│    └─ 表格内容（收起时隐藏）                                │
├─────────────────────────────────────────────────────────────┤
│  ▼ 第三层：行动路径（转化承接层）   [展开/收起]            │
│    └─ 表格内容（收起时隐藏）                                │
└─────────────────────────────────────────────────────────────┘
```

**实现方式：**
- 使用现有的 `Accordion` 组件（@radix-ui/react-accordion）
- 默认第一层展开，其他收起
- 添加平滑的展开/收起动画

### 2.2 模块间添加滚动入场动画

为每个模块（Card）添加 **视口触发动画**：

```typescript
// 使用 framer-motion 的 whileInView
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  <Card>...</Card>
</motion.div>
```

应用到以下模块：
- 模块2：痛点共鸣区
- 模块3：权威背书区
- 模块4：AI对比传统
- 模块5：四大人格类型
- 模块6：三层诊断
- 模块7：价值交付区
- 模块8：定价模块

### 2.3 三层层级说明添加交互动画

为三层层级说明添加 **点击高亮** + **脉动效果**：

```typescript
// 点击某层时，对应的洋葱圈放大高亮
const [activeLayer, setActiveLayer] = useState<1 | 2 | 3 | null>(null);

<motion.div
  onClick={() => setActiveLayer(1)}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className={cn(
    "cursor-pointer transition-all",
    activeLayer === 1 && "ring-2 ring-blue-400"
  )}
>
  第一层说明...
</motion.div>
```

### 2.4 价值交付区添加卡片翻转效果

为四个价值卡片添加 **渐进入场** + **悬停提升** 效果：

```typescript
<motion.div
  initial={{ opacity: 0, y: 20, rotateX: -10 }}
  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
  whileHover={{ 
    y: -4, 
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)" 
  }}
  transition={{ type: "spring", stiffness: 300 }}
>
  价值卡片内容...
</motion.div>
```

### 2.5 CTA 按钮添加吸引注意力动画

```typescript
<motion.div
  animate={{ 
    scale: [1, 1.02, 1],
  }}
  transition={{ 
    duration: 2, 
    repeat: Infinity, 
    ease: "easeInOut" 
  }}
>
  <Button>开始测评</Button>
</motion.div>
```

---

## 三、技术实现

### 3.1 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `EmotionHealthStartScreen.tsx` | 添加 Accordion、whileInView 动画、交互效果 |

### 3.2 新增 Accordion 导入

```typescript
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
```

### 3.3 三层诊断表格改造代码

```tsx
{/* 科学量表对照 - 使用 Accordion */}
<Accordion type="single" collapsible defaultValue="layer1" className="mt-4 space-y-3">
  {/* 第一层 */}
  <AccordionItem value="layer1" className="border-0">
    <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-800 overflow-hidden">
      <AccordionTrigger className="px-3 py-3 hover:no-underline">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            第一层：状态筛查（科学背书层）
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        {/* 表格内容 */}
      </AccordionContent>
    </div>
  </AccordionItem>

  {/* 第二层、第三层同理... */}
</Accordion>
```

### 3.4 模块包装组件

```tsx
// 创建动画包装组件
function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 四、视觉效果对比

| 优化前 | 优化后 |
|--------|--------|
| 三张大表格平铺展示 | Accordion 折叠，默认只展开第一层 |
| 页面长度：约 6-7 屏 | 页面长度：约 4-5 屏（节省 30%） |
| 模块静态呈现 | 滚动时渐入动画，增加层次感 |
| 按钮无特殊效果 | 按钮有微弱呼吸脉动，吸引注意 |

---

## 五、实施步骤

| 步骤 | 内容 |
|------|------|
| 1 | 添加 Accordion 导入 |
| 2 | 创建 AnimatedSection 包装组件 |
| 3 | 将三层诊断表格改造为 Accordion |
| 4 | 为各模块添加 whileInView 动画 |
| 5 | 为 CTA 按钮添加呼吸动画 |
| 6 | 为价值卡片添加悬停效果 |

---

## 六、注意事项

1. **WeChat WebView 兼容性**：所有 framer-motion 动画使用 `opacity: 0.01` 而非 `opacity: 0`，添加 `translateZ(0)` 硬件加速
2. **移动端性能**：使用 `viewport: { once: true }` 确保动画只触发一次
3. **Accordion 默认值**：使用 `defaultValue="layer1"` 让第一层默认展开，用户可快速了解科学背书
