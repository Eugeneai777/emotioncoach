

# 阶段二：购买成功后展示企微二维码引导卡片

## 用户场景

用户在 `/promo/synergy` 完成支付 → 看到 SuccessPanel（购买成功页）→ 页面中新增一个「添加教练微信」卡片，展示企微二维码 → 用户长按/扫码添加 → 点击「进入训练营」继续。

## 改动范围（2个文件）

### 1. 复制企微二维码图片到项目
- 将用户上传的企微二维码图片复制到 `src/assets/wecom-coach-qr.jpg`

### 2. 修改 SuccessPanel — `src/pages/SynergyPromoPage.tsx`

在 SuccessPanel 的「7天情绪成长训练营已开通」卡片下方、按钮区域上方，新增企微引导卡片：

```text
现有卡片结构:
  ✅ 知乐胶囊已安排发货
  💡 建议收到胶囊后再开启训练营
  🧠 7天情绪成长训练营已开通
  ── 新增：企微教练卡片 ──     ← 插入位置
  [进入情绪成长训练营] 按钮
  [查看订单与物流] 按钮
```

**企微卡片设计**：
- 深色主题卡片（与 SuccessPanel 风格一致），渐变边框（emerald/teal）
- 标题：「👨‍🏫 添加主教练微信，加入学员互助群」
- 副文案：「获得真人教练 1v1 指导、参加线上冥想直播、学员社群互助交流」
- 居中展示企微二维码图片（圆角、白色背景内衬，确保扫码可识别）
- 底部小字提示：「长按识别二维码添加」

### 3. 同步修改 WealthSynergyPromoPage 的 SuccessPanel
- 同样在 `src/pages/WealthSynergyPromoPage.tsx` 的 SuccessPanel 中添加相同的企微引导卡片（配色改为金色系以匹配主题）

## 不受影响的内容
- 支付流程、训练营开通逻辑零改动
- 未购买用户看不到此卡片（SuccessPanel 仅在 `alreadyPurchased` 为 true 时渲染）
- 手机端自动适配（二维码居中、卡片全宽）
- `/promo/zhile-havruta` 不受影响

