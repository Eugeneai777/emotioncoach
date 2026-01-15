import { motion } from 'framer-motion';

interface AudioWaveformProps {
  status: 'idle' | 'user-speaking' | 'assistant-speaking' | 'connecting';
  primaryColor?: string;
}

export const AudioWaveform = ({ status, primaryColor = 'rose' }: AudioWaveformProps) => {
  const barsCount = 5;
  
  // 根据主色调获取颜色
  const colorMap: Record<string, { from: string; to: string }> = {
    rose: { from: 'from-rose-400', to: 'to-rose-600' },
    green: { from: 'from-green-400', to: 'to-green-600' },
    blue: { from: 'from-blue-400', to: 'to-blue-600' },
    purple: { from: 'from-purple-400', to: 'to-purple-600' },
    orange: { from: 'from-orange-400', to: 'to-orange-600' },
  };
  
  const colors = colorMap[primaryColor] || colorMap.rose;
  
  // 获取条形颜色
  const getBarColor = () => {
    switch (status) {
      case 'user-speaking':
        return 'bg-gradient-to-t from-green-400 to-green-300';
      case 'assistant-speaking':
        return `bg-gradient-to-t ${colors.from} ${colors.to}`;
      case 'connecting':
        return 'bg-gradient-to-t from-white/40 to-white/60';
      default:
        return 'bg-gradient-to-t from-white/20 to-white/40';
    }
  };
  
  // 获取动画持续时间
  const getDuration = (index: number) => {
    switch (status) {
      case 'user-speaking':
        return 0.4 + index * 0.1;
      case 'assistant-speaking':
        return 0.5 + index * 0.08;
      case 'connecting':
        return 1.2;
      default:
        return 2;
    }
  };
  
  // 获取动画 scaleY 值
  const getScaleY = () => {
    switch (status) {
      case 'user-speaking':
        return [0.3, 1, 0.5, 0.8, 0.3];
      case 'assistant-speaking':
        return [0.4, 0.9, 0.6, 1, 0.4];
      case 'connecting':
        return [0.2, 0.4, 0.2];
      default:
        return [0.15, 0.25, 0.15];
    }
  };
  
  // 获取延迟
  const getDelay = (index: number) => {
    switch (status) {
      case 'connecting':
        return index * 0.15;
      case 'idle':
        return index * 0.2;
      default:
        return 0;
    }
  };
  
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: barsCount }).map((_, index) => (
        <motion.div
          key={index}
          className={`w-1.5 rounded-full origin-center ${getBarColor()}`}
          style={{ height: '100%' }}
          animate={{
            scaleY: getScaleY(),
            opacity: status === 'connecting' ? [0.5, 1, 0.5] : 1,
          }}
          transition={{
            duration: getDuration(index),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: getDelay(index),
          }}
        />
      ))}
    </div>
  );
};
