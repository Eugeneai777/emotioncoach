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
        {/* Card-style Menu */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ duration: 0.25, type: 'spring', stiffness: 350, damping: 28 }}
              className="absolute bottom-16 left-0 bg-background/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-3 min-w-[220px]"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Menu List - Vertical Layout */}
              <div className="flex flex-col gap-1.5">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isCurrentPage = location.pathname === item.path;

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: index * 0.04,
                        duration: 0.2,
                        type: 'spring',
                        stiffness: 400,
                        damping: 25
                      }}
                      onClick={() => handleMenuItemClick(item.id, item.path)}
                      whileHover={{ scale: 1.03, x: 4 }}
                      whileTap={{ scale: 0.96 }}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200
                        ${isCurrentPage 
                          ? 'bg-primary/15 text-primary shadow-sm' 
                          : 'hover:bg-muted/80 active:bg-muted'
                        }
                        ${item.isCustom ? 'border border-dashed border-muted-foreground/20' : ''}
                      `}
                    >
                      <motion.div 
                        className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-md`}
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.4 }}
                      >
                        <Icon className="w-4.5 h-4.5 text-white drop-shadow-sm" />
                      </motion.div>
                      <span className="text-sm font-medium whitespace-nowrap group-hover:translate-x-0.5 transition-transform duration-200">
                        {item.label}
                      </span>
                      {isCurrentPage && (
                        <motion.div 
                          className="ml-auto w-2 h-2 rounded-full bg-primary"
                          layoutId="activeIndicator"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Settings Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                onClick={() => {
                  setIsExpanded(false);
                  setShowSettings(true);
                }}
                className="w-full mt-3 pt-2.5 border-t border-border/50 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                自定义快捷入口
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Button */}
        <motion.div
          className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer select-none
            ${isExpanded 
              ? 'bg-gradient-to-br from-slate-600 to-slate-700' 
              : 'bg-gradient-to-br from-sky-100 via-white to-sky-50'
            }
            ${isDragging ? 'scale-110 shadow-2xl' : ''}
            transition-all duration-300 border border-white/30`}
          style={{
            boxShadow: isExpanded 
              ? '0 10px 40px -10px rgba(0, 0, 0, 0.4)' 
              : '0 8px 30px -8px rgba(56, 189, 248, 0.35), 0 4px 15px -4px rgba(0, 0, 0, 0.1)',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          onClick={handleClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          animate={!isExpanded && !isDragging ? {
            y: [0, -3, 0],
            boxShadow: [
              '0 8px 30px -8px rgba(56, 189, 248, 0.35), 0 4px 15px -4px rgba(0, 0, 0, 0.1)',
              '0 12px 40px -8px rgba(56, 189, 248, 0.5), 0 6px 20px -4px rgba(0, 0, 0, 0.15)',
              '0 8px 30px -8px rgba(56, 189, 248, 0.35), 0 4px 15px -4px rgba(0, 0, 0, 0.1)',
            ],
          } : {}}
          transition={{
            y: {
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            boxShadow: {
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
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6 text-white drop-shadow-md" />
              </motion.div>
            ) : (
              <motion.span 
                key="rocket"
                className="text-2xl drop-shadow-md"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: -45, opacity: 1, scale: 1 }}
                exit={{ rotate: 0, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, type: 'spring', stiffness: 400 }}
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
