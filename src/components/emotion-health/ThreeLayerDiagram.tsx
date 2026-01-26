import { motion } from "framer-motion";

interface ThreeLayerDiagramProps {
  size?: number;
  className?: string;
}

export function ThreeLayerDiagram({ size = 200, className }: ThreeLayerDiagramProps) {
  const center = size / 2;
  const outerRadius = size * 0.45;
  const middleRadius = size * 0.32;
  const innerRadius = size * 0.2;

  return (
    <div className={className}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {/* 第一层渐变 - 蓝色 */}
          <linearGradient id="layer1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(210, 100%, 60%)" />
            <stop offset="100%" stopColor="hsl(190, 100%, 50%)" />
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
          opacity={0.25}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.25 }}
          transition={{ duration: 0.5, delay: 0 }}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="url(#layer1Gradient)"
          strokeWidth={2}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [1, 1.02, 1], 
            opacity: 1 
          }}
          transition={{ 
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.5 }
          }}
        />

        {/* 第二层 - 中圈（反应模式） */}
        <motion.circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="url(#layer2Gradient)"
          opacity={0.35}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.35 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="url(#layer2Gradient)"
          strokeWidth={2}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [1, 1.03, 1], 
            opacity: 1 
          }}
          transition={{ 
            scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
            opacity: { duration: 0.5, delay: 0.15 }
          }}
        />

        {/* 第三层 - 内核（行动阻滞） */}
        <motion.circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="url(#layer3Gradient)"
          opacity={0.5}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="url(#layer3Gradient)"
          strokeWidth={2}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [1, 1.05, 1], 
            opacity: 1 
          }}
          transition={{ 
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
            opacity: { duration: 0.5, delay: 0.3 }
          }}
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

      {/* 标注 */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
          <span className="text-muted-foreground">状态筛查</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500" />
          <span className="text-muted-foreground">反应模式</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500" />
          <span className="text-muted-foreground">行动阻滞</span>
        </div>
      </div>
    </div>
  );
}
