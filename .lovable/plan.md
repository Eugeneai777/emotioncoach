

# 修复情绪健康测评支付逻辑错误

## 问题根因

`AssessmentPayDialog` 组件设计时假设只用于财富卡点测评，内部硬编码了多处 `wealth_block_assessment`，导致情绪健康测评调用时：
- 错误检测财富测评的购买状态
- 创建的订单属于财富测评产品
- 显示的产品名称是"财富卡点测评"

## 解决方案

将 `AssessmentPayDialog` 改造为通用组件，通过 props 传入产品信息。

## 具体修改

### 第一步：扩展 AssessmentPayDialog Props

```typescript
interface AssessmentPayDialogProps {
  // 现有 props...
  
  // 🆕 新增产品配置 props
  packageKey: string;      // 如 'emotion_health_assessment'
  packageName: string;     // 如 '情绪健康测评'
  price?: number;          // 可选，不传则从数据库获取
}
```

### 第二步：替换所有硬编码

| 位置 | 原代码 | 修改后 |
|------|--------|--------|
| 第 83 行 | `'wealth_block_assessment'` | `packageKey` prop |
| 第 426 行 | `.eq('package_key', 'wealth_block_assessment')` | `.eq('package_key', packageKey)` |
| 第 491 行 | `packageKey: "wealth_block_assessment"` | `packageKey: packageKey` |
| 第 492 行 | `packageName: "财富卡点测评"` | `packageName: packageName` |
| 第 559-561 行 | 同上 | 同上 |

### 第三步：更新 EmotionHealthPage 调用

```typescript
<AssessmentPayDialog
  open={showPayDialog}
  onOpenChange={setShowPayDialog}
  onSuccess={handlePaymentSuccess}
  userId={user?.id}
  hasPurchased={hasPurchased}
  packageKey="emotion_health_assessment"     // 🆕 指定产品
  packageName="情绪健康测评"                  // 🆕 指定名称
/>
```

### 第四步：更新 WealthBlockAssessment 调用

保持向后兼容，同时显式传入参数：

```typescript
<AssessmentPayDialog
  // ...existing props
  packageKey="wealth_block_assessment"
  packageName="财富卡点测评"
/>
```

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/wealth-block/AssessmentPayDialog.tsx` | 修改 | 添加 packageKey/packageName props，替换硬编码 |
| `src/pages/EmotionHealthPage.tsx` | 修改 | 传入正确的产品参数 |
| `src/pages/WealthBlockAssessment.tsx` | 修改 | 显式传入产品参数（向后兼容） |

## 技术细节

### 价格获取逻辑

```typescript
// 优先使用 props 传入的价格，否则从数据库查询
const { data: packages } = usePackages();
const assessmentPrice = price ?? getPackagePrice(packages, packageKey, 9.9);
```

### 购买检查逻辑

```typescript
const { data: existingOrder } = await supabase
  .from('orders')
  .select('id')
  .eq('user_id', userId)
  .eq('package_key', packageKey)  // 使用动态 packageKey
  .eq('status', 'paid')
  .limit(1)
  .maybeSingle();
```

## 预期效果

修复后：
- 情绪健康测评将正确检查 `emotion_health_assessment` 的购买状态
- 创建的订单 `package_key` 为 `emotion_health_assessment`
- 支付弹窗显示"情绪健康测评"产品名称
- 财富卡点测评功能不受影响

