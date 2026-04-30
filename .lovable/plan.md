# 修复"男人有劲状态评估"分享海报

## 问题诊断

### 问题 1：海报数据与结果页对不上（核心 Bug）
该测评使用"恢复阻力"逻辑：**原始分越低 = 状态越好**。

- 结果页：已通过 `toVitalityStatusScore()` 把原始分翻转为"状态指数 %"（高=好），并把维度名 `压力内耗→压力调节`、`恢复阻力→行动恢复力`。
- 分享海报 (`MaleMidlifeVitalityShareCard`)：直接用 **原始分** 计算 `score / maxScore × 100`，**没有翻转**，也没有改名。

后果：用户在结果页看到"57% 状态指数"和"睡眠修复 78%"（高=好），但海报却显示"43% 状态指数"和"睡眠修复 22%"（实际还是阻力分，越高越糟）— 完全反了，且对中年男性用户传递"我状态很差"的负面错觉，伤害分享意愿。

### 问题 2：海报文字展示不清晰
（用户截图红框圈出维度区）
- 维度名字号仅 11px，标签宽度只有 66px，"睡眠修复"等四字标签在高 DPR 截图下糊。
- 主卡片宽度 340px 偏窄。
- 维度行间距 9px 偏紧。
- "下一步建议" 字号 12px 偏小。

## 修复方案

### 一、修正分数翻转（关键）

在 `MaleMidlifeVitalityShareCard.tsx` 内引入与结果页一致的 `toVitalityStatusScore()` helper，并在渲染前对 totalScore / dimensionScores 做翻转 + 重命名：

```ts
const toVitalityStatusScore = (score: number, max: number) =>
  max > 0 ? Math.max(0, Math.min(100, Math.round(100 - (score / max) * 100))) : 0;

const labelMap: Record<string, string> = {
  '压力内耗': '压力调节',
  '恢复阻力': '行动恢复力',
};

const statusPercent = toVitalityStatusScore(totalScore, maxScore);
const statusDimensions = dimensionScores.map(d => ({
  ...d,
  label: labelMap[d.label] ?? d.label,
  score: toVitalityStatusScore(d.score, d.maxScore),
  maxScore: 100,
}));
```

把后续 `percentage` 与 `topDimensions` 的来源切换为 `statusPercent` / `statusDimensions`。这样海报的"状态指数 %"和每个维度条都与结果页完全一致，方向也正确（高=好）。

### 二、提升文字清晰度（中年男性可读性）

调整 `MaleMidlifeVitalityShareCard.tsx` 样式：

| 元素 | 旧值 | 新值 |
|---|---|---|
| 卡片宽度 | 340 | **360** |
| 头像/标题块 标题字号 | 14 | **15**（加粗 800） |
| 主画像名字号 | 24 | **26** |
| "% 状态指数" 数字字号 | 24 | **28**（加粗 900）|
| 维度行 emoji 字号 | 14 | **16** |
| 维度行 label 字号 | 11 | **13**，宽度 66→**78**，颜色 `#f1f5f9` |
| 维度行百分比字号 | 10 | **13**（加粗 800）|
| 维度行间距 marginBottom | 9 | **12** |
| 维度卡片内边距 | 14 | **16** |
| "下一步建议" 标题字号 | 12 | **13** |
| "下一步建议" 正文字号 | 12 | **13**，行高 1.55→**1.6** |
| 维度进度条高度 | 7 | **8** |

颜色加深确保对比度（深色背景下 `#cbd5e1` → `#e2e8f0` for 维度旁数字）。

### 三、保留品牌一致性
- 渐变背景、emoji 主画像、teal/amber 主色不变，仍切合"中年男性·稳重·能量恢复"调性。
- Footer CTA "扫码看你的有劲状态"不变，符合中年群体的接地气表达。

## 修改文件
- `src/components/dynamic-assessment/MaleMidlifeVitalityShareCard.tsx`（唯一改动文件）

## 自检清单（实施后）

1. **结果页 ↔ 结果分享海报一致性**
   - 状态指数总分一致（如结果页 57% → 海报 57%）。
   - 6 维顺序虽不同（海报 Top4），但每个维度的 % 与结果页同维度 % 一致。
   - 维度名称使用"压力调节 / 行动恢复力"等用户友好版。

2. **售前页海报 (`AssessmentPromoShareCard`) 准确性**
   - 它不展示分数，只展示卖点文案，本次不改也无 bug；保持"3分钟看清你的精力、睡眠和关键时刻信心" + 6维扫描卖点。

3. **中年男性接受度**
   - 文案避免"测试""疾病""分数"等说教/冷冰冰词汇 → 已用"有劲状态""状态指数""下一步建议"等行动型表达。
   - 字号增大后在微信朋友圈缩略图下仍可辨认。
   - 视觉保留深色 + 琥珀金调，符合稳重感，不显轻浮。

无后端 / 数据库 / 支付链路改动，零风险。