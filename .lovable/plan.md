
# 添加三层诊断对照表方案

## 一、需求分析

根据用户提供的截图，需要在模块6（三层诊断）中为第二层和第三层添加对照表格：

### 第二层表格：4大反应模式
| 模式 | 本质 | 对应人群 |
|------|------|----------|
| 能量耗竭型 | 长期付出无恢复 | 宝妈/护理者/管理者 |
| 高度紧绷型 | 完美主义+控制 | 职场骨干 |
| 情绪压抑型 | 不敢表达真实需要 | 关系型人格 |
| 逃避延迟型 | 情绪一来就拖延 | 自由职业/学生 |

### 第三层表格：4个行动维度
| 维度 | 问什么 |
|------|--------|
| 行动 | 知道该做但做不动吗 |
| 情绪 | 情绪是否常淹没你 |
| 信念 | 是否觉得自己不够好 |
| 给予 | 是否长期只消耗不滋养 |

---

## 二、当前系统数据

代码中已有可复用的数据：

### patternConfig（第二层可用）
```typescript
exhaustion: { name: '能量耗竭型', targetAudience: '宝妈 / 护理者 / 管理者' }
tension: { name: '高度紧绷型', targetAudience: '职场骨干 / 完美主义者' }
suppression: { name: '情绪压抑型', targetAudience: '关系型人格 / 照顾者' }
avoidance: { name: '逃避延迟型', targetAudience: '自由职业者 / 学生' }
```

### 第三层问题（需要新增配置）
```typescript
{ id: 29, text: "你是否知道该做什么，但就是启动不了？", blockageType: 'action' }
{ id: 30, text: "你的情绪是否经常会淹没你，让你难以思考？", blockageType: 'emotion' }
{ id: 31, text: "你是否经常觉得自己不够好，或不值得？", blockageType: 'belief' }
{ id: 32, text: "你是否长期只在消耗能量，很少被滋养？", blockageType: 'giving' }
```

---

## 三、实施方案

### 3.1 数据层新增（emotionHealthData.ts）

```typescript
// 第二层：反应模式对照配置
export const patternTableMapping = [
  { pattern: '能量耗竭型', essence: '长期付出无恢复', audience: '宝妈/护理者/管理者', color: 'orange' },
  { pattern: '高度紧绷型', essence: '完美主义+控制', audience: '职场骨干', color: 'blue' },
  { pattern: '情绪压抑型', essence: '不敢表达真实需要', audience: '关系型人格', color: 'purple' },
  { pattern: '逃避延迟型', essence: '情绪一来就拖延', audience: '自由职业/学生', color: 'teal' },
];

// 第三层：行动阻滞维度配置
export const blockageDimensionMapping = [
  { dimension: '行动', question: '知道该做但做不动吗', emoji: '🎯' },
  { dimension: '情绪', question: '情绪是否常淹没你', emoji: '🌊' },
  { dimension: '信念', question: '是否觉得自己不够好', emoji: '💭' },
  { dimension: '给予', question: '是否长期只消耗不滋养', emoji: '🔋' },
];
```

### 3.2 UI组件新增（EmotionHealthStartScreen.tsx）

在模块6的三层简化说明之后，分别添加第二层和第三层的对照表格：

