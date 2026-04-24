

## 客服入口 · 第二轮深度优化方案

上一轮修复了「感恩教练 404」与「首轮先寒暄」两个止损项。但从商业架构师视角看，当前 `/customer-support` 在**用户体验、跨端流畅度、稳定性**上仍有 8 类未优化的遗留问题。本轮聚焦「真正交付到手机/电脑/小程序里都不卡、不崩、能闭环」。

---

## 一、已修复（不再处理）
- 感恩教练路由 404
- 首轮欢迎语污染上下文
- AI 先寒暄不答题
- 快速选项贴近真实问法

## 二、本轮要解决的 8 类遗留问题

### 1. 路由真相源仍有遗漏 ⚠️
- `PAGE_ROUTES.gratitude`（感恩日记）写死 `/gratitude-journal`，但全站感恩入口已统一到 `/coach/gratitude_coach`，需核对实际路由是否存在
- `parent_coach` → `/parent-coach`、`communication_coach` → `/communication-coach`、`story_coach` → `/story-coach`：这些独立路由是否仍有效，需逐一核验，避免下一次又出现 404
- AI 工具 enum 里有 13 个 page_type，但前端 `PAGE_ROUTES` 与之是否完全对齐，需建立**单一映射表**，避免 enum 与前端再次走偏

### 2. 工单创建后没有"确认反馈" ⚠️
现在 `submit_ticket` 工单号只在 AI 文本里口播，用户无法点击查看进度、无法复制工单号、无法进入「我的工单」。商业上等于"提了等于没提"。

### 3. 移动端体验断点 📱
- 输入框用 `Textarea`，移动端键盘弹起时**会顶到屏幕外**（没有 `keyboardWillShow` 兼容）
- 快速选项区在小屏幕（375px 以下，如 iPhone SE）一行只能放 2 个，9 个选项会撑成 5 行，把聊天区压得只剩 2 个气泡可见
- `h-[calc(100dvh-60px)]` 在 iOS Safari 老版本不支持 `dvh`，会出现底部输入条被地址栏盖住
- `WebkitOverflowScrolling: 'touch'` 用在外层容器，但内部 `ScrollArea` 是 Radix 实现，会导致**双层滚动冲突**，iOS 上经常出现"滑不动"

### 4. 微信小程序 WebView 稳定性 🟢
- `/customer-support` 没有针对微信小程序环境做适配：
  - 推荐卡片里 `navigate(pageInfo.route)` 在 MP 内调用 `react-router` 跳转 `/coach/xxx`，部分场景会触发 WebView 白屏
  - 企微二维码 `QiWeiQRCard` 在小程序内**无法长按识别**（小程序 WebView 不支持 `wx.previewImage`），需要降级为"复制企微号"或"显示官方二维码图"
  - `[QIWEI_QR]` 标记是字符串匹配，AI 偶尔会写成 `【QIWEI_QR】`/`(QIWEI_QR)` 等变体，导致二维码不显示

### 5. 性能与流畅度 ⚡
- 后端每次请求都跑 5 张表全量 `SELECT *`（`packages / coach_templates / camp_templates / video_courses / support_knowledge_base`），每条消息都重查，**单轮延迟 1.5-3s**
- `support_conversations` 历史保存用 `select * .single()` + `update`，每次都是 1 次读 + 1 次写，应改为 `upsert`
- 消息每次都把全部历史拼进 prompt，10 轮后 token 翻倍，回复会越来越慢；缺**滑窗截断**（保留最近 10 轮 + 首条用户消息）
- 前端没有**乐观渲染 + 流式回复**，用户发完消息要等 2-3s 整段才出现，体感"卡死"

### 6. 错误处理与降级 🛡️
- AI 后端报错只返回兜底文案，**不显示工单号、不提供重试按钮、不引导企微**
- 前端 `error` 时只 push 一条文本，没有「重新发送」按钮
- 网络断开（移动端/小程序常见）时没有提示，用户以为自己消息发出去了

### 7. 商业转化未闭环 💰
- 推荐套餐卡片 `SupportPackageCard` 点击后是否能直接进支付？需要核对，目前看仅显示信息
- 推荐训练营卡片是否能进 `StartCampDialog`？同上
- 客服里没有**「我的会话历史」入口**，用户每次进来都是 new session，付费意愿被中断

### 8. 双客服组件并存的污染源 🔁
`src/components/TextCustomerSupport.tsx` 是另一个独立的客服弹窗组件，目前我搜了一圈，**主路径已不引用它**，但代码还在，且首条欢迎语写法和后端契约都已陈旧。留着会让下一次有人再"复制粘贴它"，导致退化。

---

## 三、本轮实施方案（按优先级 P0→P2）

### P0 · 立即修（兼容多端 + 止损）

#### A. 路由一致性硬约束
- 在 `src/config/customerSupportRoutes.ts` 中新建 **唯一真相表**，导出 `PAGE_ROUTES` 和 `pageTypeEnum`
- `CustomerSupport.tsx` 只 import 这张表
- `supabase/functions/customer-support/index.ts` 的 `navigate_to_page.enum` 通过注释强制对齐这张表
- 跑一次 `gratitude / parent_coach / communication_coach / story_coach / community / packages` 路由健康检查，凡是不存在的统一指向 `/coach/<key>` 或 `/camps`

