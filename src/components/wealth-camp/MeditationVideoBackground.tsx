import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type VideoBackgroundType = 'water' | 'forest' | 'fire' | 'stars' | 'clouds' | 'sunset' | 'aurora' | 'snow' | null;

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
  const [meteors, setMeteors] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  // 初始化粒子（用于星空、云和雪效果）
  useEffect(() => {
    if (backgroundType === 'stars') {
      const newParticles = Array.from({ length: 120 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.8 + 0.2,
      }));
      setParticles(newParticles);
      // 生成多个流星
      const newMeteors = Array.from({ length: 4 }, (_, i) => ({
        id: i,
        left: 20 + Math.random() * 60,
        delay: i * 2 + Math.random() * 2,
      }));
      setMeteors(newMeteors);
    } else if (backgroundType === 'clouds') {
      const newParticles = Array.from({ length: 25 }, () => ({
        x: Math.random() * 120 - 10,
        y: Math.random() * 100,
        size: Math.random() * 100 + 60,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.4 + 0.3,
      }));
      setParticles(newParticles);
    } else if (backgroundType === 'snow') {
      const newParticles = Array.from({ length: 80 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 5 + 5,
        opacity: Math.random() * 0.6 + 0.4,
      }));
      setParticles(newParticles);
    }
  }, [backgroundType]);

  // Canvas 动画（水波纹、火焰、日落效果）
  useEffect(() => {
    if (!canvasRef.current || !isActive) return;
    if (backgroundType !== 'water' && backgroundType !== 'fire' && backgroundType !== 'sunset') return;

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
      } else if (backgroundType === 'sunset') {
        // 日落效果
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(25, 25, 60, 0.95)');
        gradient.addColorStop(0.3, 'rgba(80, 40, 80, 0.9)');
        gradient.addColorStop(0.5, 'rgba(200, 80, 60, 0.85)');
        gradient.addColorStop(0.7, 'rgba(255, 140, 50, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 180, 80, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 太阳
        const sunX = width * 0.5;
        const sunY = height * 0.65 + Math.sin(time * 0.2) * 5;
        const sunRadius = 40 + Math.sin(time * 0.5) * 5;
        
        // 太阳光晕
        for (let i = 3; i >= 0; i--) {
          const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius + i * 30);
          glowGradient.addColorStop(0, `rgba(255, 200, 100, ${0.3 - i * 0.05})`);
          glowGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(sunX, sunY, sunRadius + i * 30, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // 太阳本体
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
        sunGradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        sunGradient.addColorStop(0.7, 'rgba(255, 200, 100, 1)');
        sunGradient.addColorStop(1, 'rgba(255, 150, 50, 0.8)');
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // 水面反射
        ctx.fillStyle = 'rgba(255, 180, 100, 0.15)';
        ctx.fillRect(0, height * 0.75, width, height * 0.25);
        
        // 水波光
        for (let i = 0; i < 8; i++) {
          const reflectY = height * 0.78 + i * 8;
          const waveWidth = 60 + Math.sin(time + i) * 20;
          ctx.fillStyle = `rgba(255, 200, 150, ${0.3 - i * 0.03})`;
          ctx.fillRect(sunX - waveWidth / 2 + Math.sin(time * 2 + i) * 10, reflectY, waveWidth, 3);
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

  // 星空效果（CSS 动画 + 增强流星）
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
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDuration: `${2 + particle.speed * 3}s`,
              animationDelay: `${index * 0.05}s`,
            }}
          />
        ))}
        {/* 多个流星效果 */}
        {meteors.map((meteor) => (
          <div 
            key={meteor.id}
            className="absolute w-1 h-16 bg-gradient-to-b from-white via-white/50 to-transparent opacity-80 animate-meteor" 
            style={{ 
              left: `${meteor.left}%`, 
              top: '-10%', 
              transform: 'rotate(45deg)',
              animationDelay: `${meteor.delay}s`,
              animationDuration: `${2 + Math.random()}s`,
            }} 
          />
        ))}
        {/* 银河效果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
      </div>
    );
  }

  // 云海效果（CSS 动画 + 增强层次）
  if (backgroundType === 'clouds') {
    return (
      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-lg",
        "bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100",
        className
      )}>
        {/* 远景云层 */}
        {particles.slice(0, 10).map((particle, index) => (
          <div
            key={`far-${index}`}
            className="absolute rounded-full bg-white/40 blur-2xl animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y * 0.6}%`,
              width: `${particle.size * 1.5}px`,
              height: `${particle.size * 0.5}px`,
              animationDuration: `${15 + particle.speed * 10}s`,
              animationDelay: `${index * 0.8}s`,
            }}
          />
        ))}
        {/* 近景云层 */}
        {particles.slice(10).map((particle, index) => (
          <div
            key={`near-${index}`}
            className="absolute rounded-full bg-white/70 blur-xl animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size * 0.4}px`,
              animationDuration: `${10 + particle.speed * 8}s`,
              animationDelay: `${index * 0.5}s`,
            }}
          />
        ))}
        {/* 光晕效果 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-yellow-100/30 blur-3xl" />
      </div>
    );
  }

  // 森林效果（CSS 渐变 + 动态树影）
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
              className="absolute bottom-0 bg-gradient-to-t from-black/40 to-transparent animate-sway"
              style={{
                left: `${i * 15 - 5}%`,
                width: '20%',
                height: `${50 + Math.random() * 30}%`,
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${3 + i * 0.3}s`,
              }}
            />
          ))}
        </div>
        {/* 阳光穿透效果 */}
        <div className="absolute top-0 right-10 w-32 h-64 bg-gradient-to-b from-yellow-200/30 via-yellow-100/10 to-transparent blur-xl animate-pulse" style={{ animationDuration: '4s' }} />
        {/* 光斑效果 */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-yellow-200/20 blur-3xl animate-pulse" />
        <div className="absolute top-20 left-20 w-24 h-24 rounded-full bg-green-300/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        {/* 萤火虫效果 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`firefly-${i}`}
            className="absolute w-2 h-2 rounded-full bg-yellow-200 blur-sm animate-twinkle"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${30 + Math.random() * 50}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // 极光效果
  if (backgroundType === 'aurora') {
    return (
      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-lg",
        "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-800",
        className
      )}>
        {/* 星星背景 */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.8 + 0.2,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        {/* 极光带 */}
        <div className="absolute inset-x-0 top-0 h-3/4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`aurora-${i}`}
              className="absolute inset-x-0 animate-aurora"
              style={{
                top: `${10 + i * 12}%`,
                height: '30%',
                background: `linear-gradient(180deg, 
                  transparent 0%, 
                  ${i % 2 === 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'} 30%, 
                  ${i % 2 === 0 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(34, 197, 94, 0.2)'} 70%, 
                  transparent 100%)`,
                filter: 'blur(20px)',
                animationDelay: `${i * 1.2}s`,
                animationDuration: `${5 + i}s`,
              }}
            />
          ))}
        </div>
        {/* 地平线光晕 */}
        <div className="absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>
    );
  }

  // 雪景效果
  if (backgroundType === 'snow') {
    return (
      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-lg",
        "bg-gradient-to-b from-slate-700 via-slate-600 to-slate-500",
        className
      )}>
        {/* 雪花 */}
        {particles.map((particle, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white animate-snowfall"
            style={{
              left: `${particle.x}%`,
              top: `-5%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDuration: `${particle.speed + 5}s`,
              animationDelay: `${index * 0.1}s`,
              filter: particle.size > 4 ? 'blur(1px)' : 'none',
            }}
          />
        ))}
        {/* 雪地 */}
        <div className="absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-white/40 to-transparent" />
        {/* 远山 */}
        <div 
          className="absolute bottom-1/4 left-0 w-1/2 h-1/3 bg-slate-400/50"
          style={{ clipPath: 'polygon(0 100%, 50% 30%, 100% 100%)' }}
        />
        <div 
          className="absolute bottom-1/4 right-0 w-2/3 h-2/5 bg-slate-500/40"
          style={{ clipPath: 'polygon(0 100%, 40% 20%, 100% 100%)' }}
        />
        {/* 雾气效果 */}
        <div className="absolute inset-0 bg-white/10" />
      </div>
    );
  }

  // 水波纹、火焰和日落效果（Canvas）
  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 rounded-lg", className)}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default MeditationVideoBackground;