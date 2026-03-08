

## 测评同步检测器 — 方案 A 实现计划

### 目标
在管理后台"体验包管理"页面（`/admin/experience-items`）顶部新增 **AssessmentSyncChecker** 组件，自动检测 `partner_assessment_templates` 和 `energy_studio_tools` 中的活跃测评是否已在 `partner_experience_items` 中注册，支持一键同步或选择性跳过。

### 实现细节

#### 1. 新建 `src/components/admin/AssessmentSyncChecker.tsx`

- **数据查询**：并行查询三张表
  - `partner_assessment_templates`（`is_active = true`）→ 获取所有活跃测评的 `assessment_key`、`title`、`emoji`
  - `partner_experience_items` → 获取已有的 `package_key` 列表
  - `energy_studio_tools` → 获取已有的工具 ID 列表

- **对比逻辑**：找出在 `partner_assessment_templates` 中存在但在 `partner_experience_items` 中缺失的条目

- **UI 展示**：
  - 全部已同步时：显示绿色 ✓ 提示"所有测评已同步"
  - 有缺失项时：显示黄色警告卡片，列出未同步测评
  - 每个缺失项显示：名称、emoji、两个按钮
    - **"添加到产品中心"**：预填表单数据（从模板取 title → name，assessment_key → package_key，emoji → icon），插入 `partner_experience_items`，管理员可编辑价格描述后确认
    - **"跳过/不同步"**：将该测评标记为"已忽略"，不再提示（使用 localStorage 存储忽略列表，key 为 `sync-ignored-keys`）

#### 2. 修改 `src/components/admin/ExperiencePackageManagement.tsx`

- 在页面顶部（标题下方）嵌入 `<AssessmentSyncChecker onSynced={invalidateQueries} />`

#### 3. 同步到 `energy_studio_tools` 的检测

- 同样对比 `energy_studio_tools` 表，显示缺失项
- 一键添加时自动填充 `tool_id`、`title`、`category: 'exploration'`、`icon`、`gradient`

### 不涉及的变更
- 不修改数据库 schema（使用现有表）
- 不影响前端产品中心展示逻辑
- 不影响现有测评运行

