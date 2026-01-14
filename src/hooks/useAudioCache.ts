import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const DB_NAME = 'meditation-audio-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio-files';

interface CachedAudio {
  url: string;
  blob: Blob;
  cachedAt: number;
  size: number;
}

interface AudioCacheState {
  isSupported: boolean;
  cachedUrls: string[];
  totalSize: number;
}

// Open IndexedDB connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
  });
};

// Check if IndexedDB is supported
const isIndexedDBSupported = (): boolean => {
  try {
    return 'indexedDB' in window && indexedDB !== null;
  } catch {
    return false;
  }
};

export const useAudioCache = () => {
  const [state, setState] = useState<AudioCacheState>({
    isSupported: false,
    cachedUrls: [],
    totalSize: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and load cached URLs
  useEffect(() => {
    const init = async () => {
      if (!isIndexedDBSupported()) {
        setState(prev => ({ ...prev, isSupported: false }));
        return;
      }

      try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result as CachedAudio[];
          const urls = items.map(item => item.url);
          const totalSize = items.reduce((acc, item) => acc + item.size, 0);
          setState({
            isSupported: true,
            cachedUrls: urls,
            totalSize,
          });
        };

        request.onerror = () => {
          console.error('Failed to load cached URLs');
        };
      } catch (error) {
        console.error('Failed to initialize audio cache:', error);
      }
    };

    init();
  }, []);

  // Check if a URL is cached
  const isCached = useCallback((url: string): boolean => {
    return state.cachedUrls.includes(url);
  }, [state.cachedUrls]);

  // Cache an audio file
  const cacheAudio = useCallback(async (url: string): Promise<boolean> => {
    if (!state.isSupported) {
      toast.error('您的浏览器不支持离线缓存');
      return false;
    }

    if (isCached(url)) {
      return true;
    }

    setIsLoading(true);

    try {
      // Fetch the audio file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch audio');
      }

      const blob = await response.blob();
      const size = blob.size;

      // Store in IndexedDB
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const cachedAudio: CachedAudio = {
        url,
        blob,
        cachedAt: Date.now(),
        size,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cachedAudio);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      setState(prev => ({
        ...prev,
        cachedUrls: [...prev.cachedUrls, url],
        totalSize: prev.totalSize + size,
      }));

      toast.success('音频已缓存，可离线播放');
      return true;
    } catch (error) {
      console.error('Failed to cache audio:', error);
      toast.error('缓存失败，请检查网络连接');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [state.isSupported, isCached]);

  // Get cached audio blob URL
  const getCachedAudio = useCallback(async (url: string): Promise<string | null> => {
    if (!state.isSupported || !isCached(url)) {
      return null;
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve) => {
        const request = store.get(url);
        request.onsuccess = () => {
          const result = request.result as CachedAudio | undefined;
          if (result) {
            const blobUrl = URL.createObjectURL(result.blob);
            resolve(blobUrl);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Failed to get cached audio:', error);
      return null;
    }
  }, [state.isSupported, isCached]);

  // Remove cached audio
  const removeCachedAudio = useCallback(async (url: string): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Get the item first to update total size
      const getRequest = store.get(url);
      
      return new Promise((resolve) => {
        getRequest.onsuccess = () => {
          const item = getRequest.result as CachedAudio | undefined;
          const deleteRequest = store.delete(url);
          
          deleteRequest.onsuccess = () => {
            setState(prev => ({
              ...prev,
              cachedUrls: prev.cachedUrls.filter(u => u !== url),
              totalSize: prev.totalSize - (item?.size || 0),
            }));
            resolve(true);
          };
          deleteRequest.onerror = () => resolve(false);
        };
        getRequest.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Failed to remove cached audio:', error);
      return false;
    }
  }, [state.isSupported]);

  // Clear all cached audio
  const clearAllCache = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve) => {
        const request = store.clear();
        request.onsuccess = () => {
          setState(prev => ({
            ...prev,
            cachedUrls: [],
            totalSize: 0,
          }));
          toast.success('缓存已清空');
          resolve(true);
        };
        request.onerror = () => {
          toast.error('清空缓存失败');
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }, [state.isSupported]);

  // Format file size for display
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    isSupported: state.isSupported,
    cachedUrls: state.cachedUrls,
    totalSize: state.totalSize,
    formattedTotalSize: formatSize(state.totalSize),
    isLoading,
    isCached,
    cacheAudio,
    getCachedAudio,
    removeCachedAudio,
    clearAllCache,
  };
};
