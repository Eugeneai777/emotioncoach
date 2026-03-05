

## 分析

浏览器的"允许使用麦克风"弹窗是**操作系统/浏览器原生行为**，我们的代码无法完全控制它。但不同环境表现不同：

| 环境 | 权限持久性 |
|------|-----------|
| Chrome/Safari 桌面 | 授权后永久记住（同域名） |
| 微信内置浏览器 | 可能每次会话重置 |
| 小程序 WebView | 取决于 `app.json` 中的 `scope.record` 授权 |

## 我们能做到的

通过创建**模块级麦克风管理器**，可以确保：

1. **同一次访问中**：只弹一次对话框，后续录音复用已缓存的 MediaStream
2. **浏览器已记住权限时**：通过 `navigator.permissions.query` 检测到 `granted` 状态，静默获取流，**完全不弹窗**
3. **微信环境权限被重置时**：无法避免首次弹窗（这是系统限制），但同一会话内不再重复

## 实现计划

### 1. 创建 `src/utils/microphoneManager.ts`
- 模块级单例，缓存 MediaStream
- `acquireMicrophone()`：先用 Permissions API 检查状态，`granted` 则静默获取；否则正常请求（触发弹窗）
- `releaseMicrophone()`：释放资源
- `getStream()`：返回缓存流或获取新流

### 2. 更新 `VoiceInputButton.tsx`
- 移除组件内 `streamRef` 管理逻辑，改用共享 microphoneManager

### 3. 更新 `VoiceCustomerSupport.tsx`
- 同样改用共享 microphoneManager

## 结论

- 标准浏览器（Chrome/Safari）：用户授权一次后，后续登录**不会再弹窗**（浏览器自身记住）
- 微信浏览器/小程序：如果环境重置了权限，**首次使用仍会弹窗一次**，这是系统限制无法绕过，但同一会话内不会重复弹

