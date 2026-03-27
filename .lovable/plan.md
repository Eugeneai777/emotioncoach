

# 分享流程极简重构：参考小鹅通，一键转发/保存

## 核心问题

1. **复制链接按钮干扰**：占据主按钮区空间，用户不需要
2. **生成慢**：html2canvas 渲染复杂卡片耗时长
3. **转发失败**：微信环境 `navigator.share` 不可靠，按钮形同虚设
4. **步骤太多**：弹窗预览 → 生成 → 二次预览 → 再操作，链路太长

## 方案：一键生成 + 极简操作面板

参考小鹅通：点击分享 → 直接生成海报 → 全屏展示 + 底部两个大按钮（保存/转发）。去掉中间的弹窗预览步骤。

### A. `src/components/ui/share-dialog-base.tsx` 改造

1. **复制链接按钮**改为次要入口：移到 footer hint 区域，变成小字链接"复制链接"，不再占主按钮空间
2. **主按钮**文案统一为"生成海报"，移除"保存分享卡片"分支
3. 加 loading 进度提示（"正在生成海报..."）替代空白等待

### B. `src/components/ui/share-image-preview.tsx` 极简重构

底部操作区重构为**两个并排大按钮**（参考小鹅通）：

```
┌─────────────────────────────────┐
│         [海报图片预览]            │
│                                 │
├─────────────────────────────────┤
│  [💾 保存图片]  [📤 转发朋友]     │  ← 并排大按钮
│       长按图片也可保存            │  ← 小字提示
└─────────────────────────────────┘
```

- **保存图片**：所有环境都显示，调用 `handleDownload`
- **转发朋友**：所有环境都显示
  - 微信 H5/小程序：`navigator.share` 尝试 → 失败则 toast "请长按图片转发"
  - 手机浏览器：`navigator.share({ files: [...] })`
  - 桌面端：`navigator.share` 或 fallback 到 toast 提示
- 移除单独的"返回"按钮，改为顶部 X 关闭
- 移除底部桌面端的大号"保存图片"+"返回"双栈布局，统一用并排按钮

### C. 微信全端兼容保障

| 环境 | 保存 | 转发 |
|------|------|------|
| 微信小程序 | HTTPS URL → download按钮 + 长按 | navigator.share → fallback长按提示 |
| 微信 H5 | HTTPS URL → download按钮 + 长按 | navigator.share → fallback长按提示 |
| 电脑微信 | HTTPS URL → download按钮 | navigator.share → fallback提示 |
| 手机浏览器 | blob URL → download | navigator.share |
| 桌面浏览器 | blob URL → download | navigator.share |

`handleShareWithFallback` 已处理上传逻辑（微信Android自动上传获取HTTPS URL），保持不变。

## 改动文件

| 文件 | 改动 |
|------|------|
| `src/components/ui/share-dialog-base.tsx` | 复制链接按钮降级为小字链接；主按钮文案统一 |
| `src/components/ui/share-image-preview.tsx` | 底部重构为并排双按钮极简布局，桌面/移动统一风格 |

