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

/** 检测微信小程序 WebView */
const isMiniProgramBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger') && (
    ua.includes('miniprogram') ||
    (typeof window !== 'undefined' && (window as unknown as { __wxjs_environment?: string }).__wxjs_environment === 'miniprogram')
  );
};

/** 检测 iOS 设备 */
const isIOSDevice = (): boolean => {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

/** 获取最优分辨率倍数 - 优先速度 */
const getOptimalScale = (): number => {
  if (isMiniProgramBrowser()) return isLowEndDevice() ? 1.2 : 1.5;
  if (isIOSDevice()) return 2;
  if (isWeChatBrowser()) return isLowEndDevice() ? 1.3 : 1.8;
  // 桌面端
  return isLowEndDevice() ? 2 : 2.5;
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
  // 使用 typeof 检查避免 ReferenceError（Safari/微信不支持 requestIdleCallback）
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => preloadCommonAssets());
  } else {
    setTimeout(preloadCommonAssets, 2000);
  }
}

/** 
 * 裁剪 canvas 底部多余白边（iOS 专用）
 * 从底部向上扫描，找到最后一行非空白像素，裁剪掉多余部分
 * 仅当底部空白超过总高度 20% 时才裁剪
 */
const trimBottomWhitespace = (canvas: HTMLCanvasElement, bgColor: string | null): HTMLCanvasElement | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const { width, height } = canvas;
  if (width === 0 || height === 0) return null;

  // 优化：一次性读取底部 30% 区域像素数据，避免上千次 getImageData GPU 交互
  const scanStartY = Math.floor(height * 0.7);
  const scanHeight = height - scanStartY;
  const regionData = ctx.getImageData(0, scanStartY, width, scanHeight).data;
  
  const sampleStep = Math.max(1, Math.floor(width / 20));
  let lastContentRow = height - 1;

  // 从底部向上扫描内存中的像素数据
  for (let localY = scanHeight - 1; localY >= 0; localY--) {
    let hasContent = false;
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (localY * width + x) * 4;
      const r = regionData[idx], g = regionData[idx + 1], b = regionData[idx + 2], a = regionData[idx + 3];
      const isTransparent = a === 0;
      const isWhite = r >= 250 && g >= 250 && b >= 250 && a >= 250;
      if (!isTransparent && !isWhite) {
        hasContent = true;
        break;
      }
    }
    if (hasContent) {
      lastContentRow = scanStartY + localY;
      break;
    }
  }

  const padding = 40;
  const trimmedHeight = Math.min(height, lastContentRow + padding);
  const blankRatio = (height - trimmedHeight) / height;

  if (blankRatio < 0.2) return null;

  console.log(`[shareCardConfig] iOS trimming: ${height}px → ${trimmedHeight}px (removed ${Math.round(blankRatio * 100)}% blank)`);

  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = width;
  trimmedCanvas.height = trimmedHeight;
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (!trimmedCtx) return null;
  trimmedCtx.drawImage(canvas, 0, 0, width, trimmedHeight, 0, 0, width, trimmedHeight);
  return trimmedCanvas;
};

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
    position: absolute !important;
    overflow: hidden !important;
    height: 0 !important;
    width: 0 !important;
    pointer-events: none !important;
    z-index: -99999 !important;
    background: transparent !important;
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
  /** 跳过字体等待（元素已渲染稳定时使用） */
  skipFontWait?: boolean;
}

/**
 * 统一的 Canvas 生成函数 - v2.0 性能优化版
 * 
 * @param cardRef - 卡片元素的 ref
 * @param options - 生成选项
 * @returns Canvas 元素或 null
 */
