

# 简化推广入口设置 - 移除产品Tabs

## 问题分析

当前设计将"尝鲜会员"和"财富测评"作为两个独立产品Tab，但这导致逻辑混乱：
- 用户以为要在两个页面之间选择
- 4个体验包选项全部在"尝鲜会员"里，财富卡点测评既是体验包选项又是独立产品

## 解决方案

移除产品Tabs结构，简化为单一的体验包配置页面：

```text
┌─────────────────────────────────────────┐
│ 推广入口设置                    剩余XX名额 │
├─────────────────────────────────────────┤
│ 入口方式                                 │
│ ┌──────────────┐ ┌──────────────┐      │
│ │ 🎁 免费领取   │ │ 💳 付费¥9.9  │      │
│ └──────────────┘ └──────────────┘      │
│                                         │
│ 包含内容                         [全选] │
│ ┌────────────────────────────────────┐ │
│ │ ☑ 🤖 AI对话点数 (50点)            │ │
│ │ ☑ 💚 情绪健康测评 (专业测评)       │ │
│ │ ☑ 📋 SCL-90心理测评 (心理健康筛查) │ │
│ │ ☑ 💰 财富卡点测评 (财富诊断)       │ │
│ └────────────────────────────────────┘ │
│                                         │
│ 📎 推广链接预览                          │
│ ┌────────────────────────────────────┐ │
│ │ https://...                        │ │
│ └────────────────────────────────────┘ │
│                                         │
│        [💾 保存设置]                     │
└─────────────────────────────────────────┘
```

## 技术修改

### 文件: `src/components/partner/EntryTypeSelector.tsx`

1. **移除Tabs组件和产品类型状态**
   - 删除 `productType` state 和相关逻辑
   - 移除 `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` 结构

2. **简化保存逻辑**
   - `default_product_type` 固定为 `'trial_member'`
   - 移除产品类型相关的条件判断

3. **简化组件Props**
   - 移除 `currentProductType` prop（不再需要）

4. **更新链接预览**
   - `getPartnerShareUrl` 使用固定的 `'trial_member'` 作为产品类型

### 文件: `src/components/partner/YoujinPartnerDashboard.tsx`

- 移除传递给 `EntryTypeSelector` 的 `currentProductType` prop

## 修改后的组件结构

```tsx
<Card>
  <CardHeader>
    <CardTitle>推广入口设置</CardTitle>
    <剩余名额标签 />
  </CardHeader>
  <CardContent>
    {/* 入口方式选择 - 直接显示，无Tabs */}
    <Label>入口方式</Label>
    <div className="grid grid-cols-2 gap-2">
      <EntryCard type="free" ... />
      <EntryCard type="paid" ... />
    </div>

    {/* 体验包内容选择 - 4个选项 */}
    <Label>包含内容</Label>
    <div className="space-y-2">
      {EXPERIENCE_PACKAGES.map(pkg => <CheckboxItem />)}
    </div>

    {/* 实时链接预览 */}
    <LinkPreview url={previewUrl} />

    {/* 保存按钮 */}
    <Button>保存设置</Button>
  </CardContent>
</Card>
```

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|:----|:--------|:-----|
| `src/components/partner/EntryTypeSelector.tsx` | 简化重构 | 移除Tabs结构，直接展示入口方式和体验包选择 |
| `src/components/partner/YoujinPartnerDashboard.tsx` | 更新 | 移除productType相关prop |

