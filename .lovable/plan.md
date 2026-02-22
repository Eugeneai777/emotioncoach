

## 合伙人体验包自选功能

### 现状

| 层 | 状态 | 说明 |
|---|------|------|
| 数据库 `partners.selected_experience_packages` | 已有 | text[] 类型字段 |
| 后端 `claim-partner-entry` | 已支持 | 读取 `selected_experience_packages` 过滤发放项 |
| 前端 `EntryTypeSelector` | 未实现 | 始终保存全部 `allPackageKeys`，无勾选 UI |

### 方案

在 `EntryTypeSelector` 的"包含内容"区域，将静态展示改为可勾选列表，合伙人保存时将选中的 `package_key[]` 写入 `selected_experience_packages`。链接无需改动，后端已按此字段过滤发放。

### 改动

#### 1. EntryTypeSelector.tsx

- 新增 `selectedKeys: Set<string>` state，初始化为全选或从 partner 数据读取
- 接收新 prop `currentSelectedPackages?: string[]`，用于初始化
- "包含内容"区域：每行添加 Checkbox，点击可选/取消
- 添加"全选/取消全选"快捷操作
- 保存时将 `Array.from(selectedKeys)` 写入 `selected_experience_packages`
- 至少选 1 项才可保存，否则禁用按钮
- 选中项变化也触发 `hasChanges`

#### 2. 使用 EntryTypeSelector 的父组件

需要传入 `currentSelectedPackages` prop（从 partner 数据中读取）。查找所有引用该组件的地方并补充传参。

### 不需要改动

- `claim-partner-entry` 后端（已支持按 `selected_experience_packages` 过滤）
- `Claim.tsx`（已动态展示 `granted_items`）
- 数据库 schema（字段已存在）
- 推广链接格式（不变）

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/components/partner/EntryTypeSelector.tsx` | 添加 Checkbox 勾选 UI + selectedKeys state |
| 引用 EntryTypeSelector 的父组件 | 补充 `currentSelectedPackages` prop 传入 |
