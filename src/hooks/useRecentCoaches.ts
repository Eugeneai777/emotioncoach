import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'recent_coaches';
const MAX_RECENT = 5;

interface RecentCoach {
  coach_key: string;
  title: string;
  emoji: string;
  gradient: string | null;
  page_route: string;
  visitedAt: number;
}

const readRecent = (): RecentCoach[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useRecentCoaches = () => {
  const [recentCoaches, setRecentCoaches] = useState<RecentCoach[]>(readRecent);

  // Re-sync when storage changes from another tab
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRecentCoaches(readRecent());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const recordVisit = useCallback((coach: Omit<RecentCoach, 'visitedAt'>) => {
    const list = readRecent().filter(c => c.coach_key !== coach.coach_key);
    const updated: RecentCoach[] = [
      { ...coach, visitedAt: Date.now() },
      ...list,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecentCoaches(updated);
  }, []);

  return { recentCoaches: recentCoaches.slice(0, 3), recordVisit };
};
