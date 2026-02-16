

# 修复分享卡片预览显示被裁剪的问题

## 问题分析

从截图看，卡片在对话框中的**预览区域**被裁剪了——头像和用户名部分不可见，只从"财富卡点测评"标题开始显示。

原因是 `WealthInviteCardDialog` 中设置了：
- `previewHeight={340}` — 预览容器高度为 340px
- `previewScale={0.55}` — 卡片缩放到 55%

卡片实际高度约 600px，缩放后约 330px，理论上刚好能放下。但 `ShareDialogBase` 的预览容器使用了 `overflow: hidden`，加上 `origin-top` 的缩放方式，如果卡片实际高度超出预期，顶部不会被裁剪，但底部可能溢出。

不过从截图看是**顶部被裁剪**，可能是容器内对齐方式的问题，或者卡片高度在有内容时超出了预设值。

## 修改方案

### 文件：`src/components/wealth-camp/WealthInviteCardDialog.tsx`

1. 增大 `previewHeight` 从 `340` 到 `400`，给卡片更充足的显示空间
2. 调整 `previewScale` 从 `0.55` 到 `0.5`，让卡片缩小一点以完整显示

改动位置（约第 321 行）：
```
previewHeight={activeTab === 'achievement' ? 360 : 400}
previewScale={0.5}
```

### 文件：`src/components/ui/share-dialog-base.tsx`（可选）

如果上述调整不够，可以将预览容器的 `overflow: hidden` 改为 `overflow: auto`，允许用户滚动查看完整卡片。但通常增大高度和减小缩放就足够了。

## 预期效果

- 预览区域能完整显示卡片的所有内容（头像、标题、分数、CTA、二维码等）
- 不再有顶部或底部被裁剪的情况
