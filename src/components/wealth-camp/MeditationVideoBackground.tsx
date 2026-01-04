import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type VideoBackgroundType = 'water' | 'forest' | 'fire' | 'stars' | 'clouds' | null;

interface MeditationVideoBackgroundProps {
  backgroundType: VideoBackgroundType;
  isActive: boolean;
  className?: string;
}

const MeditationVideoBackground: React.FC<MeditationVideoBackgroundProps> = ({
  backgroundType,
  isActive,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; speed: number; opacity: number }>>([]);

  // 初始化粒子（用于星空和云效果）
  useEffect(() => {
    if (backgroundType === 'stars' || backgroundType === 'clouds') {
      const newParticles = Array.from({ length: backgroundType === 'stars' ? 100 : 20 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (backgroundType === 'stars' ? 3 : 80) + 1,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.8 + 0.2,
      }));
      setParticles(newParticles);
    }
  }, [backgroundType]);

  // Canvas 动画（水波纹和火焰效果）
  useEffect(() => {
    if (!canvasRef.current || !isActive) return;
    if (backgroundType !== 'water' && backgroundType !== 'fire') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      if (!ctx || !canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      if (backgroundType === 'water') {
        // 水波纹效果
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(30, 60, 90, 0.8)');
        gradient.addColorStop(1, 'rgba(20, 40, 60, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 绘制多层波纹
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(100, 180, 255, ${0.1 + layer * 0.05})`;
          ctx.lineWidth = 2;
          
          for (let x = 0; x < width; x += 5) {
            const y = height * 0.5 + 
              Math.sin((x * 0.01) + time * (0.5 + layer * 0.2)) * 20 +
              Math.sin((x * 0.02) + time * (0.3 + layer * 0.1)) * 15;
            
            if (x === 0) {
              ctx.moveTo(x, y + layer * 30);
            } else {
              ctx.lineTo(x, y + layer * 30);
            }
          }
          ctx.stroke();
        }

        // 添加光斑效果
        for (let i = 0; i < 5; i++) {
          const x = (time * 20 + i * 100) % width;
          const y = height * 0.4 + Math.sin(time + i) * 30;
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 30);
          glow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(x - 30, y - 30, 60, 60);
        }
      } else if (backgroundType === 'fire') {
        // 火焰效果背景
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, 'rgba(60, 20, 0, 0.9)');
        gradient.addColorStop(0.5, 'rgba(40, 15, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(20, 10, 5, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 绘制火焰粒子
        for (let i = 0; i < 30; i++) {
          const baseX = width * 0.3 + (i * width * 0.015);
          const flicker = Math.sin(time * 3 + i) * 10;
          const y = height - 50 - Math.abs(Math.sin(time * 2 + i * 0.5)) * 150;
          
          const fireGradient = ctx.createRadialGradient(
            baseX + flicker, y, 0,
            baseX + flicker, y, 40 + Math.sin(time + i) * 10
          );
          fireGradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
          fireGradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.5)');
          fireGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
          
          ctx.fillStyle = fireGradient;
          ctx.beginPath();
          ctx.arc(baseX + flicker, y, 40 + Math.sin(time + i) * 10, 0, Math.PI * 2);
          ctx.fill();
        }

        // 添加火星
        for (let i = 0; i < 15; i++) {
          const sparkX = width * 0.3 + Math.random() * width * 0.4;
          const sparkY = height - 100 - (time * 30 + i * 20) % (height * 0.6);
          const sparkSize = Math.random() * 3 + 1;
          
          ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${0.8 - sparkY / height})`;
          ctx.beginPath();
          ctx.arc(sparkX + Math.sin(time + i) * 5, sparkY, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      time += 0.02;
      animationRef.current = requestAnimationFrame(animate);
    };

    // 设置 canvas 尺寸
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [backgroundType, isActive]);

  if (!backgroundType || !isActive) return null;

  // 星空效果（CSS 动画）
  if (backgroundType === 'stars') {
    return (
      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-lg",
        "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900",
        className
      )}>
        {particles.map((particle, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDuration: `${2 + particle.speed * 3}s`,
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
        {/* 流星效果 */}
        <div className="absolute w-1 h-20 bg-gradient-to-b from-white to-transparent opacity-60 animate-meteor" 
          style={{ left: '70%', top: '-20%', transform: 'rotate(45deg)' }} 
        />
      </div>
    );
  }

  // 云海效果（CSS 动画）
  if (backgroundType === 'clouds') {
    return (
      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-lg",
        "bg-gradient-to-b from-sky-200 via-sky-300 to-sky-400",
        className
      )}>
        {particles.map((particle, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white/60 blur-xl"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size * 0.4}px`,
              animation: `float ${10 + particle.speed * 10}s ease-in-out infinite`,
              animationDelay: `${index * 0.5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // 森林效果（CSS 渐变 + 叠加）
  if (backgroundType === 'forest') {
    return (
      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-lg",
        "bg-gradient-to-b from-emerald-900 via-green-800 to-emerald-950",
        className
      )}>
        {/* 树影效果 */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 bg-gradient-to-t from-black/40 to-transparent"
              style={{
                left: `${i * 15 - 5}%`,
                width: '20%',
                height: `${50 + Math.random() * 30}%`,
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                animation: `sway ${3 + i * 0.5}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
        {/* 光斑效果 */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-yellow-200/20 blur-3xl animate-pulse" />
        <div className="absolute top-20 left-20 w-24 h-24 rounded-full bg-green-300/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    );
  }

  // 水波纹和火焰效果（Canvas）
  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 rounded-lg", className)}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default MeditationVideoBackground;
