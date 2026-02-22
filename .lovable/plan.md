

## 海报工坊优化 - 设计统一 + 分享修复

### 问题诊断

#### A. 设计问题 - teal/cyan 色系未统一

`PosterCenter.tsx` 全页仍使用 teal/cyan 色系，与已统一的品牌橙色不一致：

| 位置 | 当前 | 应改为 |
|------|------|--------|
| 页面背景 | `from-teal-50 via-cyan-50 to-blue-50` | `from-orange-50 via-amber-50 to-orange-100` |
| 快速生成按钮 | `from-teal-500 to-cyan-500` | `from-orange-500 to-amber-500` |
| 加载动画 | `text-teal-500` | `text-orange-500` |
| 出现 6 处 teal/cyan 背景 | 全部 teal | 全部 orange |

#### B. 分享规范问题 - PosterWithCustomCopy.tsx（3 个错误）

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| QR码生成 | 错误 | 直接用 `QRCode.toDataURL` 而非 `useQRCode` hook |
| 域名硬编码 | 错误 | 硬编码 `https://wechat.eugenewe.net` 而非 `getPromotionDomain()` |
| 品牌标识 | 警告 | `有劲AI · 每个人的生活教练` 应为 `Powered by 有劲AI` |

#### C. 分享规范问题 - PosterPreview.tsx（1 个警告）

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| 品牌标识 | 警告 | 小红书版使用 `有劲AI · 科学验证`，应统一为 `Powered by 有劲AI` |

### 改动方案

#### 1. PosterCenter.tsx - teal 全改橙色（6 处）

- 第 103/118/130/350/396/450/548/675 行：`from-teal-50 via-cyan-50 to-blue-50` 改为 `from-orange-50 via-amber-50 to-orange-100`
- 第 121 行：`text-teal-500` 改为 `text-orange-500`
- 第 687 行：快速生成按钮 `from-teal-500 to-cyan-500` 改为 `from-orange-500 to-amber-500`

#### 2. PosterWithCustomCopy.tsx - 修复 3 个分享规范问题

**QR码修复**：
- 移除 `import QRCode from 'qrcode'` 和手动 `useEffect` 生成逻辑
- 改用 `import { useQRCode } from '@/utils/qrCodeUtils'`
- 改用 `import { getPartnerShareUrl } from '@/utils/partnerQRUtils'`

**域名修复**：
- 移除 `const PRODUCTION_DOMAIN = 'https://wechat.eugenewe.net'`
- 使用 `getPartnerShareUrl(partnerId, entryType)` 生成完整 URL（该函数内部已使用 `getPromotionDomain()`）
- posterId 参数通过 URL 拼接追加

**品牌标识修复**：
- `有劲AI · 每个人的生活教练` 改为 `Powered by 有劲AI`

#### 3. PosterPreview.tsx - 修复品牌标识

- 第 312 行：`有劲AI · 科学验证` 改为 `Powered by 有劲AI`

### 涉及文件

| 文件 | 改动 | 说明 |
|------|------|------|
| `src/pages/PosterCenter.tsx` | 中 | 6 处 teal 颜色替换 |
| `src/components/poster/PosterWithCustomCopy.tsx` | 中 | QR码 + 域名 + 品牌标识修复 |
| `src/components/poster/PosterPreview.tsx` | 小 | 品牌标识修复 |

### 无数据库改动

前端样式 + 分享规范修复，共改 3 个文件。

