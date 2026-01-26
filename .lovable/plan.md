

# 添加科学量表信任表格方案

## 一、需求分析

根据用户提供的参考图片，需要新增一个科学背书表格，展示三大指数与国际通用心理量表的对应关系：

| 指数 | 对标量表 | 你可用命名 |
|------|----------|-----------|
| 情绪能量 | PHQ-9 | 情绪能量指数 |
| 紧张预期 | GAD-7 | 焦虑张力指数 |
| 压力承载 | PSS-10 | 压力负载指数 |

**目标**：通过展示专业量表来源，大幅提升用户对测评科学性的信任感。

---

## 二、当前系统数据

代码中已有对应的科学量表映射关系（emotionHealthData.ts）：

```text
- 情绪能量指数 E（对标 PHQ-9 简化）→ 题目 1-4
- 焦虑张力指数 A（对标 GAD-7 简化）→ 题目 5-8  
- 压力负载指数 S（对标 PSS-10 简化）→ 题目 9-12
```

但这些信息目前仅存在于代码注释中，未在介绍页展示给用户。

---

## 三、实施方案

### 3.1 数据层新增（emotionHealthData.ts）

```typescript
// 科学量表对照配置
export const scientificScalesMapping = [
  {
    indexName: '情绪能量',
    scale: 'PHQ-9',
    scaleFullName: 'Patient Health Questionnaire-9',
    displayName: '情绪能量指数',
    description: '抑郁症状筛查国际标准量表',
    color: 'cyan'
  },
  {
    indexName: '紧张预期',
    scale: 'GAD-7',
    scaleFullName: 'Generalized Anxiety Disorder-7',
    displayName: '焦虑张力指数',
    description: '广泛性焦虑评估国际标准量表',
    color: 'purple'
  },
  {
    indexName: '压力承载',
    scale: 'PSS-10',
    scaleFullName: 'Perceived Stress Scale-10',
    displayName: '压力负载指数',
    description: '压力感知评估国际标准量表',
    color: 'rose'
  }
];
```

### 3.2 UI组件新增（EmotionHealthStartScreen.tsx）

在**模块6：三层洋葱模型**内，精简后的三层说明下方添加科学量表表格：

```text
┌─────────────────────────────────────────────────────────────┐
│  ✅ 第一层：状态筛查（科学背书层）                          │
│                                                             │
│  目的：建立专业信任 + 判断风险等级                         │
│  建议包含 3 个指数：                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  指数        对标量表      本测评命名               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  情绪能量    PHQ-9        情绪能量指数              │   │
│  │  紧张预期    GAD-7        焦虑张力指数              │   │
│  │  压力承载    PSS-10       压力负载指数              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 以上量表均为国际权威心理健康筛查工具                   │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 UI实现细节

使用现有的 Table 组件创建清晰的三列表格：

```tsx
{/* 科学量表对照表 */}
<div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-800">
  <div className="flex items-center gap-2 mb-3">
    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
      第一层：状态筛查（科学背书层）
    </span>
  </div>
  
  <p className="text-xs text-muted-foreground mb-3">
    目的：建立专业信任 + 判断情绪风险等级
  </p>

  <Table className="text-xs">
    <TableHeader>
      <TableRow className="bg-white/50 dark:bg-white/5">
        <TableHead className="py-2 px-3 font-semibold">指数</TableHead>
        <TableHead className="py-2 px-3 font-semibold">对标量表</TableHead>
        <TableHead className="py-2 px-3 font-semibold">本测评命名</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {scientificScalesMapping.map((item, index) => (
        <TableRow key={index} className="border-0">
          <TableCell className="py-2 px-3">{item.indexName}</TableCell>
          <TableCell className="py-2 px-3">
            <Badge variant="outline" className="font-mono text-xs">
              {item.scale}
            </Badge>
          </TableCell>
          <TableCell className="py-2 px-3 text-primary font-medium">
            {item.displayName}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
  
  <p className="text-[10px] text-muted-foreground mt-3 text-center">
    💡 以上量表均为国际权威心理健康筛查工具
  </p>
</div>
```

---

## 四、位置选择

将此表格放置在**模块6：三层洋葱模型**的简化三层说明之后：

```text
现有结构：
├── 三层洋葱模型图
├── "由外向内 · 层层剥离 · 直达情绪卡点"
├── 第一层说明（状态筛查 12题）
├── 第二层说明（反应模式 16题）
├── 第三层说明（行动阻滞 4题）
└── [新增] 科学量表对照表  ← 插入位置

理由：
1. 在用户了解三层结构后，补充第一层的科学依据
2. 强化"这不是随便写的测评"的印象
3. 表格形式清晰专业，快速建立信任
```

---

## 五、实施步骤

| 步骤 | 内容 | 文件 |
|------|------|------|
| 1 | 添加 `scientificScalesMapping` 配置 | emotionHealthData.ts |
| 2 | 更新 index.ts 导出新配置 | index.ts |
| 3 | 在模块6中添加科学量表表格 | EmotionHealthStartScreen.tsx |
| 4 | 引入 Table 相关组件 | EmotionHealthStartScreen.tsx |

---

## 六、视觉设计

### 配色方案

| 元素 | 颜色 |
|------|------|
| 容器背景 | 渐变绿 `from-emerald-50 to-cyan-50` |
| 标题图标 | 绿色勾 `emerald-600` |
| 表头背景 | 半透明白 `white/50` |
| 量表徽章 | outline + 等宽字体 |
| 测评命名 | 主题色 + 加粗 |

### 表格样式

- 紧凑行高（py-2）适配移动端
- 无边框设计，更简洁
- 等宽字体显示量表缩写（PHQ-9, GAD-7, PSS-10）
- 底部脚注使用 10px 灰色文字

---

## 七、预期效果

| 维度 | 改进 |
|------|------|
| **专业信任** | 通过展示国际标准量表来源，大幅提升可信度 |
| **用户认知** | 让用户明白"这是有科学依据的测评，不是随便写的" |
| **差异化** | 区别于市面上的娱乐型测试 |
| **转化率** | 信任感提升将直接影响付费意愿 |

