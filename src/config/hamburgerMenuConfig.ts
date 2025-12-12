import { 
  User, Wallet, Clock, Bell, Tent, ShoppingBag, LogOut, UserCircle, Handshake, Settings, Headphones, type LucideIcon 
} from "lucide-react";

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  group: 'settings' | 'products' | 'admin' | 'account';
  groupLabel?: string;
  danger?: boolean;
  requireAdmin?: boolean;
}

export const hamburgerMenuItems: MenuItemConfig[] = [
  // 账户设置分组
  { id: 'profile', label: '个人资料', icon: User, path: '/settings?tab=profile', group: 'settings', groupLabel: '账户设置' },
  { id: 'account', label: '账户', icon: Wallet, path: '/settings?tab=account', group: 'settings' },
  { id: 'reminders', label: '提醒设置', icon: Clock, path: '/settings?tab=reminders', group: 'settings' },
  { id: 'notifications', label: '通知偏好', icon: Bell, path: '/settings?tab=notifications', group: 'settings' },
  { id: 'camp', label: '训练营', icon: Tent, path: '/settings?tab=camp', group: 'settings' },
  { id: 'companion', label: '情绪伙伴', icon: UserCircle, path: '/settings?tab=companion', group: 'settings' },
  
  // 产品服务分组
  { id: 'packages', label: '全部产品', icon: ShoppingBag, path: '/packages', group: 'products', groupLabel: '产品服务' },
  { id: 'partner', label: '合伙人中心', icon: Handshake, path: '/partner', group: 'products' },
  { id: 'customer-service', label: '联系客服', icon: Headphones, path: '/customer-support', group: 'products' },
  
  // 管理员分组
  { id: 'admin', label: '后台管理', icon: Settings, path: '/admin', group: 'admin', groupLabel: '管理', requireAdmin: true },
  
  // 账户操作
  { id: 'logout', label: '退出登录', icon: LogOut, path: '', group: 'account', danger: true },
];
