import { useEffect } from "react";

/**
 * 全局忙碌引用计数。useVersionCheck 在 reload 前会检查 window.__LOVABLE_BUSY__,
 * 为 true 时跳过本次刷新,等下一次轮询。这样可以防止生图/生视频中途被强制刷新。
 */
let counter = 0;

function sync() {
  if (typeof window !== "undefined") {
    (window as any).__LOVABLE_BUSY__ = counter > 0;
  }
}

export function bumpBusy() {
  counter++;
  sync();
}

export function releaseBusy() {
  counter = Math.max(0, counter - 1);
  sync();
}

/** 在组件 active 时占用一个忙碌槽位,unmount 或 active=false 时释放。 */
export function useBusyGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    bumpBusy();
    return () => releaseBusy();
  }, [active]);
}

/** 包装一个异步函数,执行期间持有忙碌锁。 */
export async function withBusy<T>(fn: () => Promise<T>): Promise<T> {
  bumpBusy();
  try {
    return await fn();
  } finally {
    releaseBusy();
  }
}