#### B. 移动端 / 小程序 / iOS Safari 三端兼容
- 高度计算改为 `min-h-[100svh]` + `max-h-[100dvh]` 双兜底，老 iOS 用 `100vh - env(safe-area-inset-bottom)`
- 输入区加 `pb-[env(safe-area-inset-bottom)]`，键盘弹起时容器加 `scroll-padding-bottom`
- 快速选项改为**横向滚动条**（`overflow-x-auto snap-x`），固定一行；不再多行撑高
- 移除外层 `WebkitOverflowScrolling: 'touch'`，让 `ScrollArea` 独占滚动
- 检测 `isWeChatMiniProgram()`：
  - 二维码卡片改为「展示二维码图 + 提示用户截屏 + 复制企微号」
  - 跳转前对 `/coach/*` / `/camps` 等做 try-catch，失败回退到 `window.location.href`

#### C. AI 标记容错
- 把 `[QIWEI_QR]` 检测改为正则 `/[【\[(（]\s*QIWEI[_-]?QR\s*[\])）】]/i`
- 同时在 `systemPrompt` 加一句"必须严格使用 `[QIWEI_QR]` 这 11 个字符"

#### D. 删掉 `TextCustomerSupport.tsx`（确认无引用后），消除污染源

---

### P1 · 体验与转化闭环（一周内）

#### E. 工单可视化
- `submit_ticket` 后，前端**自动渲染一张「工单已创建」卡片**，包含：
  - 工单号（可一键复制）
  - 「查看进度」按钮 → 跳 `/my-tickets`（如果不存在则建一个最小列表页）
  - 「联系企微」按钮 → 直接展开 QR 卡片
- 后端在 `recommendations` 里新增 `ticket: { ticket_no, subject }`

#### F. 流式回复 + 乐观渲染
- 改用 `fetch` + ReadableStream（Lovable AI Gateway 支持 SSE），首字 < 500ms
- 前端先在用户消息下方占位 "正在思考…"，AI 一边吐 token 一边渲染
- 这是最直接拉升「电脑/手机流畅度」感知的一步

#### G. 上下文截断 + 套餐缓存
- 边缘函数新增 `recentMessages = messages.slice(-10)`
- 套餐/教练/训练营查询结果用 `Deno KV` 或 in-memory cache，TTL 60s（同一进程内复用，不每次走 DB）
- `support_conversations` 用 `upsert` 一条 SQL 搞定

#### H. 网络异常降级
- 检测 `navigator.onLine === false` → 顶部黄条提示「网络断开，请检查」
- AI 报错时插入「🔄 重试此消息」按钮，点击重发上一条 user message
- 5xx 错误自动展示 `QiWeiQRCard`

---

### P2 · 商业化与回访（两周内）

#### I. 套餐/训练营卡片直达支付
- `SupportPackageCard` 点击 → `UnifiedPayDialog`
- `SupportCampCard` 点击 → `StartCampDialog`
- 转化路径从「客服 → 套餐页 → 详情 → 支付」缩短为「客服 → 直接支付」

#### J. 会话历史入口
- 顶部 PageHeader 右侧加「历史对话」按钮，从 `support_conversations` 拉用户最近 5 条会话
- 未登录用户用 `localStorage` 存 `sessionId`，登录后自动绑定 `user_id`

#### K. 意图统计看板（仅后端打点，不做 UI）
- 在 `support_conversations` 上加触发器或扩字段 `last_intent`，记录每轮触发的工具名
- 后续可用于热门问题排行榜，反向优化 quick options

---

## 四、改动清单

**前端**
- 新增 `src/config/customerSupportRoutes.ts`（路由真相表）
- 新增 `src/components/customer-support/SupportTicketCard.tsx`（工单卡片）
- 新增 `src/components/customer-support/SupportRetryButton.tsx`
- 改 `src/pages/CustomerSupport.tsx`：
  - 引入真相表
  - 高度 / safe-area / 横向滚动选项 / 流式回复 / 重试 / 网络降级
  - 小程序环境检测与跳转兜底
  - QIWEI_QR 正则匹配
- 改 `src/components/customer-support/QiWeiQRCard.tsx`：小程序内降级提示
- 改 `SupportPackageCard` / `SupportCampCard`：点击直达支付/激活
- 删 `src/components/TextCustomerSupport.tsx`（确认无引用）

**后端**
- 改 `supabase/functions/customer-support/index.ts`：
  - SSE 流式输出
  - 知识库 60s in-memory 缓存
  - `recentMessages` 滑窗
  - `support_conversations` 改 `upsert`
  - `recommendations.ticket` 新增字段
  - `systemPrompt` 加 QIWEI_QR 严格化、加「触发哪些工具→只能触发哪些 enum」对齐

**新增页面（最小化）**
- `/my-tickets`：用户工单列表（如已存在跳过）

---

## 五、不在本轮做
- 多 Agent 架构 / RAG 升级
- 客服 UI 视觉重做
- 教练页面本身的业务逻辑
- 未确认存在的路由不主动新建页面

---

## 六、验收标准

| 场景 | 期望 |
|---|---|
| iPhone SE（375px） | 快速选项一行横滑、聊天区不被压扁、键盘不遮挡 |
| 微信小程序 WebView | 跳转教练页不白屏；二维码可截屏保存；网络抖动有提示 |
| 桌面 Chrome | AI 回复 500ms 内开始流式输出；连发 10 条不卡顿 |
| 弱网/断网 | 顶部红条提示，发送失败可重试 |
| 工单流程 | 创建后立刻看到工单号 + 复制 + 查看进度 + 转企微 |
| 套餐推荐 | 卡片点击直接进支付，不再二跳 |
| 路由 | 任意推荐入口都不再 404 |

---

## 推荐落地顺序
1. **P0 一次性合并**（路由真相表 + 三端兼容 + 标记容错 + 删旧组件）
2. **P1 流式 + 工单卡 + 缓存**（用户感知最强）
3. **P2 卡片直达支付 + 会话历史**（直接拉转化）

