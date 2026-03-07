

## 行业合伙人管理页优化

基于之前批准的四个方向，以下是具体实施计划：

---

### 1. 详情页 Tab 分组 + 移动端下拉选择器
**文件**: `IndustryPartnerDetail.tsx`

- 桌面端：将 11 个 Tab 按功能分为 4 组，用 `gap-4` 间距分隔
  - **设置**：基本信息
  - **业务**：收益看板、推广链接、学员管理
  - **运营**：创建活动、AI教练、测评、组合产品
  - **组织**：团队成员、商城商品、商城订单
- 移动端（<640px）：用 `Select` 下拉替代 `TabsList`，通过 `useMediaQuery` 或 CSS 切换显示
- Tab 分组用 `Separator` 竖线在桌面端可视区分

### 2. 列表页状态筛选 + 表头排序
**文件**: `IndustryPartnerList.tsx`

- 在 `AdminFilterBar` 旁新增状态筛选按钮组（全部/活跃/停用），使用 `ToggleGroup`
- 新增排序状态 `sortField` + `sortDir`，点击"推荐用户"和"总收益"表头切换升降序
- 表头添加排序图标指示当前排序方向

### 3. 移动端卡片布局
**文件**: `IndustryPartnerList.tsx`

- 添加 `useIsMobile` hook 判断屏幕宽度
- 移动端用 `MobileCard` 组件渲染每个合伙人（公司名、状态徽章、负责人、收益、操作按钮）
- 桌面端保持现有 Table 布局不变

### 4. Realtime + 乐观更新
**文件**: `useIndustryPartners.ts`

- 数据库迁移：`ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;`
- 在 hook 中添加 Supabase Realtime 订阅，收到 `postgres_changes` 事件时调用 `queryClient.invalidateQueries`
- 设置/移除负责人操作添加 `onMutate` 乐观更新（立即更新缓存中的 `user_id` 和 `nickname`）

---

### 实施顺序
1. 数据库迁移启用 Realtime
2. 重构 `IndustryPartnerDetail.tsx`（Tab 分组 + 移动端 Select）
3. 增强 `IndustryPartnerList.tsx`（筛选、排序、卡片布局）
4. 优化 `useIndustryPartners.ts`（Realtime + 乐观更新）

