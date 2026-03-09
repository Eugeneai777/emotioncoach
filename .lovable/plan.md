

# 将妈妈页感恩记录同步到感恩日记数据库

## 现状

当前 `MamaDailyEnergy` 的 `onGratitudeSubmit` 只是打开 AI 聊天窗口，感恩内容**没有**保存到 `gratitude_entries` 表。计数也只存在 `localStorage`。

## 方案

在 `MamaDailyEnergy` 提交时，同时将内容写入 `gratitude_entries` 表（已登录用户），保持现有的 AI 聊天触发不变。

### 改动

**`src/components/mama/MamaDailyEnergy.tsx`**：
1. 引入 `supabase` 客户端和 `useAuth`
2. 提交时：已登录 → 写入 `gratitude_entries` 表；未登录 → 仅保留本地计数
3. 保留现有 `onGratitudeSubmit` 回调（打开 AI 聊天）

逻辑：
```text
用户点击"记下这份温暖"
  → 已登录？
    → 插入 gratitude_entries(user_id, content, category='other', date=today)
    → toast "已同步到感恩日记"
  → 未登录？
    → 仅本地计数
  → 触发 onGratitudeSubmit（打开AI聊天）
  → confetti + 清空输入
```

单文件改动。

