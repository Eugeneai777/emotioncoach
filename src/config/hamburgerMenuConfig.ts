import { 
  Settings, ShoppingBag, LogOut, Handshake, Headphones, Info, type LucideIcon 
} from "lucide-react";

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  danger?: boolean;
  requireAdmin?: boolean;
}

export const hamburgerMenuItems: MenuItemConfig[] = [
  { id: 'settings', label: '设置', icon: Settings, path: '/settings' },
  { id: 'packages', label: '产品中心', icon: ShoppingBag, path: '/packages' },
  { id: 'partner', label: '合伙人中心', icon: Handshake, path: '/partner' },
  { id: 'customer-service', label: '联系客服', icon: Headphones, path: '/customer-support' },
  { id: 'admin', label: '后台管理', icon: Settings, path: '/admin', requireAdmin: true },
  { id: 'about', label: '关于我们', icon: Info, path: '/platform-intro' },
  { id: 'logout', label: '退出登录', icon: LogOut, path: '', danger: true },
];
