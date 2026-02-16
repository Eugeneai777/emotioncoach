

## 修复：智能消息重复发送 + "继续对话"按钮无响应

### 问题 1：同一通知重复发送十几次

**根因**：`useDynamicCoachChat.ts` 的清理 effect（第 918-938 行）在组件每次卸载时触发 `incomplete_coach_session` 通知。而用户在教练页面的操作（如切换 tab、路由变化、React 严格模式重渲染）会导致组件反复挂载/卸载。虽然 Edge Function 有 5 分钟去重窗口，但间隔超过 5 分钟的重复卸载仍会生成新通知。

**修复方案**：

1. **客户端增加去重保护**（`src/hooks/useDynamicCoachChat.ts`，第 918-938 行）：
   - 用 `sessionStorage` 记录已触发通知的 conversationId
   - 同一 conversationId 只触发一次通知
   - 增加检查：如果用户仍在同一教练页面（未真正离开），不触发通知

```typescript
// 修改清理 effect
useEffect(() => {
  return () => {
    const currentMessages = messagesRef.current;
    const convId = currentConversationId;
    if (currentMessages.length >= 2 && convId && !briefingGeneratedRef.current) {
      // 去重：同一会话只触发一次
      const notifiedKey = `incomplete_notified_${convId}`;
      if (sessionStorage.getItem(notifiedKey)) return;
      sessionStorage.setItem(notifiedKey, '1');

      supabase.functions.invoke('generate-smart-notification', {
        body: {
          scenario: 'incomplete_coach_session',
          context: {
            sessionId: convId,
            coachKey,
            message_count: currentMessages.length,
          }
        }
      }).catch(err => console.error('触发未完成通知失败:', err));
    }
  };
}, [currentConversationId, coachKey]);
```

2. **清理已有的重复通知**：通过数据库清理对同一 sessionId 重复的 `incomplete_coach_session` 通知，每个 sessionId 只保留最新一条。

---

### 问题 2："继续对话"按钮点击无响应

**根因**：用户已经在 `/coach/wealth_coach_4_questions` 页面上，点击"继续对话"按钮调用 `navigate('/coach/wealth_coach_4_questions', { state: { sessionId: '...' } })`。React Router 检测到路径相同，不会重新挂载组件，所以 `useDynamicCoachChat` 的 useEffect 不会重新执行，按钮看起来没有反应。

**修复方案**（`src/components/NotificationCard.tsx`，第 123-131 行）：

在 `handleAction` 中判断：如果目标路径与当前路径相同，使用 `navigate(0)` 强制刷新，或者使用 `window.location.reload()` 确保组件重新挂载并使用新的 state。

更优方案：当用户已在目标页面时，直接触发会话恢复逻辑，而不依赖路由跳转：

```typescript
const handleAction = () => {
  onClick(); // 标记已读
  
  if (notification.action_type === 'navigate' && notification.action_data?.path) {
    const { path, ...routeState } = notification.action_data;
    const currentPath = window.location.pathname;
    
    if (currentPath === path || currentPath.endsWith(path)) {
      // 已在目标页面：用 replace + key 强制重新挂载
      navigate(path, { 
        state: Object.keys(routeState).length > 0 ? routeState : undefined,
        replace: true 
      });
      // 强制刷新以触发会话恢复
      window.location.reload();
    } else {
      navigate(path, { 
        state: Object.keys(routeState).length > 0 ? routeState : undefined 
      });
    }
  }
};
```

---

### 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `src/hooks/useDynamicCoachChat.ts` | 清理 effect 增加 sessionStorage 去重，同一会话只触发一次通知 |
| `src/components/NotificationCard.tsx` | handleAction 处理已在目标页面的场景，强制重新加载 |

### 数据库清理（可选）

运行以下 SQL 清除历史重复通知，每个 sessionId 只保留最新一条：

```sql
DELETE FROM smart_notifications
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, scenario, action_data->>'sessionId'
      ORDER BY created_at DESC
    ) as rn
    FROM smart_notifications
    WHERE scenario = 'incomplete_coach_session'
      AND action_data->>'sessionId' IS NOT NULL
  ) ranked
  WHERE rn > 1
);
```

