

## 修复：财富简报已生成但对话显示未完成

### 问题根因分析

经过代码审查，发现两个关键 Bug：

**Bug 1：简报卡片消息未持久化到数据库**

在 `useDynamicCoachChat.ts` 第 842-844 行，只保存了 AI 的文本回复（`assistantMessage`），但简报卡片内容（`<!--WEALTH_BRIEFING_CARD-->...`）是在第 613-628 行通过 `setMessages` 添加到本地状态的，并没有调用 `saveMessage` 保存到数据库。因此：
- 当时在聊天中能看到简报卡片（因为是本地 state）
- 刷新页面或重新打开后，简报卡片消息丢失（因为数据库里没有）

**Bug 2：恢复逻辑判断不完整**

在第 198-210 行的恢复逻辑中，系统通过查 `briefingTableName` 表来判断对话是否已完成。但财富教练的简报存储在 `wealth_coach_4_questions_briefings` 表中，而实际生成流程走的是 `generate-wealth-journal` Edge Function，简报数据存到了不同的表。这导致恢复逻辑查不到已有简报，误判为"对话未完成"，不断尝试恢复。

**Bug 3：第 624 行有重复代码**

```typescript
return prev.map((m, i) => i === genIdx ? { ...m, content: resultContent } : m);
return prev.map((m, i) => i === genIdx ? { ...m, content: resultContent } : m); // 重复行
```

### 修复方案

**文件：`src/hooks/useDynamicCoachChat.ts`**

1. **持久化简报卡片消息**：在第 628 行简报卡片添加到本地 state 之后，调用 `saveMessage(convId, "assistant", resultContent)` 将其保存到数据库，确保刷新后仍能看到。

2. **修复恢复逻辑**：在恢复判断中（第 198-210 行），除了检查 `briefingTableName` 表，还额外检查 `messages` 表中是否存在包含 `<!--WEALTH_BRIEFING_CARD-->` 标记的消息。如果找到，说明对话已完成，跳过恢复。

3. **删除第 624 行的重复代码**。

### 技术细节

#### 修改 1：保存简报卡片到数据库（约第 628 行后）

```typescript
// 现有代码：setMessages 添加卡片到本地 state
// 新增：将卡片消息也保存到数据库
await saveMessage(convId, "assistant", resultContent);
```

#### 修改 2：增强恢复判断逻辑（约第 198-210 行）

```typescript
// 除了检查 briefingTableName 表，还检查消息中是否包含简报卡片标记
const { data: briefingMessages } = await supabase
  .from('messages')
  .select('id')
  .eq('conversation_id', recentConv.id)
  .like('content', '%<!--WEALTH_BRIEFING_CARD-->%')
  .limit(1);

if (briefingMessages && briefingMessages.length > 0) {
  return; // 已有简报卡片，对话已完成
}
```

#### 修改 3：删除第 624 行重复的 return 语句

