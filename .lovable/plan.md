

## 需求

复制 `/scl90-lite` 页面为一个新的免费版本，去掉支付流程，完成答题后直接查看结果。不改动原页面任何逻辑。

## 修改计划

### 1. 新建 `src/pages/SCL90Free.tsx`

基于 `SCL90Lite.tsx` 复制，移除以下内容：
- `useSCL90Purchase` hook 调用
- `hasPurchased` 判断逻辑
- `showPayDialog` 状态
- `handlePaymentSuccess` 回调
- `SCL90PayDialog` 组件渲染

`handleComplete` 简化为：答题完成 → 直接计算结果 → 进入结果页。

`showFooterInfo` 固定传 `false`（不显示付费提示）。

### 2. `src/App.tsx` — 注册路由

新增 `/scl90-free` 路由指向 `SCL90Free`。

| 文件 | 操作 |
|------|------|
| `src/pages/SCL90Free.tsx` | 新建 |
| `src/App.tsx` | 添加路由 |

共约 40 行新代码，0 行现有代码修改。

