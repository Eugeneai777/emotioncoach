

# 修复知乐订单看板：滚动条 + 确保所有管理员可见

## 问题根因

### 1. 水平滚动条失效
`AdminTableContainer` 的 `overflow-x-auto` 和 `Table` 组件内置的 `<div className="overflow-auto">` 形成**双层嵌套滚动容器**，互相冲突导致滚动条不可见。

### 2. 线上未生效
数据库函数 `get_zhile_orders()` 已确认正确返回 `product_name`（如"知乐胶囊草本调理16种草本成分..."）和 `amount`。代码也已更新。**线上站点需要重新发布**才能生效。

## 修复方案

### 文件：`src/components/partner/ZhileOrdersDashboard.tsx`

**移除 `AdminTableContainer`**，改为直接在 `<Table>` 上设置 `className="min-w-[1200px]"`。这样利用 `Table` 组件**自身的** `overflow-auto` 包裹层来产生滚动条，避免嵌套冲突。

```text
修改前（双层嵌套，滚动条冲突）:
  AdminTableContainer(overflow-x-auto)
    └─ div(minWidth:1200)
        └─ Table → div(overflow-auto)  ← 内层吞掉了滚动
            └─ table

修改后（单层，滚动条正常）:
  Table → div(overflow-auto)
    └─ table(min-w-[1200px])  ← 强制宽度，触发父层滚动条
```

改动极小：
- 删除 `AdminTableContainer` 包裹和 import
- `<Table>` 改为 `<Table className="min-w-[1200px]">`

### 发布
修改后需重新发布到线上，确保所有管理员账号（包括 18898593978）都能看到最新的下单时间首列、商品名称列和水平滚动条。

