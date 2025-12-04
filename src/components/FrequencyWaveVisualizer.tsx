import React, { useRef, useEffect } from 'react';

interface FrequencyWaveVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  frequency: number;
  gradient: string;
  className?: string;
}

export const FrequencyWaveVisualizer: React.FC<FrequencyWaveVisualizerProps> = ({
  analyserNode,
  isPlaying,
  frequency,
  gradient,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();

    // 获取渐变色
    const getGradientColors = () => {
      if (gradient.includes('teal')) return ['#2dd4bf', '#06b6d4'];
      if (gradient.includes('emerald')) return ['#34d399', '#22c55e'];
      if (gradient.includes('red')) return ['#f87171', '#f97316'];
      if (gradient.includes('violet')) return ['#a78bfa', '#8b5cf6'];
      if (gradient.includes('amber')) return ['#fbbf24', '#eab308'];
      if (gradient.includes('pink')) return ['#f472b6', '#f43f5e'];
      if (gradient.includes('blue')) return ['#60a5fa', '#6366f1'];
      if (gradient.includes('indigo')) return ['#818cf8', '#8b5cf6'];
      return ['#2dd4bf', '#06b6d4'];
    };

    const [color1, color2] = getGradientColors();

    const draw = () => {
      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, width, height);

      if (!isPlaying) {
        // 静态波形
        ctx.beginPath();
        ctx.strokeStyle = `${color1}40`;
        ctx.lineWidth = 2;
        
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.02) * 10;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        return;
      }

      timeRef.current += 0.05;

      // 创建渐变
      const linearGradient = ctx.createLinearGradient(0, 0, width, 0);
      linearGradient.addColorStop(0, color1);
      linearGradient.addColorStop(1, color2);

      // 绘制多层波形
      for (let layer = 0; layer < 3; layer++) {
        const amplitude = (30 - layer * 8) * (isPlaying ? 1 : 0.3);
        const phase = timeRef.current + layer * 0.5;
        const waveFreq = 0.01 + (frequency / 10000) + layer * 0.005;
        const opacity = 1 - layer * 0.3;

        ctx.beginPath();
        ctx.strokeStyle = layer === 0 ? linearGradient : `${color1}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 3 - layer;
        ctx.lineCap = 'round';

        for (let x = 0; x < width; x++) {
          const y = height / 2 + 
            Math.sin(x * waveFreq + phase) * amplitude +
            Math.sin(x * waveFreq * 2 + phase * 1.5) * (amplitude * 0.3);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // 添加发光效果
      if (isPlaying) {
        ctx.shadowColor = color1;
        ctx.shadowBlur = 15;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, frequency, gradient, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-24 rounded-lg ${className}`}
      style={{ background: 'transparent' }}
    />
  );
};
