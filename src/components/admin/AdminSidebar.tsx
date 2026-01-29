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
  Tent
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

const NAV_GROUPS = [
  {
    title: "概览",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { key: "dashboard", label: "概览仪表板", path: "/admin", icon: LayoutDashboard }
    ]
  },
  {
    title: "用户与订单",
    icon: Users,
    defaultOpen: true,
    items: [
      { key: "users", label: "用户账户", path: "/admin/users", icon: Users },
      { key: "orders", label: "订单管理", path: "/admin/orders", icon: ShoppingCart },
      { key: "partners", label: "有劲合伙人", path: "/admin/partners", icon: Handshake },
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
    items: [
      { key: "coaches", label: "教练模板", path: "/admin/coaches", icon: GraduationCap },
      { key: "human-coaches", label: "真人教练", path: "/admin/human-coaches", icon: UserCheck },
      { key: "camps", label: "训练营管理", path: "/admin/camps", icon: Tent },
      { key: "videos", label: "视频课程", path: "/admin/videos", icon: Video },
      { key: "knowledge", label: "知识库", path: "/admin/knowledge", icon: BookOpen },
      { key: "tools", label: "生活馆工具", path: "/admin/tools", icon: Wrench }
    ]
  },
  {
    title: "运营数据",
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { key: "usage", label: "使用记录", path: "/admin/usage", icon: BarChart3 },
      { key: "funnel", label: "转化漏斗", path: "/admin/funnel", icon: TrendingUp },
      { key: "cost-monitor", label: "成本监控", path: "/admin/cost-monitor", icon: DollarSign },
      { key: "reports", label: "举报管理", path: "/admin/reports", icon: Flag }
    ]
  },
  {
    title: "系统配置",
    icon: Package,
    defaultOpen: false,
    items: [
      { key: "packages", label: "套餐权益", path: "/admin/packages", icon: Package },
      { key: "partner-levels", label: "合伙人等级", path: "/admin/partner-levels", icon: Handshake },
      { key: "share-cards", label: "分享卡片", path: "/admin/share-cards", icon: Share2 },
      { key: "og-preview", label: "OG预览", path: "/admin/og-preview", icon: Share2 },
      { key: "sync", label: "同步状态", path: "/admin/sync", icon: RefreshCw },
      { key: "service", label: "客服管理", path: "/admin/service", icon: Headphones }
    ]
  }
];

export function AdminSidebar() {
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
        {NAV_GROUPS.map((group) => (
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
