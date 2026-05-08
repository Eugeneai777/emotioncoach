# 7 天伴随手册 PDF v3 · 后台精准下发版

三件事已确认，按你最新两点补充重写关键设计：

- **第 8 天去掉链接，改企微二维码 + 训练营价值卡**
- **管理员后台一键下载（每条用户记录单独下载），保证不串号、不乱码**

---

## 一、第 8 天页面调整（你的补充①）

去掉 `/promo/synergy` 与 `/promo/midlife-women-399` 链接，改为：

```
┌──────────────────────────────────┐
│  第 8 天，找你的专属顾问报名      │
├──────────────────────────────────┤
│  【训练营名称】                    │
│  · 7 天有劲训练营（男）            │
│  · 35+ 女性绽放营（女）            │
│                                    │
│  【你能拿到什么】（4 条价值点）    │
│  ① 每天 15 分钟教练带练            │
│  ② 1 个微信小群 · 同频伙伴         │
│  ③ 专属作业本 + 复盘卡             │
│  ④ 第 7 天 1v1 状态复盘            │
│                                    │
│  【为什么不是一个人调】            │
│  （30 字男/女差异化文案）          │
│                                    │
│        [企微二维码 200×200]        │
│   扫码加顾问 · 报名领取早鸟价      │
└──────────────────────────────────┘
```

二维码用 `src/assets/qiwei-assistant-qr.jpg`（已存在）。男女版价值文案不同，二维码同一张。

末页（P9）的"专属助教"二维码保留——但与 P8 区分定位：**P8 是报名入口，P9 是日常陪伴**。

---

## 二、后台下发路径（你的补充②，重点）

### 2.1 下发流程

```
管理员后台
  └─ 「测评管理」列表
       └─ 找到某条记录（按手机/姓名/时间筛选）
            └─ 点「下载 7 天手册 PDF」按钮
                 └─ 浏览器侧用该条 record 数据 + AI 生成 → 渲染 PDF → 下载
                      └─ 文件名：{测评名}_{用户名或手机后4位}_{记录ID前8位}_{日期}.pdf
                           例：男人有劲手册_张先生_a1b2c3d4_20260508.pdf
```

操作位置：

- 男版 → `src/components/admin/AssessmentRespondentDrawer.tsx`（已存在的应答详情抽屉）追加按钮
- 女版 → `src/components/admin/EmotionHealthInsightsDetail.tsx` 追加按钮

### 2.2 不串号的 5 道防线（核心承诺）


| #   | 防线             | 怎么做                                                                                                                          |
| --- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | **数据源单一**      | 每次点击只接受一个 `recordId`，组件入参强类型 `{ recordId: string }`，禁止数组/批量入口。                                                               |
| 2   | **隔离渲染容器**     | PDF 渲染节点用独立 `ref`，挂在 `position:fixed; left:-99999px` 的临时 portal，每次渲染前 `unmount` 上一次的节点（用 `key={recordId}` 强制重建）。             |
| 3   | **AI 调用绑定 ID** | Edge Function 入参带 `recordId`，返回值 `{ recordId, insights }`，前端拿到后**校验 `returned.recordId === requested.recordId**`，不匹配直接报错不渲染。 |
| 4   | **顶层水印 + 元信息** | PDF 封面右上角打印 `记录ID: a1b2c3d4 · 生成时间: 2026-05-08 14:32`；管理员肉眼可对账。                                                              |
| 5   | **顺序锁**        | 后台按钮加 `useBusyGuard`（项目已有 hook），同一管理员同一时刻只允许 1 个 PDF 在生成，避免并发交叉。                                                             |


### 2.3 不乱码的 4 道防线


