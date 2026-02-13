
## 将"有劲会员"改为"有劲合伙人"

### 改动内容

**文件：`src/config/productCategories.ts`（第 29 行）**

将 `name` 从 `'有劲会员'` 改为 `'有劲合伙人'`。

同时检查其他引用"有劲会员"的位置（共 3 个文件），按需同步修改：

| 文件 | 位置 | 改动 |
|------|------|------|
| `src/config/productCategories.ts` | 第 29 行 | `'有劲会员'` → `'有劲合伙人'` |
| `src/components/ProductComparisonTable.tsx` | 第 229 行注释 | `有劲会员` → `有劲合伙人`（注释） |
| `src/components/admin/PackagesManagement.tsx` | 第 474 行 | `有劲会员套餐列表` → `有劲合伙人套餐列表` |
