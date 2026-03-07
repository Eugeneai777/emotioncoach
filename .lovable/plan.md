

## 行业合伙人管理页优化方案

### 问题分析

当前 `IndustryPartnerManagement.tsx` 是一个 **672 行的巨型组件**，包含列表页、详情页、创建弹窗、绑定弹窗等所有逻辑，存在以下问题：
- 单文件职责过多，难以维护
- 所有 Tab 内容同时加载，性能浪费
- 列表页信息密度可优化，缺少分页和批量操作
- 移动端表格体验差

---

### 1. 代码架构拆分

将 672 行文件拆分为独立组件：

```text
src/components/admin/industry-partners/
├── PartnerInfoEditor.tsx        (已有)
├── PartnerTeamManager.tsx       (已有)
├── PartnerProductBundles.tsx    (已有)
├── IndustryPartnerList.tsx      ← 新：列表页（统计卡片 + 筛选 + 表格）
├── IndustryPartnerDetail.tsx    ← 新：详情页（Tabs 容器）
├── CreatePartnerDialog.tsx      ← 新：创建弹窗
├── BindUserDialog.tsx           ← 新：绑定用户弹窗
├── useIndustryPartners.ts       ← 新：数据获取 hook
└── types.ts                     ← 新：共享类型定义
```

主文件 `IndustryPartnerManagement.tsx` 精简为路由分发（约 50 行）：根据 `selectedPartnerId` 渲染 List 或 Detail。

### 2. 性能优化

- **懒加载 Tab 内容**：使用 `React.lazy` + `Suspense` 按需加载重量级 Tab 组件（FlywheelGrowthSystem、PartnerCoachManager 等），未激活的 Tab 不加载代码
- **自定义 Hook + React Query**：将 `fetchPartners` 迁移到 `useIndustryPartners` hook，利用已配置的 5 分钟 staleTime 缓存，避免重复请求
- **列表虚拟化**：合伙人数量较多时考虑，当前阶段暂不需要

### 3. UI/UX 改进

- **列表页增强**：
  - 在表格中增加"总收益"列，快速了解合伙人价值
  - 绑定用户列显示昵称而非仅"已绑定"
  - 使用 `AdminTableContainer` 包裹表格，统一移动端横向滚动体验
  - 空状态使用更友好的插图

- **详情页 Tab 优化**：
  - Tab 导航在移动端改为可横向滚动，当前 `flex-wrap` 在小屏上换行过多
  - 记住上次选中的 Tab（通过 URL searchParams `?tab=revenue`）

- **统计卡片**：增加"总收益"卡片到列表页概览

### 4. 功能增强

- **分页**：列表超过 20 条时启用分页，避免一次加载全部数据
- **批量操作**：支持批量启用/停用合伙人
- **数据导出**：列表页增加"导出 CSV"按钮，导出合伙人基础数据 + 收益汇总
- **URL 状态同步**：详情页当前 Tab 同步到 URL（`?partner=xxx&tab=revenue`），支持分享和刷新保持

### 实施优先级

1. **架构拆分 + 类型抽取**（最高优先级，降低后续开发成本）
2. **useIndustryPartners hook + React Query 集成**
3. **Tab 懒加载 + URL 状态同步**
4. **UI 细节改进**（表格列、移动端 Tab 滚动）
5. **分页 + 导出功能**

