
## 有劲合伙人页面优化方案（Matrix 表格展示版）

### 需求分析

根据用户截图和要求，需要：
1. 将体验包内容（4项）以 Matrix 表格形式展示
2. 将可分成产品（11款）以 Matrix 表格形式展示
3. 保持与现有产品中心（截图所示）一致的表格风格

### 涉及文件

| 文件 | 操作 | 修改内容 |
|:-----|:-----|:---------|
| `src/config/youjinPartnerProducts.ts` | 新建 | 体验包内容和可分成产品配置 |
| `src/config/productComparison.ts` | 修改 | 增加"可分成产品"和"体验包内容"对比项 |
| `src/pages/YoujinPartnerIntro.tsx` | 修改 | 添加体验包和可分成产品 Matrix 展示 |
| `src/pages/YoujinPartnerPlan.tsx` | 修改 | 更新体验包描述文案 |
| `src/pages/PartnerTypeSelector.tsx` | 修改 | 更新有劲合伙人说明文案 |
| `src/components/ProductComparisonTable.tsx` | 修改 | 更新"可分发的体验包"区域为4项内容 |

---

### 1. 新建配置文件 `src/config/youjinPartnerProducts.ts`

```typescript
// 体验包包含的 4 项内容
export const experiencePackageItems = [
  { key: 'ai_points', name: 'AI对话点数', value: '50点', icon: '🤖' },
  { key: 'emotion_health', name: '情绪健康测评', value: '1次', icon: '💚' },
  { key: 'scl90', name: 'SCL-90心理测评', value: '1次', icon: '📋' },
  { key: 'wealth_block', name: '财富卡点测评', value: '1次', icon: '💰' },
];

// 可分成产品（11款）
export const commissionableProducts = [
  { category: '基础产品', name: '尝鲜会员', price: 9.9 },
  { category: '测评服务', name: '情绪健康测评', price: 9.9 },
  { category: '测评服务', name: 'SCL-90心理测评', price: 9.9 },
  { category: '测评服务', name: '财富卡点测评', price: 9.9 },
  { category: '年度会员', name: '365会员', price: 365, highlight: true },
  { category: '训练营', name: '21天情绪日记训练营', price: 299 },
  { category: '训练营', name: '财富觉醒训练营', price: 299 },
  { category: '训练营', name: '21天青少年困境突破营', price: 299 },
  { category: '合伙人套餐', name: '初级合伙人', price: 792 },
  { category: '合伙人套餐', name: '高级合伙人', price: 3217 },
  { category: '合伙人套餐', name: '钻石合伙人', price: 4950 },
];

export const totalCommissionableCount = 11;
```

---

### 2. 修改 `src/config/productComparison.ts`

在 `youjinPartnerFeatures` 数组中增加两个新类别：

```typescript
// 在佣金权益后添加

// 体验包内容（新类别）
{ name: "AI对话点数", category: "体验包内容", l1: "50点", l2: "50点", l3: "50点" },
{ name: "情绪健康测评", category: "体验包内容", l1: "1次", l2: "1次", l3: "1次" },
{ name: "SCL-90心理测评", category: "体验包内容", l1: "1次", l2: "1次", l3: "1次" },
{ name: "财富卡点测评", category: "体验包内容", l1: "1次", l2: "1次", l3: "1次" },

// 可分成产品（新类别）
{ name: "尝鲜会员 ¥9.9", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "情绪健康测评 ¥9.9", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "SCL-90测评 ¥9.9", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "财富卡点测评 ¥9.9", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "365会员 ¥365", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "情绪日记训练营 ¥299", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "财富觉醒训练营 ¥299", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "青少年困境突破营 ¥299", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "初级合伙人 ¥792", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "高级合伙人 ¥3,217", category: "可分成产品", l1: true, l2: true, l3: true },
{ name: "钻石合伙人 ¥4,950", category: "可分成产品", l1: true, l2: true, l3: true },
```

