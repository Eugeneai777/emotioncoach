## 修改方案（方案C）

统一去除 5 张测评海报中"免费"字样，避免与实际付费（¥9.9 起）产生误导。

### 文案修改对照表

| 文件 | 行号 | 旧文案 | 新文案 |
|---|---|---|---|
| `src/components/share/AssessmentPromoShareCard.tsx` | 189 | 扫码免费测评 | 扫码测评 |
| `src/components/wealth-block/WealthBlockPromoShareCard.tsx` | 119 | 扫码免费测评 | 扫码测评 |
| `src/components/share/TransformationValueShareCard.tsx` | 244 | 扫码免费定位起点 | 扫码测评 |
| `src/components/share/TransformationValueShareCard.tsx` | (副标) | 🎁 开启你的觉醒之旅 | 🎁 找到你的财富卡点 |
| `src/components/share/AssessmentValueShareCard.tsx` | 177 | 🎁 免费测评你的财富卡点 | 🎁 测评你的财富卡点 |
| `src/components/share/MidlifeAwakeningShareCard.tsx` | 45 | 🎁 免费测评 · 3分钟出结果 | 🎁 3分钟出结果 |
| `src/components/share/MaleMidlifeVitalityShareCard.tsx` | 58 | 3分钟 · 私密 · 免费 | 3分钟 · 私密 · 专业 |
| `src/components/share/SBTIShareCard.tsx` | 30 | 🎭 全网爆火 · 免费测试 | 🎭 全网爆火 · 人格测试 |

### 不在本次范围

- 落地页"限时免费"促销 hook
- AI 工具类"免费体验"文案
- `AssessmentPromoShareCard` 的"🎁 3分钟出结果"副标（无"免费"字样，保留）

### 实现方式

纯前端展示层文案替换，使用 `code--line_replace` 逐处精确替换，不涉及业务逻辑、定价或后端。
