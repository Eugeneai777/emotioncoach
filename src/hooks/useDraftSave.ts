import { useState, useEffect, useCallback, useRef } from 'react';

interface DraftData {
  [key: string]: string;
}

interface UseDraftSaveOptions {
  key: string;
  debounceMs?: number;
  onRestore?: (data: DraftData) => void;
}

interface UseDraftSaveReturn {
  saveDraft: (data: DraftData) => void;
  loadDraft: () => DraftData | null;
  clearDraft: () => void;
  hasDraft: boolean;
  lastSavedAt: Date | null;
}

const DRAFT_PREFIX = 'draft_';

export const useDraftSave = ({
  key,
  debounceMs = 1000,
  onRestore
}: UseDraftSaveOptions): UseDraftSaveReturn => {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `${DRAFT_PREFIX}${key}`;

  // 检查是否有草稿
  useEffect(() => {
    const checkDraft = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setHasDraft(true);
          if (parsed.savedAt) {
            setLastSavedAt(new Date(parsed.savedAt));
          }
          // 如果提供了恢复回调，自动恢复
          if (onRestore && parsed.data) {
            onRestore(parsed.data);
          }
        }
      } catch (e) {
        console.error('Failed to check draft:', e);
      }
    };

    checkDraft();
  }, [storageKey, onRestore]);

  // 保存草稿（带防抖）
  const saveDraft = useCallback((data: DraftData) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        // 检查数据是否有实际内容
        const hasContent = Object.values(data).some(v => v && v.trim().length > 0);
        if (!hasContent) {
          // 如果没有内容，清除草稿
          localStorage.removeItem(storageKey);
          setHasDraft(false);
          setLastSavedAt(null);
          return;
        }

        const saveData = {
          data,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        setHasDraft(true);
        setLastSavedAt(new Date());
      } catch (e) {
        console.error('Failed to save draft:', e);
      }
    }, debounceMs);
  }, [storageKey, debounceMs]);

  // 加载草稿
  const loadDraft = useCallback((): DraftData | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data || null;
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
    return null;
  }, [storageKey]);

  // 清除草稿
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setLastSavedAt(null);
    } catch (e) {
      console.error('Failed to clear draft:', e);
    }
  }, [storageKey]);

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    lastSavedAt
  };
};
