/**
 * 统一分享卡片配置模块
 * 
 * 提供标准化的 html2canvas 配置和 generateCanvas 辅助函数
 * 避免配置分散在多个文件中
 */

import html2canvas, { Options as Html2CanvasOptions } from 'html2canvas';

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

/** 超时配置 */
export const SHARE_TIMEOUTS: {
  imageLoad: number;
  imageLoadWeChat: number;
  renderDelay: number;
  renderDelayWeChat: number;
  canvasGeneration: number;
} = {
  /** 图片加载超时 (毫秒) */
  imageLoad: 5000,
  /** 微信环境图片加载超时 */
  imageLoadWeChat: 8000,
  /** 渲染稳定延迟 */
  renderDelay: 150,
  /** 微信环境渲染延迟 */
  renderDelayWeChat: 250,
  /** canvas 生成超时 */
  canvasGeneration: 12000,
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

// ============= 辅助函数 =============

/** 等待元素内所有图片加载完成 */
export const waitForImages = async (
  element: HTMLElement, 
  timeout = SHARE_TIMEOUTS.imageLoad
): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete && img.naturalHeight > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), timeout);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); resolve(); };
    });
  });
  await Promise.all(promises);
};

/** 创建隐藏的渲染容器 */
export const createHiddenWrapper = (): HTMLDivElement => {
  const wrapper = document.createElement('div');
  wrapper.id = 'share-card-render-wrapper';
  wrapper.style.cssText = `
    position: fixed !important;
    left: -99999px !important;
    top: -99999px !important;
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
  cloned.style.background = 'transparent';
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
}

/**
 * 统一的 Canvas 生成函数
 * 
 * @param cardRef - 卡片元素的 ref
 * @param options - 生成选项
 * @returns Canvas 元素或 null
 */
export const generateCanvas = async (
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
  } = options;

  if (!cardRef.current) {
    console.error('[shareCardConfig] cardRef.current is null');
    return null;
  }

  const originalElement = cardRef.current;
  const elementWidth = explicitWidth || originalElement.scrollWidth || originalElement.offsetWidth;
  const elementHeight = explicitHeight || originalElement.scrollHeight || originalElement.offsetHeight;

  debug && console.log('[shareCardConfig] Starting generation:', { 
    width: elementWidth, 
    height: elementHeight,
    backgroundType,
    isWeChat 
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
    // 等待图片加载
    const imageTimeout = isWeChat ? SHARE_TIMEOUTS.imageLoadWeChat : SHARE_TIMEOUTS.imageLoad;
    await waitForImages(clonedElement, imageTimeout);

    // 渲染稳定延迟
    const renderDelay = isWeChat ? SHARE_TIMEOUTS.renderDelayWeChat : SHARE_TIMEOUTS.renderDelay;
    await new Promise(resolve => setTimeout(resolve, renderDelay));

    debug && console.log('[shareCardConfig] Starting html2canvas...');

    // 构建 html2canvas 配置
    const canvasOptions: Partial<Html2CanvasOptions> = {
      ...SHARE_CARD_CONFIG,
      backgroundColor: bgColor,
      logging: debug,
      imageTimeout: imageTimeout,
      width: elementWidth,
      height: elementHeight,
      windowWidth: elementWidth + 100,
      windowHeight: elementHeight + 100,
      onclone: (_doc, element) => {
        element.style.transform = 'none';
        element.style.visibility = 'visible';
        element.style.opacity = '1';
        
        // Force background color on cloned element to prevent transparency
        if (bgColor) {
          element.style.backgroundColor = bgColor;
        }
      },
    };

    // 带超时的 canvas 生成
    const canvas = await Promise.race([
      html2canvas(clonedElement, canvasOptions),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('图片生成超时，请重试')), SHARE_TIMEOUTS.canvasGeneration)
      )
    ]) as HTMLCanvasElement;

    debug && console.log('[shareCardConfig] Canvas generated:', canvas.width, 'x', canvas.height);
    return canvas;

  } finally {
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
  }
};

/** Canvas 转 Blob */
export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
};

/** Canvas 转 DataURL */
export const canvasToDataUrl = (canvas: HTMLCanvasElement): string => {
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
