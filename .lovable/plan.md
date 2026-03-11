

# 安卓海报底部文字截断修复方案

## 问题根因

海报容器使用固定高度（如 300×533px），内容通过 `position: absolute; inset: 0` + flexbox 排列。在安卓设备上，由于字体渲染差异（中文字体行高更大），内容实际高度可能超出容器，导致底部的二维码区域和品牌 footer 被 `overflow: hidden` 裁剪。

同时，`generateCanvasInternal` 的 `onclone` 回调仅在 iOS 上设置了显式高度，安卓设备上克隆元素高度不受控制，html2canvas 以 `explicitHeight` 裁剪画布，底部内容丢失。

## 修改计划

### 1. `src/utils/shareCardConfig.ts` — onclone 安卓兼容

在 `onclone` 回调中，为安卓设备也设置显式的 `height` 和 `overflow: hidden`，确保克隆元素与画布尺寸一致：

```typescript
// 当前：仅 iOS 设置高度
if (isIOSDevice()) {
  element.style.overflow = 'hidden';
  element.style.maxHeight = `${elementHeight}px`;
  element.style.height = `${elementHeight}px`;
}

// 改为：所有设备都设置
element.style.overflow = 'hidden';
element.style.height = `${elementHeight}px`;
element.style.maxHeight = `${elementHeight}px`;
```

### 2. `src/components/poster/PosterPreview.tsx` — 压缩默认布局间距

让内容在 533px 高度内完全展示：

- **Emoji**：fontSize `40px` → `34px`，marginBottom `10px` → `6px`
- **产品名 h2**：fontSize `22px` → `20px`
- **定位语 badge**：marginBottom `10px` → `6px`
- **主标语**：margin-bottom `16px` → `10px`
- **卖点卡片**：padding `10px 14px` → `8px 12px`，gap `8px` → `6px`
- **QR 区域**：padding `12px` → `10px`，QR 图片 `60px` → `55px`
- **品牌 footer**：marginTop `10px` → `6px`
- **容器 padding**：`24px 18px 16px` → `20px 16px 14px`

对朋友圈版、小红书版、微信群版做类似的间距压缩。

### 3. `src/components/poster/PosterWithCustomCopy.tsx` — 压缩专家模式布局间距

对 default/moments/xiaohongshu/wechat_group/minimal 五种布局：

- **容器 padding**：各减少 2-4px
- **ProductBadge**：marginBottom `8px` → `6px`
- **标题**：fontSize 各减 1-2px
- **卖点区域**：padding 和 gap 各减 2px
- **QRSection**：padding `12px` → `10px`，QR 码 `65px` → `55px`
- **BrandFooter**：marginTop `8px` → `4px`

### 4. `src/components/poster/PosterPreview.tsx` — 添加安全 minHeight 防护

在 renderQRSection 外层容器添加 `flexShrink: 0`，确保 QR 区域不被 flex 压缩：

```typescript
// QR section wrapper
<div style={{ flexShrink: 0 }}>
  {renderQRSection()}
</div>
```

## 预期效果

- 安卓设备生成海报时，底部二维码和品牌文字完整显示
- 内容在所有尺寸（标准 9:16、朋友圈 1:1 等）下不溢出
- iOS 行为不受影响

