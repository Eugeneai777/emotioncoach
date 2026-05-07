## 需求
生成 `/emotion-health` 售前页的二维码，用户扫码即可进入售前页并开始测评。

## 方案
使用在线二维码服务直接生成 PNG 图片，目标 URL：

```
https://wechat.eugenewe.net/emotion-health
```

（按项目标准外部域名 `wechat.eugenewe.net`）

### 输出
- 生成 1024x1024 高清二维码 PNG，保存到 `/mnt/documents/emotion-health-qr.png`
- 使用 Python `qrcode` 库本地生成（高纠错级别 H，便于打印/添加 logo）
- 可选：再生成一个带标题文字「扫码开始情绪健康测评」的海报版（同目录 `emotion-health-qr-poster.png`）方便分享

### 不涉及
- 不修改任何前端代码
- 不在 App 内嵌入二维码组件（如需要再单独提需求）

## 询问
是否需要带品牌 logo / 海报背景？默认我会生成两版：
1. 纯二维码（1024x1024）
2. 带标题+副标题的简洁海报版（750x1100）