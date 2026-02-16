

## 修复：Safari 中连接一直转圈

### 问题根因

Safari 支持 WebRTC，所以系统选择了 WebRTC 直连 OpenAI 的路径。但由于网络环境限制（中国大陆），对 `api.openai.com` 的 SDP 请求会失败。

关键问题在于：**WebRTC 连接失败后的 WebSocket 降级条件太严格**。

当前代码（CoachVoiceChat.tsx 第 1324-1328 行）只在以下条件下降级到 WebSocket：
- `errorType === 'region_blocked'`
- `errorType === 'forbidden'`
- `statusCode === 403`
- 错误信息包含 `'403'` 或 `'unsupported_country'`

但在 Safari 中，对 OpenAI 的 fetch 请求可能因为 DNS 解析失败、网络超时或 CORS 错误而直接抛出 `TypeError: Failed to fetch`，这种错误不会匹配上述任何条件，导致直接进入通用错误处理，显示"连接失败"而不是降级到 WebSocket。

### 修复方案

**文件：`src/components/coach/CoachVoiceChat.tsx`**

扩大 WebRTC 失败时自动降级到 WebSocket 的条件范围。将目前仅针对"地区封锁"的降级逻辑改为：**所有 WebRTC 连接失败都尝试降级到 WebSocket**。

理由：WebSocket relay 是一个可靠的备用通道，无论 WebRTC 因何原因失败（地区限制、DNS 失败、Safari 兼容问题、网络超时等），都应该尝试 WebSocket。

具体修改（约第 1320-1366 行）：

```text
修改前：
  catch (webrtcError) {
    // 只在 region_blocked / forbidden / 403 时降级
    const isRegionBlocked = ...;
    if (isRegionBlocked) {
      // 降级到 WebSocket
    }
    throw webrtcError;  // 其他错误直接抛出
  }

修改后：
  catch (webrtcError) {
    // 所有 WebRTC 失败都尝试降级到 WebSocket
    console.log('[VoiceChat] WebRTC failed, falling back to WebSocket relay...');
    toast({ title: "正在切换通道", description: "正在使用备用语音通道..." });
    // 清理 WebRTC 连接
    chat.disconnect();
    chatRef.current = null;
    // 切换到 WebSocket relay 模式
    // ...（复用现有降级代码）
  }
```

### 变更文件

| 文件 | 修改内容 |
|------|---------|
| `src/components/coach/CoachVoiceChat.tsx` | WebRTC catch 块中，移除 `isRegionBlocked` 条件判断，所有 WebRTC 失败都降级到 WebSocket relay |

### 修复后效果

- Safari 用户：WebRTC 连接失败 -> 自动降级到 WebSocket relay -> 正常通话
- Chrome 用户（可直连 OpenAI）：行为不变，WebRTC 成功则直接使用
- Chrome 用户（被封锁）：行为改善，任何 WebRTC 失败都会快速降级
- 微信小程序：不受影响，本来就直接走 WebSocket

