import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Handshake,
  GraduationCap,
  Video,
  BookOpen,
  Wrench,
  BarChart3,
  DollarSign,
  Flag,
  Activity,
  Package,
  CreditCard,
  RefreshCw,
  Headphones,
  ChevronDown,
  Home,
  TrendingUp,
  UserCheck,
  Flower2,
  Wallet,
  Mail,
  Share2,
  Tent,
  Key,
  Gift,
  MessageSquare,
  Zap,
  FlaskConical,
  Filter,
  PieChart,
  Network,
  Brain
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

import type { AdminRole } from "./AdminLayout";

const NAV_GROUPS = [
  {
    title: "概览",
    icon: LayoutDashboard,
    defaultOpen: true,
    roles: ['admin', 'content_admin'] as AdminRole[],
    items: [
      { key: "dashboard", label: "概览仪表板", path: "/admin", icon: LayoutDashboard }
    ]
  },
  {
    title: "用户与订单",
    icon: Users,
    defaultOpen: true,
    roles: ['admin'] as AdminRole[],
    items: [
      { key: "users", label: "用户账户", path: "/admin/users", icon: Users },
      { key: "orders", label: "订单管理", path: "/admin/orders", icon: ShoppingCart },
      { key: "partners", label: "有劲合伙人", path: "/admin/partners", icon: Handshake },
      { key: "industry-partners", label: "行业合作伙伴", path: "/admin/industry-partners", icon: Network }
    ]
  },
  {
    title: "绽放合伙人",
    icon: Flower2,
    defaultOpen: true,
    roles: ['admin'] as AdminRole[],
    items: [
      { key: "bloom-invitations", label: "绽放邀请管理", path: "/admin/bloom-invitations", icon: Mail },
      { key: "bloom-delivery", label: "合伙人交付", path: "/admin/bloom-delivery", icon: Package },
      { key: "bloom-single", label: "单营交付", path: "/admin/bloom-single", icon: Flower2 },
      { key: "bloom-profit", label: "绽放利润核算", path: "/admin/bloom-profit", icon: DollarSign },
      { key: "bloom-monthly", label: "绽放月度利润", path: "/admin/bloom-monthly", icon: TrendingUp },
      { key: "bloom-cashflow", label: "绽放月度现金流", path: "/admin/bloom-cashflow", icon: Wallet }
    ]
  },
  {
    title: "内容管理",
    icon: BookOpen,
    defaultOpen: false,
    roles: ['admin', 'content_admin'] as AdminRole[],
    items: [
      { key: "coaches", label: "教练模板", path: "/admin/coaches", icon: GraduationCap },
      { key: "human-coaches", label: "真人教练", path: "/admin/human-coaches", icon: UserCheck },
      { key: "camps", label: "训练营管理", path: "/admin/camps", icon: Tent },
      { key: "videos", label: "视频课程", path: "/admin/videos", icon: Video },
      { key: "knowledge", label: "知识库", path: "/admin/knowledge", icon: BookOpen },
      { key: "tools", label: "生活馆工具", path: "/admin/tools", icon: Wrench },
      { key: "community-posts", label: "社区动态", path: "/admin/community-posts", icon: MessageSquare }
    ]
  },
  {
    title: "转化飞轮",
    icon: Zap,
    defaultOpen: false,
    roles: ['admin'] as AdminRole[],
    items: [
      { key: "flywheel", label: "飞轮总览", path: "/admin/flywheel", icon: Zap },
      { key: "flywheel-campaigns", label: "Campaign实验室", path: "/admin/flywheel-campaigns", icon: FlaskConical },
      { key: "flywheel-funnel", label: "漏斗行为追踪", path: "/admin/flywheel-funnel", icon: Filter },
      { key: "flywheel-revenue", label: "收入与ROI", path: "/admin/flywheel-revenue", icon: PieChart },
      { key: "flywheel-referral", label: "裂变追踪", path: "/admin/flywheel-referral", icon: Network },
      { key: "flywheel-ai", label: "AI策略中心", path: "/admin/flywheel-ai", icon: Brain }
    ]
  },
  {
    title: "运营数据",
    icon: BarChart3,
    defaultOpen: false,
    roles: ['admin'] as AdminRole[],
    items: [
      { key: "usage", label: "使用记录", path: "/admin/usage", icon: BarChart3 },
      { key: "activation-codes", label: "激活码管理", path: "/admin/activation-codes", icon: Key },
      { key: "funnel", label: "转化漏斗", path: "/admin/funnel", icon: TrendingUp },
      { key: "reports", label: "举报管理", path: "/admin/reports", icon: Flag }
    ]
  },
  {
    title: "举报管理",
    icon: Flag,
    defaultOpen: false,
    roles: ['content_admin'] as AdminRole[],
    items: [
      { key: "reports", label: "举报管理", path: "/admin/reports", icon: Flag }
    ]
  },
  {
    title: "系统安全",
    icon: Activity,
    defaultOpen: false,
    roles: ['admin'] as AdminRole[],
    items: [
      { key: "api-monitor", label: "调用监控", path: "/admin/api-monitor", icon: Activity },
      { key: "cost-monitor", label: "成本监控", path: "/admin/cost-monitor", icon: DollarSign },
      { key: "user-anomaly", label: "用户异常监控", path: "/admin/user-anomaly", icon: Users },
      { key: "stability", label: "稳定性监控", path: "/admin/stability", icon: RefreshCw },
      { key: "risk-content", label: "风险内容监控", path: "/admin/risk-content", icon: Flag }
    ]
  },
  {
    title: "系统配置",
    icon: Package,
    defaultOpen: false,
    roles: ['admin'] as AdminRole[],
    items: [
      { key: "packages", label: "套餐权益", path: "/admin/packages", icon: Package },
      { key: "partner-levels", label: "合伙人等级", path: "/admin/partner-levels", icon: Handshake },
      { key: "share-cards", label: "分享卡片", path: "/admin/share-cards", icon: Share2 },
      { key: "og-preview", label: "OG预览", path: "/admin/og-preview", icon: Share2 },
      { key: "sync", label: "同步状态", path: "/admin/sync", icon: RefreshCw },
      { key: "service", label: "客服管理", path: "/admin/service", icon: Headphones },
      { key: "experience-items", label: "体验包管理", path: "/admin/experience-items", icon: Gift }
    ]
  }
];

interface AdminSidebarProps {
  userRole: AdminRole;
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_GROUPS.forEach(group => {
      initial[group.title] = group.defaultOpen;
    });
    return initial;
  });

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-foreground">管理后台</h2>
              <p className="text-xs text-muted-foreground">有劲生活</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {NAV_GROUPS.filter(group => group.roles.includes(userRole)).map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups[group.title]}
            onOpenChange={() => toggleGroup(group.title)}
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <group.icon className="h-4 w-4" />
                    {!collapsed && <span>{group.title}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openGroups[group.title] && "rotate-180"
                      )} 
                    />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.path)}
                          className={cn(
                            "w-full",
                            isActive(item.path) && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          <Link to={item.path} className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.label}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button variant="ghost" size="sm" asChild className="w-full justify-start">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            {!collapsed && <span>返回首页</span>}
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
