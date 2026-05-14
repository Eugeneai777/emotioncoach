
# AI 语音教练对话优化方案

下面针对你提出的 5 个问题，先做**根因定位**，再给出**可选方案 + 风险**，由你决定执行哪些。所有改动都集中在 `CoachVoiceChat.tsx`、`vibrant-life-realtime-token/index.ts`、`RealtimeAudio.ts`、`ConnectionProgress.tsx`，不会动业务表结构。

---

## 1. 杂音误识别 / 韩文英文乱码 — 已修，建议再加一道防线

**根因**：OpenAI Realtime 用 `whisper-1` + `language: "zh"` 做转写，但 VAD 阈值 0.6 偏低，环境噪音/喘息也会被切成"语音段"送给 Whisper，Whisper 在无效语音上经常乱猜成韩/日/英文。

**方案 A（推荐，改动小）**：
- VAD `threshold` 从 `0.6` → `0.75`，`silence_duration_ms` 从 `1800` → `1200`（更难触发，但对话节奏不变慢）。
- Whisper 的 `prompt` 加一句"用户使用简体中文，无中文内容时请输出空字符串"，并在前端转写回调里做后过滤：非中文字符占比 > 60% 且无中文 → 丢弃该条 transcript（不显示、不送 AI）。
- 已修部分保留。

**方案 B（更彻底）**：转写模型从 `whisper-1` 换成 `gpt-4o-mini-transcribe`，对环境噪音更稳，多语种误识别率显著下降，价格相近。

**风险**：阈值调高在低麦音量场景可能漏识别一两句 → 配一个"麦克风提示音量过低"toast。

---

## 2. 偶发断开后弹"连接成功"页面

**根因**：`CoachVoiceChat` 用一个 `connectionPhase` 状态机驱动 `<ConnectionProgress />`，"重连"会再次跑 `setConnectionPhase('preparing' → 'connected')`，所以即使是后台静默重连，UI 也会全屏弹"连接成功"。

**方案**：
- 给 `<ConnectionProgress />` 增加 `mode: 'initial' | 'silent-reconnect'`。
- 在已经有过一次 `connected` 后，再次进入 `connecting` 时只显示顶部一个细条（"网络波动，正在恢复…"）+ 顶部 toast，不再整页覆盖。
- 加一个 `hasEverConnectedRef`，进入重连只切顶部 badge 不切 phase。

**风险**：低，纯 UI 层。

---

## 3. 偶尔断开后又重连 — 期望对话不中断

**根因**：当前 `disconnect` 一旦触发（WebRTC ICE 断连/Realtime WS 关闭），`chatRef.current?.disconnect()` 直接清掉 session，再次连接相当于**新开 session**，AI 上下文丢失，所以"中断感"明显。当前只保存了 `sessionId + lastBilledMinute` 用于退款，并没真正用于恢复对话历史。

**方案 A（推荐，工程量中等）**：
- 在 `RealtimeAudio.ts` 增加：a) `enableAutoReconnect` 选项；b) WS/PeerConnection `oniceconnectionstatechange === 'disconnected'` 时启动指数退避重连（1s/2s/4s，最多 3 次，10s 内成功不通知用户）；c) 重连成功后用本地缓存的 `conversation.item.create` 把最近 N 条对话用 `previous_item_id` 推回 OpenAI session（Realtime 支持手动注入历史）。
- 前端把每条 user/assistant transcript 入内存数组 → 重连时回灌。
- 与方案 2 联动：自动重连过程不打断 UI、不重置计时。

**方案 B（保底，简单）**：仅做 a + b，重连后给 OpenAI 注入一条 system "继续刚才的对话主题：…"摘要，避免硬中断观感。

**风险**：注入历史会消耗一些 token；网络持续不通仍需明确告知用户中断。

---

## 4. 对话不够"四部曲"，趋于给建议或浮于表面

**根因**：`vibrant-life-realtime-token` 默认快路径用的是极简 instructions（"你是劲老师，温暖的AI生活教练"），只有 `scenario` 模式才走完整四部曲提示。通用模式下没有四部曲约束，模型自然倾向直接给建议。

**方案**：
- 在 `buildResponseGuidelines()` 增加一段强约束的"四部曲对话规则"：
  1. 觉察：先回应感受，禁止 30 秒内给建议；
  2. 理解：用 1-2 个开放式问题挖动机/需求；
  3. 反应：复述并核对，再给方向（不超过 2 条）；
  4. 转化：邀请用户自己说出最小一步。
- 配一组 `few-shot` 反例（"❌ 直接列 3 条建议"）和正例。
- 通用模式不再走"极简 instructions 快路径"，统一注入完整 system prompt + 四部曲约束（启动延迟约 +200ms，可接受）。
- 增加一个 `track_dialog_stage` tool，AI 自评当前阶段，便于后期回看与监控偏离率。

**风险**：用户问"几点开门""怎么做"这种事实问题时，规则可能让 AI 显得啰嗦 → 在 prompt 里做例外处理（信息查询直答）。

---

## 5. 无记忆功能 — 提前读历史再对话

**现状**：实际上**已读了** `user_coach_memory`（最多 5 条按 importance_score）+ 最近一次 `vibrant_life_sage_briefings` 简报，但只用于通用劲老师，且只在非 fast-path 下注入。其他教练（情绪、亲子、财富、青少年）大多没用，且很多场景"opening"是写死开场白，没读用户名/上次主题。

**方案**：
- 抽出 `loadUserMemoryContext(userId, coachType)` 公共函数，在所有 `*-realtime-token` 边缘函数里统一调用（情绪、亲子、财富、青少年、生活教练）。
- 注入内容标准化：① 昵称；② 最近 1 次 briefing 摘要（用户问题 + 关键洞察）；③ 跨教练关键 memories（top 5，按 importance）；④ 最近 3 次本教练对话主题（新增 `voice_chat_sessions.topic` 摘要字段，对话结束时让 AI summarize 一句存表）。
- 通话开场由 AI 自己按上下文生成 1 句个性化问候（"上次你说在准备述职，今天怎么样了？"），替换现在的写死 opening。
- 增加 `forget_memory` / `update_memory` tool 供用户主动管理。

**安全**：所有 memory 已有 RLS（按 user_id），新加字段沿用同策略；不向 AI 注入敏感字段（电话/身份证）。

**风险**：每次启动多 1 次 DB 聚合查询（~50ms）；prompt 变长 → token 成本小幅上升（约 +300 tokens/次）。

---

## 推进建议（请你勾选）

| 序号 | 问题 | 推荐方案 | 工作量 | 风险 |
|---|---|---|---|---|
| ① | 杂音/多语种 | 方案 A | 0.5 天 | 低 |
| ② | 重连弹"连接成功" | 上述 UI 改造 | 0.5 天 | 低 |
| ③ | 重连不中断对话 | 方案 A（含历史回灌） | 1.5 天 | 中 |
| ④ | 四部曲约束 | 强 prompt + tool 监控 | 0.5 天 | 低-中 |
| ⑤ | 全教练记忆贯通 | 抽公共函数 + 主题摘要表 | 1.5 天 | 低 |

**总计 ~4.5 天**。可拆批次：
- **第一批（最快见效）**：①+②+④，约 1.5 天
- **第二批（体验跃迁）**：③+⑤，约 3 天

请告诉我：要全部推进，还是先做第一批？或对哪个方案需要再细化／换思路？
