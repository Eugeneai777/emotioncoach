

## 隐私数据 RLS 安全审计报告 — 修复记录

### 修复完成情况

#### ✅ P0 Round 1（已完成）
1. `parent_teen_bindings` — "System can manage bindings" → `TO service_role`
2. `subscriptions` — "系统可创建订阅" → `TO service_role`
3. `user_behavior_analysis` — "System can manage analysis" → `TO service_role`
4. `sms_verification_codes` — 移除冗余 public 策略
5. `user_integration_secrets` — 添加显式拒绝 + service_role 策略
6. `cache_store` / `wealth_camp_activation_codes` / `wechat_login_scenes` — 添加 service_role 策略

#### ✅ P0 Round 2（已完成）
7. `appointment_notification_logs` — ALL public → `TO service_role`
8. `awakening_entries` — INSERT public → `TO service_role`
9. `bloom_delivery_completions` — INSERT/UPDATE public → `TO service_role`
10. `coach_settlements` — INSERT/UPDATE public → `TO service_role`
11. `scenario_strategy_analytics` — ALL public → `TO service_role`
12. `teen_coaching_contexts` — ALL public → `TO service_role`
13. `smart_notifications` — INSERT public → `TO service_role` + `TO authenticated`（保留前端评论通知）
14. `user_free_quota_usage` — ALL public → `TO service_role`
15. `wecom_messages` — INSERT/UPDATE public → `TO service_role`
16. `wecom_user_mappings` — ALL public → `TO service_role`
17. `api_cost_logs` — INSERT public → `TO service_role`

#### ✅ P1（已完成）
18. `human_coaches` — 创建 `human_coaches_public` 安全视图（排除 phone, admin_note, 财务字段）
    - 前端 `useHumanCoaches.ts` 改用视图查询
    - 基表 SELECT 策略限制为：教练本人 + 管理员 + 活跃教练

### 未修复/可接受风险
- `conversion_events` — 前端埋点设计，INSERT true 可接受
- `customer_tickets` / `user_feedback` — 公开提交工单/反馈，INSERT true 可接受
- `poster_scan_logs` — 扫码日志，INSERT true 可接受
- Leaked Password Protection — 建议在认证设置中手动开启
