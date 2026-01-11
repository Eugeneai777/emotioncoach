import { useState, useEffect } from 'react';

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

export const availablePages = [
  { path: '/coach-space', label: '教练空间', icon: 'Users', color: 'bg-rose-500' },
  { path: '/wealth-camp-checkin', label: '财富日记', icon: 'BookOpen', color: 'bg-amber-500' },
  { path: '/wealth-block', label: '财富测评', icon: 'ClipboardCheck', color: 'bg-purple-500' },
  { path: '/customer-support', label: '给予建议', icon: 'MessageCircle', color: 'bg-blue-500' },
  { path: '/packages', label: '产品套餐', icon: 'Package', color: 'bg-emerald-500' },
  { path: '/settings', label: '设置', icon: 'Settings', color: 'bg-slate-500' },
  { path: '/energy-studio', label: '能量工作室', icon: 'Sparkles', color: 'bg-violet-500' },
  { path: '/partner', label: '合伙人', icon: 'Handshake', color: 'bg-teal-500' },
  { path: '/awakening', label: '觉醒入口', icon: 'Sunrise', color: 'bg-orange-500' },
  { path: '/community', label: '社区', icon: 'MessagesSquare', color: 'bg-indigo-500' },
];

export const defaultConfig: QuickMenuConfig = {
  homePagePath: '/coach-space',
  customSlot1: {
    id: 'custom1',
    label: '财富日记',
    path: '/wealth-camp-checkin',
    icon: 'BookOpen',
    color: 'bg-pink-500',
  },
  customSlot2: {
    id: 'custom2',
    label: '能量工作室',
    path: '/energy-studio',
    icon: 'Sparkles',
    color: 'bg-cyan-500',
  },
};

export const useQuickMenuConfig = () => {
  const [config, setConfig] = useState<QuickMenuConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved config
  useEffect(() => {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsed });
      } catch (e) {
        console.error('Failed to parse saved quick menu config');
      }
    }
    setIsLoaded(true);
  }, []);

  // Save config
  const saveConfig = (newConfig: QuickMenuConfig) => {
    setConfig(newConfig);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
  };

  // Update home path
  const updateHomePath = (path: string) => {
    const newConfig = { ...config, homePagePath: path };
    saveConfig(newConfig);
  };

  // Update custom slot
  const updateCustomSlot = (slot: 'customSlot1' | 'customSlot2', item: MenuItemConfig) => {
    const newConfig = { ...config, [slot]: item };
    saveConfig(newConfig);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    saveConfig(defaultConfig);
  };

  return {
    config,
    isLoaded,
    saveConfig,
    updateHomePath,
    updateCustomSlot,
    resetToDefaults,
    availablePages,
  };
};
