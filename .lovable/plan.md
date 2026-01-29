

## 重新设计绽放训练营产品卡片颜色

### 参考分析

根据提供的参考图，需要调整两个绽放训练营产品的视觉风格：

| 产品 | 当前渐变 | 参考图效果 | 新设计 |
|:-----|:---------|:-----------|:-------|
| 身份绽放训练营 🦋 | `from-purple-600 via-pink-500 to-rose-500` | 深紫到品红的渐变，边缘发光效果 | `from-purple-700 via-fuchsia-600 to-rose-500` |
| 情感绽放训练营 💚 | `from-pink-500 via-rose-500 to-purple-500` | 暖色调米黄/杏色渐变 | `from-amber-100 via-orange-100 to-yellow-50` |

---

### 设计要点

#### 1. 身份绽放训练营 - 紫粉色调优化
- **保持紫色调**，增强对比度和饱和度
- 更深的紫色起点 → 品红过渡 → 玫红结尾
- 文字保持白色确保可读性

#### 2. 情感绽放训练营 - 暖色调重设计
- **完全改变配色方案**：从粉紫色改为暖米黄色调
- 使用柔和的暖色：米白/杏色/淡黄
- **关键改变**：文字颜色从白色改为深色（棕色/深灰）确保可读性
- 按钮渐变也需要相应调整

---

### 实施方案

#### 文件修改：`src/components/ProductComparisonTable.tsx`

**第一处修改 - 渐变色映射表（约第817-821行）**

```tsx
// 改动前
const gradientMap: Record<string, string> = {
  'identity_bloom': 'from-purple-600 via-pink-500 to-rose-500',
  'emotion_bloom': 'from-pink-500 via-rose-500 to-purple-500',
};

// 改动后
const gradientMap: Record<string, string> = {
  'identity_bloom': 'from-purple-700 via-fuchsia-600 to-rose-500',
  'emotion_bloom': 'from-amber-100 via-orange-100 to-yellow-50',
};
```

**第二处修改 - 文字颜色适配**

针对暖色背景（情感绽放），需要动态调整文字颜色：

```tsx
// 判断是否为浅色背景
const isLightBg = camp.camp_type === 'emotion_bloom';
const textColorClass = isLightBg ? 'text-amber-900' : 'text-white';
const subTextColorClass = isLightBg ? 'text-amber-800/85' : 'text-white/85';
const tagBgClass = isLightBg ? 'bg-amber-900/15' : 'bg-white/20';
const tagTextClass = isLightBg ? 'text-amber-900/90' : 'text-white/95';
```

应用到各元素：
- 标题：`text-white` → `textColorClass`
- 副标题：`text-white/85` → `subTextColorClass`
- 标签背景：`bg-white/20` → `tagBgClass`
- 标签文字：`text-white/95` → `tagTextClass`
- 价格：动态适配

**第三处修改 - 按钮渐变适配**

暖色背景的按钮使用暖色渐变确保视觉一致性：

```tsx
const buttonGradient = isLightBg 
  ? 'from-amber-500 via-orange-500 to-amber-600' 
  : gradient;
```

---

### 技术细节

#### 颜色对比分析

| 元素 | 身份绽放（深色背景） | 情感绽放（浅色背景） |
|:-----|:---------------------|:---------------------|
| 背景 | `from-purple-700 via-fuchsia-600 to-rose-500` | `from-amber-100 via-orange-100 to-yellow-50` |
| 标题 | `text-white` | `text-amber-900` |
| 副标题 | `text-white/85` | `text-amber-800/85` |
| 标签背景 | `bg-white/20` | `bg-amber-900/15` |
| 标签文字 | `text-white/95` | `text-amber-900/90` |
| 价格 | `text-white` | `text-amber-900` |
| 原价 | `text-white/60` | `text-amber-700/60` |
| 价格标签 | `bg-amber-400 text-amber-900` | `bg-amber-500 text-white` |
| 按钮 | `from-purple-700 via-fuchsia-600 to-rose-500` | `from-amber-500 via-orange-500 to-amber-600` |

---

### 涉及文件

| 文件 | 修改内容 |
|:-----|:---------|
| `src/components/ProductComparisonTable.tsx` | 更新渐变色映射表、动态文字颜色、按钮适配 |

---

### 预期效果

1. **身份绽放训练营**：
   - 保持紫粉色调，但更加鲜艳饱和
   - 蝴蝶图标 🦋 在紫色背景上更加醒目

2. **情感绽放训练营**：
   - 温暖的米黄/杏色渐变背景
   - 绿色爱心 💚 在暖色背景上形成互补色对比
   - 深色文字确保可读性
   - 整体传达温暖、情感支持的氛围

3. **视觉区分**：
   - 两个产品视觉风格明显不同
   - 身份绽放 = 活力、蜕变、华丽
   - 情感绽放 = 温暖、治愈、柔和

