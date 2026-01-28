

# 优化训练营卡片颜色差异

## 问题分析

从截图可以看到，**青少年困境突破营**和**财富觉醒训练营**的颜色几乎一样（都是青绿色系），难以区分。

## 优化方案

为每个训练营使用**色相差距大**的颜色，确保一眼能区分：

| 训练营 | 主题 | 新配色 | 色系 |
|:------|:-----|:------|:-----|
| 情绪日记 | 情感/内心 | `from-purple-500 via-pink-500 to-rose-500` | 紫粉色 |
| 青少年困境突破 | 亲子/教育 | `from-blue-500 via-sky-500 to-cyan-500` | 蓝色 |
| 财富觉醒 | 金钱/财富 | `from-amber-500 via-orange-500 to-yellow-400` | 金橙色 |

### 颜色选择原理

- **紫粉色**：情绪、内心世界 → 柔和、治愈
- **蓝色**：青少年、成长 → 信任、稳定  
- **金橙色**：财富、能量 → 活力、积极

这三种颜色在色轮上相距较远，视觉区分度高。

## 技术实现

### 修改文件：`src/components/ProductComparisonTable.tsx`

更新 `gradientMap`：

```typescript
const gradientMap: Record<string, string> = {
  'emotion_journal_21': 'from-purple-500 via-pink-500 to-rose-500',
  'teen_breakthrough_14': 'from-blue-500 via-sky-500 to-cyan-500',
  'wealth_awakening_7': 'from-amber-500 via-orange-500 to-yellow-400',
};
```

同时更新默认 fallback 颜色：
```typescript
const gradient = gradientMap[camp.camp_type] || 'from-slate-500 via-gray-500 to-slate-600';
```

## 预期效果

| 卡片 | 当前 | 修改后 |
|:----|:-----|:------|
| 情绪日记 | 紫粉 | 保持紫粉 |
| 青少年困境 | 青绿（与财富撞色） | 改为蓝色 |
| 财富觉醒 | 青绿 | 改为金橙色 |

三张卡片颜色差异明显，一目了然。

