

# 训练营免费额度描述优化 — 明确营名 + 体验提升

## 问题分析

从截图可见，"训练营免费额度 · 语音通话" 没有说明是**哪个训练营**提供的免费额度。用户如果购买了多个训练营（如情绪解压7天营 + 财富觉醒21天营），完全无法区分。

当前数据库中有 3 种训练营类型：`emotion_stress_7`、`emotion_journal_21`、`wealth_block_21`。

## 技术方案

### 1. 后端：`deduct-quota` 边缘函数 — 描述中加入营名

当前描述模板：`训练营免费额度 · ${campSceneLabel}`（如"训练营免费额度 · 生活教练语音"）

**改为**：`${campNameLabel}免费额度 · ${campSceneLabel}`

增加营名映射：
```typescript
const campNameMap: Record<string, string> = {
  emotion_stress_7: '7天解压营',
  emotion_journal_21: '21天情绪营',
  wealth_block_21: '财富觉醒营',
};
```

最终效果示例：`7天解压营免费额度 · 情绪教练语音`

### 2. 前端：`VoiceUsageSection.tsx` — 兼容历史数据

对历史记录中仍显示"训练营免费额度"的旧数据，在 `humanizeDescription` 中做兼容处理：通过 metadata 中的 `camp_type` 字段（如果有）补充营名。

### 3. 前端：流水列表中的 `description` 显示优化

目前部分旧记录没有 `·` 分隔符（如截图中"训练营免费额度"后直接跟 source），需要在 `humanizeDescription` 中统一格式。

## 修改文件

| 文件 | 改动 |
|------|------|
| `supabase/functions/deduct-quota/index.ts` | 增加 `campNameMap`，描述模板改为 `${营名}免费额度 · ${场景}` |
| `src/components/VoiceUsageSection.tsx` | `humanizeDescription` 兼容旧"训练营免费额度"数据，尝试从 metadata 补充营名 |

不涉及数据库改动，不涉及新增文件。

