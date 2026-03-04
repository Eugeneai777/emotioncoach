

# 修复：AI教练解说按钮点击无响应

## 问题分析

`wealth-assessment-realtime-token` 边缘函数日志完全为空，说明语音通话流程在到达 token 请求之前就已经失败退出。

最可能的原因是**全局语音会话锁（VoiceSessionLock）残留**：如果之前有语音会话异常结束（页面刷新、网络中断等），锁没有正确释放，后续所有 `CoachVoiceChat` 启动时 `acquireLock()` 返回 false，显示一个短暂 toast 后立即调用 `onClose()`，用户看到的就是"点了没反应"。

## 修复方案

**文件：`src/components/wealth-block/AssessmentVoiceCoach.tsx`**

在 `handleClick` 中，打开语音通话前先调用 `forceReleaseSessionLock()` 清理可能的残留锁，确保不会因为旧锁阻塞新通话。

```ts
import { forceReleaseSessionLock } from '@/hooks/useVoiceSessionLock';

const handleClick = () => {
  if (disabled) return;
  if (isLimitReached) {
    setShowPayDialog(true);
    return;
  }
  // 清理可能的残留锁，防止"点了没反应"
  forceReleaseSessionLock();
  setShowVoiceChat(true);
};
```

改动约 3 行，仅影响 `AssessmentVoiceCoach` 组件。

