## 诊断结论

当前失败的是第 8/10 题「半开的门」图片，数据库里配置的是：

```text
/assessment-media/q6_door.jpg
```

文件本身存在，问题主要出在前一次为提速加入的自动 WebP 优先逻辑：组件看到 `.jpg` 后会先尝试加载同名 `.webp`：

```text
/assessment-media/q6_door.webp
```

但这个文件不存在。部分浏览器/微信小程序 WebView 在 `<picture><source>` 选中了不存在的 WebP 后，不会稳定回退到原始 JPG，于是直接进入「图片加载失败」，点重试也只是重复同一个失败路径。

## 修复计划

1. **移除不安全的自动 WebP 猜测**
   - 不再对所有 `.jpg/.png` 自动插入同名 `.webp`。
   - 避免浏览器优先选择一个不存在的资源。

2. **改成显式图片候选链**
   - 先加载数据库配置的真实 URL。
   - 如果原图是 `.webp`，失败后再回退到 `.jpg`（当前 `q1_spiral.webp` 已有 `q1_spiral.jpg` 兜底）。
   - 如果原图是 `.jpg`，就直接加载 `.jpg`，不再先猜 `.webp`。

3. **优化重试体验**
   - 点击重试时重新从第一个真实候选地址加载，并追加缓存破坏参数。
   - 只有所有候选都失败时，才显示「图片加载失败，点击重试」。

4. **补充资源一致性检查**
   - 确认 `/assessment-media/q1_spiral.webp`、`q1_spiral.jpg`、`q6_door.jpg` 均存在。
   - 不改题目、分数、顺序和结果逻辑。

## 涉及文件

```text
src/components/dynamic-assessment/QuestionMedia.tsx
```

## 预期效果

- 「半开的门」题直接加载 `q6_door.jpg`，不会再被不存在的 `q6_door.webp` 拦截。
- 第一题 WebP 如果在某些端不兼容，会自动回退到 JPG。
- 小程序端图片加载失败率降低，重试按钮不再重复失败路径。