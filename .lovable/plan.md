# 男人身体警报扫描 V6.1 · 钩子与二维码最终化

## 1. 加微二维码复用

复用「男人有劲状态评估」模板里的 `qr_image_url` 字段（同一个企微顾问号），无需新二维码。

执行：通过 migration 把 `male_vitality_status` 模板的 `qr_image_url` 值，写入 `male_unspoken_check` 模板的 `qr_image_url` 字段。前端 `DynamicAssessmentResult` 已经读 `template.qr_image_url`，组件自动生效，0 改前端。

## 2. 钩子文案重写（去掉不可兑现的稀缺/承诺）

旧文案问题：
- 「本周限 20 个陪聊名额」→ 暗示有人值班排队，兑现不了
- 「今天内回拨电话」→ SLA 承诺，做不到就是翻车
- 「优先安排回复」→ 已经被「有劲」用过，重复

替换原则：**只承诺"发出去"，不承诺"多快回 / 限量 / 人工服务"**。把"稀缺感"换成"对号入座感"——你是这一档，就回这个词，我发你这一档的东西。

| 档位 | 旧 | 新（推荐） |
|---|---|---|
| 🟢 0-7 绿 | 回复『保持』领 7 天清单 | **回复『绿』· 发你同龄绿档男人的 3 个日常习惯** |
| 🟡 8-14 黄 | 回复你最在意的一条 | **回复『黄』· 发你这 3 个信号背后到底在说什么** |
| 🟠 15-22 橙 | 回复『橙色』领 15 分钟陪聊（限 20） | **回复『橙』· 发你同档位男人 3 个月后的真实走向** |
| 🔴 23-30 红 | 回复『红色』今天内回拨 | **回复『红』· 发你现在最该先停的 1 件事**（不是去医院那种废话） |

特点：
1. 全部"我发你 XX"——交付物是已存在的文字/图，不依赖人工排班
2. 颜色当暗号，降低开口成本（中年男人不愿打字描述症状）
3. 红档去掉电话承诺，改成"先停 1 件事"——比"叫救护车"更像哥们说话

## 3. 改动清单

**Migration（1 条 SQL）**
- update `partner_assessment_templates` set `qr_image_url` = (select qr_image_url from male_vitality_status) where key = 'male_unspoken_check'
- 同步 update `result_tiers` JSON 里 4 档的 `tips` 文案为上表新版

**前端：0 改动**
（`AssessmentPromoShareCard` / `DynamicAssessmentIntro` / `DynamicAssessmentResult` 都已读模板字段）

## 4. 确认点

请确认：
- (a) 4 档新钩子文案是否照用？或哪一档想再调？
- (b) 红档"先停 1 件事"的具体内容由我配文（基于该档信号），还是您来写？
