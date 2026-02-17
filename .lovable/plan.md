

## /camps 页面设计排版优化

### 问题清单

| # | 问题 | 位置 |
|---|------|------|
| 1 | 统计区"21天 科学周期"写死，但训练营有 7/21/28/30 天不同周期 | CampList.tsx 第259行 |
| 2 | `isBloomCamp` 只包含 emotion_bloom 和 identity_bloom，漏掉了新增的 life_bloom | CampTemplateCard.tsx 第25行 |
| 3 | 手机端2列卡片标题被截断（"7天财富觉醒训..."），信息丢失严重 | CampTemplateCard.tsx 卡片设计 |
| 4 | 卡片同时显示 subtitle 和 description，两者都被截断，冗余且无效 | CampTemplateCard.tsx 第126-132行 |
| 5 | 价格字号 text-2xl 在窄卡片中过大，¥12,800 几乎占满宽度 | CampTemplateCard.tsx 第153行 |
| 6 | 付费卡片底部"立即购买"+"了解更多"双按钮占用大量垂直空间 | CampTemplateCard.tsx 第181-201行 |

### 修改方案

**1. 统计区：用动态数据替换硬编码"21天"**

`src/pages/CampList.tsx` 第258-260行

将中间统计卡片从写死的"21天 科学周期"改为动态显示总报名人数：

```tsx
// 之前
<div className="text-2xl sm:text-3xl font-bold ...">21天</div>
<div className="...">科学周期</div>

// 之后
<div className="text-2xl sm:text-3xl font-bold ...">{stats.total.enrolled}</div>
<div className="...">学员报名</div>
```

**2. 修复 `isBloomCamp` 遗漏 `life_bloom`**

`src/components/camp/CampTemplateCard.tsx` 第25行

```tsx
// 之前
const isBloomCamp = ['emotion_bloom', 'identity_bloom'].includes(camp.camp_type);

// 之后
const isBloomCamp = ['emotion_bloom', 'identity_bloom', 'life_bloom'].includes(camp.camp_type);
```

**3. 重新设计卡片布局 -- 紧凑高效**

`src/components/camp/CampTemplateCard.tsx` 整体优化：

- **合并 subtitle 和 description**：手机端只显示 subtitle（更短），隐藏 description；桌面端才显示 description
- **标题自适应字号**：`text-base sm:text-xl`，手机端缩小以避免截断
- **价格字号缩小**：`text-lg sm:text-2xl`，在窄卡片中更协调
- **合并底部按钮**：付费卡片只保留一个按钮（点击购买，整张卡片可点击了解更多），去掉"了解更多"独立按钮
- **天数 Badge 整合到标题行**：将天数徽章从内容区移到标题旁，减少垂直占用
- **渐变头图进一步压缩**：手机端 `h-24 sm:h-36`
- **标签精简**：手机端渐变头图上的标签（绽放系列、深度转化）只保留1个，避免多标签挤占空间

### 涉及文件

- `src/pages/CampList.tsx` -- 统计区动态化
- `src/components/camp/CampTemplateCard.tsx` -- 卡片布局重构、isBloomCamp 修复、响应式优化

### 预期效果

- 手机端卡片高度减少约 30%，标题不再截断
- 统计区数据真实反映训练营多样性
- 生命绽放特训营获得正确的绽放系列视觉样式
- 付费卡片更简洁，购买按钮更突出

