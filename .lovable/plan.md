

## 优化未完成对话逻辑，确保不产生误判

### 发现的问题

上一次修复已解决了简报卡片持久化和恢复判断的核心问题。但经过进一步审查，发现两个残留隐患：

**问题 1：`resetConversation` 没有重置 `briefingGeneratedRef`**

当用户完成一次对话（简报已生成，`briefingGeneratedRef.current = true`），然后点击"新对话"时，`resetConversation` 函数清空了消息、对话 ID 等状态，但没有将 `briefingGeneratedRef.current` 重置为 `false`。这意味着：
- 新对话中如果用户中途离开，系统不会触发"未完成对话"通知（因为 ref 仍为 true）
- 新对话的简报生成可能受到影响

**问题 2：恢复对话时未同步 `briefingGeneratedRef`**

当系统恢复一个已有消息但尚未生成简报的对话时，`briefingGeneratedRef.current` 保持默认值 `false`，这是正确的。但如果恢复的对话消息中已经包含简报卡片标记（理论上被前面的检查拦截了，但为防御性考虑），应该同步设置 ref。

### 修复方案

**文件：`src/hooks/useDynamicCoachChat.ts`**

1. **`resetConversation` 中重置 ref**：在第 898-908 行的 `resetConversation` 函数中，添加 `briefingGeneratedRef.current = false;`

2. **恢复对话时检查已有简报标记**：在第 225-235 行的恢复逻辑中，检查加载的消息是否包含 `<!--WEALTH_BRIEFING_CARD-->` 标记，如果有则设置 `briefingGeneratedRef.current = true`，防止离开时误发"未完成对话"通知。

### 技术细节

#### 修改 1：重置 ref（约第 900 行）

```typescript
const resetConversation = useCallback(() => {
  setMessages([]);
  messagesRef.current = [];
  setCurrentConversationId(null);
  setLastBriefingId(null);
  setCoachRecommendation(null);
  setVideoRecommendation(null);
  setToolRecommendation(null);
  setEmotionButtonRecommendation(null);
  setCampRecommendation(null);
  briefingGeneratedRef.current = false; // 新增
}, []);
```

#### 修改 2：恢复时同步 ref（约第 233 行后）

```typescript
setMessages(loadedMessages);
messagesRef.current = loadedMessages;

// 检查恢复的消息中是否已有简报卡片，同步 ref 状态
const hasBriefingCard = loadedMessages.some(m => m.content.includes('<!--WEALTH_BRIEFING_CARD-->'));
if (hasBriefingCard) {
  briefingGeneratedRef.current = true;
}

setIsRecovering(false);
```

这两处修改确保 `briefingGeneratedRef` 在所有场景下与实际状态保持一致，避免误触发通知或阻碍新对话的简报生成。
