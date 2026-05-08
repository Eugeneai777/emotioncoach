## 问题诊断

你看到的弹窗 `updateAppMessageShareData:ok` 说明 **JSSDK 配置成功、分享数据也写进去了**。但微信仍然展示"光秃秃的域名链接"而不是带标题/描述/图片的卡片，原因在 **缩略图本身**：

```text
当前 og:image = og-general-series-1768516976993.png
  - 尺寸: 1200 × 630 (横版 1.91:1)
  - 大小: 924 KB
```

微信对分享卡片缩略图有硬性限制：
- **官方建议 ≤ 32KB，最大约 128KB**
- **比例必须接近 1:1（正方形）**，横版 1.91:1 在 iOS 微信"发给朋友"卡片里会被判为不合规
- 一旦缩图加载失败/超限，微信会**自动降级为"只显示域名"** —— 正是你看到的现象

OG 图片本来是给 Twitter / FB / 浏览器预览用的（横版 1200×630 是它们的标准），不能直接当微信缩图。

## 解决方案

新增一个**专门用于微信分享卡片**的小尺寸正方形封面，与 OG 横版图分开：

### 1. 数据层
在 `og_configurations` 表新增一列 `wechat_thumb_url`（可空）。`useWechatShare` 优先使用 `wechat_thumb_url`，没有就 fallback 到 `og:image`。

### 2. 生成微信缩图
为 `coach_wealth_coach_4_questions` 这一行生成 **400×400 JPG，<100KB** 的封面：
- 使用现有 `og-general-series` 的核心视觉元素（财富教练徽标 + 主标题）
- 居中正方形构图，文字大、对比强（手机列表里只有 80px 缩图）
- 上传到 `og-images` bucket 命名 `wechat-thumb-wealth-coach-4q.jpg`
- 写回 `wechat_thumb_url` 字段

### 3. 前端改造
- `usePageOG.ts` / `ogConfig.ts`：返回 `wechatThumbUrl`
- `DynamicOGMeta.tsx`：构造一个 `wechatShareImage = wechatThumbUrl || safeShareImage`，单独传给 `useWechatShare({ imgUrl: wechatShareImage, ... })`，OG meta 标签继续用横版图（不影响 SEO/Twitter）
- 同步把 `useMiniProgramShareBridge` 的 `imageUrl` 也切到这张小图（小程序卡片同样要求 5:4 / 1:1 小图）

### 4. 验证清单
- 在微信里打开 `/coach/wealth_coach_4_questions`（**去掉 wxdebug=1**，免得弹框）
- 点 "..." → 发送给朋友 → 应看到带"有劲AI · 财富教练"标题 + 描述 + 正方形小图的卡片
- 转发到朋友圈也确认带图

### 5. 后续推广
同样的问题在所有页面都存在。本次只修 `coach_wealth_coach_4_questions` 验证方案，确认 OK 后下一轮批量给其他高频分享页（情绪健康测评、财富训练营、教练首页等）补微信缩图。

## 预期结果

```text
现在：[域名] wechat.eugenewe.net  ←  WeChat 加载缩图失败的兜底
之后：[小图] 有劲AI • 财富教练
       3步突破5层同频，财富从内而外流动
       wechat.eugenewe.net
```

无任何业务逻辑改动，仅图片资源 + 一个数据库字段 + 一处取值优先级调整。
