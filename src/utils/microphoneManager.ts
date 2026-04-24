/**
 * 模块级麦克风管理器 - 单例模式
 * 缓存 MediaStream，避免重复弹出权限对话框
 *
 * ⚠️ 重要：通话结束 / 组件卸载 / 路由离开必须调用 forceReleaseMicrophone()，
 * 否则浏览器/WebView 会保留 track 的 "live" 状态，
 * 导致 iOS / Android 状态栏左上角红色"录音中"图标一直挂着，
 * 直到用户手动杀进程才会消失。
 */

let cachedStream: MediaStream | null = null;
let acquirePromise: Promise<MediaStream> | null = null;

/** 检查麦克风权限状态（不触发弹窗） */
async function checkPermissionStatus(): Promise<PermissionState | null> {
  try {
    if (navigator.permissions?.query) {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state;
    }
  } catch {
    // Permissions API 不支持 microphone（如 Firefox/Safari），返回 null
  }
  return null;
}

/** 判断缓存流是否仍然可用 */
function isStreamAlive(stream: MediaStream): boolean {
  return stream.getTracks().some(t => t.readyState === 'live');
}

/**
 * 获取麦克风流（带缓存）
 * - 如果已有活跃流，直接返回（不弹窗）
 * - 如果权限已 granted，静默获取（不弹窗）
 * - 否则正常请求（触发一次弹窗，之后缓存）
 */
export async function acquireMicrophone(): Promise<MediaStream> {
  // 返回缓存的活跃流（强制开麦自愈：防止上次 PTT 把 track.enabled 设为 false 后被复用，
  // 导致后续连续通话场景拿到一个"活着但静音"的流，AI 收不到声音）
  if (cachedStream && isStreamAlive(cachedStream)) {
    try {
      cachedStream.getAudioTracks().forEach(t => { t.enabled = true; });
    } catch {}
    return cachedStream;
  }

  // 缓存的流已经全部 ended（被外部 stop() 了），清掉引用避免后续误判
  if (cachedStream && !isStreamAlive(cachedStream)) {
    cachedStream = null;
  }

  // 防止并发请求导致多次弹窗
  if (acquirePromise) {
    return acquirePromise;
  }

  acquirePromise = (async () => {
    try {
      // 先检查权限状态
      const status = await checkPermissionStatus();
      console.log('[MicManager] Permission status:', status);

      // 无论什么状态都需要调用 getUserMedia 来获取流
      // 但如果 status === 'granted'，浏览器不会弹窗
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      cachedStream = stream;

      // 标记用户已授权过（用于优化 UX）
      try {
        localStorage.setItem('mic_permission_granted', 'true');
      } catch {}

      return stream;
    } finally {
      acquirePromise = null;
    }
  })();

  return acquirePromise;
}

/**
 * 软释放麦克风流：仅静音、保留 track（用于 PTT 模式按下/松开间隙）
 * ⚠️ 这不会让系统状态栏的"录音中"图标消失。通话结束请调用 forceReleaseMicrophone。
 */
export function releaseMicrophone(): void {
  if (cachedStream) {
    try {
      cachedStream.getAudioTracks().forEach(t => { t.enabled = false; });
    } catch {}
  }
}

/**
 * 硬释放麦克风流：stop() 所有 track 并清空缓存。
 * 通话结束 / 组件卸载 / 路由离开 / 页面隐藏 必须调用此方法，
 * 才能让 iOS / Android / 微信 WebView 状态栏的录音红点消失。
 */
export function forceReleaseMicrophone(): void {
  if (!cachedStream) return;
  try {
    cachedStream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch (e) {
        console.warn('[MicManager] Failed to stop track:', e);
      }
    });
  } catch (e) {
    console.warn('[MicManager] forceRelease error:', e);
  }
  cachedStream = null;
  console.log('[MicManager] ✅ Microphone hard-released, all tracks stopped');

  // 自检日志：1 秒后确认 track 状态
  setTimeout(() => {
    if (cachedStream) {
      const tracks = (cachedStream as MediaStream).getAudioTracks();
      console.log('[MicManager] Post-release track states:', tracks.map(t => ({
        enabled: t.enabled,
        readyState: t.readyState,
        label: t.label,
      })));
    }
  }, 1000);
}

/** 检查用户是否曾经授权过麦克风（基于 localStorage） */
export function hasPreviouslyGranted(): boolean {
  try {
    return localStorage.getItem('mic_permission_granted') === 'true';
  } catch {
    return false;
  }
}
