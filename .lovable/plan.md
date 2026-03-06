

## 组合产品支持 AI 教练

### 改动范围

仅修改 `src/components/admin/industry-partners/PartnerProductBundles.tsx` 一个文件。

### 具体改动

1. **扩展 `BundleProduct.source` 类型**：从 `"package" | "store"` 扩展为 `"package" | "store" | "coach"`。

2. **加载合伙人 AI 教练数据**：新增一个 `useQuery` 从 `coach_templates` 表查询该合伙人创建的教练（`created_by_partner_id = partnerId, is_partner_coach = true, is_active = true`）。

3. **将教练加入可选产品列表**：在 `allProducts` 的 `useMemo` 中，将教练数据映射为 `SelectableProduct`，`source` 设为 `"coach"`，`group` 设为 `"AI 教练"`，`id` 为教练模板 id，价格默认为 0（教练本身免费，作为增值服务组合）。

4. **产品选择 UI 中显示教练分组**：现有的分组渲染逻辑（`grouped` map）会自动将 "AI 教练" 作为新分组展示，无需额外 UI 改动。

### 文件清单

| 类型 | 文件 | 说明 |
|------|------|------|
| 改 | `src/components/admin/industry-partners/PartnerProductBundles.tsx` | 加载教练数据，扩展 source 类型，加入可选列表 |

