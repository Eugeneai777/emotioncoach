

# 诊断结果与修复方案

## 问题根因

账号 **18898593978**（炯谦）的角色是 `partner_admin`，通过 `partner_admin_bindings` 绑定到知乐合伙人（ID: `151be937`）。

但 `health_store_products` 表的 RLS 策略只允许两类用户执行 UPDATE：
1. 拥有 `admin` 角色的用户
2. 合伙人本人（`partners.user_id = auth.uid()`，即知乐的 owner `3e050d09`）

**`partner_admin` 角色完全没有被覆盖**，所以更新操作被 RLS 静默拒绝（返回成功但 0 行受影响），前端代码未检测到这一情况，误报"更新成功"。

## 修复方案

### 1. 新增 RLS 策略（数据库迁移）

为 `partner_admin` 用户添加 SELECT/UPDATE/INSERT/DELETE 策略，通过 `partner_admin_bindings` 表验证其对绑定合伙人商品的管理权限：

```sql
-- partner_admin 可以查看绑定合伙人的商品
CREATE POLICY "Partner admins can select bound partner products"
ON public.health_store_products FOR SELECT TO authenticated
USING (
  partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM partner_admin_bindings pab
    WHERE pab.partner_id = health_store_products.partner_id
      AND pab.user_id = auth.uid()
  )
);

-- partner_admin 可以更新绑定合伙人的商品
CREATE POLICY "Partner admins can update bound partner products"
ON public.health_store_products FOR UPDATE TO authenticated
USING (
  partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM partner_admin_bindings pab
    WHERE pab.partner_id = health_store_products.partner_id
      AND pab.user_id = auth.uid()
  )
);

-- 同理添加 INSERT 和 DELETE 策略
```

### 2. 代码加固：检测静默失败

在 `PartnerStoreProducts.tsx` 的 update 调用中添加 `.select()` 并检查返回数据是否为空，如果为空则抛出明确错误提示"无权限修改该商品"。

### 涉及文件
- **数据库迁移**：新增 4 条 RLS 策略
- `src/components/partner/PartnerStoreProducts.tsx`：update 调用加 `.select()` 检测

