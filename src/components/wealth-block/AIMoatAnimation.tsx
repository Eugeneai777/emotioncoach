import { motion } from "framer-motion";
import { Clock, Database, Heart, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const trilogy = [
  {
    icon: Clock,
    name: "成长追踪",
    color: "from-amber-400 to-orange-500",
    glowColor: "rgba(251,191,36,0.4)",
    angle: 0,
    description: "7天追踪你的变化轨迹",
  },
  {
    icon: Database,
    name: "画像对比",
    color: "from-cyan-400 to-blue-500",
    glowColor: "rgba(6,182,212,0.4)",
    angle: 120,
    description: "活画像记录你的每一次成长",
  },
  {
    icon: Heart,
    name: "AI见证",
    color: "from-rose-400 to-pink-500",
    glowColor: "rgba(244,63,94,0.4)",
    angle: 240,
    description: "见证并命名你的每次蜕变",
  },
];

interface AIMoatAnimationProps {
  compact?: boolean;
  showLabels?: boolean;
}

export function AIMoatAnimation({ compact = false, showLabels = true }: AIMoatAnimationProps) {
  const size = compact ? 200 : 280;
  const orbitRadius = compact ? 65 : 95;
  const centerSize = compact ? 70 : 100;
  const lockSize = compact ? 40 : 56;
  
  return (
    <Card className={`${compact ? 'p-4' : 'p-6'} bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/30 overflow-hidden relative`}>
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 blur-3xl"
        />
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-center gap-2 mb-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
        </motion.div>
        <h3 className={`font-bold text-white ${compact ? 'text-sm' : 'text-base'}`}>
          AI 陪伴三部曲
        </h3>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </motion.div>
      </div>
      
      {/* Main Animation Container */}
      <div 
        className="relative mx-auto"
        style={{ width: size, height: size }}
      >
        {/* Orbital rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-dashed"
            style={{
              width: orbitRadius * 2 + ring * 20,
              height: orbitRadius * 2 + ring * 20,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              borderColor: `rgba(139,92,246,${0.15 + ring * 0.05})`,
            }}
            animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 30 + ring * 10, repeat: Infinity, ease: "linear" }}
          />
        ))}
        
        {/* Center core - User data */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center"
          style={{ width: centerSize, height: centerSize }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(139,92,246,0.4), 0 0 40px rgba(139,92,246,0.2)',
              '0 0 30px rgba(139,92,246,0.6), 0 0 60px rgba(139,92,246,0.3)',
              '0 0 20px rgba(139,92,246,0.4), 0 0 40px rgba(139,92,246,0.2)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className={`${compact ? 'text-xl' : 'text-2xl'}`}>👤</span>
            </motion.div>
            <p className={`text-white font-medium ${compact ? 'text-[8px]' : 'text-[10px]'} mt-0.5`}>你的成长</p>
          </div>
        </motion.div>
        
        {/* Orbiting items */}
        {trilogy.map((item, index) => {
          const angleOffset = (index * 120) * (Math.PI / 180);
          
          return (
            <motion.div
              key={item.name}
              className="absolute"
              style={{
                width: lockSize,
                height: lockSize,
                top: '50%',
                left: '50%',
                marginLeft: -lockSize / 2,
                marginTop: -lockSize / 2,
              }}
              animate={{
                x: Math.cos(angleOffset) * orbitRadius,
                y: Math.sin(angleOffset) * orbitRadius,
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
            >
              {/* Animated orbit around center */}
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                }}
              >
                <motion.div
                  className={`w-full h-full rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                  style={{
                    position: 'absolute',
                    transform: `rotate(${-index * 120}deg)`,
                  }}
                  animate={{
                    boxShadow: [
                      `0 4px 15px ${item.glowColor}`,
                      `0 4px 25px ${item.glowColor}`,
                      `0 4px 15px ${item.glowColor}`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <item.icon className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>
              
              {/* Connection line to center */}
              <motion.div
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                  width: orbitRadius - lockSize / 2,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${item.glowColor})`,
                  transform: `rotate(${180 + item.angle}deg)`,
                }}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              />
            </motion.div>
          );
        })}
        
        {/* Data flow particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
            style={{
              top: '50%',
              left: '50%',
            }}
            animate={{
              x: [0, Math.cos((i * 60) * Math.PI / 180) * orbitRadius * 0.8, 0],
              y: [0, Math.sin((i * 60) * Math.PI / 180) * orbitRadius * 0.8, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      {/* Labels */}
      {showLabels && (
        <div className={`relative z-10 ${compact ? 'mt-3' : 'mt-5'} space-y-2`}>
          {trilogy.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              className="flex items-center gap-3"
            >
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${item.color}`}>
                <item.icon className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-xs">{item.name}</span>
                  <span className="text-slate-500 text-[10px]">0{index + 1}</span>
                  <motion.div
                    className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"
                    animate={{ scaleX: [0, 1] }}
                    transition={{ delay: 0.5 + index * 0.15, duration: 0.5 }}
                  />
                </div>
                <p className="text-slate-400 text-[10px] truncate">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Bottom tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className={`relative z-10 ${compact ? 'mt-3' : 'mt-4'} text-center`}
      >
        <p className="text-[10px] text-slate-500">
          追踪 → 对比 → 见证，AI陪你走完每一步
        </p>
      </motion.div>
    </Card>
  );
}
