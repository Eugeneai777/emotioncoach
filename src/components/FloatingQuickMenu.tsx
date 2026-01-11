import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageCircle, Sparkles, Package, Users, Settings, 
  Rocket, X, BookOpen, ClipboardCheck, Handshake, Sunrise, 
  MessagesSquare, Edit3, Star, Heart, Baby, Coins, Gamepad2
} from 'lucide-react';
import { useQuickMenuConfig } from '@/hooks/useQuickMenuConfig';
import { QuickMenuSettingsDialog } from '@/components/QuickMenuSettingsDialog';

const POSITION_STORAGE_KEY = 'floatingQuickMenuPosition';
const EXCLUDED_ROUTES = ['/auth', '/login', '/register', '/onboarding'];

interface Position {
  x: number;
  y: number;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Home, MessageCircle, Sparkles, Package, Users, Settings,
  BookOpen, ClipboardCheck, Handshake, Sunrise, MessagesSquare, Star,
  Heart, Baby, Coins, Gamepad2, Rocket,
};

export const FloatingQuickMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config, isLoaded, saveConfig } = useQuickMenuConfig();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: window.innerHeight - 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const initialPos = useRef<Position>({ x: 0, y: 0 });

  // Build menu items from config
  const menuItems = [
    { 
      id: 'home', 
      icon: iconMap['Home'], 
      label: '首页', 
      path: config.homePagePath, 
      color: 'bg-amber-500',
      isHome: true,
    },
    { 
      id: 'feedback', 
      icon: iconMap['MessageCircle'], 
      label: '建议', 
      path: '/customer-support', 
      color: 'bg-blue-500',
    },
    { 
      id: 'awakening', 
      icon: iconMap['Sparkles'], 
      label: '觉醒', 
      path: '/wealth-block', 
      color: 'bg-purple-500',
    },
    { 
      id: 'products', 
      icon: iconMap['Package'], 
      label: '产品', 
      path: '/packages', 
      color: 'bg-emerald-500',
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
  ];

  // Load saved position
  useEffect(() => {
    const saved = localStorage.getItem(POSITION_STORAGE_KEY);
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
  const handleMenuItemClick = (path: string) => {
    setIsExpanded(false);
    navigate(path);
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
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute bottom-14 left-0 bg-background/95 backdrop-blur-md rounded-xl shadow-xl border border-border p-3 min-w-[200px]"
            >
              {/* Menu List - Vertical Layout */}
              <div className="flex flex-col gap-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrentPage = location.pathname === item.path;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.path)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors
                        ${isCurrentPage 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-muted'
                        }
                        ${item.isCustom ? 'border border-dashed border-muted-foreground/30' : ''}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Settings Button */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setShowSettings(true);
                }}
                className="w-full mt-2 pt-2 border-t border-border flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                自定义快捷入口
              </button>
            </motion.div>
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
            <Rocket className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </div>

      {/* Settings Dialog */}
      <QuickMenuSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        config={config}
        onSave={saveConfig}
      />
    </>
  );
};
