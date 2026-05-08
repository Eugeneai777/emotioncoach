
# 7 天伴随手册 PDF 优化方案

整体方向：**只动手册渲染层（src/components/admin/handbook/** 与 **AdminHandbookExport** 数据装配函数），不改业务逻辑、不改边缘函数、不改下载链路。** 保证管理员现有"下载 PDF"按钮、AI 心声调用与日志写入完全不受影响。

---

## 一、文案与品牌（问题 1、2）

1. **页眉**：`HandbookHeader` 把右侧 `EugeneAI · 7 天伴随手册` 改为 `有劲 AI · 7 天伴随手册`。
2. **页脚**：`HandbookFooter` 中间的 `#e6c6d06d` 是给客服查档用的"档案编号"，但裸 hash 让用户困惑。改成 `档案编号 · A6C6D06D`（去掉 `#`，加中文前缀，字母大写更像编号），并把字号从 11px 提到 12px。
3. **第二章标题**：把 `不按题号看，按场景看` 改成用户语言：`你最近的几个生活切面`，副标题改为 `我们把你这次答的题，按发生在哪一刻整理给你看`。

---

## 二、首页留白（问题 3）

`P1Cover` 当前主标题 38px、下方一句话 + 一段 60px margin-top 的引语，导致下半页空。调整：

- 主标题 38 → **44px**，副标题 15 → **17px**。
- "这本手册写给：" 卡片 marginTop 从 80 → **56px**。
- 底部引语 marginTop 从 60 → **40px**，并在引语下方增加一段 **3 行的"这本手册怎么看"小指引**（"先看场景 → 再看优势/信号 → 跟着 7 天走 → 第 8 天选择下一步"），自然填充剩余空间，并对全本起到导读作用。

---

## 三、文字截断（问题 4，截图 image-446）

根因：`P2ScenarioBreakdown` 卡片用了 `c.items.slice(0, 4)` 但每条问答用 `q.slice(0, 40) → a` 单行渲染，长问句在 794px 宽里仍可能折到第 3 行；同时 A4 单页放 4-5 个卡片（每个含 4 条问答 + insight）超出 1123px，造成 html2canvas 切片时把卡片正文劈到第二页。

修复：

- **场景卡限高 + 内部紧凑**：每个场景卡问答从最多 4 条减到 **3 条**；问答行 `display: grid` 改成 `auto 1fr`，列宽自适应；问句 `slice(0, 28)`，答案 `slice(0, 20)`，超出加 `…`。
- **场景数量限制**：第二章一页最多渲染 **4 个场景卡**，多余的合并到末尾"其它"卡。
- **分页保护**：在 `HANDBOOK_PAGE_STYLE` 增加 `overflow: hidden`，并把 P2/P5/P6/P7 页面里的卡片容器加 `breakInside: 'avoid'`（html2canvas 切片时配合下一条更可靠）。
- **PDF 切片优化**：`exportNodeToPdf` 当前按固定像素高度切，会从卡片中间切。改为：先在 DOM 里给每个 `data-page` 节点单独 render → 单独 `html2canvas` → 一页一图加入 PDF。这样每页与设计页 1:1 对齐，**彻底消除截断**。是本次最关键的稳定性改动。

---

## 四、优势页文案乱码（问题 5，截图 image-447）

根因：`buildMaleData` 里 `dims` 的键可能是数字索引（`"0"`、`"1"`），而 `MALE_LABEL` 只覆盖 `energy/sleep/...`，导致渲染出 `0 还稳着，是你接下来 7 天能借力的格`。

修复：

- 在 `buildMaleData` 内增加键名归一化：若 `dims` key 不在 `MALE_LABEL` 里，按位置映射到 `[energy, sleep, stress, confidence, relationship, recovery]`。
- 文案改写为更友好版本：`「精力续航」目前还撑得住，是你这 7 天可以倚靠的部分。` 同时 P3 头部说明文案改成：`这一页是你目前还稳的部分。优先用它接住自己，别一上来就挑最难的格硬扛。`

---

## 五、风险页 [object Object]（问题 6，截图 image-448）

根因：`row.dimension_scores` 的 value 在新版本里是对象 `{score, level}`，所以 `${v}` 渲染成 `[object Object]`。

修复：

- 在 `buildMaleData` 的 risks 生成处，统一通过 `const num = typeof v === 'number' ? v : (v?.score ?? v?.value ?? 0)` 取分值。
- 同时给 `buildEmotionData` 的 `indices` 做相同兜底（`row.energy_index` 等若为对象同样处理）。
- 文案改成用户语言：`「{label}」目前 {num} 分，已经在亮黄/红灯，这 7 天先别再加压。`

---

## 六、Day 卡片重复"安抚语"（问题 7）

根因：`MALE_SEVEN_DAYS` / `FEMALE_SEVEN_DAYS` 每日 `reassure` 字段全部用同一个 `COMMON_REASSURE` 常量，14 张卡都印同一句话。

修复（不改 config 数据来源，避免影响其它依赖）：

- 在 `HandbookDayPage` 渲染 reassure 时，**按 day 编号轮换 6 句不同的安抚短语**（在组件内本地定义数组），让用户每天看到的鼓励都不同：
  - Day 1 — `没做到也行。第一天的目标只有一个：知道自己存在。`
  - Day 2 — `今天动一点点，比完美的明天更值钱。`
  - Day 3 — `卡住很正常，记下来比硬撑更重要。`
  - Day 4 — `让一个人知道你在调，比独自扛更快好起来。`
  - Day 5 — `身体在还债，对自己宽一点，不是放弃。`
  - Day 6 — `走到这一天，你已经比 70% 的人多撑了 5 天。`
  - Day 7 — `今天回头看：你没回到原点，你在向前走。`

---

## 七、PDF 下载稳定性兜底（贯穿）

- 字体加载等待已存在（`document.fonts?.ready`），保留。
- 新增：导出前对 `containerRef.current` 做 `scrollIntoView({ block: 'nearest' })` + `await new Promise(r => requestAnimationFrame(r))` 双 RAF，避免首次点击时 layout 尚未稳定。
- 切片改为"按 `[data-page]` 节点逐张截图"后，PDF 始终是 9 页，与设计稿一致；不会因 DPI / 字体宽度变化出现内容塌方。
- 文件名 `filename` 已经在 `useMemo` 里前置（之前已修），保持不动。

---

## 技术清单（本次会改的文件）

```text
src/components/admin/handbook/shared/HandbookHeader.tsx      文案 EugeneAI → 有劲 AI
src/components/admin/handbook/shared/HandbookFooter.tsx      档案编号文案 + 字号
src/components/admin/handbook/handbookStyles.ts              overflow: hidden
src/components/admin/handbook/pages/P1Cover.tsx              字号、留白、加 3 行导读
src/components/admin/handbook/pages/P2ScenarioBreakdown.tsx  标题/副标题/卡片限高/3 条
src/components/admin/handbook/pages/P3Strengths.tsx          说明文案优化
src/components/admin/handbook/pages/P4Risks.tsx              （仅文案微调，主要在 build 函数）
src/components/admin/handbook/pages/HandbookDayPage.tsx      按 day 轮换 reassure 文案
src/pages/admin/AdminHandbookExport.tsx                      dims key 归一化、风险 v 兜底
src/utils/exportReportToPdf.ts                               切片改为按 [data-page] 节点逐页
```

不动：边缘函数 `generate-handbook-insights`、`reportAIInsight.ts` 缓存、迁移、抽屉里的下载按钮、路由。

---

## 验收标准

1. 9 页全部 1 页 1 屏，**无任何文字被切到下一页**。
2. 页眉/页脚无英文品牌词、无裸 hash。
3. P1 视觉重心在中部，无大块空白。
4. P3/P4 全部使用中文标签 + 数字，无 `[object Object]` / `0 还稳着`。
5. P5/P6/P7 每天的安抚语都不同。
6. 管理员从抽屉点击"下载 7 天伴随手册 PDF"→ 新窗 → 点击"下载 PDF" → 10-15 秒内得到 9 页 A4 PDF，文件名格式不变，日志正常写入 `pdf_generation_logs`。
