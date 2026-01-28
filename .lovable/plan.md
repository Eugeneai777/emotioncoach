
# 优化推广入口设置 + 添加财富卡点测评体验包

## 现状分析

### 当前问题

**UI 排版问题**：
1. 分三步展示（Step 1/2/3）导致层级混乱，用户需要滚动多次
2. TabsContent 中的产品详情卡片与后续步骤有大量重复信息
3. 保存按钮只在有变更时显示，用户可能找不到

**逻辑问题**：
1. 缺少实时链接预览 - 用户修改设置后看不到链接变化
2. 财富卡点测评（`wealth_block_assessment`）在数据库中已存在，但前端和后端都只配置了3个体验包

### 数据库已有的4个体验包

| 包名 | package_key | 价格 |
|:----|:-----------|:-----|
| AI对话点数 | basic | ¥9.9 |
| 情绪健康测评 | emotion_health_assessment | ¥9.9 |
| SCL-90心理测评 | scl90_report | ¥9.9 |
| 财富卡点测评 | wealth_block_assessment | ¥9.9 |

---

## 修改方案

### 1. 重构 UI 布局 - EntryTypeSelector.tsx

**移除分步流程**，改为紧凑的内联布局：

```text
┌─────────────────────────────────────────┐
│ 推广入口设置                    剩余XX名额 │
├─────────────────────────────────────────┤
│ [尝鲜会员] [财富测评]  ← Tabs           │
│                                         │
│ ┌─ 尝鲜会员配置 ─────────────────────┐ │
│ │ 入口方式: [免费领取] [付费¥9.9]    │ │
│ │                                    │ │
│ │ 体验包内容:                        │ │
│ │ ☑ AI对话点数 (50点)               │ │
│ │ ☑ 情绪健康测评                     │ │
│ │ ☑ SCL-90心理测评                   │ │
│ │ ☑ 财富卡点测评  ← 新增             │ │
│ └────────────────────────────────────┘ │
│                                         │
│ 📎 实时预览                             │
│ ┌────────────────────────────────────┐ │
│ │ wechat.eugenewe.net/claim?partner=│ │
│ └────────────────────────────────────┘ │
│                                         │
│        [💾 保存设置]                     │
└─────────────────────────────────────────┘
```

**具体改动**：

1. 移除 Step 1/2/3 的编号标签
2. 将入口方式选择和体验包选择合并到 TabsContent 内部
3. 添加实时链接预览区域（基于当前选择生成，非已保存数据）
4. 保存按钮始终显示（禁用状态表示无变更）

### 2. 添加第4个体验包 - 前端

**文件**: `src/components/partner/EntryTypeSelector.tsx`

```typescript
// 更新体验包定义，添加财富卡点测评
const EXPERIENCE_PACKAGES = [
  { key: 'basic', label: 'AI对话点数', description: '50点', icon: '🤖' },
  { key: 'emotion_health_assessment', label: '情绪健康测评', description: '专业测评', icon: '💚' },
  { key: 'scl90_report', label: 'SCL-90心理测评', description: '心理健康筛查', icon: '📋' },
  { key: 'wealth_block_assessment', label: '财富卡点测评', description: '财富诊断', icon: '💰' },  // 新增
] as const;

// 更新默认值
const DEFAULT_PACKAGES = ['basic', 'emotion_health_assessment', 'scl90_report', 'wealth_block_assessment'];
```

### 3. 添加第4个体验包 - 后端 Edge Function

**文件**: `supabase/functions/claim-partner-entry/index.ts`

```typescript
// 更新默认包列表
const selectedPackages: string[] = partner.selected_experience_packages 
  || ['basic', 'emotion_health_assessment', 'scl90_report', 'wealth_block_assessment'];

// 更新测评包处理逻辑
const assessmentPackages = [
  { key: 'emotion_health_assessment', package_key: 'emotion_health_assessment', package_name: '情绪健康测评' },
  { key: 'scl90_report', package_key: 'scl90_report', package_name: 'SCL-90心理测评报告' },
  { key: 'wealth_block_assessment', package_key: 'wealth_block_assessment', package_name: '财富卡点测评' },  // 新增
];
```

### 4. 实时链接预览功能

在 EntryTypeSelector 组件中添加预览区域：

```typescript
import { getPartnerShareUrl } from "@/utils/partnerQRUtils";

// 计算预览链接
const previewUrl = getPartnerShareUrl(partnerId, entryType, productType);

// 渲染预览区域
<div className="mt-4 p-3 bg-gray-50 rounded-lg border">
  <div className="flex items-center justify-between mb-1">
    <span className="text-xs text-muted-foreground">📎 推广链接预览</span>
    <Button size="sm" variant="ghost" onClick={copyPreviewUrl}>
      <Copy className="w-3 h-3" />
    </Button>
  </div>
  <p className="font-mono text-xs text-gray-700 break-all">{previewUrl}</p>
</div>
```

### 5. Dashboard 数据刷新

**文件**: `src/components/partner/YoujinPartnerDashboard.tsx`

添加 `onUpdate` 回调以确保保存后刷新 `FixedPromoLinkCard`：

```typescript
// 添加 key 来强制刷新
const [refreshKey, setRefreshKey] = useState(0);

<EntryTypeSelector 
  partnerId={partner.id} 
  currentEntryType={partner.default_entry_type || 'free'}
  // ...其他 props
  onUpdate={() => setRefreshKey(k => k + 1)}
/>

<FixedPromoLinkCard 
  key={refreshKey}
  partnerId={partner.id}
  // ...
/>
```

---

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|:----|:--------|:-----|
| `src/components/partner/EntryTypeSelector.tsx` | 重构 | 简化UI布局，添加第4个体验包，添加实时预览 |
| `supabase/functions/claim-partner-entry/index.ts` | 更新 | 添加 wealth_block_assessment 到默认值和处理逻辑 |
| `src/components/partner/YoujinPartnerDashboard.tsx` | 更新 | 添加刷新机制 |

---

## 技术细节

### EntryTypeSelector 新结构

```tsx
<Card>
  <CardHeader>
    <CardTitle>推广入口设置</CardTitle>
    {/* 预购额度提示 */}
  </CardHeader>
  <CardContent>
    <Tabs value={productType}>
      <TabsList>
        <TabsTrigger value="trial_member">尝鲜会员</TabsTrigger>
        <TabsTrigger value="wealth_assessment">财富测评</TabsTrigger>
      </TabsList>
      
      <TabsContent value="trial_member">
        {/* 入口方式 - 直接嵌入，无Step标签 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <EntryCard type="free" selected={entryType === 'free'} />
          <EntryCard type="paid" selected={entryType === 'paid'} />
        </div>
        
        {/* 体验包选择 - 4个选项 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>包含内容</Label>
            <Checkbox label="全选" />
          </div>
          {EXPERIENCE_PACKAGES.map(pkg => (
            <CheckboxItem key={pkg.key} ... />
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="wealth_assessment">
        <p>财富测评固定价格 ¥9.9</p>
      </TabsContent>
    </Tabs>
    
    {/* 实时链接预览 */}
    <LinkPreview url={previewUrl} />
    
    {/* 保存按钮 - 始终显示 */}
    <Button disabled={!hasChanges || saving}>保存设置</Button>
  </CardContent>
</Card>
```

### Edge Function 更新逻辑

第4个体验包（财富卡点测评）的处理方式与情绪健康测评和SCL-90相同：
- 通过 `orders` 表插入一条 `status: 'paid'` 的记录
- `package_key: 'wealth_block_assessment'`
- 用户可在"我的测评"页面看到并使用

