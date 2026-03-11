

# 修复所有海报版本在安卓上内容显示不完整

## 问题

所有版本（默认、小红书、微信群、极简、卡片）的海报在安卓上都存在内容溢出/截断问题，朋友圈版已在上次修复。核心原因相同：安卓中文字体行高更大，内容区域撑满后底部QR码和品牌footer被裁剪。

## 修改方案

### PosterPreview.tsx — 3个版本压缩

**默认版 (renderDefaultLayout)**
- 主标语：添加 `overflow: 'hidden'`, `maxHeight: '60px'`
- 卖点：显示最多3条（slice 0,3），gap `6px` → `5px`，padding `8px 12px` → `7px 10px`
- Emoji fontSize `34px` → `30px`
- 整体 padding `20px 16px 14px` → `18px 16px 14px`

**小红书版 (renderXiaohongshuLayout)**
- 主标语：添加 `overflow: 'hidden'`, `maxHeight: '60px'`
- 标签栏 marginBottom `14px` → `10px`
- 产品名 fontSize `20px` → `18px`
- 主标语 marginBottom `14px` → `10px`
- 数据卡片 gap `8px` → `6px`，marginBottom `14px` → `10px`

**微信群版 (renderWechatGroupLayout)**
- 主标语气泡：添加 `overflow: 'hidden'`, `maxHeight: '60px'`
- 卖点列表 padding `12px 14px` → `10px 12px`，gap `8px` → `6px`
- 头像区 marginBottom `14px` → `10px`
- 标语气泡 marginBottom `14px` → `10px`

### PosterWithCustomCopy.tsx — 5个版本压缩

**默认版**
- headline：添加 `overflow: 'hidden'`, `maxHeight: '52px'`
- subtitle marginBottom `6px` → 内联已有
- 卖点显示最多3条，padding `8px 12px` → `7px 10px`

**小红书版**
- headline：添加 `overflow: 'hidden'`, `maxHeight: '48px'`
- 标签区 marginBottom `12px` → `8px`
- subtitle marginBottom `12px` → `8px`
- 数据卡片 gap `8px` → `6px`

**微信群版**
- headline：添加 `overflow: 'hidden'`, `maxHeight: '52px'`
- subtitle marginBottom `16px` → `10px`
- 气泡 gap `10px` → `7px`，padding `10px 14px` → `8px 12px`
- avatars marginBottom `12px` → `8px`

**极简版**
- headline：添加 `overflow: 'hidden'`, `maxHeight: '80px'`
- 分割线 marginBottom `32px` → `20px`

**卡片版**
- headline：添加 `overflow: 'hidden'`, `maxHeight: '48px'`
- 内容卡片 padding `20px` → `16px`
- 卖点显示最多3条，gap `8px` → `6px`，padding `10px 12px` → `8px 10px`

## 涉及文件

- `src/components/poster/PosterPreview.tsx`
- `src/components/poster/PosterWithCustomCopy.tsx`

