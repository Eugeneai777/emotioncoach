/**
 * 全局语音会话互斥锁
 * 确保同一时间只有一个语音会话在运行，防止多个组件同时发起语音导致双重声音
 */

// 全局状态
let activeSessionId: string | null = null;
let activeSessionComponent: string | null = null;
const listeners = new Set<() => void>();

// 通知所有监听器状态变化
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// 获取当前活跃会话
export const getActiveSession = () => ({
  sessionId: activeSessionId,
  component: activeSessionComponent,
  isActive: activeSessionId !== null
});

// 尝试获取会话锁
export const acquireSessionLock = (sessionId: string, component: string): boolean => {
  if (activeSessionId !== null) {
    console.warn(`[VoiceSessionLock] 会话已被 ${activeSessionComponent} 占用，无法启动新会话`);
    return false;
  }
  
  activeSessionId = sessionId;
  activeSessionComponent = component;
  console.log(`[VoiceSessionLock] 会话锁已获取: ${sessionId} (${component})`);
  notifyListeners();
  return true;
};

// 释放会话锁
export const releaseSessionLock = (sessionId: string): boolean => {
  if (activeSessionId !== sessionId) {
    console.warn(`[VoiceSessionLock] 尝试释放非当前会话的锁: ${sessionId}, 当前: ${activeSessionId}`);
    return false;
  }
  
  console.log(`[VoiceSessionLock] 会话锁已释放: ${sessionId}`);
  activeSessionId = null;
  activeSessionComponent = null;
  notifyListeners();
  return true;
};

// 强制释放锁（用于错误恢复）
export const forceReleaseSessionLock = () => {
  console.log(`[VoiceSessionLock] 强制释放会话锁: ${activeSessionId}`);
  activeSessionId = null;
  activeSessionComponent = null;
  notifyListeners();
};

// 检查是否有活跃会话
export const hasActiveSession = (): boolean => {
  return activeSessionId !== null;
};

// React Hook 用于组件订阅状态变化
import { useState, useEffect, useCallback } from 'react';

export const useVoiceSessionLock = (componentName: string) => {
  const [isLocked, setIsLocked] = useState(hasActiveSession());
  const [isOwner, setIsOwner] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // 监听全局状态变化
  useEffect(() => {
    const handleChange = () => {
      setIsLocked(hasActiveSession());
      setIsOwner(activeSessionComponent === componentName && activeSessionId === sessionId);
    };
    
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, [componentName, sessionId]);

  // 尝试获取锁
  const acquire = useCallback((newSessionId?: string) => {
    const id = newSessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const success = acquireSessionLock(id, componentName);
    if (success) {
      setSessionId(id);
      setIsOwner(true);
    }
    return success ? id : null;
  }, [componentName]);

  // 释放锁
  const release = useCallback(() => {
    if (sessionId) {
      releaseSessionLock(sessionId);
      setSessionId(null);
      setIsOwner(false);
    }
  }, [sessionId]);

  // 组件卸载时自动释放
  useEffect(() => {
    return () => {
      if (sessionId) {
        releaseSessionLock(sessionId);
      }
    };
  }, [sessionId]);

  return {
    isLocked,           // 是否有活跃会话（全局）
    isOwner,            // 当前组件是否持有锁
    sessionId,          // 当前会话ID
    acquire,            // 获取锁
    release,            // 释放锁
    activeComponent: activeSessionComponent  // 当前持有锁的组件名
  };
};
