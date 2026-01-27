import React, { forwardRef, ReactNode } from 'react';
import { useQRCode } from '@/utils/qrCodeUtils';
import { getPromotionDomain } from '@/utils/partnerQRUtils';

// ============= Types =============

export interface ShareCardBaseProps {
  /** 分享链接路径 (不含域名) */
  sharePath: string;
  /** 合伙人代码 */
  partnerCode?: string;
  /** 卡片宽度 */
  width?: number;
  /** 卡片内边距 */
  padding?: number;
  /** 卡片背景 (CSS gradient 或颜色) */
  background?: string;
  /** 卡片圆角 */
  borderRadius?: number;
  /** 卡片内容 */
  children: ReactNode;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 是否显示底部区域 */
  showFooter?: boolean;
  /** 底部配置 */
  footerConfig?: FooterConfig;
  /** 自定义 footer 渲染 - 如果提供则完全覆盖默认 footer */
  renderFooter?: (qrCodeUrl: string | null, shareUrl: string) => ReactNode;
  /** 加载完成回调 */
  onReady?: () => void;
}

export interface FooterConfig {
  /** CTA 主标题 */
  ctaTitle?: string;
  /** CTA 副标题 */
  ctaSubtitle?: string;
  /** QR码说明文字 */
  qrLabel?: string;
  /** 主题色 (用于文字) */
  primaryColor?: string;
  /** 次要色 (用于副文字) */
  secondaryColor?: string;
  /** 是否显示QR码 */
  showQR?: boolean;
  /** 是否显示品牌标识 */
  showBranding?: boolean;
  /** 品牌标识颜色 */
  brandingColor?: string;
  /** 品牌标识透明度 */
  brandingOpacity?: number;
  /** Footer 布局: 'horizontal' | 'vertical' */
  layout?: 'horizontal' | 'vertical';
  /** 额外的 CTA 标签 */
  tags?: string[];
  /** 标签主题色 */
  tagColor?: string;
  /** 标签背景色 */
  tagBgColor?: string;
}

// ============= Default Config =============

const defaultFooterConfig: Required<FooterConfig> = {
  ctaTitle: '扫码体验',
  ctaSubtitle: '🎁 免费体验',
  qrLabel: '',
  primaryColor: '#1f2937',
  secondaryColor: '#6b7280',
  showQR: true,
  showBranding: true,
  brandingColor: '#9ca3af',
  brandingOpacity: 0.85,
  layout: 'horizontal',
  tags: [],
  tagColor: '#0D9488',
  tagBgColor: 'rgba(204, 251, 241, 0.5)',
};

// ============= Sub Components =============

interface QRCodeSectionProps {
  qrCodeUrl: string | null;
  config: Required<FooterConfig>;
}

const QRCodeSection: React.FC<QRCodeSectionProps> = ({ qrCodeUrl, config }) => {
  if (!config.showQR || !qrCodeUrl) return null;

  if (config.layout === 'vertical') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: config.showBranding ? '14px' : '0',
        }}
      >
        <img
          src={qrCodeUrl}
          alt="扫码"
          style={{ width: '80px', height: '80px', borderRadius: '8px' }}
        />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', color: config.primaryColor }}>
            {config.ctaTitle}
          </p>
          <p style={{ fontSize: '11px', color: config.secondaryColor, margin: 0 }}>
            {config.ctaSubtitle}
          </p>
          {config.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
              {config.tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    background: config.tagBgColor,
                    borderRadius: '10px',
                    color: config.tagColor,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '14px',
        padding: '14px',
        marginBottom: config.showBranding ? '14px' : '0',
      }}
    >
      <img
        src={qrCodeUrl}
        alt="扫码"
        style={{ width: '70px', height: '70px', borderRadius: '8px' }}
      />
      <div style={{ color: config.primaryColor }}>
        <p style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
          {config.ctaTitle}
        </p>
        <p style={{ fontSize: '11px', color: config.secondaryColor, margin: 0 }}>
          {config.ctaSubtitle}
        </p>
        {config.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {config.tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  background: config.tagBgColor,
                  borderRadius: '10px',
                  color: config.tagColor,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface BrandingProps {
  config: Required<FooterConfig>;
}

const Branding: React.FC<BrandingProps> = ({ config }) => {
  if (!config.showBranding) return null;
  
  return (
    <div
      style={{
        textAlign: 'center',
        fontSize: '11px',
        color: config.brandingColor,
        opacity: config.brandingOpacity,
      }}
    >
      Powered by 有劲AI
    </div>
  );
};

// ============= Main Component =============

/**
 * ShareCardBase - 分享卡片基础组件
 * 
 * 封装统一的 QR 码生成、品牌标识、底部区域等通用元素
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <ShareCardBase
 *   sharePath="/wealth-block"
 *   partnerCode="ABC123"
 *   width={340}
 *   background="linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
 *   footerConfig={{
 *     ctaTitle: '扫码开始测评',
 *     ctaSubtitle: '🎁 免费体验',
 *     primaryColor: '#4f46e5',
 *   }}
 * >
 *   <YourCardContent />
 * </ShareCardBase>
 * 
 * // 自定义 footer
 * <ShareCardBase
 *   sharePath="/scl90"
 *   showFooter={false}
 *   renderFooter={(qrCodeUrl, shareUrl) => (
 *     <CustomFooter qrCodeUrl={qrCodeUrl} />
 *   )}
 * >
 *   <YourCardContent />
 * </ShareCardBase>
 * ```
 */
const ShareCardBase = forwardRef<HTMLDivElement, ShareCardBaseProps>(
  (
    {
      sharePath,
      partnerCode,
      width = 340,
      padding = 24,
      background = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      borderRadius = 24,
      children,
      style,
      className,
      showFooter = true,
      footerConfig = {},
      renderFooter,
      onReady,
    },
    ref
  ) => {
    // 生成分享URL
    const shareUrl = partnerCode
      ? `${getPromotionDomain()}${sharePath}?ref=${partnerCode}`
      : `${getPromotionDomain()}${sharePath}`;
    
    // 使用统一的 QR 码 hook
    const { qrCodeUrl, isLoading } = useQRCode(shareUrl);
    
    // 合并配置
    const mergedConfig: Required<FooterConfig> = {
      ...defaultFooterConfig,
      ...footerConfig,
    };

    // 通知加载完成
    React.useEffect(() => {
      if (!isLoading && onReady) {
        onReady();
      }
    }, [isLoading, onReady]);

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: `${width}px`,
          padding: `${padding}px`,
          background,
          borderRadius: `${borderRadius}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
      >
        {/* 卡片内容 */}
        {children}
        
        {/* 自定义 footer 或默认 footer */}
        {renderFooter ? (
          renderFooter(qrCodeUrl, shareUrl)
        ) : showFooter && (
          <div style={{ marginTop: '16px' }}>
            <QRCodeSection qrCodeUrl={qrCodeUrl} config={mergedConfig} />
            <Branding config={mergedConfig} />
          </div>
        )}
      </div>
    );
  }
);

ShareCardBase.displayName = 'ShareCardBase';

// ============= Exports =============

export default ShareCardBase;

// 导出子组件供自定义使用
export { QRCodeSection, Branding };

// 导出类型
export type { QRCodeSectionProps, BrandingProps };

// 导出默认配置供外部使用
export { defaultFooterConfig };
