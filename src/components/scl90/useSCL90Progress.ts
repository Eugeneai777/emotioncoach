import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "scl90_progress";

export interface SCL90Progress {
  answers: Record<number, number>;
  currentPage: number;
  startedAt: string;
  lastUpdatedAt: string;
}

export function useSCL90Progress() {
  const [savedProgress, setSavedProgress] = useState<SCL90Progress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载保存的进度
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SCL90Progress;
        // 检查是否在7天内（防止过期数据）
        const lastUpdated = new Date(parsed.lastUpdatedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 7 && Object.keys(parsed.answers).length > 0) {
          setSavedProgress(parsed);
        } else {
          // 清除过期数据
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Error loading SCL90 progress:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoaded(true);
  }, []);

  // 保存进度
  const saveProgress = useCallback((answers: Record<number, number>, currentPage: number) => {
    const progress: SCL90Progress = {
      answers,
      currentPage,
      startedAt: savedProgress?.startedAt || new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setSavedProgress(progress);
    } catch (e) {
      console.error("Error saving SCL90 progress:", e);
    }
  }, [savedProgress?.startedAt]);

  // 清除进度
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedProgress(null);
    } catch (e) {
      console.error("Error clearing SCL90 progress:", e);
    }
  }, []);

  // 检查是否有未完成的进度
  const hasUnfinishedProgress = savedProgress !== null && Object.keys(savedProgress.answers).length > 0;

  return {
    savedProgress,
    hasUnfinishedProgress,
    isLoaded,
    saveProgress,
    clearProgress,
  };
}
