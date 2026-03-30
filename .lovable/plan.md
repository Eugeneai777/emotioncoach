

# 女性专区插画更新 + 人群卡片排序调整

## 评估

### 1. 插画问题 — 确实不合适

当前 `mama` 插画的生成 prompt 是 **"a gentle mother holding a baby"**（妈妈抱婴儿），这与已升级的"女性专区"定位严重不符。35+ 单身女性、已婚未育女性看到"抱孩子"的画面会产生心理排斥，直接影响点击率。

**需要做**：更新生成 prompt 为更泛化的女性形象（如自信独立的职场女性、或多元女性群像），然后重新生成插画并替换数据库记录。

### 2. 排序调整 — 商业合理

你提出的排序：

```text
第一排：女性专区  银发陪伴  情侣夫妻
第二排：中年觉醒  青少年    职场解压
```

**商业评估**：
- **女性专区 + 中年觉醒对角线分布**，两个核心付费转化入口（挂测评 badge）分别占据左上、左下视觉焦点位，符合 Z 字阅读动线
- **银发陪伴提前**到第一排中间 — 这是一个家庭决策型入口（子女替父母选），放在显眼位置有利于口碑传播
- **职场解压移到右下** — 当前已无 badge，降低了其战略优先级，放在末位合理

---

## 具体改动

### 1. 调整卡片排序（两个文件）

**`MiniAppEntry.tsx`** 和 **`AudienceHub.tsx`** 中 audiences 数组重排为：

1. 女性专区 (mama)
2. 银发陪伴 (senior)
3. 情侣夫妻 (couple)
4. 中年觉醒 (midlife)
5. 青少年 (youth)
6. 职场解压 (workplace)

### 2. 更新女性专区插画 prompt + 重新生成

**`generate-audience-illustrations/index.ts`** 中将 mama prompt 从：
> "a gentle mother holding a baby..."

改为：
> "a confident modern Chinese woman standing tall, professional attire with warm smile, representing empowerment and independence, soft rose-pink tones, minimalist flat style..."

然后调用 edge function 重新生成 mama 插画。

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/pages/MiniAppEntry.tsx` | audiences 数组重排顺序 |
| `src/components/energy-studio/AudienceHub.tsx` | audiences 数组重排顺序 |
| `supabase/functions/generate-audience-illustrations/index.ts` | 更新 mama prompt |
| 数据库 `audience_illustrations` | 调用 edge function 重新生成 mama 插画 |

