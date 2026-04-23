/**
 * 模块级麦克风管理器 - 单例模式
 * 缓存 MediaStream，避免重复弹出权限对话框
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

/** 释放麦克风流 */
export function releaseMicrophone(): void {
  if (cachedStream) {
    cachedStream.getTracks().forEach(track => track.stop());
    cachedStream = null;
  }
}

/** 检查用户是否曾经授权过麦克风（基于 localStorage） */
export function hasPreviouslyGranted(): boolean {
  try {
    return localStorage.getItem('mic_permission_granted') === 'true';
  } catch {
    return false;
  }
}
