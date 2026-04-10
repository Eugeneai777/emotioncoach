

# 给 ¥389 落地页添加分享海报功能

## 改动

### 1. 新建 `src/components/promo/ZhileCoachShareCard.tsx`

参考 `SynergyShareCard.tsx`，使用 `ShareCardBase` 创建专属海报卡片：
- 背景：暖橙色渐变（与页面风格一致）
- 内容：badge "30分钟1V1深度咨询"、标题"¥389 身心诊断体验"、3个亮点（1V1教练诊断 / 知乐胶囊 / 专属服务群）
- 二维码指向 `/promo/zhile-coach`
- 使用 `sharePath` 带上 `ref=share` 参数

### 2. 修改 `src/pages/ZhileCoachPromoPage.tsx`

- 引入 `useShareDialog`、`ShareDialogBase`、`ZhileCoachShareCard`
- 在吸底栏左侧添加分享图标按钮（与 SynergyPromoPage 一致的圆形按钮），不需要登录即可点击
- 页面底部添加 `ShareDialogBase` 弹窗，包含预览卡和导出卡

### 不改的
- 不改数据库
- 不改其他页面
- 复用现有 `ShareDialogBase` + `ShareCardBase` + `useShareDialog` 架构

