import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const CONFIG_STORAGE_KEY = 'floatingQuickMenuConfig';

export interface MenuItemConfig {
  id: string;
  label: string;
  path: string;
  icon: string;
  color: string;
}

export interface QuickMenuConfig {
  homePagePath: string;
  customSlot1: MenuItemConfig;
  customSlot2: MenuItemConfig;
}

// Coach pages - can be set as home page
// Note: Most coaches use /coach/:coachKey dynamic route, except standalone pages
export const coachPages = [
  { path: '/coach-space', label: '教练空间', icon: 'Users', color: 'bg-rose-500' },
  { path: '/coach/emotion', label: '情绪教练', icon: 'Heart', color: 'bg-pink-500' },
  { path: '/parent-coach', label: '亲子教练', icon: 'Baby', color: 'bg-sky-500' },
  { path: '/coach/wealth_coach_4_questions', label: '财富教练', icon: 'Coins', color: 'bg-amber-500' },
  { path: '/coach/vibrant_life', label: '有劲生活', icon: 'Sparkles', color: 'bg-violet-500' },
  { path: '/teen-coach', label: '青少年教练', icon: 'Gamepad2', color: 'bg-cyan-500' },
  { path: '/wealth-camp-checkin', label: '财富日记', icon: 'BookOpen', color: 'bg-orange-500' },
];

// All available pages for custom slots
export const availablePages = [
  ...coachPages,
  { path: '/wealth-camp-checkin', label: '财富日记', icon: 'BookOpen', color: 'bg-amber-500' },
  { path: '/wealth-block', label: '财富测评', icon: 'ClipboardCheck', color: 'bg-purple-500' },
  { path: '/customer-support', label: '给予建议', icon: 'MessageCircle', color: 'bg-blue-500' },
  { path: '/packages', label: '产品套餐', icon: 'Package', color: 'bg-emerald-500' },
  { path: '/settings', label: '设置', icon: 'Settings', color: 'bg-slate-500' },
  { path: '/energy-studio', label: '有劲生活馆', icon: 'Sparkles', color: 'bg-violet-500' },
  { path: '/partner', label: '合伙人', icon: 'Handshake', color: 'bg-teal-500' },
  { path: '/awakening', label: '觉醒入口', icon: 'Sunrise', color: 'bg-orange-500' },
  { path: '/community', label: '社区', icon: 'MessagesSquare', color: 'bg-indigo-500' },
];

export const defaultConfig: QuickMenuConfig = {
  homePagePath: '/coach/wealth_coach_4_questions',
  customSlot1: {
    id: 'custom1',
    label: '财富日记',
    path: '/wealth-camp-checkin',
    icon: 'BookOpen',
    color: 'bg-pink-500',
  },
  customSlot2: {
    id: 'custom2',
    label: '有劲生活馆',
    path: '/energy-studio',
    icon: 'Sparkles',
    color: 'bg-cyan-500',
  },
};

