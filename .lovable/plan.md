

## 问题诊断

**桌面端无法长按保存海报** 的根本原因：

| 端口 | 当前行为 | 问题 |
|---|---|---|
| **手机微信/iOS/Android H5** | `ShareImagePreview` 显示「👆 长按保存到相册」 ✅ | 正常 |
| **PC 浏览器（含 Mac/Win）** | `executeOneClickShare` / `ShareDialogBase` 在桌面走 `navigator.share` 或直接 `<a download>` 触发文件下载，**不进入预览页** ❌ | 用户根本看不到海报，更别提"长按保存或转发到微信" |
| **PC 微信（小程序/客户端）** | UA 含 `micromessenger`，会进入预览页，但底部提示是「长按上方图片保存到相册」（鼠标无法长按）❌ | 用户卡住，不知怎么保存/转发 |

**影响范围**（全站统一组件，问题完全一致）：
- 所有用 `ShareDialogBase` 的售前/结果页：SBTI、中场觉醒力、SCL-90、35+女性、情绪健康、财富卡点、动态测评通用模板…
- 所有用 `executeOneClickShare` 的卡片：SBTI 结果页、Insight 卡片、训练营邀请卡

## 解决方案（一处改全站修复）

只改 2 个共享文件，**全站所有测评的售前页+结果页同步修复**，零业务回归。

### 改动 1：`src/utils/shareUtils.ts` — 桌面端也走预览

把 `shouldUseImagePreview()` 从「只移动端」扩到「所有端」。`handleShareWithFallback` 在桌面端也走 `showUploadedPreview()`，跳过不可靠的 `navigator.share` 和静默下载。

```ts
// 改为：所有端都进入预览页（统一体验）
export const shouldUseImagePreview = (): boolean => true;
```

同步在 `handleShareWithFallback` 把 desktop 分支也改成 `showUploadedPreview()`；`oneClickShare.ts` 第 182-211 行的桌面 navigator.share + 下载兜底替换为 `showUploadedPreview()`。

### 改动 2：`src/components/ui/share-image-preview.tsx` — 智能底部按钮

按 4 种环境分别显示对应操作：

| 环境 | 主按钮 | 副提示 |
|---|---|---|
| **手机微信** (iOS/Android) | 无按钮，显示「👆 长按上方图片保存到相册」 | 保存后可转发到微信/朋友圈 |
| **PC 微信小程序** (检测 `isMiniProgram` + 非移动) | 「📥 保存图片」（点击下载到本地）+「右键图片→另存为」备用 | 保存后可拖到微信窗口转发好友 |
| **PC 浏览器**（非微信） | 「📥 保存图片」（下载） | 保存后可上传到微信/社交软件 |
| **手机非微信浏览器** | 「📥 保存图片」（已有，保留） | 保存后可在社交软件中转发 |

新增桌面友好提示：
- 桌面用户告知「右键图片可直接复制 / 另存为」
- PC 微信用户额外提示「将图片拖入微信对话框即可发送」
- 复制链接按钮在桌面端置顶显示（PC 用户更习惯复制链接）

### 改动 3（可选增强）：`ShareDialogBase` 桌面端布局优化

桌面 viewport（≥1024px）时：
- 预览图旁边显示「右键 → 图片另存为」hint
- 「复制链接」按钮加大、更显眼，与"生成海报"并列

## 兼容性验证表

| 端口 | SBTI 售前页 | SBTI 结果页 | 其他测评 | 转发到微信 |
|---|---|---|---|---|
| iPhone Safari | ✅ 长按保存 | ✅ 长按保存 | ✅ | ✅ 微信选图 |
| Android Chrome | ✅ 系统分享面板 / 长按 | 同左 | ✅ | ✅ |
| 手机微信 | ✅ 长按保存 | ✅ 长按保存 | ✅ | ✅ 转发朋友圈 |
| **PC 浏览器** | ✅ **新增预览+下载按钮** | ✅ | ✅ | ✅ 下载后拖入微信 |
| **PC 微信小程序** | ✅ **新增预览+下载** | ✅ | ✅ | ✅ 拖入微信对话框 |
| **PC 微信客户端 H5** | ✅ 同上 | ✅ | ✅ | ✅ |

## 不会改动的部分

- 海报内容、卡片样式、分享 URL、二维码
- 移动端现有「长按保存」体验完全保留
- `uploadShareImage` 上传链路不动
- 各测评页业务逻辑零侵入（只改 2 个底层 utils + 1 个预览组件）

## 交付物

- `src/utils/shareUtils.ts`：`shouldUseImagePreview` 常量化、桌面分支改预览
- `src/utils/oneClickShare.ts`：桌面分支改预览（不再静默下载）
- `src/components/ui/share-image-preview.tsx`：4 种环境智能底部提示 + PC 友好操作
- 自检：桌面浏览器 + PC 微信 + 手机微信分别测一遍 SBTI 售前/结果页

