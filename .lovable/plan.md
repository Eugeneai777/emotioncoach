

## 更新 9.9 体验包海报分享内容

### 问题

体验包已从 4 项扩展到 7 项（新增死了吗打卡、觉察日记、情绪SOS），但海报工坊中的 `experience_pack` 模板仍显示旧的 4 项内容：

| 位置 | 当前内容 | 问题 |
|------|----------|------|
| 标语 | "9.9元解锁4项专业服务" | 应为 7 项 |
| 卖点列表 | 50点AI额度 + 3个测评 | 缺少 3 个日常工具 |
| 各场景文案 | 均提及"4项" | 数量不准确 |
| PosterPreview slogan | "9.9元解锁4项专业服务" | 同上 |

### 方案

更新 2 个文件中的硬编码内容，使海报准确反映当前 7 项体验包。

### 改动

#### 1. PosterTemplateGrid.tsx -- 更新模板数据

- **tagline**: "9.9元解锁7项专业服务，开启你的心理健康之旅"
- **sellingPoints**: 重新组织为更有吸引力的概括性卖点：
  - "尝鲜会员 50点AI教练额度"
  - "3项专业测评（情绪健康+SCL-90+财富卡点）"
  - "3项日常工具（情绪SOS+觉察日记+打卡）"
  - "一杯奶茶钱，7项服务全解锁"
- **sceneVariants**: 更新三个场景（朋友圈/小红书/微信群）中所有提及"4项"的文案为"7项"，并补充新工具的亮点

#### 2. PosterPreview.tsx -- 更新产品标语

- 将 `experience_pack` 的 slogan 从 "9.9元解锁4项专业服务" 改为 "9.9元解锁7项专业服务"

### 改动文件

| 文件 | 改动范围 |
|------|----------|
| `src/components/poster/PosterTemplateGrid.tsx` | experience_pack 模板的 tagline、sellingPoints、3 个场景文案 |
| `src/components/poster/PosterPreview.tsx` | experience_pack 的 slogan 映射 |

### 不需要改动

- PosterGenerator.tsx（渲染逻辑无需调整）
- 数据库（体验包数据已是最新的 7 项）
- 其他海报模板（不受影响）
