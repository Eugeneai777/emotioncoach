
-- =============================================
-- Backfill quota_transactions from historical data
-- =============================================

-- Source A: usage_records → quota_transactions
INSERT INTO public.quota_transactions (user_id, type, amount, balance_after, source, description, reference_id, created_at)
SELECT
  ur.user_id,
  CASE ur.record_type
    WHEN 'conversation' THEN CASE WHEN ur.amount = 0 THEN 'free_quota' ELSE 'deduct' END
    WHEN 'camp_entitlement' THEN 'free_quota'
    WHEN 'refund' THEN 'refund'
    WHEN 'compensation' THEN 'refund'
    ELSE 'deduct'
  END AS type,
  CASE ur.record_type
    WHEN 'conversation' THEN -GREATEST(ur.amount, 0)  -- positive cost → negative amount
    WHEN 'camp_entitlement' THEN 0
    WHEN 'refund' THEN ABS(ur.amount)                  -- refund amount stored as negative → make positive
    WHEN 'compensation' THEN ABS(ur.amount)            -- compensation stored as negative → make positive
    ELSE -GREATEST(ur.amount, 0)
  END AS amount,
  NULL AS balance_after,  -- historical snapshot not available
  ur.source,
  CASE ur.record_type
    WHEN 'camp_entitlement' THEN '训练营免费额度'
    WHEN 'refund' THEN '语音通话退款 +' || ABS(ur.amount) || '点'
    WHEN 'compensation' THEN '系统补偿 +' || ABS(ur.amount) || '点'
    ELSE COALESCE(ur.source, '消费') || ' -' || ur.amount || '点'
  END AS description,
  ur.conversation_id::text AS reference_id,
  ur.created_at
FROM public.usage_records ur
WHERE NOT EXISTS (
  SELECT 1 FROM public.quota_transactions qt
  WHERE qt.reference_id = ur.conversation_id::text
    AND qt.user_id = ur.user_id
    AND qt.created_at = ur.created_at
);

-- Source B: orders (basic package purchase → +150 points)
INSERT INTO public.quota_transactions (user_id, type, amount, balance_after, source, description, reference_id, created_at)
SELECT
  o.user_id,
  'grant',
  150,
  NULL,
  'purchase_basic',
  '购买尝鲜会员 +150点',
  o.order_no,
  COALESCE(o.paid_at, o.created_at)
FROM public.orders o
WHERE o.status = 'paid'
  AND o.package_key = 'basic'
  AND NOT EXISTS (
    SELECT 1 FROM public.quota_transactions qt
    WHERE qt.source = 'purchase_basic'
      AND qt.user_id = o.user_id
      AND qt.reference_id = o.order_no
  );

-- Source C: registration bonus (+50 points per user)
INSERT INTO public.quota_transactions (user_id, type, amount, balance_after, source, description, reference_id, created_at)
SELECT
  ua.user_id,
  'grant',
  50,
  NULL,
  'registration',
  '注册赠送 +50点',
  NULL,
  ua.created_at
FROM public.user_accounts ua
WHERE NOT EXISTS (
  SELECT 1 FROM public.quota_transactions qt
  WHERE qt.source = 'registration'
    AND qt.user_id = ua.user_id
);
