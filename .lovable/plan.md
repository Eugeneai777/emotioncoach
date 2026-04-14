

# 小程序环境下产品体验计划跳转适配

## 问题
微信小程序 WebView 中 `window.open` 无法打开外部链接，导致"产品体验计划"点击无反应。

## 方案
复用项目已有的小程序适配模式（与健康商城、协同套餐一致）：
- 检测当前环境是否为小程序（`detectPlatform() === 'mini_program'`）
- **H5/Web 环境**：保持 `window.open` 跳转
- **小程序环境**：点击后弹出 Dialog，展示用户上传的腾讯文档小程序码图片，提示"长按识别小程序码填写问卷"

## 修改文件
**`src/pages/MyPage.tsx`**（唯一改动文件）：
1. 导入 `detectPlatform`、`Dialog` 组件、小程序码图片
2. 添加 `isMiniProgram` 判断和 `qrDialogOpen` 状态
3. Card 的 `onClick` 根据环境分支处理
4. 添加 Dialog 展示小程序码图片

## 资源
- 将用户上传的小程序码图片复制到 `src/assets/survey-miniprogram-qr.jpg`

