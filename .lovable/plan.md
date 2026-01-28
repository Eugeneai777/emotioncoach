
# 移除体验包选择 - 默认全选

## 需求理解

用户希望简化推广入口设置，移除体验包的选择功能，让所有4个体验包默认全选且不可更改。

## 解决方案

移除体验包选择UI，改为静态展示全部4个体验包内容，同时后台固定保存全部4个包。

## UI 变化

```text
修改前:
┌────────────────────────────────────┐
│ 包含内容                    [全选] │
│ ☑ 🤖 AI对话点数 (50点)            │
│ ☑ 💚 情绪健康测评 (专业测评)       │
│ ☑ 📋 SCL-90心理测评 (心理健康筛查) │
│ ☑ 💰 财富卡点测评 (财富诊断)       │
└────────────────────────────────────┘

修改后:
┌────────────────────────────────────┐
│ 包含内容                           │
│ ✓ 🤖 AI对话点数 (50点)             │
│ ✓ 💚 情绪健康测评 (专业测评)        │
│ ✓ 📋 SCL-90心理测评 (心理健康筛查)  │
│ ✓ 💰 财富卡点测评 (财富诊断)        │
└────────────────────────────────────┘
```

## 技术修改

### 文件: `src/components/partner/EntryTypeSelector.tsx`

1. **移除状态和逻辑**
   - 删除 `selectedPackages` state
   - 删除 `handleTogglePackage` 函数
   - 删除 `handleSelectAllPackages` 函数
   - 删除 `isAllSelected` 计算
   - 删除 `checkHasChanges` 中的包选择对比逻辑

2. **移除Props**
   - 删除 `currentSelectedPackages` prop（不再需要）

3. **简化UI**
   - 移除全选Checkbox
   - 移除每个包的Checkbox
   - 改为静态列表展示，使用绿色勾号图标

4. **固定保存逻辑**
   - `handleSave` 中固定使用 `DEFAULT_PACKAGES`
   - 移除包选择验证

### 文件: `src/components/partner/YoujinPartnerDashboard.tsx`

- 移除传递 `currentSelectedPackages` prop

## 修改后的组件结构

```tsx
<div className="space-y-2">
  <Label className="text-sm text-muted-foreground">包含内容</Label>
  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
    {EXPERIENCE_PACKAGES.map((pkg) => (
      <div key={pkg.key} className="flex items-center gap-2">
        <Check className="w-4 h-4 text-teal-500" />
        <span className="text-sm">{pkg.icon}</span>
        <span className="text-sm font-medium">{pkg.label}</span>
        <span className="text-xs text-muted-foreground">({pkg.description})</span>
      </div>
    ))}
  </div>
</div>
```

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|:----|:--------|:-----|
| `src/components/partner/EntryTypeSelector.tsx` | 简化 | 移除包选择功能，改为静态展示 |
| `src/components/partner/YoujinPartnerDashboard.tsx` | 更新 | 移除 `currentSelectedPackages` prop |
