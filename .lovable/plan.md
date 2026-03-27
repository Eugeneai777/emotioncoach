

# 排查结果 + 修复方案：重复训练营记录

## 问题根因

账号 `18588235488` 只成功支付了 **1 笔** synergy_bundle 订单（`YJ20260327022538O78SHK`，paid_at: 02:25:50），但 `user_camp_purchases` 表中出现了 **3 条** `emotion_stress_7` 记录和 **3 条** `emotion_journal_21` 记录（时间均在 02:25:49-51 的 2 秒内）。

**原因**：支付回调中存在 **重复写入**，同一笔订单触发了多次插入：

1. **wechat-pay-callback** 第 150-185 行："自愈逻辑"先查后插（有简单去重，但并发下会穿透）
2. **wechat-pay-callback** 第 309-337 行：主逻辑 **无任何去重检查**，直接 insert
3. **check-order-status** 第 209-246 行：前端轮询也触发了自愈逻辑，又插入一轮

三处并发执行，产生了 3 条重复记录。这也解释了之前 3/26 那笔已 refunded 的订单为什么也留下了 7 条购买记录（callback + check-order-status 各执行了多次）。

## 修复方案

### 第一步：数据库层面加唯一约束（彻底防重复）

在 `user_camp_purchases` 表添加唯一约束 `(user_id, camp_type, payment_status)`，从根本上防止并发插入重复记录。

```sql
-- 先清理现有重复数据，保留每组最早的一条
DELETE FROM user_camp_purchases 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, camp_type, payment_status) id 
  FROM user_camp_purchases 
  ORDER BY user_id, camp_type, payment_status, purchased_at ASC
);

-- 添加唯一约束
ALTER TABLE user_camp_purchases 
ADD CONSTRAINT unique_user_camp_purchase UNIQUE (user_id, camp_type, payment_status);
```

### 第二步：边缘函数改为 upsert / ON CONFLICT

**wechat-pay-callback**：
- 删除第 309-337 行的重复 bundle 插入块（与第 150-185 行功能完全重复）
- 第 150-185 行的自愈逻辑改用 `upsert` + `onConflict: 'user_id,camp_type,payment_status'`
- 第 254-267 行的 camp- 前缀处理同样改为 upsert

**check-order-status**：
- 第 209-246 行和第 308-340 行同样改为 upsert，避免并发穿透

### 第三步：前端列表去重兜底

**CampList.tsx** 第 112-131 行：purchases 遍历前按 `camp_type` 去重（只取每个类型最新的一条），防止即使数据有残留重复也不会在 UI 上显示多条。

## 当前数据清理

清除该用户的重复记录（每个 camp_type 只保留最早一条）：

```sql
-- emotion_stress_7：保留 9e2d8438，删除另外 2 条
DELETE FROM user_camp_purchases 
WHERE id IN ('bdb63785-db64-4dc5-a5a0-9b98018b878d', '01f8193d-ab93-413e-b86c-913851eabf3f');

-- emotion_journal_21：保留 8c5ffbd7（3/27最早），删除 3/27 的另外 2 条
-- 3/26 的 refunded 订单产生的 4 条也一并清理
DELETE FROM user_camp_purchases 
WHERE id IN (
  'eb67fa36-74ed-4cf8-afcc-5d834fab8c7c',
  'b8e5ada5-b10c-4de4-a2a5-4bfd6fc79129',
  '6841aba3-b13a-47e6-b929-7722d85ab1c5',
  '97b59ce7-9346-448c-968a-52250dd8988a',
  '82319bbd-4134-4901-b4c7-972f3ff41af7',
  'cdad1122-f6fe-402d-b126-e62f46f1aa86'
);
```

## 不受影响

- 支付流程、金额、回调逻辑不变
- 权益判断逻辑不变（查询仍然有效）
- 其他用户数据不受影响（唯一约束只防止未来重复）

