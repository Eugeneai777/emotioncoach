

## 修复 Bug #322：未付费用户可以直接开启21天情绪训练营

### 根因分析

在 `src/pages/Index.tsx`（情绪教练主页），"开启训练营" 按钮触发的 `StartCampDialog` 传入了一个硬编码的 `campTemplate` 对象，但**缺少 `price` 字段**：

```js
campTemplate={{
  camp_type: 'emotion_journal_21',
  camp_name: '21天情绪日记训练营',
  duration_days: 21,
  icon: '📝'
  // price 缺失!
}}
```

在 `StartCampDialog` 中，购买校验逻辑如下：

```js
const isFree = campTemplate.price === 0 
  || campTemplate.price === undefined  // <-- undefined 被判定为免费
  || campTemplate.price === null;
const needsPurchase = !isFree && !hasPurchased;
```

因为 `price` 是 `undefined`，`isFree` 为 `true`，所以**完全跳过了购买校验**，任何用户都可以直接开启训练营。

数据库中该训练营实际售价为 **399 元**。

### 修复方案

在 `src/pages/Index.tsx` 的硬编码 `campTemplate` 中补充 `price` 和 `original_price` 字段：

```js
campTemplate={{
  camp_type: 'emotion_journal_21',
  camp_name: '21天情绪日记训练营',
  duration_days: 21,
  icon: '📝',
  price: 399,
  original_price: 399,
}}
```

### 改动文件

- `src/pages/Index.tsx`（约第585-590行）：为 campTemplate 添加 `price: 399, original_price: 399`

### 影响范围

修复后：
- 未购买用户点击"开启训练营"会看到"需要购买此训练营"提示弹窗
- 已购买用户不受影响，可正常开启
- 免费训练营（price=0）不受影响
