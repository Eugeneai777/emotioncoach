

## 整合「你是否也这样？」和「写法小贴士」

### 用户需求
将两张独立卡片合并为一张：
1. 保留「你是否也这样？」卡片的位置和样式
2. 写法小贴士内容放在「记录=用最低成本打破无意识状态」之后

---

### 当前结构

**AwakeningPainPointCard 展开内容：**
```text
• 每天机械化起床、上班、刷手机
• 上周发生的事，模模糊糊没印象
• 在信息茧房里「自动驾驶」
• 感觉迷茫混乱，抓不住重点
─────────────────────────────
📝 记录 = 用最低成本打破无意识状态
```

**AwakeningTipsCard 展开内容：**
```text
• 写困境时，不叫「困难」，叫「破局关键点」
• 写顺境时，记录微小美好：散步、电影、灵感、三餐
```

---

### 合并后结构

```text
┌─────────────────────────────────────┐
│ ⚠️ 你是否也这样？              ▼    │  ← 触发区域（保持不变）
├─────────────────────────────────────┤
│ • 每天机械化起床、上班、刷手机      │
│ • 上周发生的事，模模糊糊没印象      │
│ • 在信息茧房里「自动驾驶」          │
│ • 感觉迷茫混乱，抓不住重点          │
│ ─────────────────────────────────── │
│ 📝 记录 = 用最低成本打破无意识状态  │
│ ─────────────────────────────────── │  ← 新增分隔线
│ 💡 写法小贴士                       │  ← 小标题
│ • 写困境时，叫「破局关键点」        │  ← 红色圆点
│ • 写顺境时，记录微小美好            │  ← 绿色圆点
└─────────────────────────────────────┘
```

---

### 修改方案

**文件**：`src/components/awakening/AwakeningPainPointCard.tsx`

在展开内容的「记录=...」区块之后，添加写法小贴士区块：

```tsx
// 在 painPoints 数组后添加 tips 数组
const tips = [
  {
    colorClass: "text-destructive/70",
    text: '写困境时，不叫「困难」，叫「破局关键点」或「命运转折点」'
  },
  {
    colorClass: "text-primary/70",
    text: '写顺境时，记录微小美好：散步、电影、灵感、三餐'
  }
];

// 在「📝 记录=...」div 之后添加
<div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/30">
  <div className="flex items-center gap-1 mb-2">
    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
      写法小贴士
    </span>
  </div>
  <ul className="space-y-1.5">
    {tips.map((tip, index) => (
      <motion.li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
        <span className={cn("mt-0.5", tip.colorClass)}>•</span>
        <span>{tip.text}</span>
      </motion.li>
    ))}
  </ul>
</div>
```

**文件**：`src/pages/Awakening.tsx`

移除独立的 `AwakeningTipsCard` 引用：

```tsx
// 删除导入
- import AwakeningTipsCard from "@/components/awakening/AwakeningTipsCard";

// 删除组件引用
- <AwakeningTipsCard />
```

---

### 修改文件清单

| 文件 | 操作 | 说明 |
|-----|-----|-----|
| `src/components/awakening/AwakeningPainPointCard.tsx` | 修改 | 添加写法小贴士内容 |
| `src/pages/Awakening.tsx` | 修改 | 移除 AwakeningTipsCard 引用 |
| `src/components/awakening/AwakeningTipsCard.tsx` | 可保留 | 暂不删除文件 |

