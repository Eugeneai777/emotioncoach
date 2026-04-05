

## 问题分析

图片不断重载的根本原因：**每次渲染都在图片 URL 后面拼接 `?t=${Date.now()}`**（第 359 行），导致每次组件 re-render 或 state 变化时，URL 都不同，浏览器无法使用缓存，反复重新请求图片。

同时，同一张图片在卡片中被引用了 2-3 次（背景水印 + 圆形图标 + 探索区块），每次 URL 带不同时间戳就会触发多次加载。

## 修复方案

**修改文件**: `src/pages/MiniAppEntry.tsx`

1. **移除 `Date.now()` 时间戳后缀**：将第 359 行的 `${row.image_url}?t=${Date.now()}` 改为直接使用 `row.image_url`，让浏览器正常缓存图片。

2. **用 `useQuery` 替代手动 `useEffect`**：将插画数据的获取改为 `useQuery`（项目已引入 tanstack-query），设置 `staleTime: Infinity`，确保整个会话内只请求一次，即使组件重新挂载也不会重复加载。

3. **给 `<img>` 标签添加 `loading="lazy"`**：对背景水印图片（第 429 行）补充 `loading="lazy"`，减少首屏同时加载的图片数量。

### 改动量
- 仅修改 `src/pages/MiniAppEntry.tsx`，约 15 行改动

