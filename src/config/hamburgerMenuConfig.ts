import { 
  User, Wallet, Clock, Bell, Tent, Users, ShoppingBag, LogOut, UserCircle, Handshake, type LucideIcon 
} from "lucide-react";

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  group: 'settings' | 'products' | 'account';
  groupLabel?: string;
  danger?: boolean;
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
  
  // 账户操作
  { id: 'logout', label: '退出登录', icon: LogOut, path: '', group: 'account', danger: true },
];