export const useQuickMenuConfig = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<QuickMenuConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const normalizeConfig = (raw: QuickMenuConfig): QuickMenuConfig => {
    const legacyPathMap: Record<string, string> = {
      // Wealth coach legacy paths
      '/wealth-coach': '/coach/wealth_coach_4_questions',
      '/coach/wealth': '/coach/wealth_coach_4_questions',
      // Awakening legacy paths (if ever persisted)
      '/wealth-block': '/awakening',
    };

    const legacyLabelMap: Record<string, string> = {
      '能量工作室': '有劲生活馆',
    };

    const normalizePath = (path: string) => legacyPathMap[path] ?? path;
    const normalizeLabel = (label: string) => legacyLabelMap[label] ?? label;

    const normalizeSlot = (slot: MenuItemConfig): MenuItemConfig => ({
      ...slot,
      path: normalizePath(slot.path),
      label: normalizeLabel(slot.label),
    });

    return {
      ...raw,
      homePagePath: normalizePath(raw.homePagePath),
      customSlot1: normalizeSlot(raw.customSlot1),
      customSlot2: normalizeSlot(raw.customSlot2),
    };
  };

  // Load config from database or localStorage
  useEffect(() => {
    const loadConfig = async () => {
      if (user) {
        // Try to load from database for logged-in users
        try {
          const { data, error } = await supabase
            .from('user_quick_menu_config')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Failed to load quick menu config from database:', error);
            // Fall back to localStorage
            loadFromLocalStorage();
          } else if (data) {
            // Database config exists
            const dbConfig: QuickMenuConfig = normalizeConfig({
              homePagePath: data.home_page_path,
              customSlot1: data.custom_slot_1 as unknown as MenuItemConfig,
              customSlot2: data.custom_slot_2 as unknown as MenuItemConfig,
            });
            setConfig(dbConfig);
            // Also update localStorage for offline access
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(dbConfig));
          } else {
            // No database config, check localStorage and sync
            const localConfig = loadFromLocalStorage();
            if (localConfig) {
              // Sync localStorage config to database
              syncToDatabase(localConfig);
            }
          }
        } catch (e) {
          console.error('Error loading config:', e);
          loadFromLocalStorage();
        }
      } else {
        // Not logged in, use localStorage only
        loadFromLocalStorage();
      }
      setIsLoaded(true);
    };

    loadConfig();
  }, [user]);

  // Load from localStorage
  const loadFromLocalStorage = (): QuickMenuConfig | null => {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const mergedConfig = normalizeConfig({ ...defaultConfig, ...parsed });
        setConfig(mergedConfig);
        return mergedConfig;
      } catch (e) {
        console.error('Failed to parse saved quick menu config');
      }
    }
    setConfig(defaultConfig);
    return null;
  };

  // Sync config to database
  const syncToDatabase = async (configToSync: QuickMenuConfig) => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    try {
      // Check if record exists first
      const { data: existing } = await supabase
        .from('user_quick_menu_config')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing record
        const result = await supabase
          .from('user_quick_menu_config')
          .update({
            home_page_path: configToSync.homePagePath,
            custom_slot_1: JSON.parse(JSON.stringify(configToSync.customSlot1)),
            custom_slot_2: JSON.parse(JSON.stringify(configToSync.customSlot2)),
          })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record - use raw SQL approach to avoid type issues
        const result = await supabase.rpc('insert_quick_menu_config' as never, {
          p_user_id: user.id,
          p_home_page_path: configToSync.homePagePath,
          p_custom_slot_1: JSON.parse(JSON.stringify(configToSync.customSlot1)),
          p_custom_slot_2: JSON.parse(JSON.stringify(configToSync.customSlot2)),
        } as never);
        error = result.error;
        
        // Fallback: if RPC doesn't exist, try direct insert with type cast
        if (error?.message?.includes('function') || error?.code === '42883') {
          const insertResult = await supabase
            .from('user_quick_menu_config')
            .insert([{
              user_id: user.id,
              home_page_path: configToSync.homePagePath,
              custom_slot_1: JSON.parse(JSON.stringify(configToSync.customSlot1)),
              custom_slot_2: JSON.parse(JSON.stringify(configToSync.customSlot2)),
            }] as never);
          error = insertResult.error;
        }
      }

      if (error) {
        console.error('Failed to sync config to database:', error);
      }
    } catch (e) {
      console.error('Error syncing config:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save config (to both localStorage and database)
  const saveConfig = async (newConfig: QuickMenuConfig) => {
    setConfig(newConfig);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));

    if (user) {
      await syncToDatabase(newConfig);
    }
  };

  // Update home path
  const updateHomePath = async (path: string) => {
    const newConfig = { ...config, homePagePath: path };
    await saveConfig(newConfig);
  };

  // Update custom slot
  const updateCustomSlot = async (slot: 'customSlot1' | 'customSlot2', item: MenuItemConfig) => {
    const newConfig = { ...config, [slot]: item };
    await saveConfig(newConfig);
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    await saveConfig(defaultConfig);
  };

  return {
    config,
    isLoaded,
    isSyncing,
    saveConfig,
    updateHomePath,
    updateCustomSlot,
    resetToDefaults,
    availablePages,
  };
};
