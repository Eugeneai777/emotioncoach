

# 健康商城1159商品小程序环境适配

## 问题

1159元四瓶装商品的有赞链接在小程序 WebView 中无法通过 `window.open` 跳转。

## 方案

参照 `SynergyRedeemDialog` 模式：小程序环境下弹出小程序码弹窗，让用户长按识别前往下单。

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/assets/youzan-store-4pack-qr.png` | 新增，从用户上传的截图中提取小程序码图片 |
| `src/components/store/HealthStoreGrid.tsx` | 引入 `detectPlatform`；`handleBuy` 中小程序环境 + external_url 时弹出小程序码弹窗；新增 Dialog 展示小程序码 |
| `src/components/store/ProductDetailDialog.tsx` | 同样适配：接收小程序环境回调，详情页购买按钮在小程序环境触发弹窗而非跳转 |

### 核心逻辑

```typescript
import { detectPlatform } from "@/lib/platformDetector";
import youzan4packQr from "@/assets/youzan-store-4pack-qr.png";

// 商品 external_url 中的有赞标识 → 对应小程序码
const YOUZAN_QR_MAP: Record<string, string> = {
  '26x5yk7m5xg6hyx': youzan4packQr, // 1159四瓶装
};

const isMiniProgram = detectPlatform() === 'mini_program';

// handleBuy 中：
if (product.external_url) {
  if (isMiniProgram) {
    // 从 URL 中匹配商品标识，找到对应小程序码
    const match = Object.keys(YOUZAN_QR_MAP).find(k => product.external_url!.includes(k));
    if (match) {
      setQrImage(YOUZAN_QR_MAP[match]);
      setQrDialogOpen(true);
      return;
    }
  }
  window.open(product.external_url, '_blank');
  return;
}
```

弹窗 UI：展示小程序码 + "长按识别小程序码前往下单" 提示，与 SynergyRedeemDialog 风格一致。

> 359元商品暂不处理，等用户后续提供小程序码后再添加到 `YOUZAN_QR_MAP`。

