

# 修复安卓海报内容溢出问题

## 问题分析

从截图看，用户使用的是**朋友圈版（moments）**布局。在安卓设备上：
- 主标语 `fontSize: '18px'` + `lineHeight: 1.5` 占用过多垂直空间，长文本（如"测完这个我才知道，原来我潜意识里一直在推开钱......"）导致下方内容溢出
- 卖点气泡 `padding: '10px 14px'` + `gap: '10px'` 间距过大
- QR 区域被推出容器底部，显示不完整

第二张图（iPhone）显示正确效果：标语字号适中，卖点紧凑，QR 完整显示。

## 修改方案

### `src/components/poster/PosterPreview.tsx` — moments 布局压缩

| 元素 | 当前值 | 修改为 |
|------|--------|--------|
| Emoji fontSize | 42px | 36px |
| Emoji marginBottom | 6px | 4px |
| 产品名 fontSize | 18px | 16px |
| 产品名区 marginBottom | 12px | 8px |
| **主标语 fontSize** | **18px** | **15px** |
| 主标语 lineHeight | 1.5 | 1.4 |
| 主标语 marginBottom | 20px | 12px |
| 卖点 gap | 10px | 7px |
| 卖点 padding | 10px 14px | 8px 12px |
| 卖点 fontSize | 13px | 12px |
| 卖点 marginBottom | 16px | 10px |
| 情感引导语 marginBottom | 12px | 8px |

同时对主标语容器添加 `overflow: 'hidden'`、`maxHeight` 限制，防止极长文本撑破布局。

### `src/components/poster/PosterWithCustomCopy.tsx` — moments 布局同步

朋友圈版的 headline `fontSize: '24px'` 也偏大，压缩到 `20px`，subtitle marginBottom `20px` → `12px`。

### 其他版本检查

默认版、小红书版、微信群版在上次修改中已有 `flex: 1` + `flexShrink: 0` 弹性空间，本次重点修复 moments 版。

## 涉及文件

- `src/components/poster/PosterPreview.tsx` — moments 布局间距压缩
- `src/components/poster/PosterWithCustomCopy.tsx` — moments 布局同步压缩

