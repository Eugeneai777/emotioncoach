

## 收尾工作范围澄清 + P2 影响评估

---

## 一、上一轮"收尾 4 步"实际是什么

上一轮我说的 4 步收尾，**不是 P2/P3**，而是上一轮 P0+P1 中**还没真正接通的最后一公里**：

| 步骤 | 归属 | 状态 |
|---|---|---|
| 1. `submit_ticket_recall` 工具逻辑落地 | P0 #2 AI 主动播报（已写定义未写实现） | 未完成 |
| 2. `support_conversations` upsert + 写 title | P1 #5 历史抽屉（已建组件未写存储） | 未完成 |
| 3. `<HistoryDrawer />` 接入 PageHeader + 恢复会话 | P1 #5 历史抽屉前端接入 | 未完成 |
| 4. 部署 `customer-support` 边缘函数 | 上述后端改动生效 | 未完成 |

**结论**：这 4 步是 P0+P1 的闭环，必须做，不做则 AI 主动播报和历史抽屉都是死代码。

---

## 二、P2 / P3 当前定位

- **P3（图片附件 / SLA / 评分 / 看板）**：✅ 按你要求本轮不执行
- **P2 第 6 项 支付成功气泡回执**：需要影响评估（见下）
- **P2 第 7 项 意图打点**：纯后端写字段，零影响，可顺手做
- **P2 第 8 项 用户端工单内回复输入框**：`MyTicketDetail.tsx` 已经实现了输入框 + `customer_ticket_messages` 写入 + 触发 `unread_admin_count`，**实际已完成**，无需再做

---

## 三、P2 第 6 项「支付成功气泡回执」影响评估

### 改动设想
在客服页 `CustomerSupport.tsx` 监听 `sessionStorage` 中的 `pending_order_id`，支付完成回跳后自动追加一条 AI 气泡：「✅ 已开通 XX 套餐，[点这里进入]」。

### 对其他模块的影响分析

| 受影响模块 | 影响点 | 风险 | 结论 |
|---|---|---|---|
| `UnifiedPayDialog` 支付主流程 | 不修改任何支付代码 | 无 | ✅ 安全 |
| `check-order-status` 边缘函数 | 不修改 | 无 | ✅ 安全 |
| 微信小程序 H5 支付自愈（`miniprogram-h5-resumption-standard-zh`）| 它本身已用 `sessionStorage` 做支付恢复，新增读取 `pending_order_id` 是只读，**不会**抢占或破坏现有 key | 需用独立 key（如 `support_payment_celebration`），不复用支付主流程 key | ⚠️ 必须用独立 key |
| 微信支付重定向自愈（`payment-resumption-pattern-zh`）| 同上，用独立 key 隔离 | 无 | ✅ 安全 |
| 通用合伙人归因（`GlobalRefTracker`）| 完全无关 | 无 | ✅ 安全 |
| 训练营自愈逻辑（`camp-self-healing`）| 完全无关，气泡只读不写 | 无 | ✅ 安全 |
| 「我的订单」/「订单管理」UI | 完全无关 | 无 | ✅ 安全 |
| 微信公众号/小程序模板消息 | 不触发 | 无 | ✅ 安全 |

### 设计原则（避免污染）
1. **只读，不写**：客服气泡只查询 `orders` 表已存在的成功订单，不做任何状态变更
2. **独立 sessionStorage key**：`support_payment_celebration`，与 `MP_PENDING_ORDER_STORAGE_KEY` 完全隔离
3. **一次性**：展示后立即清除 key，避免重复触发
4. **降级安静**：查不到订单不报错，静默不展示气泡
5. **入口跳转复用**：直接跳已存在的训练营/套餐入口，不新建路由

### 结论
✅ **可以做，对其他支付/跳转逻辑零影响**，关键是 sessionStorage key 严格隔离。

---

## 四、本轮收尾建议执行清单

### 必做（P0+P1 闭环）
1. 实现 `submit_ticket_recall` 工具：边缘函数中根据 ticket_id 查 `customer_tickets`，把工单卡片塞回 `recommendations`
2. `support_conversations` 改 `upsert`，写入 `title`（首条用户消息前 24 字）和 `last_message_at`
3. `CustomerSupport.tsx` PageHeader 右侧加「历史」按钮 → 接入 `<HistoryDrawer />`，点击会话恢复 messages
4. 部署 `customer-support` 边缘函数

### 顺手做（P2 零风险项）
5. **意图打点**：`support_conversations` 加 `last_intent text` 字段（迁移），边缘函数每轮写入触发的工具名

### 评估通过后可做（P2 商业转化）
6. **支付成功气泡回执**：`CustomerSupport.tsx` 监听独立 key `support_payment_celebration`，查 `orders` 成功订单 → 追加 AI 气泡 + 入口卡片

### 跳过
- P2 第 8 项（已完成）
- P3 全部（按你要求）

---

## 五、改动文件清单

**数据库迁移**
- `support_conversations` 新增 `last_intent text`

**边缘函数**
- `supabase/functions/customer-support/index.ts`：
  - `submit_ticket_recall` 实现
  - `support_conversations` upsert + title + last_intent 写入

**前端**
- `src/pages/CustomerSupport.tsx`：
  - PageHeader 右侧接入 `<HistoryDrawer />` 按钮
  - 会话恢复逻辑（点历史 → 灌回 messages）
  - 监听 `support_payment_celebration` sessionStorage key → 追加气泡
- `src/components/UnifiedPayDialog.tsx`（或对应支付成功回调）：支付成功时**新增**写入 `support_payment_celebration` key（不动现有 key）

---

## 六、验收标准

| 场景 | 期望 | 涉及模块隔离 |
|---|---|---|
| 用户进客服 | AI 检测未读工单首句直接播报 + 卡片 | 不影响支付 |
| 顶部「历史」按钮 | 抽屉显示近 7 天最多 10 条会话 | 不影响支付 |
| 点击历史会话 | 恢复 messages 继续聊 | 不影响支付 |
| 支付成功跳回客服 | 气泡显示「✅ 已开通 XX」 + 入口 | sessionStorage key 完全隔离支付主流程 |
| 微信小程序 H5 支付 | 原有自愈逻辑不变 | 用独立 key 验证无干扰 |
| 测试用例 | 不支付时进客服无任何"已开通"误报 | 静默降级 |

---

## 七、不在本轮做
- P3 全部项（图片附件 / SLA / 评分 / 看板 / 搜索）
- 客服 UI 视觉重做
- 工单分类体系

---

## 八、落地顺序
1. DB 迁移（`last_intent` 字段）
2. 边缘函数 3 处改动 + 部署
3. 前端历史抽屉接入 + 会话恢复
4. 支付成功气泡（独立 key 严格隔离）
5. 端到端验证：支付一笔 → 跳客服 → 看到气泡 → 不污染下一次支付

