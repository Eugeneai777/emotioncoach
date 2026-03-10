

# 修复：返回按钮应自动挂断语音通话

## 问题

`CoachVoiceChat.tsx` 左上角返回按钮（ChevronLeft）直接调用 `onClose`（即 `navigate(-1)`），没有执行挂断流程（断开连接、退款、记录会话等）。导致页面跳转了但语音连接仍在后台运行。

## 修复方案

将返回按钮的 `onClick` 从直接调用 `onClose` 改为调用 `endCall`，让它走和挂断按钮相同的流程。`endCall` → `performEndCall` 内部最终会调用 `onClose` 完成导航。

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/components/coach/CoachVoiceChat.tsx` | 返回按钮 onClick 改为调用 `endCall`，通话未连接时保留直接 `onClose` |

### 核心逻辑（约第 2182-2189 行）

```tsx
// 之前
onClick={onClose}

// 之后
onClick={(e) => {
  if (status === 'idle' || status === 'disconnected' || status === 'error') {
    onClose();
  } else {
    endCall(e);
  }
}}
```

当通话处于 `connected` 或 `connecting` 状态时，走 `endCall` 流程（断开连接 → 退款 → 记录 → `onClose`）。当通话已结束或未开始时，直接返回。

