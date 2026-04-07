
# 微信环境长按保存失败：检查结论与修复计划

## 检查结论

问题基本已经定位，不是单纯“提示文案不对”，而是**分享链路本身还不可靠**：

1. **当前预览先显示的是 `blob:` URL**
   - `src/utils/shareUtils.ts` 里 `showUploadedPreview()` 先 `URL.createObjectURL(blob)` 立即展示。
   - 微信里长按保存 `blob:` 图片本来就不稳定，很多机型会直接失败。

2. **升级成 HTTPS 的后台上传，大概率会失败**
   - `src/utils/shareImageUploader.ts` 把图片上传到 `partner-assets/temp-share/...`
   - 但现有存储策略只允许：
     - partner 自己目录上传，或
     - `authenticated` 用户上传
   - `/promo/identity-bloom` 是公开售前页，微信访客通常**未登录**，所以这里很可能上传失败，最终一直停留在 `blob:` URL。

3. **界面会误导用户过早长按**
   - `ShareImagePreview` 现在一打开就提示“长按上方图片保存到相册”
   - 但此时图片可能还只是本地 blob，还没升级到可保存的 HTTPS 图。

4. **缓存还会把失败结果记住**
   - `src/components/ui/share-dialog-base.tsx` 用 `cachedBlobUrlRef` 缓存已生成海报
   - 如果第一次缓存的是 `blob:` URL，后续再次打开可能继续复用这个不可长按保存的地址。

## 需要怎么改

### 1. 先修正上传通道，让未登录微信用户也能拿到 HTTPS 图片

核心目标：**公开售前页生成的海报，必须能在未登录状态下上传成功。**

推荐方案二选一，优先方案 A：

#### 方案 A：新增专用公开分享桶
新增一个专门给公开分享海报用的存储桶，例如 `public-share-images`：

- bucket 设为 `public = true`
- 允许 `anon, authenticated` 插入
- 可选限制路径前缀为 `promo-share/`
- 前端把分享海报上传改到这个桶，不再复用 `partner-assets`

这样最干净，避免把 partner 资产桶和公开分享海报混在一起。

#### 方案 B：继续用 `partner-assets`，但补 anon 上传策略
不太推荐，但也能修：
- 给 `partner-assets` 增加 `TO anon` 的 INSERT 策略
- 同时最好限制只能写入 `temp-share/` 前缀

问题是这个桶原本是 partner 业务资产桶，职责会混乱。

## 2. 预览页增加“上传中/可保存”状态，而不是一上来就让用户长按

### `src/components/ui/share-image-preview.tsx`
新增一个状态，例如：
- `isRemoteReady?: boolean`
- `isUpgrading?: boolean`

逻辑改为：

- **微信里如果还是 blob/data URL**
  - 显示：`正在准备可保存图片，请稍候...`
  - 底部小字说明：`图片准备完成后再长按保存`
- **当切换成 https:// URL 后**
  - 再显示：`长按上方图片保存到相册`

这样用户不会在错误时机操作。

## 3. 分享逻辑要把“URL 是否已升级成功”显式传出来

### `src/utils/shareUtils.ts`
现在 `onShowPreview` 只传一个 url，不够区分状态。

建议改为传结构化数据，例如：
```ts
onShowPreview?: (payload: {
  url: string;
  isRemoteReady: boolean;
}) => void;
```

流程变成：

- 先回调 `{ url: blobUrl, isRemoteReady: false }`
- 上传成功后回调 `{ url: httpsUrl, isRemoteReady: true }`
- 上传失败时不要继续假装可长按保存，而是明确保持 false

## 4. `ShareDialogBase` 不要缓存不可保存的 blob 结果

### `src/components/ui/share-dialog-base.tsx`
当前 `cachedBlobUrlRef` 会缓存任何 url。

应改为：

- **只缓存 HTTPS 结果**
- 或至少分开缓存：
  - `cachedPreviewUrl`
  - `cachedRemoteReady`
- 如果是微信环境且 `remoteReady = false`，再次打开时应触发重新上传，而不是直接复用 blob

这是避免“第一次失败后永久失败感”的关键。

## 5. `shareImageUploader` 改成专用公开路径

### `src/utils/shareImageUploader.ts`
如果采用方案 A，则改为：
- bucket：`public-share-images`
- path：`promo-share/${Date.now()}-${random}.png`

并保留 `getPublicUrl()`。

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/utils/shareUtils.ts` | 预览回调改为携带 remote-ready 状态 |
| `src/components/ui/share-image-preview.tsx` | 微信场景增加“准备中 / 可长按”状态提示 |
| `src/components/ui/share-dialog-base.tsx` | 只缓存可保存的 HTTPS 结果，避免复用 blob |
| `src/utils/shareImageUploader.ts` | 改用公开分享海报专用 bucket/路径 |
| `supabase/migrations/...sql` | 新增公开分享海报 bucket 与 anon/authenticated 上传策略 |

## 预期效果

修完后，微信里的体验会变成：

1. 点击“生成海报”
2. 先快速看到预览
3. 底部显示“正在准备可保存图片，请稍候”
4. 后台上传成功后，自动切换为 HTTPS 图
5. 文案切换为“长按上方图片保存到相册”
6. 此时长按保存才真正可用

## 补充判断

从现有代码看，这次问题**大概率不是海报生成本身失败**，而是：
- 生成成功了
- 但**未登录微信用户无法把图片上传成公网 HTTPS 地址**
- 所以长按保存一直失败

这是目前最需要优先修的点。
