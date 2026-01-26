/**
 * 统一分享卡片配置模块
 * 
 * 提供标准化的 html2canvas 配置和 generateCanvas 辅助函数
 * 避免配置分散在多个文件中
 * 
 * v2.0 - 性能优化版本
 * - 微信环境自适应分辨率
 * - 图片预加载缓存
 * - 渲染队列防抖
 */

import html2canvas, { Options as Html2CanvasOptions } from 'html2canvas';

// ============= 性能检测 =============

/** 检测是否为低端设备 */
const isLowEndDevice = (): boolean => {
  // 检查设备内存 (< 4GB 视为低端)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) return true;
  
  // 检查 CPU 核心数
  const cores = navigator.hardwareConcurrency;
  if (cores && cores <= 4) return true;
  
  return false;
};

/** 检测微信环境 */
const isWeChatBrowser = (): boolean => {
  return /micromessenger/i.test(navigator.userAgent);
};

/** 获取最优分辨率倍数 */
const getOptimalScale = (): number => {
  if (isWeChatBrowser()) {
    // 微信环境：低端设备用 2x，否则 2.5x
    return isLowEndDevice() ? 2 : 2.5;
  }
  // 标准浏览器：低端设备用 2.5x，否则 3x
  return isLowEndDevice() ? 2.5 : 3;
};

// ============= 常量配置 =============

/** 标准 html2canvas 配置 */
export const SHARE_CARD_CONFIG = {
  /** 输出分辨率倍数 (3x 高清) */
  scale: 3,
  /** 跨域图片支持 */
  useCORS: true,
  /** 允许污染 canvas */
  allowTaint: true,
  /** 透明背景（解决白角问题） */
  backgroundColor: null,
  /** 禁用日志 */
  logging: false,
  /** foreignObject 渲染（禁用以提高兼容性） */
  foreignObjectRendering: false,
} as const;

/** 超时配置 - 优化版 */
export const SHARE_TIMEOUTS: {
  imageLoad: number;
  imageLoadWeChat: number;
  renderDelay: number;
  renderDelayWeChat: number;
  canvasGeneration: number;
  canvasGenerationWeChat: number;
} = {
  /** 图片加载超时 (毫秒) */
  imageLoad: 4000,
  /** 微信环境图片加载超时 - 降低以避免长时间等待 */
  imageLoadWeChat: 6000,
  /** 渲染稳定延迟 */
  renderDelay: 100,
  /** 微信环境渲染延迟 - 优化后减少 */
  renderDelayWeChat: 150,
  /** canvas 生成超时 */
  canvasGeneration: 10000,
  /** 微信环境 canvas 生成超时 */
  canvasGenerationWeChat: 15000,
};

/** 预览容器标准高度 */
export const PREVIEW_CONTAINER_HEIGHT = '320px';

/** 卡片类型背景色映射 */
export const CARD_BACKGROUND_COLORS = {
  // 紫色系 - 测评 & 盲点卡片
  value: '#1e1b4b',
  blindspot: '#1e1b4b',
  // 红色系 - 恐惧/情绪卡片
  fear: '#ef4444',
  // 橙色系 - 训练营 & 转化卡片
  camp: '#f59e0b',
  transform: '#f59e0b',
  // 成就卡片 - 深色主题
  achievement: '#1a1a2e',
  // 感恩日记 - 温暖橙色
  gratitude: '#f97316',
  // 情绪按钮 - 紫色
  emotion: '#7c3aed',
  // 存活检查 - 绿色
  alive: '#10b981',
  // 通用透明
  transparent: null,
} as const;

export type CardBackgroundType = keyof typeof CARD_BACKGROUND_COLORS;

// ============= 图片缓存系统 =============

/** 图片预加载缓存 */
const imageCache = new Map<string, HTMLImageElement>();

/** 预加载图片并缓存 */
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};

/** 批量预加载常用资源 */
export const preloadCommonAssets = async (): Promise<void> => {
  const commonAssets = [
    '/logo-youjin-ai.png',
  ];
  
  await Promise.allSettled(commonAssets.map(preloadImage));
};

// 应用启动时预加载
if (typeof window !== 'undefined') {
  // 延迟预加载，避免阻塞初始渲染
  requestIdleCallback?.(() => preloadCommonAssets()) ?? 
    setTimeout(preloadCommonAssets, 2000);
}

// ============= 辅助函数 =============

/** 等待元素内所有图片加载完成 - 优化版 */
export const waitForImages = async (
  element: HTMLElement, 
  timeout = SHARE_TIMEOUTS.imageLoad
): Promise<void> => {
  const images = element.querySelectorAll('img');
  if (images.length === 0) return;
  
  const promises = Array.from(images).map(img => {
    // 已完成加载
    if (img.complete && img.naturalHeight > 0) return Promise.resolve();
    
    // 检查缓存
    if (img.src && imageCache.has(img.src)) return Promise.resolve();
    
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, timeout);
      
      const cleanup = () => clearTimeout(timer);
      
      img.onload = () => { cleanup(); resolve(); };
      img.onerror = () => { cleanup(); resolve(); };
      
      // 使用 decode() API 加速（如果支持）
      if ('decode' in img) {
        img.decode().then(() => { cleanup(); resolve(); }).catch(() => {});
      }
    });
  });
  
  await Promise.all(promises);
};

