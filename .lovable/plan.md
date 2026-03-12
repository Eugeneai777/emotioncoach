

## 问题诊断结果

通过数据库查询，已确认完整的故障链：

### 根因 1：双账号问题（直接原因）
- 用户施凡在**手机浏览器**从 `/promo/synergy` 购买，系统使用了微信关联账号 `009243ad`（"微信用户"）来创建订单
- 支付成功后，用户登录时使用的是**手机号账号** `88072c0a`（bob）
- `claim-guest-order` 发现 `order.user_id` 不为 null（已绑定微信账号），且与当前登录用户不匹配，返回"订单已被其他用户认领"
- 结果：bob 的账号下没有任何购买记录，进入训练营仍显示付费

### 根因 2：synergy_bundle 只发放了一半权益（系统级 bug）
所有后端函数（`wechat-pay-callback`、`alipay-callback`、`check-order-status`、`claim-guest-order`）中的 `bundleCampMap` 均为：
```
'synergy_bundle': { campType: 'emotion_journal_21', campName: '21天情绪日记训练营' }
```
**完全缺失 `emotion_stress_7`（7天情绪解压训练营）**。用户购买 synergy_bundle 后只拿到 emotion_journal_21 的权益，而推广页跳转的目标却是 `/camp-intro/emotion_stress_7`，必然显示"需要付费"。

---

## 实施方案

### A. 立即修复：为施凡发放权益（数据操作）
1. 将订单 `YJ20260312093618337N47` 的 user_id 从微信账号同步到手机号账号 `88072c0a`
2. 为 `88072c0a` 创建 `emotion_stress_7` 和 `emotion_journal_21` 的 `user_camp_purchases` 记录
3. 将订阅记录也同步到 `88072c0a`

### B. 修复 bundleCampMap：synergy_bundle 必须同时发放两个训练营
涉及 4 个边缘函数：
- `wechat-pay-callback`
- `alipay-callback`
- `check-order-status`
- `claim-guest-order`

将映射改为数组形式：
```
'synergy_bundle': [
  { campType: 'emotion_stress_7', campName: '7天情绪解压训练营' },
  { campType: 'emotion_journal_21', campName: '21天情绪日记训练营' }
]
```

### C. 修复 claim-guest-order：支持"同人不同账号"认领
当 `order.user_id` 不为 null 且与当前用户不同时，检查该 user_id 是否为微信关联账号（无手机号的"微信用户"），如果是，则执行权益同步而非拒绝。

### 改动范围
- 数据库：直接操作修复施凡的权益数据
- `supabase/functions/wechat-pay-callback/index.ts`
- `supabase/functions/alipay-callback/index.ts`
- `supabase/functions/check-order-status/index.ts`
- `supabase/functions/claim-guest-order/index.ts`

