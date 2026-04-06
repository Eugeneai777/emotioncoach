

# 财富觉醒训练营 — 打卡路径优化方案

## 当前问题（课程设计视角）

1. **内容不可浏览**：用户只能看到当前进度天的冥想，无法预览或回顾其他天的内容
2. **补卡窗口过窄**：仅允许补前 3 天（基于 `displayDay - 1` 到 `displayDay - 3`），半个月后回来只能补到当前进度的前几天，体验断裂
3. **已完成内容不可回放**：完成 Day 1 后无入口重新听 Day 1 冥想
4. **日历不可交互**：7 天日历只有"可补卡"的天能点击，已完成/未来天都不可点
5. **断档用户无引导**：离开半个月后回来，页面仍停在 `completed_days + 1`，没有"欢迎回来"或进度恢复提示

## 优化方案

### 1. 新增「7天课程大纲」卡片
在"今日任务"Tab 顶部（日历下方）增加一个可展开的课程总览卡片，展示全部 7 天冥想标题和时长。用户可以：
- **已完成天**：点击回放冥想（只读模式，不影响进度）
- **当前天**：高亮标记，点击滚动到冥想播放器
- **未解锁天**：显示锁定图标和标题，不可播放

**文件**: 新建 `src/components/wealth-camp/WealthMeditationCourseOutline.tsx`
- 从 `wealth_meditations` 加载全部 7 天数据
- 根据 `completed_days` 判断解锁状态
- 已完成天点击后弹出独立播放器（回放模式）

### 2. 放宽补卡范围 — 允许补所有未完成天
将补卡限制从"前 3 天"改为"所有已解锁但未完成的天"。

**文件**: `src/pages/WealthCampCheckIn.tsx`（`makeupDays` 计算逻辑，约第 727 行）
- 当前逻辑：`for (let i = displayDay - 1; i >= Math.max(1, displayDay - 3); i--)`
- 改为：`for (let i = 1; i < displayDay; i++)`，遍历所有已过但未完成的天

### 3. 日历天数可点击交互
让 7 天日历格子全部可点击，行为根据状态区分：
- **已完成**：点击后展示该天的冥想回放 + 教练记录摘要
- **可补卡**（未完成且已过）：点击进入补卡模式（现有逻辑）
- **当前天**：点击滚动到冥想播放器
- **未来天**：点击显示"完成前面的天才能解锁"提示

**文件**: `src/components/wealth-camp/CollapsibleProgressCalendar.tsx`（约第 392 行）
- 扩展 `onClick` 处理，增加已完成天和当前天的交互

### 4. 断档用户欢迎回来提示
当用户超过 3 天未打卡时，在顶部显示一个温暖的回归提示卡片。

**文件**: `src/pages/WealthCampCheckIn.tsx`
- 计算 `daysSinceLastCheckIn`（`currentDay - displayDay`）
- 超过 3 天时显示鼓励文案 + 快速补卡入口

### 5. 补卡流程增加"快速补卡"选项
对于长时间断档用户，提供批量补卡入口，让用户可以一次性查看所有待补天数并逐个完成。

**文件**: `src/components/wealth-camp/CollapsibleProgressCalendar.tsx`
- 补卡入口从下拉菜单改为更显眼的卡片式列表

## 修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/wealth-camp/WealthMeditationCourseOutline.tsx` | 新建 | 7天课程大纲 + 回放功能 |
| `src/pages/WealthCampCheckIn.tsx` | 修改 | 放宽补卡范围、加断档提示、集成课程大纲 |
| `src/components/wealth-camp/CollapsibleProgressCalendar.tsx` | 修改 | 日历天数可点击交互 |

## 用户体验改善

```text
Before:
  Day 2 用户 → 只能看 Day 2 冥想 → 半月后回来仍卡在 Day 2 → 无法找到补卡入口

After:
  Day 2 用户 → 展开课程大纲可浏览 7 天内容 → 半月后回来看到"欢迎回来"提示
  → 日历显示 Day 1 ✓ + Day 2 待补卡 → 点击 Day 2 进入补卡 → 完成后自动进入 Day 3
```

