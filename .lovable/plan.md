
# 7 天伴随手册 PDF · 二次优化方案

只动手册渲染层 + 抽屉按钮，不改边缘函数 / 不改测评结果页业务逻辑。

---

## 一、问题 1：P2 场景卡 insight 文案重复（截图 image-450）

**根因**：`buildMaleData` 里每个 cluster 的 `insight` 都用 `MALE_FALLBACK_BY_SCORE[Math.round(avgScore)]`，当 AI 心声没回／所有簇平均分相近时，3 张卡都印同一句"这一格还在你手里，先别急着动它"。

**修复**（不改 fallback 表，避免影响别处）：

- 在 `AdminHandbookExport.tsx` 的 cluster 装配里，**当 AI insight 缺失** 或 **与上一张卡相同** 时，按 `cluster.key` 从一张本地 6 句的"暖心文案池"中取一句，保证 4 张卡 4 个语气：
  - 白天电量类 → `白天能撑到现在，已经是你在硬扛。先别急着证明什么。`
  - 夜里修复类 → `夜里这一格在悄悄替你修。今晚少做一件事，比多做一件更值钱。`
  - 关键时刻类 → `大场面里你没崩，是你在用旧方法救自己。这一周我们换一种。`
  - 关系/情绪类 → `这一格还连着你最在意的人。先把自己接住，再去接别人。`
  - 信心/自我类 → `你不是没力气，是力气一直在替别人花。这 7 天先留一点给自己。`
  - 兜底 → `这一格暂时不用动它。看到，就已经是改变的开始。`
- 同时 P3 优势卡也加同样的"上下两句不重复"校验（避免 strengths[0]/strengths[1] 撞文案）。

---

## 二、问题 2：合并"下载 PDF 报告"到"7 天伴随手册 PDF"

### 2.1 当前两个按钮做的事

| 按钮 | 行为 |
|---|---|
| **下载 PDF 报告**（旧） | 在新窗打开 `/assessment/male_midlife_vitality?adminPdf=1` 或 `/emotion-health?...`，触发用户结果页里的 `DimensionRadarChart` + AI 完整解读 + autoSave PDF |
| **下载 7 天伴随手册 PDF**（新） | 打开 `/admin/handbook/male/{id}`，渲染 9 页 A4 手册，含场景簇 / 优势 / 风险 / 7 天脚本 / 第 8 天邀请 |

### 2.2 合并方案：手册第 0/1 页前插入"测评全景"

新增 1 页 → 手册从 9 页变 **10 页**，结构：

```text
P1 封面
P2 测评全景（新）  ← 雷达图 + 6 维分数 + AI 完整解读
P3 你的生活切面（原 P2）
P4 优势
P5 风险
P6/7/8 7 天脚本
P9 第 7 天复盘
P10 第 8 天邀请
```

**P2 测评全景**（新 `P2AssessmentOverview.tsx`）：

- 左侧：复用 `DimensionRadarChart`（已有组件，男版传 `vitalityStatusScores`，女版传 `dimensionScores`）。固定宽 320px，背景白，避免 html2canvas 截不到 SVG。
- 右侧：6 维（男）/ 4 模式（女）的横向条形 + 分数 + 中文标签（用 `MALE_LABEL` / `FEMALE_PATTERN_LABEL`）。
- 下方：**AI 完整解读**（300-500 字）。来源：
  - 男版：`partner_assessment_results.ai_insights` 字段（已存在，结果页直接用）；
  - 女版：`emotion_health_assessments.ai_analysis` 字段；
  - 取不到时回退到 `coverNote` + 风险 + 优势的拼接。
- 加 `breakInside: 'avoid'`、`overflow: hidden`，与其它页同样的 A4 容器规格。

> 雷达图用 recharts SVG，html2canvas 已能截。验证点：导出前 `await new Promise(r=>setTimeout(r,300))` 给 recharts animation 收尾，否则会截到半张。

### 2.3 数据装配补丁

`buildMaleData` / `buildEmotionData` 各加一段：

```ts
const aiInsightsFull = String(row.ai_insights || row.ai_analysis || "").trim();
return { ..., aiInsightsFull, dims };  // dims 已有
```

`HandbookData` 类型加 `aiInsightsFull?: string; dims?: Record<string, number>`。

### 2.4 删除"下载 PDF 报告"按钮

`src/components/admin/AssessmentRespondentDrawer.tsx`：

- 删掉 lines 112–131（男版"下载 PDF 报告"按钮）
- 删掉 lines 159–178（女版"下载 PDF 报告"按钮）
- 保留"复制发送话术" + "下载 7 天伴随手册 PDF" 两个按钮
- 把"下载 7 天伴随手册 PDF" 的 toast 文案改成 `已打开 7 天伴随手册导出页（含完整测评雷达图与 AI 解读），生成约 15-25 秒`

> 旧路径 `/assessment/...?adminPdf=1` 和 `/emotion-health?adminPdf=1` 仍保留，普通用户结果页一直在用，不删。

### 2.5 PageNumber/Footer 同步

- `HandbookFooter` 里 `totalPages` 写死 9 → 改成 **10**
- `HandbookContainer` 渲染顺序新增 `<P2AssessmentOverview pageNumber={2} />`，原 P2-P9 全部 +1
- `exportNodeToPdf` 已是按 `[data-page]` 节点逐张截图，自动适配新页数，无需改

---

## 三、改动清单

```text
新增  src/components/admin/handbook/pages/P2AssessmentOverview.tsx
新增  src/components/admin/handbook/clusterCopy.ts                （6 句暖心文案池 + 去重函数）
改    src/components/admin/handbook/HandbookContainer.tsx         （插入新页 + 类型扩展）
改    src/components/admin/handbook/shared/HandbookFooter.tsx     （totalPages 9→10）
改    src/components/admin/handbook/pages/P2ScenarioBreakdown.tsx (页码 2→3，data-page=3)
改    src/components/admin/handbook/pages/P3Strengths.tsx         （页码 +1，去重 strengths）
改    src/components/admin/handbook/pages/P4Risks.tsx             （页码 +1）
改    src/components/admin/handbook/pages/HandbookDayPage.tsx     （pageNumber prop 已动态，无需改逻辑）
改    src/components/admin/handbook/pages/P8Day7Invite.tsx        （页码 +1）
改    src/components/admin/handbook/pages/P9Companion.tsx         （页码 +1）
改    src/pages/admin/AdminHandbookExport.tsx                     （装配 aiInsightsFull / dims，cluster 去重 fallback）
改    src/components/admin/AssessmentRespondentDrawer.tsx         （删除两处旧按钮 + toast 文案）
```

不动：边缘函数、`reportAIInsight.ts`、`exportReportToPdf.ts`、迁移、用户端结果页。

---

## 四、验收标准

1. 第二章 4 张场景卡的 insight 文案两两不同，至少 4 种语气。
2. 抽屉里只剩 2 个按钮：复制话术、下载 7 天伴随手册 PDF。
3. 下载得到 **10 页 A4 PDF**，第 2 页有清晰的雷达图 + 6 维分数 + AI 完整解读。
4. 雷达图无截断 / 无空白，分数标签为中文。
5. 页脚正确显示 `n / 10`，档案编号无 `#`。
6. `pdf_generation_logs` 写入正常，文件名格式不变。
