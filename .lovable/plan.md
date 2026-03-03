

# 修复：分享卡片二维码不显示

## 问题分析

用户截图显示，`generate-share-card` 边缘函数生成的 wealth-info 卡片中，二维码区域只显示白色背景，QR 码图案未渲染。

根因：satori 渲染 `img` 元素时，`width`/`height` 作为 HTML 属性传入，但 satori 要求通过 `style` 属性提供尺寸信息才能正确渲染图片。当前代码：

```js
{ type: 'img', props: { src: qrDataUrl, width: 68, height: 68 } }
```

应改为：

```js
{ type: 'img', props: { src: qrDataUrl, style: { width: 68, height: 68 } } }
```

## 修改范围

**文件：`supabase/functions/generate-share-card/index.ts`**

修改所有 `img` 元素的 `width`/`height`，从 HTML 属性改为 `style` 属性：

1. **createWealthCard 函数** (约第 86 行) — 头像 img
2. **createWealthCard 函数** (约第 216 行) — QR 码 img  
3. **createWealthInfoCard 函数** (约第 303 行) — QR 码 img

每处改为 `{ type: 'img', props: { src: ..., style: { width: N, height: N } } }`，确保 satori 能正确识别图片尺寸并渲染。

