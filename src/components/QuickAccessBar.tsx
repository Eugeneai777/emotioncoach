import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, BookOpen, MessageCircle, Target, 
  Sparkles, GraduationCap, Clock, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAccessItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  gradient: string;
  isRecent?: boolean;
}

const RECENT_ACCESS_KEY = 'recent_quick_access';
const MAX_RECENT = 3;

// 默认快捷入口
const defaultItems: QuickAccessItem[] = [
  { 
    id: 'awakening', 
    icon: <BookOpen className="w-4 h-4" />, 
    label: '觉察日记', 
    path: '/awakening',
    gradient: 'from-teal-500 to-cyan-500'
  },
  { 
    id: 'emotion', 
    icon: <Heart className="w-4 h-4" />, 
    label: '情绪教练', 
    path: '/emotion-coach',
    gradient: 'from-rose-500 to-pink-500'
  },
  { 
    id: 'gratitude', 
    icon: <Sparkles className="w-4 h-4" />, 
    label: '感恩教练', 
    path: '/gratitude',
    gradient: 'from-amber-500 to-orange-500'
  },
  { 
    id: 'camp', 
    icon: <GraduationCap className="w-4 h-4" />, 
    label: '训练营', 
    path: '/camp/list',
    gradient: 'from-violet-500 to-purple-500'
  },
  { 
    id: 'coach-space', 
    icon: <MessageCircle className="w-4 h-4" />, 
    label: '教练空间', 
    path: '/coach-space',
    gradient: 'from-blue-500 to-indigo-500'
  },
  { 
    id: 'life', 
    icon: <Target className="w-4 h-4" />, 
    label: '生活教练', 
    path: '/',
    gradient: 'from-emerald-500 to-green-500'
  },
];

export const QuickAccessBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [recentItems, setRecentItems] = useState<string[]>([]);

  // 加载最近访问记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_ACCESS_KEY);
      if (saved) {
        setRecentItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load recent access');
    }
  }, []);

  // 记录访问
  const recordAccess = (itemId: string) => {
    const updated = [itemId, ...recentItems.filter(id => id !== itemId)].slice(0, MAX_RECENT);
    setRecentItems(updated);
    localStorage.setItem(RECENT_ACCESS_KEY, JSON.stringify(updated));
  };

  const handleClick = (item: QuickAccessItem) => {
    recordAccess(item.id);
    navigate(item.path);
  };

  // 根据最近访问排序（最近使用的在前）
  const sortedItems = [...defaultItems].sort((a, b) => {
    const aIndex = recentItems.indexOf(a.id);
    const bIndex = recentItems.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // 标记最近使用的项目
  const itemsWithRecent = sortedItems.map(item => ({
    ...item,
    isRecent: recentItems.includes(item.id)
  }));

  return (
    <div className="relative py-3">
      {/* 滚动容器 */}
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {itemsWithRecent.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              onClick={() => handleClick(item)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap",
                "transition-all duration-200 flex-shrink-0",
                "border shadow-sm active:scale-95",
                isActive 
                  ? `bg-gradient-to-r ${item.gradient} text-white border-transparent shadow-md` 
                  : "bg-white/80 hover:bg-white border-border/50 text-foreground hover:shadow-md"
              )}
            >
              <span className={cn(
                "flex items-center justify-center",
                !isActive && `text-transparent bg-clip-text bg-gradient-to-r ${item.gradient}`
              )}>
                {isActive ? item.icon : (
                  <span className={cn(`text-gradient-to-r ${item.gradient}`)}>
                    {item.icon}
                  </span>
                )}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
              {item.isRecent && !isActive && (
                <Clock className="w-3 h-3 text-muted-foreground/50" />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* 右侧渐变提示 */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};
