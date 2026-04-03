

# 情绪健康测评结果页：推荐训练营改为"7天有劲训练营"

## 需要修改的内容

### 1. `src/components/emotion-health/emotionHealthData.ts`

**CTA 文案**（第630行）：
- `secondaryText`: "了解21天训练营" → "了解7天有劲训练营"

**教练对话脚本 campId**（第658、698、738、778行）：
- 4种情绪模式的 `campId` 全部从 `'emotion_journal_21'` 改为 `'emotion_stress_7'`

**底部转化配置**（第841行）：
- `primaryCampId` 从 `'emotion_journal_21'` 改为 `'emotion_stress_7'`
- `primary` 文案从 "进入21天情绪修复训练营" 改为 "进入7天有劲训练营"

### 2. `src/components/emotion-health/EmotionHealthResult.tsx`

**第275行**：
- `navigate('/camp-intro/emotion_journal_21')` → `navigate('/camp-intro/emotion_stress_7')`

## 文件变更

| 文件 | 操作 |
|---|---|
| `src/components/emotion-health/emotionHealthData.ts` | 修改6处 `emotion_journal_21` → `emotion_stress_7`，更新相关文案 |
| `src/components/emotion-health/EmotionHealthResult.tsx` | 修改1处导航路径 |

