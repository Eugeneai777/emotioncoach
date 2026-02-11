

## 管理后台增加"付费状态"列

### 改动说明

在用户列表表格中新增一列"付费"，通过查询 `orders` 表判断用户是否有过任何成功支付记录，并显示不同状态。

### 显示逻辑

| 情况 | 显示 |
|------|------|
| 有 paid 订单 | 绿色 Badge "已付费" |
| 无 paid 订单 | 灰色 Badge "未付费" |

### 技术实现

#### 1. 数据查询层（queryFn 中）

在现有的 `Promise.all` 中增加第四个并行查询，检查该用户是否有 `status = 'paid'` 的订单：

```typescript
supabase
  .from('orders')
  .select('id, package_key')
  .eq('user_id', account.user_id)
  .eq('status', 'paid')
  .limit(1)
  .maybeSingle()
```

将结果作为 `paidOrder` 字段附加到每条账户数据上。

#### 2. 表格新增列

在"会员类型"和"过期时间"之间插入"付费"列：

- 表头：`<TableHead className="w-[80px]">付费</TableHead>`
- 单元格：根据 `paidOrder` 是否存在显示对应 Badge

#### 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/admin/UserAccountsTable.tsx` | 查询增加 orders 检查；表格增加"付费"列 |

