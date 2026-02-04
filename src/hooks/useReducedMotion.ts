import { useState, useEffect, useCallback } from 'react';

const REDUCED_MOTION_KEY = 'reduced_motion_preference';

interface UseReducedMotionReturn {
  prefersReducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  systemPreference: boolean;
}

export const useReducedMotion = (): UseReducedMotionReturn => {
  // 检测系统偏好
  const [systemPreference, setSystemPreference] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // 用户手动设置（覆盖系统偏好）
  const [userPreference, setUserPreference] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(REDUCED_MOTION_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    return null;
  });

  // 监听系统偏好变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches);
    };

    // 现代浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // 兼容旧浏览器
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // 最终偏好：用户设置 > 系统偏好
  const prefersReducedMotion = userPreference !== null ? userPreference : systemPreference;

  // 设置用户偏好
  const setReducedMotion = useCallback((enabled: boolean) => {
    setUserPreference(enabled);
    localStorage.setItem(REDUCED_MOTION_KEY, String(enabled));
    
    // 更新 CSS 变量
    if (enabled) {
      document.documentElement.style.setProperty('--motion-duration', '0s');
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.style.removeProperty('--motion-duration');
      document.documentElement.classList.remove('reduce-motion');
    }
  }, []);

  // 初始化时应用设置
  useEffect(() => {
    if (prefersReducedMotion) {
      document.documentElement.style.setProperty('--motion-duration', '0s');
      document.documentElement.classList.add('reduce-motion');
    }
  }, [prefersReducedMotion]);

  return {
    prefersReducedMotion,
    setReducedMotion,
    systemPreference
  };
};

// 动画变体 - 根据偏好返回不同的动画配置
export const getMotionVariants = (reducedMotion: boolean) => {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0 }
    };
  }

  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };
};
