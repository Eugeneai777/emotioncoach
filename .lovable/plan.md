
# 分享卡片统一性修复方案

## 一、审计结果汇总

经过对所有分享卡片的详细审计，发现以下不一致问题：

### 1.1 品牌标识不一致

| 卡片 | 当前品牌文案 | 问题 |
|------|-------------|------|
| AliveCheckShareCard | "有劲生活 · 生活管理" | 过时品牌 |
| EmotionButtonShareCard | "有劲生活 · 情绪梳理教练" | 过时品牌 |
| ShareCard (社区) | "有劲AI · 情绪日记" | 带后缀 |
| TransformationValueShareCard | "有劲AI · 财富教练" | 带后缀 |
| SCL90ShareCard | "Powered by 有劲AI" | **正确** |
| EmotionHealthShareCard | "Powered by 有劲AI" | **正确** |

**统一标准**: `Powered by 有劲AI`

### 1.2 QR码生成方式不一致

| 卡片 | QR实现方式 | 问题 |
|------|-----------|------|
| AliveCheckShareCard | 直接 `QRCode.toDataURL` | 未复用标准hook |
| EmotionButtonShareCard | 直接 `QRCode.toDataURL` | 未复用标准hook |
| ShareCard (社区) | 直接 `QRCode.toDataURL` | 未复用标准hook |
| TransformationValueShareCard | `useQRCode` hook | **正确** |
| SCL90ShareCard | `useQRCode` hook | **正确** |
| EmotionHealthShareCard | `useQRCode` hook | **正确** |

**统一标准**: 使用 `useQRCode` hook

### 1.3 卡片宽度不一致

| 卡片 | 宽度 | 问题 |
|------|------|------|
| EmotionButtonShareCard | 600px | 过宽 |
| ShareCard (社区) | 600px | 过宽 |
| AliveCheckShareCard | 420px | 略宽 |
| 其他卡片 | 320-340px | **标准** |

**建议标准**: 
- 结果类/测评类: 340px
- 工具介绍类: 380-420px (内容较多)
- 社区帖子类: 保持600px (图文混排需要)

## 二、修复计划

### 2.1 AliveCheckShareCard.tsx 修复

**修改内容**:
1. 品牌文案: `有劲生活 · 生活管理` → `Powered by 有劲AI`
2. QR码生成: 直接调用 → `useQRCode` hook
3. 移除 `onReady` 回调 (hook自带loading状态)

```typescript
// Before
import QRCode from 'qrcode';
const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
useEffect(() => { QRCode.toDataURL(...) }, []);

// After
import { useQRCode } from '@/utils/qrCodeUtils';
const shareUrl = partnerCode 
  ? `${getPromotionDomain()}/energy-studio?tool=alive-check&ref=${partnerCode}`
  : `${getPromotionDomain()}/energy-studio?tool=alive-check`;
const { qrCodeUrl, isLoading } = useQRCode(shareUrl);
```

### 2.2 EmotionButtonShareCard.tsx 修复

**修改内容**:
1. 品牌文案: `有劲生活 · 情绪梳理教练` → `Powered by 有劲AI`
2. QR码生成: 直接调用 → `useQRCode` hook
3. 移除 `onReady` 回调

### 2.3 ShareCard.tsx (社区) 修复

**修改内容**:
1. 品牌文案: `有劲AI · 情绪日记` → `Powered by 有劲AI`
2. QR码生成: 直接调用 → `useQRCode` hook

### 2.4 TransformationValueShareCard.tsx 修复

**修改内容**:
1. 品牌文案: `有劲AI · 财富教练` → `Powered by 有劲AI`

## 三、文件修改清单

| 文件路径 | 操作 | 修改内容 |
|---------|------|---------|
| `src/components/tools/AliveCheckShareCard.tsx` | 修改 | QR hook + 品牌统一 |
| `src/components/tools/EmotionButtonShareCard.tsx` | 修改 | QR hook + 品牌统一 |
| `src/components/community/ShareCard.tsx` | 修改 | QR hook + 品牌统一 |
| `src/components/wealth-block/TransformationValueShareCard.tsx` | 修改 | 品牌统一 |

## 四、代码变更详情

### 4.1 AliveCheckShareCard.tsx

