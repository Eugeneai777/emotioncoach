

# 优化：海报生成使用 JPEG 格式 + 限制缩放

## 问题

当前 `canvasToBlob` 始终使用 PNG 格式，文件大（通常 1-3MB），导致上传慢、保存慢。

## 修复方案

两处改动：

### 1. `src/utils/shareCardConfig.ts` — `canvasToBlob` 改用 JPEG

将默认格式从 `image/png` 改为 `image/jpeg`，质量 0.85，大图降至 0.75。JPEG 文件体积通常只有 PNG 的 1/5~1/3。

```typescript
export const canvasToBlob = (canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const pixels = canvas.width * canvas.height;
    const adaptiveQuality = pixels > 1000000 ? 0.75 : quality;
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', adaptiveQuality);
  });
};
```

同步更新 `generateCardBlob` 以及 `uploadShareImage` 中文件扩展名从 `.png` 改为 `.jpg`，contentType 改为 `image/jpeg`。

### 2. `src/pages/PosterCenter.tsx` — 添加 `forceScale: 2`

限制 canvas 缩放倍率，避免高端手机生成 3x-4x 的超大 canvas：

```typescript
const blob = await generateCardBlob(posterRef, {
  explicitWidth: selectedPosterSize.width,
  explicitHeight: selectedPosterSize.height,
  forceScale: 2,
});
```

### 3. `src/utils/shareImageUploader.ts` — 文件名和类型改为 JPEG

### 文件变更汇总

| 文件 | 变更 |
|------|------|
| `src/utils/shareCardConfig.ts` | `canvasToBlob` 改用 `image/jpeg`，降低质量参数 |
| `src/pages/PosterCenter.tsx` | `generateCardBlob` 调用增加 `forceScale: 2` |
| `src/utils/shareImageUploader.ts` | 文件扩展名 `.png` → `.jpg`，contentType → `image/jpeg` |

预期效果：海报文件体积缩小 3-5 倍，生成和上传速度大幅提升。