/** Internal implementation without queue (used for retry to avoid deadlock) */
const generateCanvasInternal = async (
  cardRef: React.RefObject<HTMLDivElement | null>,
  options: GenerateCanvasOptions = {}
): Promise<HTMLCanvasElement | null> => {
    const {
      backgroundType = 'transparent',
      backgroundColor: customBg,
      isWeChat = false,
      debug = false,
      explicitWidth,
      explicitHeight,
      forceScale,
      skipImageWait = false,
      skipFontWait = false,
    } = options;

    if (!cardRef.current) {
      console.error('[shareCardConfig] cardRef.current is null');
      return null;
    }

    const startTime = performance.now();
    const originalElement = cardRef.current;
    // iOS: prefer explicit inline width/height over scrollWidth/scrollHeight
    // because iOS Safari miscalculates scroll dimensions for off-screen elements
    const inlineWidth = originalElement.style.width ? parseInt(originalElement.style.width, 10) : null;
    const inlineHeight = originalElement.style.height ? parseInt(originalElement.style.height, 10) : null;
    const elementWidth = explicitWidth || (inlineWidth && !isNaN(inlineWidth) ? inlineWidth : null) || originalElement.scrollWidth || originalElement.offsetWidth;
    const elementHeight = explicitHeight || (inlineHeight && !isNaN(inlineHeight) ? inlineHeight : null) || originalElement.scrollHeight || originalElement.offsetHeight;

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

    try {
      // 🔧 等待字体加载完成（解决中文乱码问题）— 可跳过
      if (!skipFontWait && document.fonts && typeof document.fonts.ready !== 'undefined') {
        try {
          await Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 3000))
          ]);
          debug && console.log('[shareCardConfig] Fonts ready');
        } catch (e) {
          debug && console.warn('[shareCardConfig] Fonts.ready failed:', e);
        }
      }

      // 等待图片加载（可跳过）
      if (!skipImageWait) {
        const imageTimeout = isWeChat ? SHARE_TIMEOUTS.imageLoadWeChat : SHARE_TIMEOUTS.imageLoad;
        await waitForImages(originalElement, imageTimeout);
      }

      // 渲染稳定延迟 — 已预加载时跳过
      if (!skipImageWait && !skipFontWait) {
        const renderDelay = isWeChat ? SHARE_TIMEOUTS.renderDelayWeChat : SHARE_TIMEOUTS.renderDelay;
        await new Promise(resolve => setTimeout(resolve, renderDelay));
      }

      // UI 让步：确保 loading toast / 进度指示已渲染到屏幕
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 0));

      debug && console.log('[shareCardConfig] Starting html2canvas...', {
        elapsed: Math.round(performance.now() - startTime) + 'ms'
      });

      // 构建 html2canvas 配置
      // 直接传原始元素给 html2canvas，让它自己处理克隆
      // 避免手动克隆后 html2canvas 在 cloned iframe 中找不到元素
      const canvasOptions: Partial<Html2CanvasOptions> = {
        ...SHARE_CARD_CONFIG,
        scale,
        backgroundColor: bgColor,
        logging: debug,
        imageTimeout: isWeChat ? SHARE_TIMEOUTS.imageLoadWeChat : SHARE_TIMEOUTS.imageLoad,
        width: elementWidth,
        height: elementHeight,
        windowWidth: elementWidth + 20,
        windowHeight: elementHeight + 20,
        onclone: (doc, element) => {
          // 确保克隆元素可见并正确定位
          element.style.position = 'relative';
          element.style.left = 'auto';
          element.style.top = 'auto';
          element.style.transform = 'none';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          element.style.margin = '0';
          element.style.width = `${elementWidth}px`;
          element.style.minWidth = `${elementWidth}px`;
          
          // 所有设备：限制高度防止克隆后撑开多余区域（安卓字体行高更大，也会溢出）
          element.style.overflow = 'hidden';
          element.style.height = `${elementHeight}px`;
          element.style.maxHeight = `${elementHeight}px`;
          
          // Force background color on cloned element
          if (bgColor) {
            element.style.backgroundColor = bgColor;
          }
          
          // 🔧 批量注入全局样式：一次性禁用所有动画 + 设置字体 fallback
          // 替代逐元素遍历，减少约 80% 的 DOM 操作开销
          const styleTag = doc.createElement('style');
          styleTag.textContent = `
            * {
              animation: none !important;
              transition: none !important;
              font-family: inherit, "PingFang SC", "Microsoft YaHei", "Heiti SC", "Noto Sans SC", sans-serif !important;
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
              text-rendering: optimizeLegibility !important;
            }
          `;
          doc.head.appendChild(styleTag);
          
          // 🔧 根元素设置中文 fallback 字体链，子元素通过 CSS 继承
          const computedFont = getComputedStyle(element).fontFamily;
          if (!computedFont.includes('PingFang') && !computedFont.includes('Microsoft YaHei')) {
            element.style.fontFamily = `${computedFont}, "PingFang SC", "Microsoft YaHei", "Heiti SC", "Noto Sans SC", sans-serif`;
          }
          
          // 🔧 bg-clip-text 修复：仅处理使用了渐变文字的元素（通常很少）
          element.querySelectorAll('[class*="bg-clip"], [class*="text-transparent"]').forEach((child: Element) => {
            if (child instanceof HTMLElement) {
              const computed = getComputedStyle(child);
              const bgClip = computed.getPropertyValue('-webkit-background-clip') || computed.getPropertyValue('background-clip');
              if (bgClip === 'text') {
                child.style.webkitBackgroundClip = 'border-box';
                child.style.backgroundClip = 'border-box';
                child.style.color = '#fbbf24';
                child.style.webkitTextFillColor = '#fbbf24';
                child.style.background = 'none';
              }
            }
          });
        },
      };

      // 带超时的 canvas 生成
      const generationTimeout = isWeChat 
        ? SHARE_TIMEOUTS.canvasGenerationWeChat 
        : SHARE_TIMEOUTS.canvasGeneration;
        
      const canvas = await Promise.race([
        html2canvas(originalElement, canvasOptions),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('图片生成超时，请重试')), generationTimeout)
        )
      ]) as HTMLCanvasElement;

      const elapsed = Math.round(performance.now() - startTime);
      debug && console.log('[shareCardConfig] Canvas generated:', {
        size: canvas.width + 'x' + canvas.height,
        elapsed: elapsed + 'ms'
      });
      
      if (elapsed > 3000) {
        console.warn('[shareCardConfig] Slow generation:', elapsed + 'ms');
      }

      // 空白 canvas 检测
      const ctx = canvas.getContext('2d');
      if (ctx && !forceScale) {
        try {
          const sampleW = Math.min(canvas.width, 10);
          const sampleH = Math.min(canvas.height, 10);
          const cx = Math.max(0, Math.floor((canvas.width - sampleW) / 2));
          const cy = Math.max(0, Math.floor((canvas.height - sampleH) / 2));
          const sample = ctx.getImageData(cx, cy, sampleW, sampleH);
          const isBlank = sample.data.every(v => v === 0);
          if (isBlank) {
            console.warn('[shareCardConfig] Blank canvas detected, retrying with scale 1.5...');
            return generateCanvasInternal(cardRef, { ...options, forceScale: 1.5 });
          }
        } catch (e) {
          debug && console.warn('[shareCardConfig] Canvas sample check failed:', e);
        }
      }
      
      // iOS: 裁剪底部多余白边（让出一帧再裁剪，减轻连续 CPU 负载）
      if (isIOSDevice()) {
        await new Promise(r => requestAnimationFrame(r));
        const trimmed = trimBottomWhitespace(canvas, bgColor);
        if (trimmed) return trimmed;
      }
      
      return canvas;

    } catch (e) {
      console.error('[shareCardConfig] Generation failed:', e);
      return null;
    }
};