同时更新类型定义：
```typescript
export interface ComparisonFeature {
  name: string;
  category: '基础信息' | '教练空间' | '成长工具' | '学习课程' | '训练营' | '佣金权益' | '专属权益' | '体验包内容' | '可分成产品';
  tooltip?: string;
}
```

---

### 3. 修改 `src/pages/YoujinPartnerIntro.tsx`

在"核心价值"卡片后添加两个 Matrix 表格：

**3.1 导入依赖**

```typescript
import { ResponsiveComparison } from "@/components/ui/responsive-comparison";
import { 
  experiencePackageItems, 
  commissionableProducts, 
  totalCommissionableCount 
} from "@/config/youjinPartnerProducts";
```

**3.2 新增"体验包内容" Matrix（在核心价值卡片后）**

```tsx
{/* 体验包内容 - Matrix 展示 */}
<Card className="border-teal-200 bg-gradient-to-br from-teal-50/50 to-cyan-50/50">
  <CardHeader>
    <CardTitle className="text-xl flex items-center gap-2">
      <Gift className="w-5 h-5 text-teal-500" />
      体验包内容（共4项）
    </CardTitle>
    <CardDescription>用户扫码后将获得以下全部权益</CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveComparison
      columns={[
        { header: "权益项目" },
        { header: "内容", highlight: true },
      ]}
      rows={experiencePackageItems.map(item => ({
        label: `${item.icon} ${item.name}`,
        values: [item.value]
      }))}
    />
  </CardContent>
</Card>
```

**3.3 新增"可分成产品" Matrix**

```tsx
{/* 可分成产品 - Matrix 展示 */}
<Card>
  <CardHeader>
    <CardTitle className="text-xl flex items-center gap-2">
      <TrendingUp className="w-5 h-5 text-orange-500" />
      可分成产品一览（{totalCommissionableCount}款）
    </CardTitle>
    <CardDescription>用户购买以下任意产品，您都能获得佣金</CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveComparison
      columns={[
        { header: "产品类别" },
        { header: "产品名称" },
        { header: "价格", highlight: true },
      ]}
      rows={commissionableProducts.map((product, idx, arr) => {
        // 判断是否为该类别第一个产品
        const isFirstInCategory = idx === 0 || arr[idx - 1].category !== product.category;
        return {
          label: isFirstInCategory ? product.category : '',
          values: [product.name, `¥${product.price}`]
        };
      })}
    />
  </CardContent>
</Card>
```

**3.4 更新 FAQ 第三条**

```tsx
<div className="space-y-2">
  <p className="font-medium">Q: 可以分成哪些产品？</p>
  <p className="text-sm text-muted-foreground">
    A: 所有有劲产品线共11款付费产品（不含绽放训练营）。详见上方"可分成产品一览"。
  </p>
</div>
```

---

### 4. 修改 `src/pages/YoujinPartnerPlan.tsx`

更新体验包描述（约第521行附近）：

```tsx
// 原：'用户低门槛体验 AI 对话 + 3项专业测评'
// 改为：
'用户低门槛体验：AI对话50点 + 3项专业测评（共4项权益）'
```

---

### 5. 修改 `src/pages/PartnerTypeSelector.tsx`

更新有劲合伙人说明（约第151-157行）：

```tsx
<ul className="space-y-1 text-sm text-muted-foreground">
  <li>• 预购100-1000份体验包（含4项权益）</li>
  <li>• 通过分发体验包建立用户关系</li>
  <li>• 用户购买11款有劲产品都能分成</li>
  <li>• 佣金比例20%-50%，取决于预购数量</li>
  <li>• 适合长期经营，建立私域流量</li>
</ul>
```

---

### 6. 修改 `src/components/ProductComparisonTable.tsx`

更新"可分发的体验包"区域（约第588-639行），将"二选一"改为"4项内容"：

