import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageCircle, Sparkles, Package, Users, Settings, 
  Rocket, X, BookOpen, ClipboardCheck, Handshake, 
  Edit3, Star, Heart, Baby, Coins, Gamepad2,
  Flower2, AlertCircle, HeartPulse, GraduationCap
} from 'lucide-react';
import { useQuickMenuConfig } from '@/hooks/useQuickMenuConfig';
import { QuickMenuSettingsDialog } from '@/components/QuickMenuSettingsDialog';
import FeedbackDialog from '@/components/FeedbackDialog';
const POSITION_STORAGE_KEY = 'floatingQuickMenuPosition';
const EXCLUDED_ROUTES = ['/auth', '/login', '/register', '/onboarding', '/wealth-block', '/coach-space'];

interface Position {
  x: number;
  y: number;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Home, MessageCircle, Sparkles, Package, Users, Settings,
  BookOpen, ClipboardCheck, Handshake, Star,
  Heart, Baby, Coins, Gamepad2, Rocket,
  Flower2, AlertCircle, HeartPulse, GraduationCap,
};

export const FloatingQuickMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config, isLoaded, saveConfig } = useQuickMenuConfig();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: window.innerHeight - 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const initialPos = useRef<Position>({ x: 0, y: 0 });

  // Build menu items from config - feedback first, then custom slots
  const menuItems = [
    { 
      id: 'feedback', 
      icon: iconMap['MessageCircle'], 
      label: '建议', 
      path: '/customer-support', 
      color: 'bg-blue-500',
    },
    { 
      id: 'custom1', 
      icon: iconMap[config.customSlot1.icon] || Star, 
      label: config.customSlot1.label, 
      path: config.customSlot1.path, 
      color: config.customSlot1.color,
      isCustom: true,
    },
    { 
      id: 'custom2', 
      icon: iconMap[config.customSlot2.icon] || Star, 
      label: config.customSlot2.label, 
      path: config.customSlot2.path, 
      color: config.customSlot2.color,
      isCustom: true,
    },
    { 
      id: 'custom3', 
      icon: iconMap[config.customSlot3?.icon] || Star, 
      label: config.customSlot3?.label || '感恩教练', 
      path: config.customSlot3?.path || '/gratitude', 
      color: config.customSlot3?.color || 'bg-green-500',
      isCustom: true,
    },
    { 
      id: 'products', 
      icon: iconMap['Package'], 
      label: '产品中心', 
      path: '/packages', 
      color: 'bg-emerald-500',
    },
    { 
      id: 'coach-space', 
      icon: iconMap['Users'], 
      label: '教练空间', 
      path: '/coach-space', 
      color: 'bg-rose-500',
    },
  ];

  // Load saved position with boundary check
  useEffect(() => {
    const saved = localStorage.getItem(POSITION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure position is within current viewport bounds
        const safeX = Math.max(10, Math.min(window.innerWidth - 60, parsed.x));
        const safeY = Math.max(100, Math.min(window.innerHeight - 80, parsed.y));
        setPosition({ x: safeX, y: safeY });
      } catch (e) {
        console.error('Failed to parse saved position');
      }
    }
  }, []);

  // Handle window resize - ensure button stays within bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const safeX = Math.max(10, Math.min(window.innerWidth - 60, prev.x));
        const safeY = Math.max(100, Math.min(window.innerHeight - 80, prev.y));
        if (safeX !== prev.x || safeY !== prev.y) {
          const newPos = { x: safeX, y: safeY };
          savePosition(newPos);
          return newPos;
        }
        return prev;
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save position
  const savePosition = (pos: Position) => {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos));
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
  const handleMenuItemClick = (id: string, path: string) => {
    setIsExpanded(false);
    if (id === 'feedback') {
      setShowFeedbackDialog(true);
    } else {
      navigate(path);
    }
  };

  // Check if should hide on current route
  if (EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  if (!isLoaded) return null;

  return (
    <>
      <div
        ref={buttonRef}
        className="fixed z-50"
        style={{
          left: position.x,
          top: position.y,
          touchAction: 'none',
        }}
      >
        {/* Card-style Menu - Compact */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: position.y > window.innerHeight / 2 ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: position.y > window.innerHeight / 2 ? 10 : -10 }}
              transition={{ duration: 0.15, type: 'spring', stiffness: 400, damping: 30 }}
              className={`absolute ${position.y > window.innerHeight / 2 ? 'bottom-12' : 'top-12'} left-0 bg-background/98 backdrop-blur-xl rounded-lg shadow-lg border border-border/40 p-1.5`}
              style={{
                boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.2)',
                maxWidth: `calc(100vw - ${position.x + 16}px)`,
                minWidth: '150px',
              }}
            >
              {/* Menu List - Ultra Compact */}
              <div className="flex flex-col gap-0.5">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isCurrentPage = location.pathname === item.path;
                  // 截断标签
                  const displayLabel = item.label.length > 4 ? item.label.slice(0, 4) : item.label;

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: index * 0.02,
                        duration: 0.1,
                      }}
                      onClick={() => handleMenuItemClick(item.id, item.path)}
                      whileTap={{ scale: 0.96 }}
                      className={`group flex items-center gap-2 px-2 py-1.5 rounded-md w-full text-left transition-colors duration-100
                        ${isCurrentPage 
                          ? 'bg-primary/12 text-primary' 
                          : 'hover:bg-muted/70 active:bg-muted'
                        }
                      `}
                    >
                      <div 
                        className={`w-6 h-6 rounded-md ${item.color} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-medium truncate max-w-[70px]">
                        {displayLabel}
                      </span>
                      {isCurrentPage && (
                        <div className="ml-auto w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Settings Button - Icon only */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
                onClick={() => {
                  setIsExpanded(false);
                  setShowSettings(true);
                }}
                className="w-full mt-1 pt-1 border-t border-border/30 flex items-center justify-center py-1 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-100 active:scale-95"
              >
                <Settings className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Button - Compact */}
        <motion.div
          className={`w-11 h-11 rounded-xl shadow-lg flex items-center justify-center cursor-pointer select-none
            ${isExpanded 
              ? 'bg-gradient-to-br from-slate-600 to-slate-700' 
              : 'bg-gradient-to-br from-sky-100 via-white to-sky-50'
            }
            ${isDragging ? 'scale-105 shadow-xl' : ''}
            transition-all duration-200 border border-white/25`}
          style={{
            boxShadow: isExpanded 
              ? '0 6px 25px -8px rgba(0, 0, 0, 0.35)' 
              : '0 6px 20px -6px rgba(56, 189, 248, 0.3), 0 3px 10px -3px rgba(0, 0, 0, 0.08)',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          onClick={handleClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          animate={!isExpanded && !isDragging ? {
            y: [0, -2, 0],
          } : {}}
          transition={{
            y: {
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.12 }}
              >
                <X className="w-4.5 h-4.5 text-white" />
              </motion.div>
            ) : (
              <motion.span 
                key="rocket"
                className="text-lg"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: -45, opacity: 1, scale: 1 }}
                exit={{ rotate: 0, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.12, type: 'spring', stiffness: 400 }}
              >
                🚀
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Settings Dialog */}
      <QuickMenuSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        config={config}
        onSave={saveConfig}
      />

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
      />
    </>
  );
};
