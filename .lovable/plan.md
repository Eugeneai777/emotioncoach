

## 修复导航流程：训练营入口应先经过财富教练页

### 问题
目前 "继续我的训练营" 和 "立即打卡" 按钮直接跳转到 `/wealth-camp-checkin`（我的财富日记/打卡页），跳过了财富教练页面（`/coach/wealth_coach_4_questions`），用户看不到财富觉醒 3 部曲进度、训练营状态等信息。

### 期望流程

```text
[训练营介绍页] --"继续我的训练营"--> [财富教练页] --"立即打卡"--> [财富日记/打卡页]
```

### 需要修改的文件

| 文件 | 改动 |
|------|------|
| `src/pages/WealthCampIntro.tsx` | 将 "继续我的训练营" 的跳转目标从 `/wealth-camp-checkin` 改为 `/coach/wealth_coach_4_questions`（第 486 行） |
| `src/pages/WealthCampActivate.tsx` | 同上，将 "继续我的训练营" 的跳转目标改为 `/coach/wealth_coach_4_questions`（第 239 行） |

### 不改动的部分
- `TrainingCampCard.tsx` 中财富教练页面上的 "立即打卡" 按钮仍保持跳转到 `/wealth-camp-checkin`，因为这是从教练页进入打卡页的正确路径
- 加入训练营成功后的 `onSuccess` 回调仍跳转 `/wealth-camp-checkin`，因为首次加入直接进入打卡是合理的

### 关于修改时间
无法从代码中确定具体修改时间，但从当前代码来看，这两个按钮一直都是直接指向 `/wealth-camp-checkin`，可能从训练营功能上线时就缺少了中间的教练页跳转。

共 2 个文件修改，无数据库改动。
