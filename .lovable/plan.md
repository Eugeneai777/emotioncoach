

# 优化快捷入口样式 + 移除分类Tab中的健康商城

## 改动内容

### 1. 健康商城图标改为绿色系
将 `quickEntries` 中健康商城的 gradient 从 `from-rose-500 to-red-500` 改为 `from-green-500 to-emerald-500`，emoji 保持 🛒。

### 2. 合伙人图标改颜色
当前合伙人是 `from-emerald-500 to-teal-500`（绿色系），为避免与健康商城撞色，改为 `from-purple-500 to-violet-500`（紫色系）。

### 3. 从第二行分类 Tab 中移除"健康商城"
在 `src/config/energyStudioTools.ts` 的 `categories` 数组中删除 `id: "store"` 这一项，避免重复入口。同时更新 TypeScript 类型，将 `"store"` 从 `CategoryConfig.id` 联合类型中移除（但 `activeCategory` state 仍保留 `"store"` 类型，因为顶部快捷入口需要用它切换到商城视图）。

---

## 技术细节

**修改文件 1**: `src/pages/EnergyStudio.tsx`
- 第 49 行：合伙人 gradient 改为 `from-purple-500 to-violet-500`
- 第 50 行：健康商城 gradient 改为 `from-green-500 to-emerald-500`

**修改文件 2**: `src/config/energyStudioTools.ts`
- 删除 categories 数组中 `id: "store"` 的条目
- 更新 CategoryConfig 的 id 类型，移除 `"store"`

