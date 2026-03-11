import { useState, useCallback } from 'react';

const STORAGE_KEY = 'dajin_quota';
const INITIAL_QUOTA = 100;

function getStoredQuota(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      localStorage.setItem(STORAGE_KEY, String(INITIAL_QUOTA));
      return INITIAL_QUOTA;
    }
    return Math.max(0, parseInt(stored, 10) || 0);
  } catch {
    return INITIAL_QUOTA;
  }
}

export function useDajinQuota() {
  const [remaining, setRemaining] = useState<number>(getStoredQuota);

  const deduct = useCallback((cost: number): boolean => {
    const current = getStoredQuota();
    if (current < cost) return false;
    const next = current - cost;
    localStorage.setItem(STORAGE_KEY, String(next));
    setRemaining(next);
    return true;
  }, []);

  const canAfford = useCallback((cost: number): boolean => {
    return getStoredQuota() >= cost;
  }, []);

  const refresh = useCallback(() => {
    setRemaining(getStoredQuota());
  }, []);

  return { remaining, deduct, canAfford, refresh };
}
