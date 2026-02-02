
# 修复财富日记无法关联训练营 + 智能通知重复生成问题

## 问题诊断

### 现象总结

| 问题 | 表现 | 数据库证据 |
|------|------|-----------|
| 日记不显示 | "我的财富日记"页面看不到刚生成的日记 | 7条日记全部 `camp_id: NULL` |
| 重复通知 | 收到完全相同的智能提醒 | 短时间内7条相同内容的通知 |

### 根因分析

**问题1：camp_id 传递链断裂**

用户使用的是训练营内嵌教练（`WealthCoachEmbedded`），该组件确实传递了 `{ dayNumber, campId }` 给 `useDynamicCoachChat`。

但是，当 hook 调用 `generate-wealth-journal` Edge Function 时，传入的 `camp_id` 却没有被正确保存。可能原因：
1. Edge Function 接收到的 `camp_id` 为空字符串或 undefined
2. Upsert 冲突逻辑 `(user_id, camp_id, day_number)` 无法匹配 NULL 值，导致每次都新建记录

**问题2：工具被重复调用**

AI 调用 `generate_wealth_briefing` 工具后，前端处理逻辑没有防重，导致：
1. 同一对话中工具被多次调用
2. 每次调用都会触发日记生成 + 智能通知
3. 因为 camp_id 为 NULL，无法通过 upsert 去重，所以每次都新增一条

---

## 修复方案

### 步骤 1：修复 useDynamicCoachChat 中的 contextData 传递

**问题**：`contextData?.campId` 可能是空字符串，应该也视为 null

**文件**：`src/hooks/useDynamicCoachChat.ts`（约第 473 行）

```typescript
// 修改前
const campIdToUse = contextData?.campId || null;

// 修改后 - 严格检查空字符串
const campIdToUse = contextData?.campId && contextData.campId.trim() !== '' 
  ? contextData.campId 
  : null;
```

### 步骤 2：修复 generate-wealth-journal Edge Function 的 upsert 逻辑

**问题**：当 `camp_id` 为 null 时，PostgreSQL 的 upsert 无法正确匹配（NULL != NULL），导致每次都新建记录

**文件**：`supabase/functions/generate-wealth-journal/index.ts`

```typescript
// 修改 upsert 逻辑，改为先查询再决定 insert 或 update
// 如果 camp_id 为 null，改用 (user_id, day_number, DATE(created_at)) 作为去重键
```

### 步骤 3：添加防重机制防止重复工具调用

**文件**：`src/hooks/useDynamicCoachChat.ts`

在处理 `generate_wealth_briefing` 工具时，添加防重 flag：
```typescript
// 在 sendMessage 函数开头添加
const journalGeneratedRef = useRef(false);

// 在处理工具调用时检查
if (toolCall?.function?.name === "generate_wealth_briefing") {
  if (journalGeneratedRef.current) {
    console.log('⚠️ 日记已生成，跳过重复调用');
    return;
  }
  journalGeneratedRef.current = true;
  // ... 继续处理
}
```

### 步骤 4：修复 generate-smart-notification 的去重逻辑

**问题**：代码注释明确说"已移除去重逻辑"，需要恢复

**文件**：`supabase/functions/generate-smart-notification/index.ts`

```typescript
// 在第 59 行附近，恢复去重逻辑：
// 检查最近5分钟内是否已有相同 scenario 的通知
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
const { data: recentSameScenario } = await supabase
  .from('smart_notifications')
  .select('id')
  .eq('user_id', userId)
  .eq('scenario', scenario)
  .gte('created_at', fiveMinutesAgo)
  .limit(1);

if (recentSameScenario && recentSameScenario.length > 0) {
  console.log(`⏭️ 5分钟内已有 ${scenario} 通知，跳过`);
  return new Response(JSON.stringify({ 
    success: false,
    message: "去重：近期已有相同场景通知"
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
```

---

## 数据修复

需要清理已生成的重复数据：

```sql
-- 删除重复的日记（保留每个用户每天最早的一条）
DELETE FROM wealth_journal_entries a
USING wealth_journal_entries b
WHERE a.user_id = b.user_id 
  AND a.day_number = b.day_number
  AND a.created_at > b.created_at
  AND a.camp_id IS NULL 
  AND b.camp_id IS NULL;

-- 删除重复的通知（保留每个用户每场景最早的一条）
DELETE FROM smart_notifications a
USING smart_notifications b  
WHERE a.user_id = b.user_id
  AND a.scenario = b.scenario
  AND a.created_at > b.created_at
  AND a.created_at >= '2026-02-02';
```

---

## 技术细节

### 数据流修复对比

```text
【修复前】
WealthCoachEmbedded 传入 { campId, dayNumber }
    │
    ▼
useDynamicCoachChat 接收 contextData
    │
    ├─→ contextData.campId = "693a7f15-..." ✓
    │
    ▼
generate-wealth-journal Edge Function
    │
    ├─→ camp_id 收到了但 upsert 失败
    │     ↓
    │   camp_id = NULL ✗ （可能是字符串处理问题）
    │
    ▼
每次调用都新增一条（无法去重）
    │
    ▼
trigger-notification 7 次 → 7 条重复通知

【修复后】
WealthCoachEmbedded 传入 { campId, dayNumber }
    │
    ▼
useDynamicCoachChat 严格校验 campId
    │
    ├─→ campId 有效 → 传递
    ├─→ campId 空串 → 设为 null
    │
    ▼
generate-wealth-journal 改用日期去重
    │
    └─→ 同用户同天只保留一条
    
防重 flag 阻止重复工具调用
    │
    └─→ 只触发一次通知
```

---

## 影响范围

| 文件 | 改动类型 | 风险 |
|------|---------|------|
| `src/hooks/useDynamicCoachChat.ts` | 添加防重 + 严格校验 | 低 |
| `supabase/functions/generate-wealth-journal/index.ts` | 改进 upsert 逻辑 | 中 |
| `supabase/functions/generate-smart-notification/index.ts` | 恢复去重 | 低 |

---

## 测试要点

1. 从训练营内嵌教练完成一次完整对话
2. 确认 AI 询问"是否生成简报"
3. 同意后检查：
   - 只生成 1 条日记
   - 日记的 `camp_id` 不为 NULL
   - 只收到 1 条智能通知
4. 在"我的财富日记"页面能看到新日记
