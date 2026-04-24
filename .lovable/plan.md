## 问题诊断

`/xiaojin` 智能语音连接界面频繁显示"网络较差"红色徽标，但用户实际网络正常。

### 根因

`src/hooks/useNetworkQuality.ts` 中的 RTT 阈值划分过于严苛：

| 当前阈值 | 评级 | 问题 |
|---|---|---|
| < 100ms | excellent | 仅本地或同区域网络可达 |
| < 200ms | good | |
| < 400ms | fair | 实际中国家庭宽带访问 Google STUN 普遍在 200-400ms |
| ≥ 400ms | **poor（红色"网络较差"）** | 误报高发区 |

测量方式问题更大：使用 **`stun:stun.l.google.com:19302`**（Google STUN 服务器）。在中国大陆，访问 Google STUN 经常被 GFW 干扰、丢包、绕路，RTT 普遍 300-800ms，**这并不代表用户网络差，只代表到 Google 的链路差**——而真正的语音通话是连到我们的 OpenAI 代理（eugenetalk.net），完全是另一条链路。

所以"每次都显示网络较差"是必然的，与用户实际带宽无关。

## 解决方案

### 1. 增加国内可达的 STUN 服务器并降低权重

把 STUN 列表改为同时包含国内可达节点，优先尝试低延迟节点：

```ts
const STUN_SERVERS = [
  'stun:stun.miwifi.com',           // 小米（国内）
  'stun:stun.qq.com:3478',          // 腾讯（国内）
  'stun:stun.l.google.com:19302',   // 兜底
];
```

### 2. 放宽 RTT 阈值到符合中国互联网现实的水平

```ts
if (measuredRtt < 200) return 'excellent';   // 原 100
if (measuredRtt < 400) return 'good';        // 原 200
if (measuredRtt < 800) return 'fair';        // 原 400 → 黄色"网络一般"，不再轻易触发警告
return 'poor';                                // ≥ 800ms 才算差
```

### 3. 测量失败时默认 `good` 而不是 `unknown`

当前 `measureStunRtt` 返回 `null` 时会回落到 connection type；如果浏览器（如微信 WebView）连 `navigator.connection` 都没有，会停留在 `unknown`，UI 可能继续显示告警。改为：测量失败 + 无 connection 信息时，**默认返回 `good`**，避免空报警。

### 4. （可选）连接进度页只在 `poor` 时显示红色徽标

`ConnectionProgress.tsx` 当前只要不是 excellent/good 就会显示黄色"网络不稳定"提示条。保持现状即可，但因为阈值放宽，绝大多数用户会落在 good 区间，警告自然消失。

## 改动文件

- `src/hooks/useNetworkQuality.ts` —— 调整 STUN 列表 + 阈值 + fallback 默认值

## 不改的部分

- `NetworkCheckDialog`、`ConnectionProgress`、`VoiceNetworkWarning` 三个组件的 UI 逻辑保留，仅由数据源（quality 值）驱动改善。
- 计费、超短通话退款等其它逻辑不变。

## 预期效果

- 国内用户在普通家庭宽带 / 4G / 5G 下，RTT 测量值通常 200-400ms，将稳定显示**绿色"网络良好"**，不再弹出红色"网络较差"。
- 仅在真实弱网（高延迟、移动信号差、跨境绕路严重）时才显示告警，回归告警的本意。
