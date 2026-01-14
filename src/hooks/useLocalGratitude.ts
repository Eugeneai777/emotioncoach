import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "gratitude_local_entries";
const SYNC_CLICK_KEY = "gratitude_sync_clicks";
const PENDING_SYNC_KEY = "gratitude_pending_sync";

export interface LocalGratitudeEntry {
  id: string;
  content: string;
  category: string;
  themes: string[];
  created_at: string;
  date: string;
}

export interface PendingGratitudeEntry {
  id: string;
  content: string;
  userId: string;
  created_at: string;
  date: string;
}

export const useLocalGratitude = () => {
  const [entries, setEntries] = useState<LocalGratitudeEntry[]>([]);
  const [syncClickCount, setSyncClickCount] = useState(0);
  const [pendingEntries, setPendingEntries] = useState<PendingGratitudeEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

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
      const pending = localStorage.getItem(PENDING_SYNC_KEY);
      if (pending) {
        setPendingEntries(JSON.parse(pending));
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

  // Save pending entries to localStorage
  const savePendingEntries = useCallback((newPending: PendingGratitudeEntry[]) => {
    setPendingEntries(newPending);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(newPending));
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

  // Add entry to pending sync queue (for logged-in users when offline)
  const addPendingEntry = useCallback((content: string, userId: string): void => {
    const newPending: PendingGratitudeEntry = {
      id: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      content: content.trim(),
      userId,
      created_at: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
    };
    const updated = [newPending, ...pendingEntries];
    savePendingEntries(updated);
  }, [pendingEntries, savePendingEntries]);

  // Sync pending entries to database
  const syncPendingEntries = useCallback(async (userId: string): Promise<number> => {
    const userPending = pendingEntries.filter(e => e.userId === userId);
    if (userPending.length === 0) return 0;

    setIsSyncing(true);
    let syncedCount = 0;

    try {
      for (const entry of userPending) {
        const { error } = await supabase
          .from("gratitude_entries")
          .insert({
            user_id: entry.userId,
            content: entry.content,
            category: "other",
            themes: [],
            date: entry.date,
            created_at: entry.created_at,
          });

        if (!error) {
          syncedCount++;
        } else {
          console.error("Failed to sync entry:", error);
        }
      }

      // Remove synced entries from pending
      if (syncedCount > 0) {
        const remaining = pendingEntries.filter(e => e.userId !== userId);
        savePendingEntries(remaining);
      }
    } catch (e) {
      console.error("Error syncing pending entries:", e);
    } finally {
      setIsSyncing(false);
    }

    return syncedCount;
  }, [pendingEntries, savePendingEntries]);

  // Get pending count for a specific user
  const getPendingCount = useCallback((userId: string): number => {
    return pendingEntries.filter(e => e.userId === userId).length;
  }, [pendingEntries]);

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
    // Offline sync support
    pendingEntries,
    addPendingEntry,
    syncPendingEntries,
    getPendingCount,
    isSyncing,
  };
};
