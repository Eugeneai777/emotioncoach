

## 点击体验包查看产品介绍功能

### 需求理解

用户希望在产品中心（/packages）页面，点击4种体验包卡片时能弹出简单的产品介绍，让用户了解每个体验包的具体内容。

### 实现方案

使用 Dialog 组件，为每个体验包卡片添加点击事件，点击后弹出该产品的简介。

### 涉及文件

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| `src/config/youjinPartnerProducts.ts` | 修改 | 为每个体验包添加产品介绍文案 |
| `src/components/ProductComparisonTable.tsx` | 修改 | 添加点击弹窗逻辑和 Dialog 组件 |

---

### 1. 扩展配置数据 `src/config/youjinPartnerProducts.ts`

为每个体验包添加 `description`（简短介绍）和 `features`（功能亮点）字段：

```typescript
export interface ExperiencePackageItem {
  key: string;
  name: string;
  value: string;
  icon: string;
  description: string;
  features: string[];
  route?: string; // 可选：跳转到详情页
}

export const experiencePackageItems: ExperiencePackageItem[] = [
  { 
    key: 'ai_points', 
    name: '尝鲜会员', 
    value: '50点', 
    icon: '🎫',
    description: '体验有劲AI教练的入门权益，50点可与5位AI教练对话约50次',
    features: [
      '5位AI教练任选对话',
      '情绪觉醒、亲子、沟通等主题',
      '情绪🆘按钮即时支持',
      '20+成长工具免费使用'
    ],
    route: '/packages'
  },
  { 
    key: 'emotion_health', 
    name: '情绪健康测评', 
    value: '1次', 
    icon: '💚',
    description: '56道专业题目评估您的情绪健康状态，生成个性化分析报告',
    features: [
      '56道专业测评题目',
      '5个维度情绪健康评估',
      '个性化改善建议',
      '专属成长路径推荐'
    ],
    route: '/emotion-health'
  },
  { 
    key: 'scl90', 
    name: 'SCL-90心理测评', 
    value: '1次', 
    icon: '📋',
    description: '国际通用的90题心理健康筛查量表，10个维度全面评估',
    features: [
      '90道标准化测评题',
      '10个心理因子分析',
      '雷达图可视化结果',
      '详细改善建议'
    ],
    route: '/scl90'
  },
  { 
    key: 'wealth_block', 
    name: '财富卡点测评', 
    value: '1次', 
    icon: '💰',
    description: '24道问题诊断财富认知卡点，揭示阻碍财富成长的深层原因',
    features: [
      '24道财富认知诊断',
      '4种财富卡点类型分析',
      'AI深度追问洞察',
      '专属突破建议'
    ],
    route: '/wealth-block'
  },
];
```

---

### 2. 修改 `src/components/ProductComparisonTable.tsx`

**2.1 添加导入**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { experiencePackageItems } from "@/config/youjinPartnerProducts";
```

**2.2 将静态卡片改为可点击卡片 + Dialog**

将第595-622行的4个静态 `<div>` 改为使用配置数据循环渲染，并包裹 Dialog：

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {experiencePackageItems.map((pkg) => {
    // 根据不同包定义颜色主题
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      ai_points: { 
        bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', 
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-400'
      },
      emotion_health: { 
        bg: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30', 
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-600 dark:text-green-400'
      },
      scl90: { 
        bg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', 
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-600 dark:text-amber-400'
      },
      wealth_block: { 
        bg: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30', 
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-600 dark:text-purple-400'
      },
    };
    const colors = colorMap[pkg.key] || colorMap.ai_points;

    return (
      <Dialog key={pkg.key}>
        <DialogTrigger asChild>
          <div 
            className={`bg-gradient-to-br ${colors.bg} rounded-lg p-3 ${colors.border} border text-center cursor-pointer hover:scale-105 transition-transform`}
          >
            <span className="text-2xl">{pkg.icon}</span>
            <p className="font-medium text-sm mt-1">{pkg.name}</p>
            <p className={`text-xs ${colors.text}`}>{pkg.value}</p>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span>{pkg.icon}</span>
              {pkg.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 简介 */}
            <p className="text-sm text-muted-foreground">{pkg.description}</p>
            
            {/* 功能亮点 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">✨ 包含内容</p>
              <ul className="space-y-1.5">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 价值标签 */}
            <div className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${colors.bg} ${colors.text}`}>
              免费领取 · {pkg.value}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  })}
</div>
```

---

### 效果预览

点击任意体验包卡片后弹出：

```text
┌─────────────────────────────────────┐
│  💚 情绪健康测评                    │
├─────────────────────────────────────┤
│  56道专业题目评估您的情绪健康状态，  │
│  生成个性化分析报告                  │
│                                     │
│  ✨ 包含内容                        │
│  ✓ 56道专业测评题目                 │
│  ✓ 5个维度情绪健康评估               │
│  ✓ 个性化改善建议                   │
│  ✓ 专属成长路径推荐                  │
│                                     │
│  [免费领取 · 1次]                   │
└─────────────────────────────────────┘
```

### 交互细节

- 卡片添加 `cursor-pointer` 和 `hover:scale-105` 提示可点击
- Dialog 使用底部弹出样式（移动端）和居中样式（桌面端）
- 保持与 PointsRulesDialog 一致的设计风格