| #   | 风险                   | 解决                                                                                           |
| --- | -------------------- | -------------------------------------------------------------------------------------------- |
| 1   | 中文字体在 jsPDF 默认字体下显示□ | 当前方案是 `html2canvas` 把 DOM 渲染成图片再塞 PDF——**中文走浏览器原生字体，不存在字体缺失**。（已验证）                          |
| 2   | Emoji / 特殊符号         | html2canvas 同样按浏览器渲染，正常显示；只需禁用 `<sub>/<sup>` Unicode 替代。                                     |
| 3   | AI 返回脏字符（控制符、零宽字符）   | Edge Function 出口做 `text.replace(/[\u0000-\u001F\u200B-\u200D\uFEFF]/g, '')` 过滤。              |
| 4   | 长姓名/长答案截断            | 容器 `word-break: break-word`，逐题卡片 `min-height` 自适应；导出前 `await document.fonts.ready` 确保字体加载完成。 |


### 2.4 准确度保障

- **答案 → 文案匹配**用 `result.answers[questionId]` 精确取档，不靠数组下标；
- **维度得分**直接读数据库字段（`exhaustion_score` 等），不在前端二次计算；
- **AI 个性化句**调用前在前端 console.log 完整 payload + recordId，便于事后审计；Edge Function 端写一张 `pdf_generation_logs` 表（recordId / admin_user_id / generated_at / ai_input_hash / status），出问题可追溯。

### 2.5 失败兜底

- AI 调用失败（429/402/超时 8s）→ 自动回落到静态档位文案，PDF 仍能导出，封面打"基础版"水印；
- html2canvas 渲染失败 → toast 报错并提示"请刷新后重试"，不生成半成品 PDF；
- 同一 recordId 1 小时内重复下载 → 直接用上一次 AI 结果（带缓存 key = `recordId + version`），节省成本也保证一致性。

---

## 三、章节目录回顾（仅 P8 改动，其余沿用 v2）

```
P1 封面（含 recordId 水印）
P2 状态总览
P3-P5 第二章 · 场景簇逐题镜像（男 4 簇 / 女 5 簇）
P6-P7 第三章 · 7 天伴随手册（接地气文案）
P8 第 8 天 · 训练营价值卡 + 企微二维码  ← 本次改动
P9 末页 · 日常陪伴助教二维码
```

---

## 四、技术结构

```
src/config/
├── maleVitalityCopyMatrix.ts          固定 4 档场景文案 + 7 天脚本（6 套，按最弱维度选）
└── emotionHealthCopyMatrix.ts         固定 4 档场景文案 + 7 天脚本（4 套，按主导模式选）

src/lib/
├── reportAIInsight.ts                 前端调用层 + recordId 校验 + 缓存
└── pdfTextSanitize.ts                 脏字符过滤

src/components/pdf-report/             新增目录（男女共用）
├── ReportCover.tsx
├── OverviewSection.tsx
├── QuestionMirrorSection.tsx          按场景簇渲染
├── SevenDayHandbook.tsx
├── Day8CampInviteSection.tsx          ← 新：训练营价值卡 + 二维码
└── AssistantQRSection.tsx

src/components/pdf-report/MaleVitalityHandbook.tsx     组合 P1-P9（男）
src/components/pdf-report/EmotionHealthHandbook.tsx    组合 P1-P9（女）

src/components/admin/
├── AssessmentRespondentDrawer.tsx    +「下载 7 天手册」按钮（男）
└── EmotionHealthInsightsDetail.tsx   +「下载 7 天手册」按钮（女）

supabase/functions/generate-handbook-insights/
└── index.ts                          调 Lovable AI Gateway，返回 {recordId, insights}

数据库迁移：
└── pdf_generation_logs 表（审计用）
```

继续用 `exportNodeToPdf` 工具，无新依赖。

---

## 五、需要你最后确认 1 件事

**男/女训练营 4 条价值点**（P8 用），我先草拟下面 4 条，你看是否准确，不准我改：

**男 · 7 天有劲训练营**

1. 每天 15 分钟教练带练，不耽误工作
2. 20 人小群，同频男人互相托底
3. 早晚 2 个动作 · 1 张电量记录卡
4. 第 7 天 1v1 状态复盘 + 下阶段建议

**女 · 35+ 女性绽放营**

1. 黛汐老师每天 1 节带练 · 7 天连续
2. 30 人姐妹小群，被听见、被陪着
3. 每日情绪日记本 + 关系练习卡
4. 第 7 天 1v1 复盘 · 给你下一步方向

确认/修改后我进入实施模式。