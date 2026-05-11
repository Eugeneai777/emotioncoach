# 更新「有劲AI生活教练」智能语音知识库 & 优化

## 背景

`supabase/functions/vibrant-life-realtime-token/index.ts` 是 **劲老师** AI 生活语音教练的唯一系统提示词来源。当前知识库（lines 370-620）尚停留在较早期的产品形态，遗漏了近几次大更新（7天压力营、统一测评矩阵、7天陪伴手册、Havruta团辅、Bloom合伙人、动态合伙人等级、知乐协同套餐、客服工单等）。

本次只更新该 Edge Function 的"知识层 + 导航工具 + 引导规则"，不改动语音协议、记忆系统或前端。

---

## 改动范围（单文件）

`supabase/functions/vibrant-life-realtime-token/index.ts`

### 1. `buildCoreKnowledge()`（L1 核心层）
- 校准 6 大人群专区入口与典型测评映射
- 新增「日常工具 / 专业测评 / 训练营 / 健康商城」最新条目
- 更新会员定价口径（保留尝鲜¥9.9 / 365会员¥365；标注"统一测评 ¥9.9"基线）
- 加入"有劲生活AI助手 + 语音/文字 + 智能场景"

### 2. `buildAwakeningKnowledge()`（觉察入口 6 维度）
- 文案微调，去除过时句式
- 标注每个维度对应的真实路由词，便于 `navigate_to` 工具命中

### 3. `buildToolsKnowledge()`（情绪🆘 / 感恩日记 / 安全守护）
- 增补"7天陪伴手册（claim_code 兑换）"获取入口说明
- 补充"AI 测评后会自动生成可领取的 PDF 陪伴手册"

### 4. `buildCampKnowledge()`（训练营）
- **新增** 7天情绪压力营（emotion_stress_7，¥399，戴汐教练，Havruta团辅交付）
- 财富觉醒营保留，绽放营拆分为「身份/情感」两大方向
- 标注"Day7 接入 Havruta 团辅，1v1 已被团辅替代"

### 5. `buildCoachesKnowledge()`（教练矩阵）
- 由"7位"调整为按真实矩阵列举：情绪/生活/亲子双轨/财富/沟通/故事/感恩/客服AI
- 明确「AI 生活教练（劲老师，即我自己）」边界

### 6. `buildMembershipKnowledge()`（会员 & 合伙人）
- 合伙人改为 **动态 L1/L2/L3 等级体系**（数据驱动，不再写死价格/比例）
- Bloom 合伙人单列：高客单+免费体验权益（不再列具体金额）
- 提示 AI："具体价格以页面为准"，避免过期信息误导

### 7. `buildResponseGuidelines()`（回答指南）
- 新增"价格类问题 → 引导用户去对应页面查看，不报死价格"
- 新增"用户问陪伴手册/测评结果 → 引导到对应测评结果页或 /assessments"
- 新增"用户求助情绪压力 → 可提及 7天情绪压力营 或 情绪🆘按钮"

### 8. `commonTools.navigate_to`（导航枚举）
扩充 `destination` 枚举至完整路由表：
```
emotion_button, emotion_coach, parent_coach, communication_coach,
story_coach, gratitude_coach, training_camp, stress_camp_7,
community, packages, meditation, history, profile, mini_app,
health_store, youjin_chat, assessments, daily_tools,
women_zone, midlife_zone, elder_zone, teen_zone, workplace_zone,
customer_support, voice_coach, partner_program
```
（前端 `navigate_to` 处理函数若不存在对应映射，已有兜底逻辑，不会破坏现有调用）

### 9. （可选，低风险）`buildSmartOpening()` 微调
- 老用户开场加入 1 个"是否要继续上次的 7 天手册/训练营"分支，仅当 lastBriefing 提到相关关键词时触发。

---

## 不改动

- OpenAI Realtime 协议、`gpt-4o-mini-realtime-preview` 模型、voice 映射
- `SCENARIO_CONFIGS` 8 个场景的 style/opening/rules（已经过用户校准）
- 工具调用执行端（前端 `navigate_to` handler）
- 记忆/简报/计费链路

---

## 验证

1. `bunx tsc --noEmit` 通过
2. `supabase--deploy_edge_functions vibrant-life-realtime-token` 自动部署
3. 进入 `/life-coach-voice` 触发会话，验证：
   - AI 知道"7天情绪压力营 ¥399"
   - AI 提到价格时回应"具体价格以页面为准"
   - 用户说"打开测评"能命中 `assessments` 路由
   - 老人陪伴/财富卡点/情绪崩溃 等场景开场不变

---

## 风险

- 系统提示词体积会增加 ~600 tokens，对延迟和成本影响极小（< 100ms / +¥0.001 每次会话）
- 若前端 `navigate_to` 没处理新枚举，会静默忽略（已有兜底）
