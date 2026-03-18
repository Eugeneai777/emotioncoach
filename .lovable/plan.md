

## 为中场觉醒力 & 35+女性竞争力售前页增加图表视觉模块

### 改动 1：`MidlifeAwakeningStartScreen.tsx` — 增加两个视觉模块

**A. 六维雷达图预览**（插入在"6维深度扫描"区块内，DimensionPreview 上方）

复用 `DimensionRadarChart` 组件，用 dimensionConfig 的 6 个维度构造示例数据：

| 维度 | 示例分 | 满分 |
|------|--------|------|
| 🌀 内耗循环 | 72 | 100 |
| 💎 价值松动 | 45 | 100 |
| ⚡ 行动停滞 | 58 | 100 |
| 🤝 支持系统 | 80 | 100 |
| ⏳ 后悔风险 | 35 | 100 |
| 🧭 使命清晰 | 65 | 100 |

雷达图上方标注"📊 报告示例预览"，下方加灰色小字"你的真实数据将在测评后生成"。

**B. 三阶诊断流程图**（插入在"AI vs 传统对比"区块之后）

用三个竖向排列的步骤卡片展示诊断层级（非 SVG，纯 Tailwind 卡片 + 连接线）：
1. 🎯 维度扫描 → "6维雷达定位你的卡点所在"
2. 🧩 人格诊断 → "4种中场人格匹配你的行为模式"  
3. 🤖 AI教练引导 → "1对1对话制定突破方案"

步骤间用渐变竖线连接，色调与页面 pink-purple 主题一致。

### 改动 2：`DynamicAssessmentIntro.tsx` — 为女性竞争力增加雷达图预览

在 `enrichmentData.women_competitiveness` 中增加维度演示数据，在"测评维度"区块上方插入雷达图卡片：

| 维度 | 示例分 | 满分 |
|------|--------|------|
| 🔥 职场生命力 | 68 | 100 |
| 👑 个人品牌力 | 52 | 100 |
| 💪 情绪韧性 | 75 | 100 |
| 💰 财务掌控力 | 40 | 100 |
| 🤝 关系经营力 | 82 | 100 |

同样复用 `DimensionRadarChart`，标注"报告预览 · 示例数据"。维度 label/emoji 从 template.dimensions 动态读取（有 enrichment 时才显示）。

### 响应式兼容

- `DimensionRadarChart` 已使用 `ResponsiveContainer`（100% 宽度），天然适配移动端
- 三阶诊断流程图使用 flex-col 布局，移动端和桌面端表现一致
- 雷达图高度固定 220px（比结果页的 260px 略小，适合售前预览场景）

### 改动文件

| 文件 | 改动内容 |
|------|---------|
| `MidlifeAwakeningStartScreen.tsx` | 引入 DimensionRadarChart + 示例数据 + 三阶诊断流程图 |
| `DynamicAssessmentIntro.tsx` | enrichmentData 增加 radarPreview 字段 + 雷达图卡片 |

### 不涉及

- 计分逻辑、支付流程、CTA 按钮逻辑 — 零改动
- 情绪健康 / 财富卡点页面 — 零改动
- 数据库 / 后端 — 零改动

