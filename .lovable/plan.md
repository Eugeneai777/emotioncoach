# 男性有劲测评结果页 · 4 屏漏斗化重排

承接已完成的 10 题多模态题型 + 文案修订,本期只在 `male_midlife_vitality` 分支重排结果页布局,不影响其他测评。

## 目标
让中年男性在结果页快速获得"被看见 → 被点醒 → 能动手 → 想加微/进训练营"的体验,以加企微转化和【7 天有劲训练营】点击为主目标。

## 4 屏结构

```text
┌─ 屏 1 · 被看见 ──────────────────┐
│ MBTI 风格标签 (5 个)             │
│ 电量条徽章 EnergyBarBadge        │
│ "你这台机器最缺的是 X" 一句话    │
│ AI 个性化洞察 (≤120 字精简版)    │
└──────────────────────────────────┘
┌─ 屏 2 · 被点醒 + 加微前置 ───────┐
│ BlindSpotActionCard              │
│  · 3 条认知盲区 (按最弱维度)     │
│ InlineWechatLeadCard (软前置)    │
│  · 加微拿专属本周行动方案        │
│  · 未说透盲区逐条拆解            │
│  · 私聊提问 不打扰 不推销        │
└──────────────────────────────────┘
┌─ 屏 3 · 能动手 ──────────────────┐
│ ImmediateActionChecklist         │
│  · 3 条即刻行动 (localStorage)   │
└──────────────────────────────────┘
┌─ 屏 4 · 主转化 ──────────────────┐
│ CampPrimaryCTA                   │
│  · "你刚勾的 3 件事,             │
│     生命教练陪你做 7 天"         │
│  · 主按钮: 了解 7 天有劲训练营   │
│  · 次按钮: 生成分享海报          │
│ ─────────────────                │
│ <折叠> 查看完整报告              │
│   雷达图 + 状态表 + 行动建议     │
└──────────────────────────────────┘
```

## 新增组件 (src/components/dynamic-assessment/male-vitality-funnel/)

| 组件 | 职责 |
|---|---|
| `EnergyBarBadge.tsx` | 0–5 格电量条 + 状态文字,基于 `getStatusBand` |
| `BlindSpotActionCard.tsx` | 按维度 key 渲染 `BLIND_SPOT_BY_DIMENSION` 中的 3 条盲区 |
| `InlineWechatLeadCard.tsx` | 加微卡 (复用 `MaleVitalityPdfClaimSheet` 内部加微逻辑/二维码),文案按用户最新口径 |
| `ImmediateActionChecklist.tsx` | 3 条勾选项 + `localStorage` 持久化 (key: `male_vitality_actions_${userId or anon}`) |
| `CampPrimaryCTA.tsx` | 主/次按钮 + 文案"…生命教练陪你做 7 天" |
| `MaleVitalityFullReportCollapse.tsx` | 折叠包裹现有雷达图 + `ClinicalResultSection` |

## 数据/文案

`src/config/maleMidlifeVitalityCopy.ts` 新增:
- `BLIND_SPOT_BY_DIMENSION: Record<DimensionKey, string[]>` — 5 维度 × 3 条盲区
- `IMMEDIATE_ACTIONS_BY_DIMENSION: Record<DimensionKey, string[]>` — 5 维度 × 3 条即刻行动
- `MBTI_STYLE_TAGS_BY_PATTERN: Record<string, string[]>` — 5 个标签

加微卡文案 (固定):
- 标题: 加顾问微信,拿你的专属本周方案
- 三点: ① 专属本周行动方案 ② 未说透的盲区逐条拆解 ③ 私聊提问 · 不打扰 · 不推销
- 按钮: 长按识别二维码 / 复制微信号

## 改动文件

- `DynamicAssessmentResult.tsx`
  - `isMaleMidlifeVitality === true` 时,渲染新的 4 屏布局,完全替代默认结果区 (雷达图/状态表/AI 教练按钮均归入折叠)
  - 其他测评分支保持现状,零影响
- `maleMidlifeVitalityCopy.ts` — 新增上述 3 个映射
- 不再改动 `DynamicAssessmentQuestions.tsx`、`MaleMidlifeVitalityShareCard.tsx`(分享海报保持现状)
- 不动数据库、不动评分逻辑

## 兼容与降级

- 维度 key 未匹配时,盲区/行动 fallback 到通用 3 条
- AI 洞察加载中/失败 → 屏 1 显示骨架/重试,不阻塞屏 2-4
- 加微二维码取自 `template.qr_image_url`,缺失时隐藏整张加微卡(不留空)
- `localStorage` 不可用时降级为内存 state

## 验收

1. `/assessment/male_midlife_vitality` 完成测评后,首屏即看到 MBTI 标签 + 电量条
2. 第 2 屏盲区正下方紧邻加微卡,文案与上面约定一致
3. 第 3 屏勾选状态刷新后保持
4. 第 4 屏主按钮跳 `/training-camp/...` (沿用现有 CTA 路由),次按钮唤起分享海报
5. 折叠"查看完整报告"展开后能看到原雷达图与状态表
6. 其他测评 (SBTI / 女性 / 财富等) 结果页无任何变化