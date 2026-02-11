

## 修复 basic（¥9.9）套餐显示"体验版"的问题

### 问题分析

有两个独立的问题：

1. **数据缺失**：用户 Jenny Chu 已付费 ¥9.9（basic 套餐），但 subscriptions 表中没有对应记录
2. **管理后台 UI 缺陷**：`UserAccountsTable.tsx` 中会员类型的显示逻辑缺少对 `basic` 类型的处理，导致即使有 subscription 记录也显示"体验版"

用户端的 `AccountBalance.tsx` 已正确处理（第 68 行显示"尝鲜会员"），但管理后台遗漏了。

### 修复方案

#### 1. 补建 Jenny Chu 的 subscription 记录

为 `user_id = 8b3130dd-e06b-4c60-8e6f-15317552a25a` 插入 subscription 记录（basic 套餐）。

#### 2. 修改管理后台 UI 显示逻辑

在 `src/components/admin/UserAccountsTable.tsx` 第 172-174 行，增加对 `basic` 类型的识别：

```
365/member365 -> 365会员
basic         -> 尝鲜会员（新增）
custom        -> 自定义
其他          -> 体验版
```

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/admin/UserAccountsTable.tsx` | 会员类型显示增加 `basic` -> "尝鲜会员" |
| 数据库 | 为 Jenny Chu 补建 subscription 记录 |

