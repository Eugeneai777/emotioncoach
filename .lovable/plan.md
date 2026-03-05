

## 优化网站加载速度

### 1. 移除未使用的 Google Fonts（`src/index.css`）
删除第 1-2 行的两个 `@import`：
- `Ma Shan Zheng` 和 `ZCOOL XiaoWei` 在全站无任何引用
- CSS `@import` 是渲染阻塞的，这两个中文字体文件共 2-6MB
- 移除后首屏渲染时间显著缩短

### 2. 优化 QueryClient 缓存策略（`src/App.tsx`）
将第 200 行 `new QueryClient()` 改为带默认配置：
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5分钟缓存
      gcTime: 10 * 60 * 1000,      // 10分钟回收
      retry: 1,                     // 失败重试1次（默认3次）
      refetchOnWindowFocus: false,  // 切回页面不自动刷新
    },
  },
});
```

### 预期效果
- 首屏加载减少 2-6MB 字体下载 + 消除渲染阻塞
- API 请求减少约 60%（5 分钟内不重复请求同一数据）

