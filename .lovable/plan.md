
# 优化方案：两份测评的结果页 → 企微领取 → 7 天伴随手册闭环

## 一、商业架构师视角的洞察

两个测评目前**只到结果页就戛然而止**——用户看完分数、合上页面，转化链路断裂。现有的"情绪健康"和"男人有劲"已经验证过一条高转化链路：

> 结果页低门槛领取码海报 → 用户截图加企微 → 企微人工/PDF 推送完整 7 天伴随手册 → 沉淀私域 → 训练营转化

我们要把这条链路平移到两个新测评，但**手册内容必须贴合各自人群和测评本身**，不能复用一套话术：

| 测评 | 对标 | 受众洞察 | 手册主轴 |
|---|---|---|---|
| 35+ 女性竞争力 | 情绪健康 | 35+ 职场/家庭夹层女性，"竞争力"焦虑背后是身份焦虑、被看见焦虑 | 7 天「重新看见自己的竞争力」——不卷年轻、不比赛道，把已有筹码亮出来 |
| 中场觉醒力 | 男人有劲 | 35-55 中年男性/女性，存在感、行动力、意义感塌方 | 7 天「中场不是终场」——把"再战一次"从口号落到 5 分钟动作 |

关键设计原则：
- **结果页保持简洁**，领取卡作为情绪到达顶点后的"自然出口"，而非弹窗打断
- **领取码 + 企微二维码海报**截图即走，零摩擦
- **手册内容差异化**——每个手册有独立的 cluster、7 天动作脚本、Day 7 邀约文案

---

## 二、改动总览

```text
[前端]
1. 结果页加「领取完整 7 天伴随手册」入口（卡片 + Sheet）
   ├─ src/components/women-competitiveness/CompetitivenessResult.tsx
   └─ src/components/midlife-awakening/MidlifeAwakeningResult.tsx

2. 新增 4 个领取组件（对照已有的 EmotionHealth/MaleVitality 两套）
   ├─ CompetitivenessPdfClaimCard.tsx     （海报，玫瑰金 → 改成竞争力主题色）
   ├─ CompetitivenessPdfClaimSheet.tsx    （领取流程 Sheet）
   ├─ MidlifeAwakeningPdfClaimCard.tsx    （海报，深蓝/铜色，中年沉稳感）
   └─ MidlifeAwakeningPdfClaimSheet.tsx

3. 新增 2 个 claim_code Hook
   ├─ useCompetitivenessClaimCode.ts
   └─ useMidlifeAwakeningClaimCode.ts

[后端 / DB]
4. 两张表加 claim_code TEXT UNIQUE 列 + 自动生成触发器
   ├─ competitiveness_assessments
   └─ midlife_awakening_assessments

[手册内容（核心商业资产）]
5. 新增 2 份手册配置（cluster / 7天脚本 / 训练营邀约 / 标签）
   ├─ src/config/womenCompetitivenessHandbook.ts
   └─ src/config/midlifeAwakeningHandbook.ts

[Admin PDF 导出]
6. AdminHandbookExport 扩展支持 4 种类型，路由 :type 增加 women / midlife
   ├─ src/pages/admin/AdminHandbookExport.tsx（增加 buildWomenData / buildMidlifeData）
   ├─ src/components/admin/handbook/HandbookContainer.tsx（type 联合扩展，标签映射扩展）
   └─ src/components/admin/handbook/pages/P1Cover.tsx & shared/HandbookFooter.tsx
       （title / sub / footer 品牌口径按 4 类分支）

[AI 解读边缘函数]
7. supabase/functions/generate-handbook-insights/index.ts
   增加两个新 type 分支的 system prompt（贴合 35+ 女性竞争力 / 中场觉醒人群）

[Admin 入口]
8. AdminAssessmentRespondentDrawer 或对应面板：
   把"导出 7 天伴随手册"按钮扩展到 4 类测评
```

---

## 三、手册内容（商业架构师定调，开发阶段细化）

### A) 35+ 女性竞争力 · 7 天伴随手册

封面副标：**"不卷年轻，不比赛道。这 7 天，先把你已有的筹码摆到桌面上。"**

