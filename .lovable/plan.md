

# 将"今天，想对你说"改为 AI 智能鼓励通知

## 现状

当前 `MamaDailyEnergy` 使用一个 30 条静态数组，按日期取模选择当天语录。同一天所有用户看到相同内容，无个性化。

## 方案

利用已有的 `generate-smart-notification` 边缘函数，新增场景 `mama_daily_encouragement`，每次进入 `/mama` 页面时生成一条个性化的鼓励/肯定/同理/温馨消息。

### 改动

**1. 新建 Hook `useMamaDailyQuote.ts`**
- 进入页面时调用 `generate-smart-notification`，scenario = `mama_daily_encouragement`
- 传入 context：当前时间段（早/中/晚）、用户最近情绪状态等
- 用 sessionStorage 缓存本次会话的结果（同一次登录不重复调用）
- AI 失败时 fallback 到静态语录数组（保留现有 quotes 作为兜底）

**2. 更新 `generate-smart-notification` 边缘函数**
- 在场景映射中新增 `mama_daily_encouragement`
- Prompt 指导 AI 生成 4 种风格随机之一：鼓励型、肯定型、同理型、温馨提醒型
- 结合用户 profile（昵称、偏好风格）个性化内容
- 限制长度 40-80 字，温暖口吻

**3. 更新 `MamaDailyEnergy.tsx`**
- 引入 `useMamaDailyQuote` hook
- 加载中显示骨架动画（淡入效果）
- 显示 AI 生成的内容，附带风格标签（如 💪 鼓励、💛 肯定、🤗 同理、🌸 温馨）
- 删除静态 quotes 数组

### 技术细节

```text
用户进入 /mama
  → useMamaDailyQuote 检查 sessionStorage
    → 有缓存 → 直接显示
    → 无缓存 → 调用 generate-smart-notification
      → 成功 → 显示 + 缓存到 sessionStorage
      → 失败 → fallback 静态语录
```

边缘函数新增 prompt 模板：
- 随机选择风格：鼓励/肯定/同理/温馨提醒
- 结合时间段（早上好/下午好/晚上好）
- 若有用户昵称则使用亲切称呼

改动文件：
| 文件 | 改动 |
|------|------|
| `src/hooks/useMamaDailyQuote.ts` | 新建 |
| `src/components/mama/MamaDailyEnergy.tsx` | 使用新 hook，加载态 |
| `supabase/functions/generate-smart-notification/index.ts` | 新增场景 |