```typescript
// 1. 替换 import
- import QRCode from 'qrcode';
+ import { useQRCode } from '@/utils/qrCodeUtils';
+ import { getPromotionDomain } from '@/utils/partnerQRUtils';

// 2. 替换 QR 生成逻辑
- const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
- useEffect(() => { ... }, [partnerCode, onReady]);
+ const shareUrl = partnerCode 
+   ? `${getPromotionDomain()}/energy-studio?tool=alive-check&ref=${partnerCode}`
+   : `${getPromotionDomain()}/energy-studio?tool=alive-check`;
+ const { qrCodeUrl, isLoading } = useQRCode(shareUrl);
+ 
+ useEffect(() => {
+   if (!isLoading) onReady?.();
+ }, [isLoading, onReady]);

// 3. 修改品牌文案
- <div style={{ fontSize: '10px', color: '#be185d', opacity: 0.7 }}>
-   有劲生活 · 生活管理
- </div>
+ <div style={{ fontSize: '10px', color: '#be185d', opacity: 0.7 }}>
+   Powered by 有劲AI
+ </div>
```

### 4.2 EmotionButtonShareCard.tsx

```typescript
// 1. 替换 import
- import QRCode from 'qrcode';
+ import { useQRCode } from '@/utils/qrCodeUtils';

// 2. 替换 QR 生成逻辑
- const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
- useEffect(() => { ... }, [partnerCode, onReady]);
+ const shareUrl = partnerCode 
+   ? `${getPromotionDomain()}/energy-studio?ref=${partnerCode}`
+   : `${getPromotionDomain()}/energy-studio`;
+ const { qrCodeUrl, isLoading } = useQRCode(shareUrl);
+ 
+ useEffect(() => {
+   if (!isLoading) onReady?.();
+ }, [isLoading, onReady]);

// 3. 修改品牌水印
- 有劲生活 · 情绪梳理教练
+ Powered by 有劲AI
```

### 4.3 ShareCard.tsx (社区)

```typescript
// 1. 替换 import
- import QRCode from "qrcode";
+ import { useQRCode } from "@/utils/qrCodeUtils";

// 2. 替换 QR 生成逻辑
- const [qrCodeUrl, setQrCodeUrl] = useState("");
- useEffect(() => {
-   const qrUrl = getQRCodeUrl(partnerInfo, post);
-   QRCode.toDataURL(qrUrl, { width: 120, margin: 1 }).then(setQrCodeUrl);
- }, [partnerInfo, post]);
+ const qrUrl = getQRCodeUrl(partnerInfo, post);
+ const { qrCodeUrl } = useQRCode(qrUrl);

// 3. 修改品牌文案
- <p className={cn("font-bold mb-2", ...)}>
-   有劲AI · 情绪日记
- </p>
+ <p className={cn("font-bold mb-2", ...)}>
+   Powered by 有劲AI
+ </p>
```

### 4.4 TransformationValueShareCard.tsx

```typescript
// 修改品牌文案
- <span>有劲AI · 财富教练</span>
+ <span>Powered by 有劲AI</span>
```

## 五、统一后的标准规范

### 5.1 品牌标识规范

所有分享卡片底部统一使用：
```
Powered by 有劲AI
```

样式规范：
- 字号: 10-11px
- 颜色: 根据卡片主题选择 (深色卡片用 white/40, 浅色卡片用对应主题色/70)
- 位置: 卡片最底部居中

### 5.2 QR码生成规范

统一使用 `useQRCode` hook：
```typescript
import { useQRCode } from '@/utils/qrCodeUtils';

const { qrCodeUrl, isLoading } = useQRCode(shareUrl, 'SHARE_CARD');
```

配置标准：
- 预设: `SHARE_CARD` (width: 120, margin: 1)
- 颜色: 黑底白底 (#000000 / #ffffff)

### 5.3 域名使用规范

所有外部分享链接使用 `getPromotionDomain()`:
```typescript
import { getPromotionDomain } from '@/utils/partnerQRUtils';

const shareUrl = `${getPromotionDomain()}/target-page`;
```

## 六、预期效果

| 指标 | 修复前 | 修复后 |
|-----|--------|--------|
| 品牌一致性 | 4种不同文案 | 统一 "Powered by 有劲AI" |
| QR码实现 | 3种不同方式 | 统一 useQRCode hook |
| 代码复用率 | ~60% | ~95% |
| 维护成本 | 高 | 低 |

## 七、验证方案

修改完成后，在分享卡片管理面板 `/admin/share-cards` 中：
1. 逐一预览所有卡片
2. 检查品牌标识是否统一
3. 测试图片生成功能
4. 确认QR码正常显示
