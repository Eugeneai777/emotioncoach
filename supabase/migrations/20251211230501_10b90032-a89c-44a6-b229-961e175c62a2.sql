-- 为 cost_alerts 表添加 metadata 字段以存储扣费异常详情
ALTER TABLE cost_alerts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- 添加扣费异常监控的告警设置
INSERT INTO cost_alert_settings (alert_type, threshold_cny, is_active, notify_wecom) VALUES
  ('billing_mismatch', 0, true, true)
ON CONFLICT DO NOTHING;

-- 添加索引以优化异常查询
CREATE INDEX IF NOT EXISTS idx_cost_alerts_alert_type_created ON cost_alerts(alert_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_metadata ON cost_alerts USING gin(metadata) WHERE metadata IS NOT NULL;