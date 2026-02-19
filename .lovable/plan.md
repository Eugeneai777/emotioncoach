

# 修复"产品中心"数据源：从 packages 表获取产品

## 问题原因

当前手工配对的"产品中心"查询的是 `partner_products` 表（合伙人自建产品），但用户期望的"产品中心"是 `/packages` 页面中展示的所有套餐，数据来源是 `packages` 表。该表有 20 条活跃产品（尝鲜会员、365会员、各种训练营、合伙人套餐等），而 `partner_products` 表为空。

## 修复方案

修改 `src/components/partner/AILandingPageWizard.tsx` 中的 `fetchManualProducts` 函数：

1. 将"产品中心"的查询从 `partner_products` 改为 `packages` 表
2. 查询条件：`is_active = true`，按 `display_order` 排序
3. 字段映射：使用 `package_name` 作为显示名称
4. 排除管理员专用套餐（如 `custom`）

## 技术细节

```text
修改前（查询 partner_products）:
  supabase.from("partner_products").select("id, product_name, price, description").eq("is_active", true)

修改后（查询 packages）:
  supabase.from("packages").select("id, package_name, price, description").eq("is_active", true).neq("package_key", "custom").order("display_order")
```

渲染时将 `p.product_name` 改为 `p.package_name`，`getSelectedManualProductNames` 同步调整。