```tsx
<Card className="border-purple-200 dark:border-purple-800">
  <CardContent className="p-4 space-y-4">
    <div className="flex items-center gap-2">
      <span className="text-xl">🎁</span>
      <h4 className="font-bold text-base">体验包内容（共4项）</h4>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* AI对话点数 */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200 text-center">
        <span className="text-2xl">🤖</span>
        <p className="font-medium text-sm mt-1">AI对话点数</p>
        <p className="text-xs text-blue-600">50点</p>
      </div>
      
      {/* 情绪健康测评 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 text-center">
        <span className="text-2xl">💚</span>
        <p className="font-medium text-sm mt-1">情绪健康测评</p>
        <p className="text-xs text-green-600">1次</p>
      </div>
      
      {/* SCL-90测评 */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-200 text-center">
        <span className="text-2xl">📋</span>
        <p className="font-medium text-sm mt-1">SCL-90测评</p>
        <p className="text-xs text-amber-600">1次</p>
      </div>
      
      {/* 财富卡点测评 */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-200 text-center">
        <span className="text-2xl">💰</span>
        <p className="font-medium text-sm mt-1">财富卡点测评</p>
        <p className="text-xs text-purple-600">1次</p>
      </div>
    </div>
    
    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
      <p className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
        <span>用户扫码即可获得以上全部4项权益，并<strong className="text-foreground">永久绑定</strong>为您的学员。</span>
      </p>
    </div>
  </CardContent>
</Card>
```

---

### UI 效果预览

#### 体验包内容 Matrix

```text
┌─────────────────────────┬──────────┐
│ 权益项目                 │ 内容     │
├─────────────────────────┼──────────┤
│ 🤖 AI对话点数            │ 50点     │
│ 💚 情绪健康测评           │ 1次      │
│ 📋 SCL-90心理测评         │ 1次      │
│ 💰 财富卡点测评           │ 1次      │
└─────────────────────────┴──────────┘
```

#### 可分成产品 Matrix

```text
┌──────────┬────────────────────┬──────────┐
│ 产品类别  │ 产品名称            │ 价格     │
├──────────┼────────────────────┼──────────┤
│ 基础产品  │ 尝鲜会员            │ ¥9.9    │
├──────────┼────────────────────┼──────────┤
│ 测评服务  │ 情绪健康测评         │ ¥9.9    │
│          │ SCL-90心理测评       │ ¥9.9    │
│          │ 财富卡点测评         │ ¥9.9    │
├──────────┼────────────────────┼──────────┤
│ 年度会员  │ 365会员             │ ¥365    │
├──────────┼────────────────────┼──────────┤
│ 训练营    │ 21天情绪日记训练营   │ ¥299    │
│          │ 财富觉醒训练营       │ ¥299    │
│          │ 21天青少年困境突破营  │ ¥299    │
├──────────┼────────────────────┼──────────┤
│ 合伙人    │ 初级合伙人          │ ¥792    │
│ 套餐      │ 高级合伙人          │ ¥3,217  │
│          │ 钻石合伙人          │ ¥4,950  │
└──────────┴────────────────────┴──────────┘
```

#### 产品中心对比表新增行

在现有 Matrix 表格（如截图所示）中增加两个新类别：

```text
┌─────────────────┬──────────┬──────────┬──────────┐
│ 权益项目         │ 初级合伙人 │ 高级合伙人 │ 钻石合伙人 │
├─────────────────┼──────────┼──────────┼──────────┤
│ 【体验包内容】   │          │          │          │
│ AI对话点数       │ 50点     │ 50点     │ 50点     │
│ 情绪健康测评      │ 1次      │ 1次      │ 1次      │
│ SCL-90心理测评    │ 1次      │ 1次      │ 1次      │
│ 财富卡点测评      │ 1次      │ 1次      │ 1次      │
├─────────────────┼──────────┼──────────┼──────────┤
│ 【可分成产品】   │          │          │          │
│ 尝鲜会员 ¥9.9    │ ✓        │ ✓        │ ✓        │
│ 情绪健康测评     │ ✓        │ ✓        │ ✓        │
│ ... 其他9款产品  │ ✓        │ ✓        │ ✓        │
└─────────────────┴──────────┴──────────┴──────────┘
```
