## 已确认决策
1. AI 完整解读字数：300-450 字
2. 页眉品牌：保留"有劲 AI · 7 天伴随手册"，男女版统一
3. 男版同步升级 `fullReading`

---

## 改动概要

### 一、Edge Function：扩展 AI 输出
**`supabase/functions/generate-handbook-insights/index.ts`**

- 在 system prompt 新增 `fullReading` 输出契约：
  - 长度 300-450 字
  - 结构 3 层：①看见此刻（用雷达分数对应日常画面）②命名隐形规则 ③递一句不催促的下一步
  - 不喊口号、不"你可以的/加油"、不 emoji、不列条目
- 女版词汇库锚点：清晨第一口气、深夜手机亮屏、家人需要才像"在"、对镜子说"我没事"、把疲惫翻译成"还行"、"先把所有人安顿好"、月经周期/更年期、自我消失感
- 男版词汇库锚点：凌晨醒来盯天花板、电话振动那一秒收紧、应酬后开车回家发呆、"再扛一下"、肩颈/腰、孩子叫爸爸时心里那一下、"撑住就是赢"
- 返回 JSON 结构追加：`{ coverNote, clusterInsights, day7Reflection, fullReading }`
- 服务端兜底：若 AI 漏写 `fullReading`，回退到一段类型对应的静态长文案

### 二、客户端类型 + 缓存
**`src/lib/reportAIInsight.ts`**
- `HandbookInsights` 接口加 `fullReading: string`
- `FALLBACK_BY_TYPE` 各加一段 300+ 字的静态兜底
- `sanitizeInsights` 兼容新字段

### 三、数据装配：让"完整解读"用上 fullReading
**`src/pages/admin/AdminHandbookExport.tsx`**
- `buildEmotionData`：`aiInsightsFull = insights.fullReading || (原 ai_analysis 兜底) || coverNote`
- `buildMaleData`：`aiInsightsFull = insights.fullReading || row.ai_insight || coverNote`
- 女版 `strengths/risks` 文案改写为场景化女性语：
  - 优势示例：「你的焦虑指数还在 75，说明心里那根弦其实一直绷着——也是它在提醒你，别再继续把自己放最后。」
  - 风险示例：「精力指数只剩 58，是身体在用最小声的方式说：撑不住了。这 7 天，先允许自己'今天就这样'。」
- 男版 strengths/risks 保留现状（已偏哥们口吻）

### 四、UI：去掉 P2 的视觉遮罩
**`src/components/admin/handbook/pages/P2AssessmentOverview.tsx`**
- 删除 `maxHeight: 560px` + `overflow: hidden` + 底部渐变蒙层
- 自适应高度，保留 `breakInside: avoid` 防 PDF 切页
- 字号 13 → 13.5px，行高 1.78 → 1.85
- 标题"AI 完整解读" → 按 `type` 切换：女版"姐姐想对你说的几句"，男版"哥们想对你说的几句"
- 需要在 props 增加 `type: "male_vitality" | "emotion_health"` 并由 HandbookContainer 传入

### 五、女版基调微调（小而准）
**`src/components/admin/handbook/pages/P1Cover.tsx`**
- 仅女版加副标题："不催你成为更好的你，先陪你回到自己。"
- 男版加副标题："不灌鸡汤，先陪你看清自己卡在哪。"

**`src/components/admin/handbook/HandbookContainer.tsx`**
- 按 `data.type` 切换 Day 章节标题：
  - 女版：先回到自己 / 把"应该"放下一格 / 让一个人看见你 / 回头看自己走了多远
  - 男版：保留现行（先看见 / 动一点点 / 让一个人靠近 / 回望）
- 把 `type` 透传给 P2AssessmentOverview

**`src/components/admin/handbook/shared/HandbookFooter.tsx`**
- 增加可选 `type` props：女版左侧文案"7 天伴随手册 · 给此刻的你"，男版保留"7 天伴随手册 · 个人专属"
- 页眉不动（按确认保留品牌）

---

## 文件改动清单

```text
supabase/functions/generate-handbook-insights/index.ts        ← 新增 fullReading + 词汇库
src/lib/reportAIInsight.ts                                    ← 类型与兜底
src/pages/admin/AdminHandbookExport.tsx                       ← 取 fullReading + 女版优势/风险改写
src/components/admin/handbook/pages/P2AssessmentOverview.tsx  ← 去蒙层 + 标题按 type 切换
src/components/admin/handbook/pages/P1Cover.tsx               ← 男女版副标题
src/components/admin/handbook/HandbookContainer.tsx           ← 女版 Day 章节标题 + 透传 type
src/components/admin/handbook/shared/HandbookFooter.tsx       ← 女版页脚文案
```

无数据库迁移。无新依赖。Edge function 部署后即时生效（旧已生成的 PDF 不回填，下次导出自动用新内容）。

---

## 风险与回退
- AI 偶发漏写 `fullReading` → 服务端 + 客户端双层静态兜底
- 旧数据无 `ai_analysis` → 走 `fullReading`，不再受影响
- 字数过长导致 PDF 单页溢出 → P2 已是单独一页，自适应高度 + 已有的 `breakInside: avoid` 保护；最坏情况溢出半页 AI 文本，比"被切到只剩一行"可接受
