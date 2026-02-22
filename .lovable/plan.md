

## 海报工坊模板补齐与分类优化

### 现状分析

| 维度 | 数量 | 说明 |
|------|------|------|
| 海报模板 (posterTemplates) | 11 | 全部平铺展示，无分类 |
| 介绍页卡片 (introShareConfigs) | 17 | 有分类但不在海报工坊中 |
| 结果类分享卡 (shareCardsRegistry) | 20+ | 不适用海报推广 |

海报工坊缺少 6 个可推广产品的模板：

| 缺少的模板 | 产品 | 优先级 |
|------------|------|--------|
| scl90 | SCL-90 心理测评 | 高（体验包内） |
| emotion_health | 情绪健康测评 | 高（体验包内） |
| alive_check | 安全打卡 | 高（体验包内） |
| vibrant_life | AI生活教练 | 中 |
| awakening | 觉察系统 | 中 |
| parent_teen | 亲子双轨模式 | 中 |

注：coachSpace、energyStudio、introduction、platformIntro、promoGuide、youjinPartner 属于聚合入口页或合伙人内部页面，不适合单独做推广海报。

### 方案

#### 1. 新增 6 个海报模板

在 `PosterTemplateGrid.tsx` 的 `posterTemplates` 数组中添加 6 个新模板，每个包含 tagline、sellingPoints、3 个场景文案。

#### 2. 模板分类展示

将 11+6 = 17 个模板分为 4 类，按优先级排列：

```text
+---------------------------+
| 推荐        (置顶高亮)      |
| experience_pack, wealth_block, scl90, emotion_health, alive_check |
+---------------------------+
| 教练        |
| emotion_coach, parent_coach, communication_coach, story_coach, vibrant_life |
+---------------------------+
| 训练营      |
| emotion_journal_21, parent_emotion_21, awakening, parent_teen |
+---------------------------+
| 会员 & 合伙人 |
| 365_member, partner_recruit |
+---------------------------+
```

#### 3. UI 改造

- `PosterTemplateGrid` 添加分组标题和分类 Tab 筛选
- "推荐"分类默认展示，包含体验包和测评类模板
- 每组用小标题分隔，推荐组加"热门"标签

#### 4. PosterPreview slogan 映射

为新增的 6 个模板补充 slogan 映射。

#### 5. PosterGenerator AI 背景 prompt

为新增的 6 个模板补充 `stylePrompts` 映射。

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/components/poster/PosterTemplateGrid.tsx` | 新增 6 模板 + 分类分组 UI |
| `src/components/poster/PosterPreview.tsx` | 新增 6 个 slogan 映射 |
| `src/components/poster/PosterGenerator.tsx` | 新增 6 个 AI 背景 prompt |

### 不需要改动

- PosterCenter.tsx（选择逻辑不变）
- 数据库（纯前端模板配置）
- 其他分享卡片组件

