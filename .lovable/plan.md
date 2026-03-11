

# 修复知乐数据看板编辑权限和用户昵称可编辑

## 问题分析

1. **物流状态切换失败**：当前 RLS 策略仅允许 `partner_admin` 更新 `orders` 表。账号 18898593978 的角色可能是 `content_admin`，无权更新。需要让所有能进入后台数据看板的角色（`admin`、`partner_admin`、`content_admin`）都能更新。

2. **用户昵称不可编辑**：当前"用户"列只读展示 `profiles.display_name`，需改为可编辑 Input，编辑后更新对应用户的 `profiles.display_name`。

## 修改方案

### 1. 数据库迁移 — 增加 `content_admin` 更新 orders 权限

```sql
CREATE POLICY "Content admins can update order shipping"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'content_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'content_admin'));
```

### 2. `ZhileOrdersDashboard.tsx` — 用户昵称列可编辑

- 将"用户"列从纯文本改为 `Input`（与收货人列一致）
- `onBlur` 时更新 `profiles.display_name`
- 复用 `updateBuyerInfo` mutation 模式，新增针对 profiles 表的更新逻辑

| 文件 | 改动 |
|------|------|
| 数据库迁移 | content_admin UPDATE 策略 on orders |
| `src/components/partner/ZhileOrdersDashboard.tsx` | 用户昵称列可编辑 |

