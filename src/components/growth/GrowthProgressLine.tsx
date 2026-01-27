import { motion } from 'framer-motion';

interface GrowthProgressLineProps {
  /** 节点总数 */
  totalNodes: number;
  /** 已完成的节点数（包括当前节点之前的所有节点） */
  completedCount: number;
  /** 每个节点的高度（用于计算线的长度） */
  nodeHeight?: number;
}

export function GrowthProgressLine({ 
  totalNodes, 
  completedCount,
  nodeHeight = 100 
}: GrowthProgressLineProps) {
  // 计算进度比例（当前节点算作一半）
  const progressRatio = totalNodes > 1 
    ? (completedCount + 0.5) / totalNodes 
    : 0;
  
  const totalHeight = (totalNodes - 1) * nodeHeight + 24; // 24px 是第一个节点的 top 偏移

  return (
    <div 
      className="absolute left-[11px] top-4 w-[2px] pointer-events-none"
      style={{ height: totalHeight }}
    >
      {/* 背景虚线 */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" />
            <stop offset={`${progressRatio * 100}%`} stopColor="rgb(139, 92, 246)" />
            <stop offset="100%" stopColor="rgb(156, 163, 175)" />
          </linearGradient>
        </defs>
        
        {/* 背景虚线（未完成部分） */}
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="100%"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="text-muted-foreground/20"
        />
        
        {/* 进度实线 */}
        <motion.line
          x1="1"
          y1="0"
          x2="1"
          y2="100%"
          stroke="url(#progressGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progressRatio }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{ 
            strokeDasharray: 1,
            strokeDashoffset: 1,
            transform: "translateZ(0)"
          }}
        />
      </svg>
    </div>
  );
}
