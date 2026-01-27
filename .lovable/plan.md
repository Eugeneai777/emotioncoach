
# 修复 requestIdleCallback 兼容性问题

## 问题代码

`src/utils/shareCardConfig.ts` 第 145-150 行：

```typescript
// 应用启动时预加载
if (typeof window !== 'undefined') {
  // 延迟预加载，避免阻塞初始渲染
  requestIdleCallback?.(() => preloadCommonAssets()) ?? 
    setTimeout(preloadCommonAssets, 2000);
}
```

## 问题原因

| 访问方式 | 变量不存在时的行为 |
|----------|---------------------|
| `requestIdleCallback?.()` | 抛出 `ReferenceError`，应用崩溃白屏 |
| `typeof requestIdleCallback` | 安全返回 `"undefined"` |

可选链 `?.` 只能处理 `undefined` 或 `null` 值，无法处理完全未声明的变量。

## 修复方案

**修改第 145-150 行**：

```typescript
// 应用启动时预加载
if (typeof window !== 'undefined') {
  // 延迟预加载，避免阻塞初始渲染
  // 使用 typeof 检查避免 ReferenceError（Safari/微信不支持 requestIdleCallback）
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => preloadCommonAssets());
  } else {
    setTimeout(preloadCommonAssets, 2000);
  }
}
```

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/utils/shareCardConfig.ts` | 第 145-150 行使用 `typeof` 安全检查 |

## 预期效果

Safari、iOS Safari、微信浏览器等不支持 `requestIdleCallback` 的环境将不再白屏，应用正常启动。