/** 创建隐藏的渲染容器 - 优化版 */
export const createHiddenWrapper = (): HTMLDivElement => {
  // 复用已存在的容器
  const existing = document.getElementById('share-card-render-wrapper') as HTMLDivElement;
  if (existing) {
    existing.innerHTML = '';
    return existing;
  }
  
  const wrapper = document.createElement('div');
  wrapper.id = 'share-card-render-wrapper';
  wrapper.style.cssText = `
    position: fixed !important;
    left: -99999px !important;
    top: -99999px !important;
    pointer-events: none !important;
    z-index: -99999 !important;
    background: transparent !important;
    contain: strict !important;
    will-change: contents !important;
  `;
  return wrapper;
};

/** 准备克隆元素的样式 */
export const prepareClonedElement = (
  cloned: HTMLElement, 
  originalWidth: number
): void => {
  cloned.style.transform = 'none';
  cloned.style.transformOrigin = 'top left';
  cloned.style.margin = '0';
  cloned.style.position = 'relative';
  cloned.style.width = `${originalWidth}px`;
  cloned.style.minWidth = `${originalWidth}px`;
  cloned.style.visibility = 'visible';
  cloned.style.opacity = '1';
  cloned.style.background = 'transparent';
  // 添加 GPU 加速
  cloned.style.willChange = 'transform';
  cloned.style.backfaceVisibility = 'hidden';
};

// ============= 渲染队列（防止并发冲突） =============

let renderQueue: Promise<any> = Promise.resolve();

const queueRender = <T>(fn: () => Promise<T>): Promise<T> => {
  const task = renderQueue.then(fn).catch(fn);
  renderQueue = task.then(() => {}).catch(() => {});
  return task;
};

// ============= 核心生成函数 =============

export interface GenerateCanvasOptions {
  /** 卡片背景类型 */
  backgroundType?: CardBackgroundType;
  /** 自定义背景色 (覆盖 backgroundType) */
  backgroundColor?: string | null;
  /** 是否微信环境 (使用更长超时) */
  isWeChat?: boolean;
  /** 是否开启调试日志 */
  debug?: boolean;
  /** 显式宽度 (用于滚动元素) */
  explicitWidth?: number;
  /** 显式高度 (用于滚动元素) */
  explicitHeight?: number;
  /** 强制使用指定分辨率 */
  forceScale?: number;
  /** 跳过图片等待（已预加载时使用） */
  skipImageWait?: boolean;
}

/**
 * 统一的 Canvas 生成函数 - v2.0 性能优化版
 * 
 * @param cardRef - 卡片元素的 ref
 * @param options - 生成选项
 * @returns Canvas 元素或 null
 */
