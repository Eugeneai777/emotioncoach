

# 增加「点数流水」审计日志（一期）

## 约束确认

本次改动**不影响**现有业务扣费逻辑、不修改 `deduct_user_quota` RPC、不改变任何支付回调的流程。所有改动都是**追加写入**性质（新建表 + 在扣费成功后插入日志行）。前端仅改动 `VoiceUsageSection.tsx` 一个组件，不影响其他页面。

## 改动范围

### 1. 数据库：新建 `quota_transactions` 表

```sql
CREATE TABLE public.quota_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,        -- 'grant' | 'deduct' | 'refund' | 'admin_recharge'
  amount integer NOT NULL,   -- 正=增加, 负=扣减
  balance_after integer,     -- 变动后余额
  source text,               -- 'voice_chat' | 'text_chat' | 'purchase_basic' | 'admin' 等
  description text,          -- 中文描述
  reference_id text,         -- 关联 session_id / order_no
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quota_tx_user ON public.quota_transactions(user_id, created_at DESC);
ALTER TABLE public.quota_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own" ON public.quota_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
```

### 2. 后端：`deduct-quota/index.ts` 追加流水写入

在扣费成功（步骤 5 之后，约第 411 行）插入一条 `quota_transactions` 记录。**不改变**任何扣费判断逻辑，仅在现有 `usage_records.insert` 之后追加一行 INSERT：

```typescript
// 在 "Record usage" 之后追加
await supabase.from('quota_transactions').insert({
  user_id: userId,
  type: usedFreeQuota ? 'free_quota' : (actualCost > 0 ? 'deduct' : 'free_quota'),
  amount: actualCost > 0 ? -actualCost : 0,
  balance_after: account?.remaining_quota || 0,
  source: source || featureKey,
  description: `${featureName}扣费 -${actualCost}点`,
  reference_id: session_id || conversationId || null,
});
```

训练营免费权益路径同样追加一条 `amount=0` 的记录。

### 3. 前端：升级 `VoiceUsageSection.tsx` → 「点数明细」

- 数据源从 `voice_chat_sessions` 切换为 `quota_transactions`
- 汇总条保持不变（剩余点数 + 本月消耗 + 本月通话次数）
- 记录列表改为显示点数流水，增减用绿/红色区分
- 布局使用 `flex-wrap` 确保手机端自动换行，电脑端保持一行

### 不涉及的改动（二期）

以下函数的流水写入列为二期，本次**不修改**：
- `admin-recharge`（管理员充值）
- `check-order-status` / `wechat-pay-callback`（购买充值）
- `refund-failed-voice-call`（退款）
- 历史数据回填

因此一期上线后，点数明细中只会显示"扣费"类记录。购买充值等"获得"记录需二期补全。

## 文件清单

| 文件 | 操作 | 影响面 |
|------|------|--------|
| 数据库迁移 | 新建 `quota_transactions` 表 + RLS | 无影响，纯新建 |
| `supabase/functions/deduct-quota/index.ts` | 追加 INSERT（约 5 行） | 不改变扣费逻辑 |
| `src/components/VoiceUsageSection.tsx` | 重构数据源和展示 | 仅影响 /my-page 该区块 |

