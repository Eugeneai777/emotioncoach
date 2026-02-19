
# 训练营简报：按完成顺序显示（不依赖日历天数）

## 问题分析

### 当前逻辑（错误）
训练营 Tab 使用 `entry.day_number` 来计算轮次和轮内天数：
```typescript
const round = Math.ceil((entry.day_number || 1) / 7);  // 按日历天数算轮次
const dayInRound = ((entry.day_number - 1) % 7) + 1;    // 按日历天数算轮内第几天
```
`day_number` 是**日历天数**（训练营开始第几天），而不是完成次数。用户第1天完成→Day 1，3天后再完成→Day 4，导致显示"第4天"而非"第2天"。

### 正确逻辑（用户期望）
按**完成顺序**来编号：
- 第1次完成 → 第一轮·第1天
- 第2次完成 → 第一轮·第2天
- 第8次完成 → 第二轮·第1天（不管间隔多少天）

代码中已有 `journalSequenceMap`（`id → 所有 journal 完成顺序`），但它包含语音条目、非训练营条目。需要专门为训练营条目建立一个 `campSequenceMap`。

## 修改方案

### 唯一需要修改的文件：`src/pages/WealthCampCheckIn.tsx`

#### 第一步：新增 `campSequenceMap`（行 412 附近，替换现有 `campRounds`）

```typescript
// 训练营条目：按完成时间升序排列，建立序号映射
const campSequenceMap = useMemo(() => {
  const sorted = [...campEntries].sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const map = new Map<string, number>();
  sorted.forEach((entry: any, index: number) => {
    map.set(entry.id, index + 1); // 1-based sequence
  });
  return map;
}, [campEntries]);
```

#### 第二步：修改 `campRounds`，按序号分组而非 `day_number`

```typescript
// 训练营按轮次分组（每7次完成一轮，而非日历7天）
const campRounds = useMemo(() => {
  return campEntries.reduce((acc: Record<number, any[]>, entry: any) => {
    const seq = campSequenceMap.get(entry.id) || 1;
    const round = Math.ceil(seq / 7);
    if (!acc[round]) acc[round] = [];
    acc[round].push(entry);
    return acc;
  }, {} as Record<number, any[]>);
}, [campEntries, campSequenceMap]);
```

#### 第三步：修改渲染逻辑，用序号替代 `day_number`（行 1101-1110）

当前：
```tsx
{(entries as any[]).map((entry) => {
  const dayInRound = ((entry.day_number - 1) % 7) + 1;  // 旧：日历天数
  return (
    <WealthJournalCard
      key={entry.id}
      entry={entry}
      sequenceNumber={dayInRound}
      onClick={...}
    />
  );
})}
```

改为：
```tsx
{(entries as any[])
  .sort((a: any, b: any) => {
    const seqA = campSequenceMap.get(a.id) || 0;
    const seqB = campSequenceMap.get(b.id) || 0;
    return seqB - seqA; // 最新的在前
  })
  .map((entry) => {
    const seq = campSequenceMap.get(entry.id) || 1;
    const dayInRound = ((seq - 1) % 7) + 1;  // 新：基于完成序号
    return (
      <WealthJournalCard
        key={entry.id}
        entry={entry}
        sequenceNumber={dayInRound}
        onClick={...}
      />
    );
  })}
```

#### 第四步：轮次标题也显示"已完成 N 天"，不再显示 Day X-Y 日历范围

当前标题：`Day {startDay}–{endDay}`（日历范围，用户看不懂）

改为：`第{roundNames[round]}轮 · {entries.length} / 7 天已完成`

```tsx
<div className="flex items-center gap-2 py-1">
  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
    🏕️ 第{roundNames[round] || round}轮
  </span>
  <span className="ml-auto text-xs text-muted-foreground">
    已完成 {(entries as any[]).length} / 7 天
  </span>
</div>
```

去掉 `Day {startDay}–{endDay}` 的子标题，因为用日历范围表达"进度"反而让用户困惑。

## 数据示例

| 完成时间 | day_number（DB存储）| campSequence | 显示 |
|---------|---------------------|--------------|------|
| 2月1日  | 1                   | 1            | 第一轮·第1天 |
| 2月4日  | 4（跳过2,3天）      | 2            | 第一轮·第2天 |
| 2月10日 | 10                  | 3            | 第一轮·第3天 |
| ...     | ...                 | ...          | ... |
| 第8次完成 | 任意              | 8            | 第二轮·第1天 |

## 技术要点

- **无需修改数据库**：`day_number` 继续保留日历天数，只是前端显示逻辑改为按 `created_at` 顺序
- **只需修改 `WealthCampCheckIn.tsx` 中的3处**：新增 `campSequenceMap`，修改 `campRounds` 依赖，修改渲染中的 `dayInRound` 计算和标题
- `campEntries` 筛选条件（`camp_id && !session_id`）保持不变
- `WealthJournalCard` 接收 `sequenceNumber` prop，显示"第 N 天"，这个 prop 传入值从日历天改为完成序号即可

## 修改范围

只修改 **1个文件**，**3处代码**，约30行改动，无数据库变更。