export const generateCanvas = async (
  cardRef: React.RefObject<HTMLDivElement | null>,
  options: GenerateCanvasOptions = {}
): Promise<HTMLCanvasElement | null> => {
  return queueRender(async () => {
    const {
      backgroundType = 'transparent',
      backgroundColor: customBg,
      isWeChat = false,
      debug = false,
      explicitWidth,
      explicitHeight,
      forceScale,
      skipImageWait = false,
    } = options;

    if (!cardRef.current) {
      console.error('[shareCardConfig] cardRef.current is null');
      return null;
    }

    const startTime = performance.now();
    const originalElement = cardRef.current;
    const elementWidth = explicitWidth || originalElement.scrollWidth || originalElement.offsetWidth;
    const elementHeight = explicitHeight || originalElement.scrollHeight || originalElement.offsetHeight;

    // 自适应分辨率
    const scale = forceScale ?? getOptimalScale();
    
    debug && console.log('[shareCardConfig] Starting generation:', { 
      width: elementWidth, 
      height: elementHeight,
      backgroundType,
      isWeChat,
      scale,
      isLowEnd: isLowEndDevice(),
    });

    // 确定背景色
    const bgColor = customBg !== undefined 
      ? customBg 
      : CARD_BACKGROUND_COLORS[backgroundType];

    // 创建隐藏容器
    const wrapper = createHiddenWrapper();
    const clonedElement = originalElement.cloneNode(true) as HTMLElement;
    prepareClonedElement(clonedElement, elementWidth);

    wrapper.appendChild(clonedElement);
    document.body.appendChild(wrapper);

    try {
      // 等待图片加载（可跳过）
      if (!skipImageWait) {
        const imageTimeout = isWeChat ? SHARE_TIMEOUTS.imageLoadWeChat : SHARE_TIMEOUTS.imageLoad;
        await waitForImages(clonedElement, imageTimeout);
      }

      // 渲染稳定延迟（缩短）
      const renderDelay = isWeChat ? SHARE_TIMEOUTS.renderDelayWeChat : SHARE_TIMEOUTS.renderDelay;
      await new Promise(resolve => setTimeout(resolve, renderDelay));

      debug && console.log('[shareCardConfig] Starting html2canvas...', {
        elapsed: Math.round(performance.now() - startTime) + 'ms'
      });

      // 构建 html2canvas 配置 - 优化版
      const canvasOptions: Partial<Html2CanvasOptions> = {
        ...SHARE_CARD_CONFIG,
        scale, // 使用自适应分辨率
        backgroundColor: bgColor,
        logging: debug,
        imageTimeout: isWeChat ? SHARE_TIMEOUTS.imageLoadWeChat : SHARE_TIMEOUTS.imageLoad,
        width: elementWidth,
        height: elementHeight,
        // 减少 window 尺寸以降低内存占用
        windowWidth: elementWidth + 20,
        windowHeight: elementHeight + 20,
        onclone: (_doc, element) => {
          element.style.transform = 'none';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          
          // Force background color on cloned element
          if (bgColor) {
            element.style.backgroundColor = bgColor;
          }
          
          // 移除动画以加速渲染
          element.style.animation = 'none';
          element.style.transition = 'none';
          
          // 递归移除子元素动画
          element.querySelectorAll('*').forEach((child: Element) => {
            if (child instanceof HTMLElement) {
              child.style.animation = 'none';
              child.style.transition = 'none';
            }
          });
        },
      };

      // 带超时的 canvas 生成
      const generationTimeout = isWeChat 
        ? SHARE_TIMEOUTS.canvasGenerationWeChat 
        : SHARE_TIMEOUTS.canvasGeneration;
        
      const canvas = await Promise.race([
        html2canvas(clonedElement, canvasOptions),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('图片生成超时，请重试')), generationTimeout)
        )
      ]) as HTMLCanvasElement;

      const elapsed = Math.round(performance.now() - startTime);
      debug && console.log('[shareCardConfig] Canvas generated:', {
        size: canvas.width + 'x' + canvas.height,
        elapsed: elapsed + 'ms'
      });
      
      // 性能监控日志
      if (elapsed > 3000) {
        console.warn('[shareCardConfig] Slow generation:', elapsed + 'ms');
      }
      
      return canvas;

    } finally {
      // 清理渲染容器
      if (wrapper.parentNode) {
        // 延迟移除，让浏览器完成渲染
        requestAnimationFrame(() => {
          wrapper.innerHTML = '';
          if (wrapper.parentNode) {
            document.body.removeChild(wrapper);
          }
        });
      }
    }
  });
};

/** Canvas 转 Blob - 优化版 */
export const canvasToBlob = (canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob | null> => {
  return new Promise((resolve) => {
    // 根据尺寸选择压缩质量
    const pixels = canvas.width * canvas.height;
    const adaptiveQuality = pixels > 1000000 ? 0.85 : quality;
    
    canvas.toBlob((blob) => resolve(blob), 'image/png', adaptiveQuality);
  });
};

/** Canvas 转 DataURL - 优化版 */
export const canvasToDataUrl = (canvas: HTMLCanvasElement): string => {
  // 大图使用 JPEG 减少数据量
  const pixels = canvas.width * canvas.height;
  if (pixels > 2000000) {
    return canvas.toDataURL('image/jpeg', 0.9);
  }
  return canvas.toDataURL('image/png', 1.0);
};

/**
 * 一键生成 Blob（组合函数）
 */
export const generateCardBlob = async (
  cardRef: React.RefObject<HTMLDivElement | null>,
  options: GenerateCanvasOptions = {}
): Promise<Blob | null> => {
  const canvas = await generateCanvas(cardRef, options);
  if (!canvas) return null;
  return canvasToBlob(canvas);
};

/**
 * 一键生成 DataURL（组合函数）
 */
export const generateCardDataUrl = async (
  cardRef: React.RefObject<HTMLDivElement | null>,
  options: GenerateCanvasOptions = {}
): Promise<string | null> => {
  const canvas = await generateCanvas(cardRef, options);
  if (!canvas) return null;
  return canvasToDataUrl(canvas);
};

// ============= 性能诊断工具 =============

/** 获取性能配置信息（用于调试） */
export const getPerformanceConfig = () => ({
  isWeChat: isWeChatBrowser(),
  isLowEnd: isLowEndDevice(),
  optimalScale: getOptimalScale(),
  cachedImages: imageCache.size,
  memory: (navigator as any).deviceMemory || 'unknown',
  cores: navigator.hardwareConcurrency || 'unknown',
});
