

# /mini-app 轮播图新增「身份绽放训练营」卡片

## 需求
在 `/mini-app` 页面轮播图中新增一张 ¥3980 身份绽放训练营卡片，仅对已登录且历史购买总金额 ≥ ¥399 的用户显示。未登录或购买金额不足的用户不展示此卡片。

## 实现方案

### 1. 新增轮播卡片定义
在 `promoSlides` 数组中追加第三张卡片：
```
{
  id: "identity-bloom",
  emoji: "🌟",
  title: "身份绽放训练营",
  subtitle: "重新定义你是谁 · ¥3980",
  tag: "高端推荐",
  gradient: "from-amber-600 to-rose-500",
  route: "/promo/identity-bloom",
}
```

### 2. 查询用户历史购买总金额
在 `MiniAppEntry` 组件中新增一个 `useQuery`，从 `orders` 表按 `user_id` + `status='paid'` 查询 `SUM(amount)`，返回用户累计付款金额。

### 3. 过滤逻辑
在 `filteredSlides` 的 `useMemo` 中追加：
- 若 `identity-bloom` 卡片：未登录 → 隐藏；已登录但总购买金额 < 399 → 隐藏；已购买 `identity_bloom` → 隐藏
- 同步将 `identity_bloom` 加入 `usePackagesPurchased` 的 key 列表

### 涉及文件
- `src/pages/MiniAppEntry.tsx` — 追加卡片定义、购买金额查询、过滤条件

