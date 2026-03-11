

# 修复：商品名称/金额已生效 + 日期列被截断

## 问题分析

1. **"改动没有生效"** — 数据库查询确认 `product_name` 已正确返回（如"知乐胶囊草本调理16种草本成分..."），前端代码和类型定义都已更新。可能是浏览器缓存，刷新后应能看到。

2. **日期内容看不完整** — 表格有 11 列，内容超出视口宽度。虽然有 `overflow-x-auto`，但 `Table` 组件内部自带一层 `overflow-auto` div，嵌套后滚动条可能不可见或不好操作。

## 修复方案

### 文件：`src/components/partner/ZhileOrdersDashboard.tsx`

用 `AdminTableContainer`（项目已有的表格容器组件）替换当前的 `<div className="overflow-x-auto">`，设置 `minWidth={1200}` 确保所有列完整显示，底部出现明确的水平滚动条。

```tsx
// 替换第 286 行的 <div className="overflow-x-auto">
<AdminTableContainer minWidth={1200}>
  <Table>
    ...
  </Table>
</AdminTableContainer>
```

同时给关键列添加 `min-w` 和 `whitespace-nowrap` 确保日期、金额不换行不截断：
- 下单时间列：`min-w-[100px] whitespace-nowrap`（已有）
- 商品名称列：保持 `max-w-[150px] truncate` 但加 `title` 属性显示完整名称
- 金额列：`whitespace-nowrap`

| 改动 | 效果 |
|------|------|
| 使用 AdminTableContainer | 底部出现水平滚动条，所有列可滚动查看 |
| 列宽约束 | 日期、金额等关键字段不再被截断 |

