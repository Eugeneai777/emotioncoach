

# /laoge 页面：已购/已完成用户隐藏测评和训练营

## 改动内容

在 `src/pages/LaogeAI.tsx` 中，对测评区（第2层）和训练营区（第3层）增加购买/完成状态检测，已有权益的项目直接隐藏。

### 1. 扩展购买状态查询

当前只查了 `synergy_bundle`，需扩展为：

```
usePackagesPurchased([
  'synergy_bundle',           // 7天有劲训练营
  'wealth_block_assessment',  // 财富卡点测评
  'emotion_health_assessment',// 情绪健康测评
  'identity_bloom',           // 身份绽放训练营
])
```

另外新增一个查询：检查 `midlife_awakening_assessments` 表是否有记录（觉醒力测评完成状态）。

### 2. 条件隐藏逻辑

| 项目 | 隐藏条件 |
|------|----------|
| 💰 财富卡点 | `wealth_block_assessment` 已购 |
| 💚 情绪健康 | `emotion_health_assessment` 已购 |
| 🧭 觉醒力 | `midlife_awakening_assessments` 表有记录 |
| ⚡ 7天有劲训练营 | `synergy_bundle` 已购 |
| 🌟 身份绽放训练营 | `identity_bloom` 已购 |

### 3. 整区隐藏

- 若3个测评全部完成/已购 → 隐藏整个"聊完再做个体检"区块
- 若2个训练营全部已购 → 隐藏整个"想要系统解决？老哥推荐"区块

### 涉及文件
- `src/pages/LaogeAI.tsx` — 扩展 `usePackagesPurchased`、新增觉醒力完成查询、条件渲染

