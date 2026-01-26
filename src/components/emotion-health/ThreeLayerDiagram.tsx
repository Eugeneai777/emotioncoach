import { motion } from "framer-motion";

type LayerType = 'layer1' | 'layer2' | 'layer3';

interface ThreeLayerDiagramProps {
  size?: number;
  className?: string;
  activeLayer?: LayerType;
  onLayerClick?: (layer: LayerType) => void;
}

export function ThreeLayerDiagram({ 
  size = 200, 
  className, 
  activeLayer,
  onLayerClick 
}: ThreeLayerDiagramProps) {
  const center = size / 2;
  const outerRadius = size * 0.45;
  const middleRadius = size * 0.32;
  const innerRadius = size * 0.2;

  const isInteractive = !!onLayerClick;

  const getLayerOpacity = (layer: LayerType, baseOpacity: number) => {
    if (!activeLayer) return baseOpacity;
    return activeLayer === layer ? baseOpacity + 0.15 : baseOpacity * 0.6;
  };

  return (
    <div className={className}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {/* 第一层渐变 - 蓝色/青色 */}
          <linearGradient id="layer1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(160, 70%, 45%)" />
            <stop offset="100%" stopColor="hsl(180, 70%, 40%)" />
          </linearGradient>
          {/* 第二层渐变 - 紫色 */}
          <linearGradient id="layer2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(270, 80%, 60%)" />
            <stop offset="100%" stopColor="hsl(280, 70%, 55%)" />
          </linearGradient>
          {/* 第三层渐变 - 玫瑰色 */}
          <linearGradient id="layer3Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(350, 80%, 60%)" />
            <stop offset="100%" stopColor="hsl(330, 80%, 55%)" />
          </linearGradient>
        </defs>

        {/* 第一层 - 外圈（状态筛查） */}
        <motion.circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="url(#layer1Gradient)"
          opacity={getLayerOpacity('layer1', 0.25)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: getLayerOpacity('layer1', 0.25) }}
          transition={{ duration: 0.5, delay: 0 }}
          onClick={() => onLayerClick?.('layer1')}
          className={isInteractive ? "cursor-pointer" : ""}
          whileHover={isInteractive ? { opacity: 0.4 } : undefined}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="url(#layer1Gradient)"
          strokeWidth={activeLayer === 'layer1' ? 3 : 2}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: activeLayer === 'layer1' ? [1, 1.03, 1] : [1, 1.02, 1], 
            opacity: 1 
          }}
          transition={{ 
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.5 }
          }}
          onClick={() => onLayerClick?.('layer1')}
          className={isInteractive ? "cursor-pointer" : ""}
        />

        {/* 第二层 - 中圈（反应模式） */}
        <motion.circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="url(#layer2Gradient)"
          opacity={getLayerOpacity('layer2', 0.35)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: getLayerOpacity('layer2', 0.35) }}
          transition={{ duration: 0.5, delay: 0.15 }}
          onClick={() => onLayerClick?.('layer2')}
          className={isInteractive ? "cursor-pointer" : ""}
          whileHover={isInteractive ? { opacity: 0.5 } : undefined}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="url(#layer2Gradient)"
          strokeWidth={activeLayer === 'layer2' ? 3 : 2}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: activeLayer === 'layer2' ? [1, 1.04, 1] : [1, 1.03, 1], 
            opacity: 1 
          }}
          transition={{ 
            scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
            opacity: { duration: 0.5, delay: 0.15 }
          }}
          onClick={() => onLayerClick?.('layer2')}
          className={isInteractive ? "cursor-pointer" : ""}
        />

        {/* 第三层 - 内核（行动阻滞） */}
        <motion.circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="url(#layer3Gradient)"
          opacity={getLayerOpacity('layer3', 0.5)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: getLayerOpacity('layer3', 0.5) }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onClick={() => onLayerClick?.('layer3')}
          className={isInteractive ? "cursor-pointer" : ""}
          whileHover={isInteractive ? { opacity: 0.65 } : undefined}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="url(#layer3Gradient)"
          strokeWidth={activeLayer === 'layer3' ? 3 : 2}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: activeLayer === 'layer3' ? [1, 1.06, 1] : [1, 1.05, 1], 
            opacity: 1 
          }}
          transition={{ 
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
            opacity: { duration: 0.5, delay: 0.3 }
          }}
          onClick={() => onLayerClick?.('layer3')}
          className={isInteractive ? "cursor-pointer" : ""}
        />

        {/* 中心点 */}
        <motion.circle
          cx={center}
          cy={center}
          r={4}
          fill="white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
      </svg>

      {/* 标注 - 可点击 */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <button 
          onClick={() => onLayerClick?.('layer1')}
          className={`flex items-center gap-1.5 transition-opacity ${isInteractive ? 'cursor-pointer hover:opacity-80' : ''} ${activeLayer && activeLayer !== 'layer1' ? 'opacity-50' : ''}`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
          <span className="text-muted-foreground">状态筛查</span>
        </button>
        <button 
          onClick={() => onLayerClick?.('layer2')}
          className={`flex items-center gap-1.5 transition-opacity ${isInteractive ? 'cursor-pointer hover:opacity-80' : ''} ${activeLayer && activeLayer !== 'layer2' ? 'opacity-50' : ''}`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500" />
          <span className="text-muted-foreground">反应模式</span>
        </button>
        <button 
          onClick={() => onLayerClick?.('layer3')}
          className={`flex items-center gap-1.5 transition-opacity ${isInteractive ? 'cursor-pointer hover:opacity-80' : ''} ${activeLayer && activeLayer !== 'layer3' ? 'opacity-50' : ''}`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500" />
          <span className="text-muted-foreground">行动阻滞</span>
        </button>
      </div>
    </div>
  );
}
