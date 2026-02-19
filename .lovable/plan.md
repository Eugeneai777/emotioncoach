
# 将觉醒档案嵌入为卡片，放在成长曲线下方

## 当前结构

`AwakeningArchiveTab.tsx` 中，成长曲线卡片（`WealthProgressChart`）之后，目前的顺序是：
```
1. 毕业成就卡片（条件显示）
2. GameProgressCard（游戏化进度）
3. 成长曲线（WealthProgressChart）← 目标插入位置
4. 成就徽章墙（CompactAchievementGrid）
5. 财富人格（CombinedPersonalityCard）
```

`/wealth-awakening-archive` 页面包含：
- 总览卡片：觉醒时刻数量统计（橙色渐变）
- 里程碑洞察：第N周关键发现
- 层次筛选 Tabs：全部 / 行为 / 情绪 / 信念 / 行动
- 时间线：按天分组的觉醒卡片（行为、情绪、信念、行动转化）

## 方案设计

将 `/wealth-awakening-archive` 的核心内容**提取成一个独立组件 `AwakeningMomentsCard`**，嵌入到 `AwakeningArchiveTab` 的成长曲线正下方。

### 卡片结构设计（紧凑版）

```
┌─────────────────────────────────────────┐
│ ✨ 觉醒档案            共 N 个时刻  [展开] │ ← 折叠式标题栏
├─────────────────────────────────────────┤
│ [全部] [行为] [情绪] [信念] [行动]        │ ← tab filter
├─────────────────────────────────────────┤
│ 第7天  3月15日                           │
│  ├─ 🎯 行为觉醒  手穷                    │
│  │    发现可负责事项...                   │
│  └─ 💡 信念转化  匮乏感                  │
│       新信念：...                        │
│ 第5天  3月13日                           │
│  └─ ❤️ 情绪觉醒  金钱焦虑               │
├─────────────────────────────────────────┤
│         查看完整觉醒档案 →               │ ← 跳转全页
└─────────────────────────────────────────┘
```

### 关键设计决策

1. **折叠/展开控制**：默认显示最近 3 天，点击"展开"显示全部，避免页面过长
2. **Tab 筛选保留**：行为 / 情绪 / 信念 / 行动，方便用户快速定位关注的层
3. **"查看完整档案"按钮**：保留跳转 `/wealth-awakening-archive` 的入口
4. **数据复用**：直接复用 `AwakeningArchiveTab` 中已有的 `fullEntries`（通过 `useWealthJournalEntries`），无需额外网络请求

## 技术实现清单

### 文件变更

| 文件 | 操作 | 内容 |
|------|------|------|
| `src/components/wealth-camp/AwakeningMomentsCard.tsx` | **新建** | 核心展示组件，包含 tab 筛选 + 时间线 + 折叠逻辑 |
| `src/components/wealth-camp/AwakeningArchiveTab.tsx` | **修改** | 在成长曲线后插入 `<AwakeningMomentsCard>` |

### AwakeningMomentsCard 接收的 props

```typescript
interface AwakeningMomentsCardProps {
  entries: WealthJournalEntry[];  // 直接传入已加载的 fullEntries
  campId?: string;
}
```

内部自行处理：
- 解析 `awakeningMoments`（复用 `WealthAwakeningArchive` 中的逻辑）
- Tab 筛选状态（`activeTab`）
- 折叠状态（`isExpanded`，默认只显示最近3天）

### 数据流（无额外请求）

```
AwakeningArchiveTab
  └─ useWealthJournalEntries → fullEntries（已有）
       └─ AwakeningMomentsCard
            ├─ 解析 awakeningMoments（本地 useMemo）
            ├─ Tab 筛选
            ├─ 按天分组
            └─ 折叠展示（最近3天 or 全部）
```

### 样式方针

- 卡片整体继承 `Card` + `shadow-sm` 风格，与页面其他卡片一致
- 时间线使用更紧凑的 padding（`p-3` 替代 `p-4`）
- 觉醒 badge 颜色沿用原页面（行为=amber，情绪=pink，信念=violet，行动=emerald）
- 底部"查看完整档案"用 `variant="link"` 按钮，保持轻量

## 效果

用户在"觉醒旅程"tab 中，滑过成长曲线后，**直接看到自己的觉醒档案摘要**，无需跳转另一个页面，且保留了跳转完整页的入口。
