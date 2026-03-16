

# 在 /mini-app 页面隐藏浮动语音按钮

## 改动内容

**文件**: `src/components/FloatingVoiceButton.tsx`

在第15行的 `EXCLUDED_ROUTES` 数组中添加 `/mini-app`，使浮动按钮不在首页显示：

```typescript
const EXCLUDED_ROUTES = ['/auth', '/wechat-auth', '/coach/vibrant_life_sage', '/parent-coach', '/', '/mini-app'];
```

这是一行改动，立即生效。

