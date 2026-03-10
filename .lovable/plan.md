

## 购买训练营后，对应教练页成为入口页

### 问题
当前购买情绪类训练营（如 `emotion_stress_7`）后，`preferred_coach` 未被正确设置，且即使设为 `emotion`，`SmartHomeRedirect` 和 `Auth.tsx` 都只是跳转到 `/`（默认的 vibrant_life_sage），而非情绪教练页 `/emotion-coach`。

### 方案

**1. `src/components/camp/StartCampDialog.tsx`** — 补全 coachTypeMap

在 `coachTypeMap` 中增加 `emotion_stress_7` → `emotion` 和 `emotion_journal_21` → `emotion` 的映射，确保开营时自动更新 `preferred_coach`。

**2. `src/components/SmartHomeRedirect.tsx`** — 增加 emotion 路由

当 `preferredCoach === 'emotion'` 时，查询用户是否有活跃的情绪训练营。若有，跳转到 `/emotion-coach`；若无，跳转默认教练页。

```text
preferred_coach 路由表：
  wealth  → /coach/wealth_coach_4_questions
  emotion → /emotion-coach （有活跃训练营时）
  parent  → /parent-emotion
  其他    → /coach/vibrant_life_sage
```

**3. `src/pages/Auth.tsx`** — 同步更新登录后跳转

将 `emotion` 的跳转目标从 `/` 改为 `/emotion-coach`。

### 具体改动

| 文件 | 改动 |
|------|------|
| `StartCampDialog.tsx` | coachTypeMap 增加 `emotion_stress_7: 'emotion'`, `emotion_journal_21: 'emotion'` |
| `SmartHomeRedirect.tsx` | 新增 `else if (preferredCoach === 'emotion')` 分支，查询活跃情绪训练营后跳转 `/emotion-coach` |
| `Auth.tsx` | `emotion` 分支跳转改为 `/emotion-coach` |