```text
┌─────────────────────────────────────────────────────────────┐
│  🧅 三层洋葱图                                              │
│  "由外向内 · 层层剥离 · 直达情绪卡点"                        │
├─────────────────────────────────────────────────────────────┤
│  ● 第一层 状态筛查（12题）                                  │
│  ● 第二层 反应模式（16题）                                  │
│  ● 第三层 行动路径（4题）                                   │
├─────────────────────────────────────────────────────────────┤
│  ✅ 第一层表格（科学量表对照）    ← 已有                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 指数 | 对标量表 | 本测评命名                        │    │
│  └────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  🧠 第二层表格（4大反应模式）    ← 新增                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 模式 | 本质 | 对应人群                             │    │
│  │ 能量耗竭型 | 长期付出无恢复 | 宝妈/护理者/管理者    │    │
│  │ ...                                                │    │
│  └────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  🎯 第三层表格（4个行动维度）    ← 新增                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 维度 | 问什么                                      │    │
│  │ 行动 | 知道该做但做不动吗                          │    │
│  │ ...                                                │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、视觉设计

### 第二层表格配色（紫色系，匹配"反应模式"层）
| 元素 | 颜色 |
|------|------|
| 容器背景 | `from-purple-50 to-violet-50` |
| 标题图标 | `🧠` + `text-purple-600` |
| 模式名称 | 各自对应颜色 badge |

### 第三层表格配色（玫红系，匹配"行动路径"层）
| 元素 | 颜色 |
|------|------|
| 容器背景 | `from-rose-50 to-pink-50` |
| 标题图标 | `🎯` + `text-rose-600` |
| 维度名称 | 简洁两列布局 |

---

## 五、实施步骤

| 步骤 | 内容 | 文件 |
|------|------|------|
| 1 | 添加 `patternTableMapping` 配置 | emotionHealthData.ts |
| 2 | 添加 `blockageDimensionMapping` 配置 | emotionHealthData.ts |
| 3 | 更新 index.ts 导出新配置 | index.ts |
| 4 | 在模块6添加第二层表格 | EmotionHealthStartScreen.tsx |
| 5 | 在模块6添加第三层表格 | EmotionHealthStartScreen.tsx |

---

## 六、代码实现细节

### 第二层表格UI
```tsx
{/* 第二层：反应模式对照表 */}
<div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800">
  <div className="flex items-center gap-2 mb-2">
    <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
    <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
      第二层：反应模式（卡点诊断层）
    </span>
  </div>
  
  <Table className="text-xs">
    <TableHeader>
      <TableRow className="bg-white/50 dark:bg-white/5 border-0">
        <TableHead className="py-2 px-2 font-semibold h-auto">模式</TableHead>
        <TableHead className="py-2 px-2 font-semibold h-auto">本质</TableHead>
        <TableHead className="py-2 px-2 font-semibold h-auto">对应人群</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {patternTableMapping.map((item, index) => (
        <TableRow key={index} className="border-0">
          <TableCell className="py-1.5 px-2 font-medium">{item.pattern}</TableCell>
          <TableCell className="py-1.5 px-2 text-muted-foreground">{item.essence}</TableCell>
          <TableCell className="py-1.5 px-2 text-muted-foreground">{item.audience}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

### 第三层表格UI
```tsx
{/* 第三层：行动阻滞维度对照表 */}
<div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800">
  <div className="flex items-center gap-2 mb-2">
    <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />
    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
      第三层：行动路径（转化承接层）
    </span>
  </div>
  
  <Table className="text-xs">
    <TableHeader>
      <TableRow className="bg-white/50 dark:bg-white/5 border-0">
        <TableHead className="py-2 px-2 font-semibold h-auto">维度</TableHead>
        <TableHead className="py-2 px-2 font-semibold h-auto">问什么</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {blockageDimensionMapping.map((item, index) => (
        <TableRow key={index} className="border-0">
          <TableCell className="py-1.5 px-2">
            <span className="inline-flex items-center gap-1.5">
              <span>{item.emoji}</span>
              <span className="font-medium">{item.dimension}</span>
            </span>
          </TableCell>
          <TableCell className="py-1.5 px-2 text-muted-foreground">{item.question}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

---

## 七、文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `emotionHealthData.ts` | 添加 `patternTableMapping` 和 `blockageDimensionMapping` 配置 |
| `index.ts` | 导出新增配置 |
| `EmotionHealthStartScreen.tsx` | 导入新配置 + 添加两个表格UI |

---

## 八、预期效果

| 维度 | 改进 |
|------|------|
| **信息完整性** | 三层诊断都有对应表格，用户一目了然 |
| **视觉层次** | 三种配色（绿/紫/粉）对应三层，清晰区分 |
| **专业感** | 表格形式展示诊断维度，提升可信度 |
| **用户预期** | 用户能提前了解测评会诊断哪些方面 |
