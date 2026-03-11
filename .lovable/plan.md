
# 三个根因诊断 + 修复方案

## 根因分析

### 根因 1：物流状态切换失败
数据库确认账号 18898593978 角色是 `partner_admin`。虽然已有 `partner_admin` 的 UPDATE 策略，但代码中 `.update().select("id")` 需要 **SELECT 权限**才能返回更新后的行。`partner_admin` 和 `content_admin` **没有 orders 表的 SELECT 策略**，导致 update 执行后 `.select("id")` 返回空数组 → 代码抛出"无权限更新此订单"。

### 根因 2：收货信息同步不过来
数据库查询确认：3 笔 `store_product_` 订单的 `buyer_name/buyer_phone` 全部 NULL。原因是 `HealthStoreGrid.tsx` 的回写逻辑用了 `.eq("status", "paid")` 筛选，但订单创建时状态可能还是 `pending`（支付回调异步更新），导致查不到订单，收货信息未写入。

### 根因 3：昵称编辑也会失败
`profiles` 表的 UPDATE 策略只允许 `admin` 和用户自己修改。`partner_admin`/`content_admin` 无权更新其他用户的昵称。

## 修复方案

### 数据库迁移（3 个策略）
```sql
-- 1. partner_admin/content_admin 可 SELECT orders（配合 UPDATE 使用）
CREATE POLICY "Partner admins can select orders"
  ON orders FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Content admins can select orders"
  ON orders FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'content_admin'));

-- 2. partner_admin/content_admin 可更新 profiles.display_name
CREATE POLICY "Partner admins can update profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Content admins can update profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'content_admin'));
```

### 代码修复 — `HealthStoreGrid.tsx`
移除 `.eq("status", "paid")` 筛选条件，改为只按 `user_id + package_key` 查最新订单，确保无论订单状态如何都能回写收货信息。

| 文件 | 改动 |
|------|------|
| 数据库迁移 | 新增 4 个 RLS 策略 |
| `src/components/store/HealthStoreGrid.tsx` | 移除 status 筛选 |
