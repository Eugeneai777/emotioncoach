

## 体验包动态化：从数据库读取，自动同步更新

### 问题

当前体验包内容在 4 个前端文件 + 2 个后端函数中硬编码，每次新增体验包项目都需要手动同步修改多处代码，容易遗漏。

### 方案

创建 `partner_experience_items` 数据库表存储体验包配置，前端通过 hook 动态读取，后端函数从数据库查询，实现"加一条记录 = 全站自动更新"。

---

### 1. 数据库变更

**新建表：** `partner_experience_items`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| item_key | TEXT | 唯一标识，如 `ai_points`、`emotion_health` |
| package_key | TEXT | 对应 packages 表的 package_key（后端兑换用），如 `basic`、`emotion_health_assessment` |
| name | TEXT | 显示名称，如"尝鲜会员" |
| value | TEXT | 数量描述，如"50点"、"1次" |
| icon | TEXT | Emoji 图标 |
| description | TEXT | 详细描述 |
| features | TEXT[] | 特色功能列表 |
| color_theme | TEXT | 颜色主题标识（`blue`/`green`/`amber`/`purple`），UI 渲染用 |
| display_order | INTEGER | 排序 |
| is_active | BOOLEAN | 是否启用，默认 true |
| created_at | TIMESTAMPTZ | 创建时间 |

**数据初始化：** 插入当前 4 项体验包数据。

**RLS 策略：** 所有人可读（公开展示数据），仅管理员可写。

---

### 2. 前端变更

#### 2.1 新建 Hook：`src/hooks/useExperiencePackageItems.ts`

- 从 `partner_experience_items` 表读取 `is_active = true` 的记录，按 `display_order` 排序
- 5 分钟缓存（staleTime）
- 导出数据和 loading 状态
- 同时保留静态 fallback（网络异常时使用当前硬编码数据）

#### 2.2 更新 `src/config/youjinPartnerProducts.ts`

- `experiencePackageItems` 保留为 fallback 默认值
- 新增 `ExperiencePackageItem` 接口补充 `color_theme` 字段

#### 2.3 更新消费组件（4 处）

| 文件 | 改动 |
|------|------|
| `src/pages/YoujinPartnerIntro.tsx` | 用 hook 替换静态导入，动态渲染体验包列表，标题中的"共X种"自动计算 |
| `src/components/ProductComparisonTable.tsx` | 用 hook 替换静态导入，颜色映射改为按 `color_theme` 字段动态匹配 |
| `src/components/partner/PartnerSelfRedeemCard.tsx` | 用 hook 替换静态导入，兑换状态检查基于 `package_key` 字段 |
| `src/components/partner/EntryTypeSelector.tsx` | 用 hook 替换硬编码的 `EXPERIENCE_PACKAGES` 常量，`DEFAULT_PACKAGES` 改为动态生成 |

---

### 3. 后端变更

#### 3.1 `supabase/functions/partner-self-redeem/index.ts`

- 从 `partner_experience_items` 表查询活跃体验包列表
- 用查询结果替代硬编码的 `assessmentKeys` 和 `assessmentPackages`
- 自动适应新增的体验包项目

#### 3.2 `supabase/functions/claim-partner-entry/index.ts`

- 从 `partner_experience_items` 表查询作为默认包列表
- `selectedPackages` 的 fallback 值改为从数据库读取
- 兑换逻辑循环基于查询结果

---

### 4. 数据流

```text
管理员在数据库新增一条体验包记录
            |
            v
  partner_experience_items 表更新
       /            \
      v              v
  前端 Hook          后端函数
  自动刷新           下次调用时
  UI 更新            读取最新列表
      |                  |
      v                  v
  介绍页/面板/        兑换/分发
  比较表自动          自动包含
  显示新项目          新产品
```

---

### 5. 文件变更总表

| 文件 | 操作 | 说明 |
|------|------|------|
| 数据库迁移 | 新建 | 创建 `partner_experience_items` 表 + 初始数据 |
| `src/hooks/useExperiencePackageItems.ts` | 新建 | 动态读取体验包配置的 Hook |
| `src/config/youjinPartnerProducts.ts` | 修改 | 保留为 fallback，补充 color_theme |
| `src/pages/YoujinPartnerIntro.tsx` | 修改 | 使用 hook 动态渲染 |
| `src/components/ProductComparisonTable.tsx` | 修改 | 使用 hook 动态渲染 |
| `src/components/partner/PartnerSelfRedeemCard.tsx` | 修改 | 使用 hook 动态渲染 |
| `src/components/partner/EntryTypeSelector.tsx` | 修改 | 使用 hook 动态渲染 |
| `supabase/functions/partner-self-redeem/index.ts` | 修改 | 从数据库读取体验包列表 |
| `supabase/functions/claim-partner-entry/index.ts` | 修改 | 从数据库读取体验包列表 |

