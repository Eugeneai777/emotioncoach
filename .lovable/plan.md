## 目标
让 `/promo/midlife-women-399`（7天身心舒展营）在小程序环境弹出兑换框时，展示女性专属的有赞小程序码（用户新上传的那张），H5 环境仍跳转已配置的 `WOMEN_YOUZAN_URL`，不影响男性 7天有劲训练营页面。

## 改动

1. **新增图片资源**
   - 把 `user-uploads://c41255e1272ebe7469f756a9e1869065.png` 复制到 `src/assets/youzan-miniprogram-qr-women.png`。

2. **`src/components/promo/SynergyRedeemDialog.tsx`**
   - 新增可选 prop：`miniProgramQr?: string`。
   - 小程序环境下渲染的 `<img>` 改为 `src={miniProgramQr || youzanMiniQr}`（默认仍是男性版二维码，保持向后兼容）。
   - 其它逻辑（H5 跳 `youzanUrl`、兑换接口、登录校验）保持不变。

3. **`src/pages/PromoMidlife25to45Women399.tsx`**
   - 导入新图：`import womenYouzanQr from "@/assets/youzan-miniprogram-qr-women.png";`
   - 给 `<SynergyRedeemDialog ... />` 新增 `miniProgramQr={womenYouzanQr}`。

## 不动的部分
- 兑换码库、edge function、`WOMEN_YOUZAN_URL`、男性 7天有劲页面、文案。
