

# 修复女性专区插画缓存问题

## 问题原因

Edge Function 确实已重新生成了 `mama` 插画并更新了数据库记录（时间戳 `2026-03-30 09:43:59`），但存储桶中的文件路径没变（仍是 `mama.png`），浏览器和 CDN 缓存了旧的"妈妈抱孩子"图片，导致页面显示未更新。

## 解决方案

在两个加载插画的组件中，给图片 URL 追加 `?t=` 时间戳参数作为 cache-busting，强制浏览器加载最新版本。

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/pages/MiniAppEntry.tsx` | 加载插画数据后，给每个 `image_url` 追加 `?t={created_at时间戳}` |
| `src/components/energy-studio/AudienceHub.tsx` | 同上 |

### 具体改动

在两个文件的 `useEffect` 中，将：
```js
map[row.audience_id] = row.image_url;
```
改为：
```js
map[row.audience_id] = `${row.image_url}?t=${Date.now()}`;
```

这样每次页面加载都会绕过缓存拉取最新图片。零业务逻辑影响，仅影响图片加载。

