

# 财富觉醒训练营 — 课程大纲可跳转打卡

## 问题

从截图和代码看，`WealthMeditationCourseOutline` 组件中：
- **已完成天**：只能弹窗"回放"冥想，无法跳到该天的完整打卡内容
- **未完成但已解锁天**（补卡天）：完全不可点击，用户找不到补卡入口
- **当前天**：无交互
- 对比有劲训练营的 `StressMeditation.tsx` 有"上一天 / 下一天"导航按钮，财富营缺少这种直觉式导航

## 修复方案

### 1. 课程大纲增加「补卡」交互
**文件**: `src/components/wealth-camp/WealthMeditationCourseOutline.tsx`

新增 `onMakeupClick` 和 `makeupDays` props：
- **已完成天**：保留回放功能不变
- **可补卡天**（未完成但 < displayDay）：显示橙色「补卡」标签，点击触发 `onMakeupClick(dayNum)` — 直接进入补卡模式
- **当前天**：点击滚动到冥想播放器（触发 `onCurrentDayClick`）
- **未来天**：点击显示 toast 提示

视觉变化：
- 可补卡天用橙色虚线边框 + "待补卡" 标签替代锁定图标
- 当前天保持高亮 + 可点击

### 2. 冥想播放器底部增加「上一天 / 下一天」导航
**文件**: `src/pages/WealthCampCheckIn.tsx`

在冥想播放器下方（WaterfallSteps 之后）添加类似有劲训练营的 prev/next 导航：
```
< 上一天          下一天 >
```
- 「上一天」：跳到已完成的前一天（回放模式）
- 「下一天」：如果下一天已解锁，切换到该天；否则禁用
- 点击切换时更新 `displayDay` / 进入补卡模式

### 3. 课程大纲默认展开
改 `isExpanded` 初始值为 `true`，让用户一眼看到所有天数和状态，降低发现成本。

## 修改文件清单

| 文件 | 说明 |
|------|------|
| `WealthMeditationCourseOutline.tsx` | 增加补卡/当前天点击交互、默认展开 |
| `WealthCampCheckIn.tsx` | 传递回调 props、底部增加上一天/下一天导航 |

## 用户体验改善

```text
Before:
  课程大纲 → 已完成天只能回放 → 补卡天无入口 → 不知道去哪补卡

After:
  课程大纲 → 已完成天可回放 → 补卡天显示"待补卡"可直接点击进入
  → 底部有上一天/下一天切换 → 与有劲训练营体验一致
```