/** Queue-wrapped public API */
export const generateCanvas = async (
  cardRef: React.RefObject<HTMLDivElement | null>,
  options: GenerateCanvasOptions = {}
): Promise<HTMLCanvasElement | null> => {
  return queueRender(() => generateCanvasInternal(cardRef, options));
};

/** Canvas 转 Blob - JPEG 优化版（体积比 PNG 小 3-5 倍） */
export const canvasToBlob = (canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob | null> => {
  return new Promise((resolve) => {
    // 大图自适应降低质量，进一步压缩体积
    const pixels = canvas.width * canvas.height;
    const adaptiveQuality = pixels > 1000000 ? 0.75 : quality;
    
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', adaptiveQuality);
  });
};

export const getBlobFileExtension = (blob: Blob): 'jpg' | 'png' => {
  return blob.type === 'image/png' ? 'png' : 'jpg';
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
  let canvas = await generateCanvas(cardRef, options);

  const canRetrySafely = !options.forceScale || options.forceScale > 1.2;
  if (!canvas && canRetrySafely) {
    console.warn('[shareCardConfig] Primary generation failed, retrying with safe settings...');
    const safeScale = isMiniProgramBrowser() || isWeChatBrowser() ? 1.2 : 1.5;
    canvas = await generateCanvas(cardRef, {
      ...options,
      forceScale: safeScale,
      skipFontWait: true,
      skipImageWait: true,
    });
  }

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
