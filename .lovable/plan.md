

## 觉察日记页面优化方案（修订版）

### 用户需求
1. 去除「研究表明」统计卡片
2. 删除痛点共鸣卡片
3. 把6个入口按钮变大，成为页面焦点
4. **保留底部金句**
5. **保留写法小贴士，但改为可折叠展开形式**

---

### 修改方案

#### 1. 简化 AwakeningHeroCard

**文件**：`src/components/awakening/AwakeningHeroCard.tsx`

删除「研究表明」统计卡片，仅保留核心标语：

```tsx
// 修改后（简化版）
const AwakeningHeroCard: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
      className="text-center space-y-1"
    >
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
          频繁记录自己，可以改命
        </h2>
        <Sparkles className="h-5 w-5 text-amber-500" />
      </div>
      <p className="text-sm text-muted-foreground">
        这不是玄学，是神经科学
      </p>
    </motion.div>
  );
};
```

删除内容：
- `stats` 数组
- `Brain`、`TrendingUp`、`Zap` 图标导入
- 黄色渐变 Card 组件

---

#### 2. 创建可折叠的写法小贴士组件

**新建文件**：`src/components/awakening/AwakeningTipsCard.tsx`

参考现有 `AwakeningPainPointCard` 的折叠模式：

```tsx
const AwakeningTipsCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const tips = [
    {
      color: "destructive",
      text: '写困境时，不叫「困难」，叫「破局关键点」或「命运转折点」'
    },
    {
      color: "primary", 
      text: '写顺境时，记录微小美好：散步、电影、灵感、三餐'
    }
  ];

  return (
    <Card onClick={() => setIsExpanded(!isExpanded)}>
      {/* 折叠头部：💡 写法小贴士 + 箭头 */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">写法小贴士</span>
        </div>
        <ChevronDown className={isExpanded ? "rotate-180" : ""} />
      </div>
      
      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div>
            <ul>{tips.map(...)}</ul>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
```

---

#### 3. 放大6个入口按钮

**文件**：`src/components/awakening/AwakeningEntryCard.tsx`

| 属性 | 当前值 | 修改后 |
|-----|-------|-------|
| 容器高度 | `min-h-[90px]` | `min-h-[120px]` |
| emoji 大小 | `text-xl` | `text-2xl` |
| 标题大小 | `text-base` | `text-lg` |
| 内边距 | `p-3` | `p-4` |
| 分类标签 | `text-[10px]` | `text-xs` |

---

#### 4. 更新主页面布局

**文件**：`src/pages/Awakening.tsx`

修改内容：
- 删除 `AwakeningPainPointCard` 导入和引用
- 删除内联的「写法小贴士」区块
- 新增 `AwakeningTipsCard` 导入和引用
- **保留底部金句**

```tsx
<main className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
  {/* 简化后的 Hero */}
  <AwakeningHeroCard />

  {/* 6个大按钮 */}
  <div className="space-y-3">
    {/* 困境区 */}
    <div className="space-y-2">
      <分隔线 />
      <div className="grid grid-cols-3 gap-2">
        {challengeDimensions.map(...)}
      </div>
    </div>
    
    {/* 顺境区 */}
    <div className="space-y-2">
      <分隔线 />
      <div className="grid grid-cols-3 gap-2">
        {blessingDimensions.map(...)}
      </div>
    </div>
  </div>

  {/* 可折叠的写法小贴士 */}
  <AwakeningTipsCard />

  {/* 保留底部金句 */}
  <motion.div className="text-center text-xs text-muted-foreground pt-2">
    <p>把平凡日常积累成个人成长的复利资产</p>
    <p className="mt-1">将碎片化时间冶炼成金 ✨</p>
  </motion.div>
</main>
```

---

### 优化后页面结构

```text
觉察日记页面 (/awakening) - 优化后
├── Header（标题栏）
├── AwakeningHeroCard（仅核心标语，2行）
├── 困境区分隔线 + 3个大按钮（120px高）
├── 顺境区分隔线 + 3个大按钮（120px高）
├── AwakeningTipsCard（可折叠写法小贴士）
├── 底部金句（保留）
└── AwakeningBottomNav（底部导航）
```

---

### 修改文件清单

| 文件 | 操作 | 说明 |
|-----|-----|-----|
| `src/components/awakening/AwakeningHeroCard.tsx` | 修改 | 删除统计卡片 |
| `src/components/awakening/AwakeningEntryCard.tsx` | 修改 | 放大 compact 模式按钮 |
| `src/components/awakening/AwakeningTipsCard.tsx` | 新建 | 可折叠写法小贴士组件 |
| `src/pages/Awakening.tsx` | 修改 | 删除痛点卡片，引入新组件，保留金句 |
| `src/components/awakening/AwakeningPainPointCard.tsx` | 可保留 | 暂不删除文件，仅移除引用 |

---

### 视觉效果对比

| 指标 | 优化前 | 优化后 |
|-----|-------|-------|
| 首屏可见按钮 | 可能只有3个 | 全部6个 |
| 单个按钮高度 | 90px | 120px |
| 按钮占屏比例 | ~40% | ~60% |
| 写法小贴士 | 始终展开 | 折叠（默认收起） |
| 底部金句 | 有 | 保留 |

