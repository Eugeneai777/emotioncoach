

# 移除轮播图"知乐双效解压"卡片

## 改动

### `src/pages/MiniAppEntry.tsx`（第187-195行）

删除 `promoBanners` 数组中 `id: "men-relief"` 的对象：

```tsx
// 删除这段
{
  id: "men-relief",
  emoji: "💪",
  title: "知乐双效解压",
  subtitle: "身心协同修复",
  tag: "男性专属",
  gradient: "from-blue-500 to-cyan-400",
  route: "/promo/zhile-havruta",
},
```

轮播组件自动适配数组长度，无需其他改动。不影响业务逻辑和排版。

