

# 测评详情页分享海报统一优化

## 问题分析

轮播图中 4 个测评的分享功能现状：

| 测评 | 分享按钮 | 从详情页能否分享 | 原因 |
|------|---------|----------------|------|
| 💰 财富卡点 | ✅ `WealthInviteCardDialog` | ✅ 可以 | 不依赖测评结果 |
| 🧭 中场觉醒力 | ✅ 按钮存在 | ❌ 不行 | ShareDialog 强制要求 `result` 数据 |
| 💚 情绪健康 | ✅ 按钮存在 | ❌ 不行 | 同上 |
| 👑 35+女性竞争力 | ❌ 无按钮 | ❌ 不行 | 使用统一引擎，intro 页无分享入口 |

**核心问题**：其他 3 个测评的分享都绑定了"结果分享"，用户在详情页（intro）点分享时没有结果数据，所以无法生成海报。

## 解决方案

参照财富卡点的 `WealthInviteCardDialog` 模式，为每个测评创建**推广型分享海报**（不需要测评结果，仅展示测评介绍 + 二维码邀请），在详情页即可分享。

### 第 1 步：创建通用测评推广分享卡片

**新建** `src/components/dynamic-assessment/AssessmentPromoShareCard.tsx`

一个通用的推广型分享卡片组件，接收以下 props：
- `title`、`subtitle`、`emoji` — 测评基本信息
- `highlights` — 3-4 个卖点（如"6维度分析"、"AI深度解读"）
- `displayName`、`avatarUrl` — 分享者信息
- `shareUrl` — 二维码链接

卡片样式参考现有的 `WealthBlockPromoShareCard`，展示测评名称 + 卖点 + 二维码。

### 第 2 步：创建通用测评推广分享弹窗

**新建** `src/components/dynamic-assessment/AssessmentPromoShareDialog.tsx`

基于 `ShareDialogBase` + `executeOneClickShare` 的弹窗，接收测评配置信息，渲染 `AssessmentPromoShareCard` 并生成海报。不依赖任何测评结果数据。

### 第 3 步：修改各测评页面的分享逻辑

**修改** `src/pages/MidlifeAwakeningPage.tsx`
- 当 `step !== 'result'` 时，点击分享按钮打开 `AssessmentPromoShareDialog`（推广海报）
- 当 `step === 'result'` 时，保留现有的 `MidlifeAwakeningShareDialog`（结果海报）

**修改** `src/pages/EmotionHealthPage.tsx`
- 同上逻辑：intro 阶段用推广海报，result 阶段用结果海报

**修改** `src/pages/DynamicAssessmentPage.tsx`
- 在 intro 和 result 阶段的顶部增加 PageHeader + 分享按钮
- intro 阶段：使用 `AssessmentPromoShareDialog`
- result 阶段：保留现有 `DynamicAssessmentShareCard` 逻辑

### 第 4 步：配置各测评的推广信息

在 `AssessmentPromoShareDialog` 中内置各测评的推广配置：

```text
midlife_awakening:  "6维度深度剖析" / "AI个性化解读" / "发现你的觉醒方向"
emotion_health:     "PHQ-9+GAD-7双量表" / "AI情绪解读" / "找到情绪出口"
women_competitiveness: "5大竞争力维度" / "AI深度洞察" / "发现你的独特优势"
wealth_block:       保持现有 WealthInviteCardDialog 不变
```

## 修改文件清单

| 文件 | 操作 |
|------|------|
| `src/components/dynamic-assessment/AssessmentPromoShareCard.tsx` | 新建 |
| `src/components/dynamic-assessment/AssessmentPromoShareDialog.tsx` | 新建 |
| `src/pages/MidlifeAwakeningPage.tsx` | 修改 — 分享按钮根据阶段切换推广/结果海报 |
| `src/pages/EmotionHealthPage.tsx` | 修改 — 同上 |
| `src/pages/DynamicAssessmentPage.tsx` | 修改 — 增加 PageHeader + 分享按钮 |

## 用户体验改善

```text
Before:
  点击测评详情 → 点右上角分享 → 弹窗空白/报错（无结果数据）

After:
  点击测评详情 → 点右上角分享 → 生成精美推广海报（含测评介绍+二维码）
  完成测评后 → 点分享 → 生成结果海报（含分数+维度图）
```

