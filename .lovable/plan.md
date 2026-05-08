
# 7 天伴随手册 PDF 排版优化方案

针对您指出的 5 个问题，作为商业架构师从"用户阅读舒适度 + 手写打卡可用性 + 内容完整性"三个维度统一优化。

---

## 1. 第一章·测评全景 AI 解读与页脚撞车（图1）

**问题**：`P2AssessmentOverview` 下半部分的"AI 完整解读"卡片没有限高，AI 文字 300–500 字时直接压到页脚的"7 天伴随手册 / 档案编号 / 2 / 10"上。

**解决**：
- 给 AI 解读卡片加 `maxHeight: 380px` + `overflow: hidden`，并在底部留 `marginBottom: 88px` 安全区（页脚高度 64px + 缓冲 24px）。
- 文字超出时末尾用淡淡的渐变遮罩提示"详见后续章节"，避免硬截断。
- AI 解读字号从 13px → 13px 行高从 1.85 → 1.78，更紧凑且不破阅读节奏。
- 顶部段落与雷达图区域之间间距从 18px → 14px，给下方让出空间。

---

## 2. 第三章「这些地方，你还撑得住」两条卡片之间空、下方留白多（图2）

**问题**：`P3Strengths` 两个卡片 `marginBottom: 14px`，挨太近；页面下方一大块空白。

**解决**（`P3Strengths.tsx`）：
- 卡片间距 `marginBottom: 14px → 28px`。
- 卡片内部 padding `16px 18px → 20px 22px`，"今日用法"与上面正文之间 `marginTop: 8px → 12px`。
- 在两条卡片下方加一段轻量"温柔总结句"小卡（不是新内容、是空间过渡），例如：
  > "把还稳的部分先用起来——这就是这 7 天最聪明的策略。"
- `SunRise` 装饰从右下 `bottom: 100px` 上移到 `bottom: 130px`，避免和新底部文案打架。

---

## 3. 第四章「这些信号别再忽略」三步缓冲挨太紧（图3）

**问题**：`SOSCard` 三个 STEP 列之间 gap 太小，整体看起来"墙"，下方仍有空白。

**解决**（`SOSCard.tsx` + `P4Risks.tsx`）：
- 风险红色条目 `marginBottom: 14px → 20px`。
- `SOSCard` 三列 `gap` 加大；每个 STEP 内部 padding 增加，行高从默认 → 1.75；STEP 标题与正文之间间距加大。
- `SOSCard` 整体 `marginTop` 加大（与上方风险列表拉开呼吸），并把 `WaningMoon` 装饰下移避免遮挡。

---

## 4. Day 1-2 / 3-4 / 5-6 卡片排版 +「今日一句话」太挤（图4）

**问题**（`HandbookDayPage.tsx` + `DailyCheckBox.tsx`）：
- 两个 Day 卡片之间 `marginBottom: 18px`，偏挤。
- "今日一句话"行紧跟在"早做了/午做了/晚做了"勾选行下面，纸质打印时手写空间不足。

**解决**：
- Day 卡片之间 `marginBottom: 18px → 26px`。
- `DailyCheckBox`：
  - 勾选行与"今日一句话"之间 `rowGap: 8px → 16px`。
  - "今日一句话"右侧手写横线高度 `height: 16px → 22px`，并在下方再加一条同样的虚线（即两行手写空间），符合纸质手账习惯。
  - 勾选框尺寸 12×12 → 14×14，更易识别。

---

## 5. Day 5-6 之后没有 Day 7，直接跳到第 8 天（图4）

**问题**：`HandbookContainer.tsx` 把 7 天分成 `slice(0,2) / slice(2,4) / slice(4,6)`，**第 7 天的内容被丢弃**，下一页直接是"第 8 天 · 下一步"。这是硬伤。

**解决**（核心结构变更）：
- 在 Day 5-6 页之后**新增一页 Day 7**，使用同一个 `HandbookDayPage` 组件，传 `slice(6, 7)`，标题改为「Day 7 · 回头看，向前走」。
- Day 7 页面下方多一块"7 天回顾"小卡（用 `day7Reflection` 的简短版），承上启下到第 8 天页面。
- 总页数 `HANDBOOK_TOTAL_PAGES` 从 10 → 11；P8Day7Invite / P9Companion 的 `pageNumber` 顺延（10 / 11）；P1 封面、所有页脚的"X / 11"自动更新。
- 为防止 Day 7 单卡片导致页面下方空，给单 Day 卡片场景加一段"7 天小结"半页内容（仍在 A4 高度内）。

---

## 技术细节（给开发者）

### 涉及文件
| 文件 | 改动 |
| --- | --- |
| `src/components/admin/handbook/HandbookContainer.tsx` | `HANDBOOK_TOTAL_PAGES` 10→11；新增 Day 7 `HandbookDayPage` 实例；P8/P9 页码顺延 |
| `src/components/admin/handbook/pages/P2AssessmentOverview.tsx` | AI 卡片 `maxHeight + overflow + marginBottom` 安全区 |
| `src/components/admin/handbook/pages/P3Strengths.tsx` | 卡片间距 28px；底部加温柔总结小卡；装饰位移 |
| `src/components/admin/handbook/pages/P4Risks.tsx` | 风险条间距 20px；SOSCard `marginTop` 加大；装饰位移 |
| `src/components/admin/handbook/shared/SOSCard.tsx` | 三列 gap 加大、内 padding 加大、行高 1.75 |
| `src/components/admin/handbook/pages/HandbookDayPage.tsx` | Day 卡间距 26px；新支持单 Day（Day 7）下方"7 天小结"模块 |
| `src/components/admin/handbook/shared/DailyCheckBox.tsx` | 勾选与"今日一句话"行距 16px；横线 22px；新增第二条横线；勾选框 14px |
| `src/components/admin/handbook/pages/P1Cover.tsx` | "共 X 页"从 10 → 11 |
| `src/pages/admin/AdminHandbookExport.tsx` | 预览高度提示从"9 页"统一为常量 `HANDBOOK_TOTAL_PAGES` |

### 不涉及
- 不改 `exportReportToPdf.ts`（仍按 `[data-page]` 逐页截图，新增第 7 页天然兼容）。
- 不改 `handbookStyles.ts`（A4 尺寸不变）。
- 不动数据装配 / AI 调用（`MALE_SEVEN_DAYS` / `FEMALE_SEVEN_DAYS` 已经是 7 元素数组，目前是被切丢了）。
- 不影响管理员下载稳定性，整体仍是同一管线。

### 风险与回滚
- 总页数从 10 → 11，PDF 文件大小 +约 100KB，可忽略。
- 若第 7 天数组缺失，自动回退展示 `day7Reflection` 文案，不会白页。

---

## 预期效果

1. P2 AI 解读不再压页脚，长文优雅截断。
2. P3/P4/Day 页面卡片之间有清晰呼吸感，页面下方留白显著减少。
3. 打卡行有足够手写空间，纸质使用真正可用。
4. 第 7 天补齐，整本手册 7 天闭环完整，第 8 天承接逻辑自然。
