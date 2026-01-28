

# 修复训练营卡片颜色映射

## 问题原因

代码中的 `gradientMap` 使用了错误的 key，与数据库中的 `camp_type` 不匹配：

| 训练营 | 代码中的 key (错误) | 数据库实际值 (正确) |
|:------|:------------------|:------------------|
| 情绪日记 | `emotion_journal_21` | `emotion_journal_21` ✅ |
| 青少年困境突破 | `teen_breakthrough_14` | `parent_emotion_21` |
| 财富觉醒 | `wealth_awakening_7` | `wealth_block_7` |
| 身份绽放 | (无) | `identity_bloom` |
| 情感绽放 | (无) | `emotion_bloom` |

## 解决方案

更新 `gradientMap`，使用数据库中的实际 `camp_type` 值作为 key。

## 技术实现

修改文件：`src/components/ProductComparisonTable.tsx`

更新 `gradientMap`（约第400-406行）：

```typescript
const gradientMap: Record<string, string> = {
  // 有劲训练营
  'emotion_journal_21': 'from-purple-500 via-pink-500 to-rose-500',      // 紫粉色 - 情绪日记
  'parent_emotion_21': 'from-blue-500 via-sky-500 to-cyan-500',          // 蓝色 - 青少年困境突破
  'wealth_block_7': 'from-amber-500 via-orange-500 to-yellow-400',       // 金橙色 - 财富觉醒
  // 绽放训练营  
  'identity_bloom': 'from-indigo-500 via-violet-500 to-purple-500',      // 靛紫色 - 身份绽放
  'emotion_bloom': 'from-rose-500 via-pink-500 to-fuchsia-500',          // 玫红色 - 情感绽放
};
```

## 预期效果

| 训练营 | 修改后颜色 |
|:------|:---------|
| 情绪日记 | 紫粉色 |
| 青少年困境突破 | 蓝色 |
| 财富觉醒 | 金橙色 |
| 身份绽放 | 靛紫色 |
| 情感绽放 | 玫红色 |

五个训练营颜色各不相同，一目了然。

