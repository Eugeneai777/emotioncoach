# 情绪健康测评结果页升级方案（35+ 女性 · 私域获客版）

## 战略目标

把"免费测评 → 加企微 → 拿到专属报告"做成完整的获得感闭环，复用「男人有劲」已经验证的"领取码 + 私密 PDF 报告 + 底部常驻 CTA"机制，但语气和视觉切换到 35+ 女性。

**当前问题**：结果页虽然信息丰富（5个模块 + 助教二维码 + 延伸测评），但缺三件事：
1. 没有"专属感"——所有人看到的都一样，没有"这是为我生成的"信号
2. 没有"稀缺/独享"——加企微的理由不够强（"获取个性化方案"太虚）
3. 没有"持续可见的钩子"——CTA 在第 5 屏，滑过就忘

## 改造方案（5 个动作）

### 1. 顶部新增"专属女性能量报告"卡（替代原 Card1 的灰色基调）

借鉴 MaleVitalityReportCard 的"PRIVATE REPORT + 总分电量条 + 称呼 + 日期"结构，但调成 35+ 女性视觉：

- 标题 `「她」专属能量报告` + `PRIVATE REPORT` 英文小字
- 显示用户昵称（已登录用 displayName，未登录用"这位姐姐"）+ 生成日期
- 一个"女性能量电量"主指标（基于现有 energy/anxiety/stress 反算：100 - avgIndex）
  - 电量条配色用玫瑰金渐变（#F472B6 → #C026D3），区别于男版的绿/橙/红
  - 80+：能量满格 · 50-79：续航中 · <50：需要充电（中文档位）
- 右上角放一个小小的"领取码 6 位"芯片（来自 useClaimCode），下面写"凭此码联系助教领取完整 PDF 报告"

### 2. 新增"专属 PDF 私密报告"领取浮层（复用男版 Sheet）

新建 `EmotionHealthPdfClaimSheet.tsx` + `EmotionHealthPdfClaimCard.tsx`，结构对照 `MaleVitalityPdfClaimSheet/Card`，但内容改为：

- 卡片标题：`你的情绪能量报告 · 仅供本人查阅`
- 含三维指标条 + 主反应模式 + 阻滞点 + AI 一句话洞察
- 底部固定：`领取码 ABC-123` + 二维码 + `添加助教企微，回复领取码即可领取完整 32 题深度解读 PDF`
- 行为：自动 html2canvas 生成预览 → 提供「保存到相册」+「复制领取码」按钮
- 复用 `useClaimCode(recordId)`，需要把 `recordId` 写入 `emotion_health_assessments`（见技术细节）

### 3. 底部常驻 Sticky Bar（复用男版思路）

新建 `EmotionHealthClaimStickyBar.tsx`：
- 玫瑰金渐变小条，固定底部，安全区适配
- 文案：`🎁 你的专属 PDF 报告已就绪 · 点击领取`
- 点击 → 打开 PDF 领取 Sheet
- 滑到结果页就出现，不滑走，强化"东西在等你领"

### 4. 重排现有 5 个模块的优先级 + 文案柔化

- **Card 1（顶部）**：换成新「专属能量报告卡」（带领取码）—— 上面 #1
- **Card 2（反应模式）**：保留，但 emoji + 文案审一遍，确保对女性场景友好（避免"硬汉/拼搏"等男性化措辞——查 patternConfig 是否已经柔和）
- **Card 3（阻滞点）**：保留
- **Card 4（今日第一步）**：保留，但加一句 `想要 7 天系统方案？添加助教领取专属 PDF →`
- **Card 5（统一承接区 → AI 教练）**：CTA 主按钮改为 `🎁 领取我的专属 PDF 报告`（打开 Sheet），把"开启 AI 教练对话"降为次按钮 ghost 样式
- **AssistantQRCard**：保留，标题改成 `添加助教企微，回复领取码 ${claimCode}，立即获取你的专属 PDF 深度报告`

### 5. "获得感"细节强化

- 顶部卡显示 `已为你分析 32 道题 · 生成 4 张维度图谱 · 1 份专属 PDF`（数字制造价值感）
- 新增"你的能量画像关键词"3 个 chip（基于 primaryPattern + blockedDimension 拼出，如 `#高敏感` `#情绪超载` `#关系内耗`）—— 女性最爱"标签化自我"
- AI 解读区（如果 partner_assessment_results 已有 ai_insight 就显示；没有就隐藏，不强求）

## 技术细节

### 数据层

- 当前 `EmotionHealthResult` 没接收 `recordId`，需要从 `EmotionHealthPage`/`EmotionHealthLite` 把 `assessmentId`（写库后的 `emotion_health_assessments.id`）一路传下来
- 检查 `useClaimCode` 是否硬绑 `partner_assessment_results`：是的。两条路：
  - **方案 A（推荐）**：在 `emotion_health_assessments` 上加一个 `claim_code text` 字段 + 复制 `generate_assessment_claim_code` 逻辑写一个 `useEmotionHealthClaimCode(assessmentId)` hook
  - **方案 B**：测评写库时同步插一条 `partner_assessment_results`，复用现有 hook（侵入大，不推荐）
- 走方案 A，需一个 migration：给 `emotion_health_assessments` 加 `claim_code text` 列 + 唯一索引

### 文件改动清单

新增：
- `src/components/emotion-health/EmotionHealthClaimReportCard.tsx`（顶部专属卡）
- `src/components/emotion-health/EmotionHealthPdfClaimCard.tsx`（PDF 卡 750px 离屏）
- `src/components/emotion-health/EmotionHealthPdfClaimSheet.tsx`（领取浮层）
- `src/components/emotion-health/EmotionHealthClaimStickyBar.tsx`（底部常驻条）
- `src/hooks/useEmotionHealthClaimCode.ts`
- 1 个 migration（claim_code 列）

修改：
- `src/components/emotion-health/EmotionHealthResult.tsx`：插入新组件、重排顺序、改 CTA、接 recordId
- `src/pages/EmotionHealthPage.tsx` / `EmotionHealthLite.tsx`：保存写库后的 assessmentId 并传下去
- `src/components/emotion-health/AssistantQRCard.tsx`：title prop 支持插入领取码

### 风险与边界

- 未登录用户在 Lite 页拿不到 recordId → 顶部卡降级为"登录后生成你的专属编码"按钮
- claim code 生成失败：Sticky Bar/Sheet 仍可用，只是不显示码（不阻断主流程）
- PDF 截图失败兜底：参考男版 1.5s 头像超时 + 双 RAF 兜底逻辑

## 不做的事（避免范围蔓延）

- 不改测评题目、不改打分算法、不改 patternConfig 内容（仅可能微调措辞）
- 不动后端 AI 解读（如已有就读，没有就不强生成）
- 不动延伸测评卡片
