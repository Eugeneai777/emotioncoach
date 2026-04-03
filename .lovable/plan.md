

# 359元商品小程序环境适配

## 方案

与1159元商品完全一致的适配方式：

1. **保存小程序码图片** — 将用户上传的359商品小程序码保存为 `src/assets/youzan-store-1pack-qr.png`

2. **更新 `YOUZAN_QR_MAP`** — 在两个文件中新增359商品的映射：

```typescript
const YOUZAN_QR_MAP: Record<string, string> = {
  '26x5yk7m5xg6hyx': youzan4packQr,   // 1159四瓶装
  '3ept17m02a8x5x3': youzan1packQr,   // 359单瓶装
};
```

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/assets/youzan-store-1pack-qr.png` | 新增，359商品小程序码 |
| `src/components/store/HealthStoreGrid.tsx` | import 新图片，YOUZAN_QR_MAP 加一行 |
| `src/components/store/ProductDetailDialog.tsx` | 同上 |

