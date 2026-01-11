import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageCircle, Sparkles, Package, Users, Settings, Zap, X } from 'lucide-react';

const STORAGE_KEY = 'floatingQuickMenuPosition';
const EXCLUDED_ROUTES = ['/auth', '/login', '/register', '/onboarding'];

interface Position {
  x: number;
  y: number;
}

const quickMenuItems = [
  { id: 'home', icon: Home, label: '首页', path: '/wealth-camp-checkin', color: 'bg-amber-500' },
  { id: 'feedback', icon: MessageCircle, label: '建议', path: '/customer-support', color: 'bg-blue-500' },
  { id: 'awakening', icon: Sparkles, label: '觉醒', path: '/wealth-block', color: 'bg-purple-500' },
  { id: 'products', icon: Package, label: '产品', path: '/packages', color: 'bg-emerald-500' },
  { id: 'coach', icon: Users, label: '教练', path: '/coach-space', color: 'bg-rose-500' },
  { id: 'settings', icon: Settings, label: '设置', path: '/settings', color: 'bg-slate-500' },
];

export const FloatingQuickMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: window.innerHeight - 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const initialPos = useRef<Position>({ x: 0, y: 0 });

  // Load saved position
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPosition(parsed);
      } catch (e) {
        console.error('Failed to parse saved position');
      }
    }
  }, []);

  // Save position
  const savePosition = (pos: Position) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  };

  // Handle drag start
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setHasMoved(false);
    dragStartPos.current = { x: clientX, y: clientY };
    initialPos.current = { ...position };
  };

  // Handle drag move
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - dragStartPos.current.x;
    const deltaY = clientY - dragStartPos.current.y;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setHasMoved(true);
    }

    const newX = Math.max(10, Math.min(window.innerWidth - 60, initialPos.current.x + deltaX));
    const newY = Math.max(100, Math.min(window.innerHeight - 80, initialPos.current.y + deltaY));

    setPosition({ x: newX, y: newY });
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      savePosition(position);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  // Global mouse/touch move and up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchEndGlobal = () => handleDragEnd();
    const handleTouchMoveGlobal = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMoveGlobal);
      window.addEventListener('touchend', handleTouchEndGlobal);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMoveGlobal);
      window.removeEventListener('touchend', handleTouchEndGlobal);
    };
  }, [isDragging, position]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Handle click on main button
  const handleClick = () => {
    if (!hasMoved) {
      setIsExpanded(!isExpanded);
    }
  };

  // Handle menu item click
  const handleMenuItemClick = (path: string) => {
    setIsExpanded(false);
    navigate(path);
  };

  // Check if should hide on current route
  if (EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  return (
    <div
      ref={buttonRef}
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        touchAction: 'none',
      }}
    >
      {/* Menu Items - Fan expansion */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {quickMenuItems.map((item, index) => {
              const angle = -90 - (index * 30); // Start from top, spread 30 degrees each
              const radius = 70; // Distance from center
              const radian = (angle * Math.PI) / 180;
              const x = Math.cos(radian) * radius;
              const y = Math.sin(radian) * radius;
              const isCurrentPage = location.pathname === item.path;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    x: x, 
                    y: y, 
                    scale: 1,
                  }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: index * 0.03,
                    type: 'spring',
                    stiffness: 300,
                    damping: 20
                  }}
                  onClick={() => handleMenuItemClick(item.path)}
                  className={`absolute w-10 h-10 rounded-full ${item.color} text-white shadow-lg flex items-center justify-center
                    ${isCurrentPage ? 'ring-2 ring-white ring-offset-2' : ''}
                    hover:scale-110 active:scale-95 transition-transform`}
                  style={{ 
                    left: '50%', 
                    top: '50%', 
                    marginLeft: '-20px', 
                    marginTop: '-20px' 
                  }}
                >
                  <item.icon className="w-5 h-5" />
                </motion.button>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.div
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer select-none
          ${isExpanded 
            ? 'bg-slate-600' 
            : 'bg-gradient-to-br from-amber-400 to-orange-500'
          }
          ${isDragging ? 'scale-110' : ''}
          transition-all duration-200`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onClick={handleClick}
        whileTap={{ scale: 0.95 }}
        animate={!isExpanded && !isDragging ? {
          boxShadow: [
            '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            '0 4px 20px -1px rgba(251, 191, 36, 0.4)',
            '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          ],
        } : {}}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        {isExpanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Zap className="w-6 h-6 text-white" />
        )}
      </motion.div>

      {/* Label tooltip on hover */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-black/75 text-white text-xs rounded whitespace-nowrap"
          >
            点击选择快捷入口
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
