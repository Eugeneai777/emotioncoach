import { useState, useEffect, useMemo, useCallback } from "react";

const STORAGE_KEY = "gratitude_local_entries";
const SYNC_CLICK_KEY = "gratitude_sync_clicks";

export interface LocalGratitudeEntry {
  id: string;
  content: string;
  category: string;
  themes: string[];
  created_at: string;
  date: string;
}

export const useLocalGratitude = () => {
  const [entries, setEntries] = useState<LocalGratitudeEntry[]>([]);
  const [syncClickCount, setSyncClickCount] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
      const clicks = localStorage.getItem(SYNC_CLICK_KEY);
      if (clicks) {
        setSyncClickCount(parseInt(clicks, 10) || 0);
      }
    } catch (e) {
      console.error("Failed to load local gratitude entries:", e);
    }
  }, []);

  // Save to localStorage whenever entries change
  const saveEntries = useCallback((newEntries: LocalGratitudeEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
  }, []);

  const addEntry = useCallback((content: string): number => {
    const newEntry: LocalGratitudeEntry = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      content: content.trim(),
      category: "other",
      themes: [],
      created_at: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
    };
    const newEntries = [newEntry, ...entries];
    saveEntries(newEntries);
    return newEntries.length;
  }, [entries, saveEntries]);

  const deleteEntry = useCallback((id: string) => {
    const newEntries = entries.filter(e => e.id !== id);
    saveEntries(newEntries);
  }, [entries, saveEntries]);

  const incrementSyncClick = useCallback((): number => {
    const newCount = syncClickCount + 1;
    setSyncClickCount(newCount);
    localStorage.setItem(SYNC_CLICK_KEY, String(newCount));
    return newCount;
  }, [syncClickCount]);

  const clearLocal = useCallback(() => {
    setEntries([]);
    setSyncClickCount(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNC_CLICK_KEY);
  }, []);

  // Calculate theme stats (same as database version)
  const themeStats: Record<string, number> = useMemo(() => {
    const stats: Record<string, number> = {};
    entries.forEach(entry => {
      const themes = entry.themes || [];
      themes.forEach(theme => {
        stats[theme] = (stats[theme] || 0) + 1;
      });
    });
    return stats;
  }, [entries]);

  return {
    entries,
    addEntry,
    deleteEntry,
    themeStats,
    syncClickCount,
    incrementSyncClick,
    clearLocal,
  };
};
