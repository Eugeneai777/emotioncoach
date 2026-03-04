

# 修复：每次点击麦克风都弹出权限对话框

## 问题原因

`VoiceInputButton` 每次录音结束后调用 `stream.getTracks().forEach(track => track.stop())`，释放了麦克风流。在微信浏览器中（尤其 iOS），释放流后下次调用 `getUserMedia` 会重新弹出权限对话框（权限不持久化）。

## 修复方案

**文件：`src/components/coach/VoiceInputButton.tsx`**

1. **缓存 MediaStream**：用 `useRef` 保存已获取的麦克风流，录音结束后不调用 `track.stop()`，而是保留流供下次复用
2. **组件卸载时释放**：在 `useEffect` 清理函数中才真正 stop tracks
3. **录音结束只停 MediaRecorder**：`mediaRecorder.stop()` 后不释放底层 stream

改动约 15 行，仅影响 `VoiceInputButton` 组件。其他教练页面使用同一组件，修复自动覆盖所有页面。