7 天主轴（按 weakest_category 略调）：
| Day | 主题 | 核心动作（≤5 分钟） |
|---|---|---|
| 1 | 看见盘面 | 写下你 35 岁后增加的 3 项无可替代的能力 |
| 2 | 拆掉假对手 | 列 1 个你一直在比的人，写她不知道的你 3 个底牌 |
| 3 | 把"应该"放下一格 | 选 1 件本周本来"应该"做的事，主动延后 |
| 4 | 让一个人看见你 | 给 1 个老朋友发一句"我最近在做……" |
| 5 | 把无形资产作价 | 给你的 1 个隐性能力定一个时薪 |
| 6 | 占一个能见的位 | 在你日常的群/社交场，主动发表 1 次专业观点 |
| 7 | 回看 7 天 | 写一句"35+ 的我，最值钱的不是……，而是……" |

训练营邀约：「她的中场，重新出牌」7 天微营，对应已有的女性方向训练营产品。

### B) 中场觉醒力 · 7 天伴随手册

封面副标：**"中场不是终场。这 7 天，把'再来一次'从口号变成动作。"**

7 天主轴（按 internalFrictionRisk / actionPower / missionClarity / regretRisk 几个最弱维度切分脚本组）：
| Day | 主题 | 动作 |
|---|---|---|
| 1 | 先承认卡住 | 写下你最近 3 个月里"一直想做但没动"的 1 件事 |
| 2 | 把内耗看清 | 把 Day1 那件事卡住的真正原因写 3 行 |
| 3 | 缩小到 5 分钟 | 把它拆成 1 个 5 分钟以内能完成的动作 |
| 4 | 做完那 5 分钟 | 今天就做 1 次，不论效果，只论动了 |
| 5 | 找回意义半径 | 写"如果 50 岁的我回头看今天，我希望我做了……" |
| 6 | 找一个同代人 | 给 1 个 35+ 男性朋友发一段你这周的小动作 |
| 7 | 中场宣言 | 写一句"我的中场，第一件事是……" |

训练营邀约：复用「男人有劲 / 中场觉醒」训练营产品，文案侧重"不被时代抛下，靠 5 分钟动作"。

---

## 四、技术实现要点

- **claim_code 一致性**：复用 `generate_assessment_claim_code` RPC（partner 表已用），两个新表在 `BEFORE INSERT` 触发器中调用，旧记录走 Hook 内 fallback 生成（同 useClaimCode 模式）
- **领取卡海报**：750px 离屏 inline-style，html2canvas 兼容，二维码用 `@/assets/qiwei-assistant-qr.jpg`
- **HandbookContainer.type** 扩展为 `"male_vitality" | "emotion_health" | "women_competitiveness" | "midlife_awakening"`，标签映射、Day 1-7 标题文案、封面/页脚品牌口径按 4 类分支（页眉品牌口径按既定决议保留"有劲 AI"）
- **AI 解读 edge function**：男版 fullReading 升级（已落地）的写法直接复用，对两个新 type 各加一个 system prompt 段，强调人群语境（不灌鸡汤、不年龄歧视、不性别刻板印象）
- **管理员入口**：`/admin/handbook/:type/:recordId` 路由 type 增加 `women` 和 `midlife`，AdminLayout/Drawer 的"导出手册"按钮按测评类型分发

---

## 五、验收清单

- [ ] 两个结果页底部出现"领取完整 7 天伴随手册"卡片，点开为 Sheet，含 6 位领取码 + 企微二维码海报，可下载/截图
- [ ] 数据库两张表已落 `claim_code`（新建记录自动生成、历史记录首次访问补写）
- [ ] Admin 在两类测评的用户答卷抽屉里，能点"导出 7 天伴随手册"，跳到导出页并成功生成 PDF（11 页结构与男/女版一致，文案用本方案的 7 天脚本）
- [ ] 手册内容明显贴合各自人群，没有男/女版话术串台
- [ ] 不影响已上线的情绪健康、男人有劲两条链路

如方案 OK，我会按上述顺序落地：先 DB 迁移 → 手册内容配置 → 前端领取闭环 → AdminHandbookExport 扩展 → edge function prompt 扩展 → 联调验收。
