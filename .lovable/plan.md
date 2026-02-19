
# 修复日记列表：按实际完成顺序显示"第 N 天"

## 问题明确

用户要求：显示的"第几天"应该是用户**实际完成的第几次**，而不是数据库里固定存储的 `day_number`。

举例：
- 用户做了 7 天 → Day 1 ~ Day 7
- 停了 10 天没做
- 再做了一天 → 应该显示 **第 8 天**（不是 Day 1 或 Day 8）

当前问题：`WealthJournalCard` 直接显示 `entry.day_number`（数据库存的营期天数），与用户期待的"第 N 次打卡"不符。

## 数据流分析

```text
WealthCampCheckIn.tsx
  └── mergedBriefings (按 created_at 降序排列)
        └── allJournalEntries (来自 wealth_journal_entries 表)
              └── WealthJournalCard (显示 entry.day_number ← 这里需要替换)
```

`mergedBriefings` 是将所有日记条目和教练简报**按日期倒序**合并的列表。渲染时按索引可以计算出"这是用户第几条日记"。

## 修复方案

### 方案：在渲染时传入"序号"

**改动点 1：`WealthJournalCard.tsx`**

给 `WealthJournalCardProps` 新增一个可选的 `sequenceNumber` 属性：

```typescript
interface WealthJournalCardProps {
  entry: WealthJournalEntry;
  onClick?: () => void;
  sequenceNumber?: number;  // 新增：实际完成的第几天
}
```

显示逻辑从：
```tsx
{isVoice ? '语音梳理' : `Day ${entry.day_number}`}
```
改为：
```tsx
{isVoice ? '语音梳理' : sequenceNumber ? `第 ${sequenceNumber} 天` : `Day ${entry.day_number}`}
```

**改动点 2：`WealthCampCheckIn.tsx`**

在渲染 `mergedBriefings` 时，先提取出所有 journal 类型的条目，按 `created_at` **升序**排列（从旧到新），建立一个 `id → 序号` 的映射表，然后在渲染 `WealthJournalCard` 时传入对应序号：

```typescript
// 建立 journal 条目的序号映射（按时间从旧到新排，第1条 = 第1天）
const journalSequenceMap = useMemo(() => {
  const journalOnly = mergedBriefings
    .filter(item => item._source === 'journal')
    .sort((a, b) => new Date(a._sortDate).getTime() - new Date(b._sortDate).getTime());
  
  const map = new Map<string, number>();
  journalOnly.forEach((item, index) => {
    map.set(item.id, index + 1);
  });
  return map;
}, [mergedBriefings]);
```

渲染时：
```tsx
<WealthJournalCard
  key={item.id}
  entry={item}
  sequenceNumber={journalSequenceMap.get(item.id)}
  onClick={() => navigate(`/wealth-journal/${item.id}`)}
/>
```

## 效果示意

修复前（混乱）：
```
📖 Day 1  2月20日   ← 最新的，但显示 Day 1
📖 Day 7  1月15日
📖 Day 6  1月14日
📖 Day 1  1月10日   ← 最早的，也显示 Day 1
```

修复后（清晰）：
```
📖 第 8 天  2月20日  ← 按实际完成顺序
📖 第 7 天  1月15日
📖 第 6 天  1月14日
📖 第 1 天  1月10日
```

## 修改文件范围

- `src/components/wealth-camp/WealthJournalCard.tsx`：新增 `sequenceNumber` prop，更新显示逻辑
- `src/pages/WealthCampCheckIn.tsx`：计算序号映射表，传入 `WealthJournalCard`

两处改动都很小，不影响其他使用 `WealthJournalCard` 的地方（`sequenceNumber` 为可选参数，不传则 fallback 到原来的 `Day N`）。
