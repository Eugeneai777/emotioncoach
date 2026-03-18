import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, ChevronRight, ChevronDown,
  Info, Bell, MessageSquare, LogOut, Truck,
  ClipboardCheck, Flame, BookOpen, Settings, Sparkles,
  Wrench, BarChart3, Target, ShoppingBag, Users, Headphones
} from "lucide-react";
import TextCustomerSupport from "@/components/TextCustomerSupport";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface OrderData {
  id: string;
  order_no: string | null;
  package_name: string | null;
  amount: number | null;
  status: string | null;
  shipping_status: string | null;
  shipping_note: string | null;
  created_at: string | null;
}

const LEARNING_MODULES = [
  {
    key: "assessment",
    icon: ClipboardCheck,
    label: "测评",
    gradient: "from-violet-500/15 to-violet-600/5",
    iconColor: "text-violet-600 dark:text-violet-400",
    route: "/assessment-picker",
  },
  {
    key: "camp",
    icon: Flame,
    label: "训练营",
    gradient: "from-amber-500/15 to-amber-600/5",
    iconColor: "text-amber-600 dark:text-amber-400",
    route: "/camps?filter=my",
  },
  {
    key: "course",
    icon: BookOpen,
    label: "课程",
    gradient: "from-emerald-500/15 to-emerald-600/5",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    route: "/courses",
  },
];

const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return "";
  if (phone.length >= 7) {
    return phone.slice(0, 3) + "****" + phone.slice(-4);
  }
  return phone;
};

const statusLabel = (status: string | null): string => {
  switch (status) {
    case "paid": return "已支付";
    case "shipped": return "已发货";
    case "completed": return "已完成";
    case "pending": return "待支付";
    case "refunded": return "已退款";
    default: return status || "未知";
  }
};

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [hasPaidOrder, setHasPaidOrder] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);

  // Load profile & orders
  useEffect(() => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }

    const loadData = async () => {
      // Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (profileData) setProfile(profileData);

      // Orders
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, order_no, package_name, amount, status, shipping_status, shipping_note, created_at")
        .eq("user_id", user.id)
        .in("status", ["paid", "shipped", "completed", "refunded"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (orderData) setOrders(orderData as OrderData[]);

      // Membership check
      const { data: memberOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .in("package_key", ["member365", "365"])
        .eq("status", "paid")
        .limit(1)
        .maybeSingle();
      setIsMember(!!memberOrder);

      // Check if user has any paid order
      const { data: paidOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .limit(1)
        .maybeSingle();
      setHasPaidOrder(!!paidOrder);

      setLoadingProfile(false);
    };
    loadData();
  }, [user]);

  const visibleOrders = showAllOrders ? orders : orders.slice(0, 2);

  const handleSettingsClick = async (label: string) => {
    switch (label) {
      case "提醒设置":
        navigate("/settings?view=reminders");
        break;
      case "通知偏好":
        navigate("/settings?view=notifications");
        break;
      case "联系客服":
        setShowCustomerSupport(true);
        break;
      case "退出登录":
        await signOut();
        toast({ title: "已退出登录" });
        navigate("/auth");
        break;
    }
  };

  const SETTINGS_ITEMS = [
    { icon: Bell, label: "提醒设置" },
    { icon: MessageSquare, label: "通知偏好" },
    { icon: Headphones, label: "联系客服" },
    { icon: LogOut, label: "退出登录" },
  ];

  const displayName = profile?.display_name || user?.user_metadata?.display_name || "未设置昵称";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const phone = profile?.phone || user?.phone;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-28">
      {/* 页面标题 */}
      <div className="pt-12 pb-4 px-5">
        <h1 className="text-2xl font-bold text-foreground">我的</h1>
      </div>

      <div className="px-4 space-y-5">
        {/* ======== 1. 账号信息 ======== */}
        <Card
          className="border-border/40 bg-card/80 backdrop-blur-sm cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
          onClick={() => navigate("/settings?view=profile")}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="w-14 h-14">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{displayName}</p>
              {phone && (
                <p className="text-sm text-muted-foreground">{maskPhone(phone)}</p>
              )}
              {!phone && (
                <p className="text-sm text-muted-foreground">点击编辑个人信息</p>
              )}
            </div>
            {isMember && (
              <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
                365会员
              </Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* ======== 2. 订单信息 ======== */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">订单信息</h2>
            </div>
            <span className="text-xs text-muted-foreground">{orders.length}笔订单</span>
          </div>
          <Card className="border-border/40 bg-card/80">
            <CardContent className="p-0 divide-y divide-border/30">
              {visibleOrders.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">暂无订单</div>
              )}
              {visibleOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{order.package_name || "未知商品"}</span>
                    <Badge
                      variant={order.status === "paid" || order.status === "shipped" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {statusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>订单号：{order.order_no || order.id.slice(0, 12)}</span>
                    <span className="font-semibold text-foreground">
                      ¥{(order.amount ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString("zh-CN") : ""}
                  </div>
                  {order.shipping_note && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
                      <Truck className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-xs text-muted-foreground">
                        物流单号：<span className="text-foreground font-medium select-all">{order.shipping_note}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          {orders.length > 2 && (
            <button
              onClick={() => setShowAllOrders(!showAllOrders)}
              className="w-full flex items-center justify-center gap-1 mt-2 py-2 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <span>{showAllOrders ? "收起" : "查看全部订单"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllOrders ? "rotate-180" : ""}`} />
            </button>
          )}
        </section>

        {/* ======== 3. 学习与成长中心 ======== */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">学习与成长中心</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LEARNING_MODULES.map((mod) => (
              <Card
                key={mod.key}
                className="border-border/40 cursor-pointer hover:shadow-md active:scale-[0.97] transition-all"
                onClick={() => navigate(mod.route)}
              >
                <CardContent className={`p-4 flex flex-col items-center text-center gap-2.5 bg-gradient-to-br ${mod.gradient} rounded-2xl`}>
                  <div className="w-11 h-11 rounded-xl bg-background/80 flex items-center justify-center shadow-sm">
                    <mod.icon className={`w-5 h-5 ${mod.iconColor}`} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{mod.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ======== 3.5 五大板块（仅付费用户可见） ======== */}
        {hasPaidOrder && (
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">助你持续成长</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { icon: Wrench, label: "日常工具", gradient: "from-cyan-500/15 to-cyan-600/5", iconColor: "text-cyan-600 dark:text-cyan-400", route: "/energy-studio" },
                { icon: BarChart3, label: "专业测评", gradient: "from-violet-500/15 to-violet-600/5", iconColor: "text-violet-600 dark:text-violet-400", route: "/energy-studio?tab=assessments" },
                { icon: Flame, label: "系统训练营", gradient: "from-amber-500/15 to-amber-600/5", iconColor: "text-amber-600 dark:text-amber-400", route: "/camps" },
                { icon: ShoppingBag, label: "健康商城", gradient: "from-emerald-500/15 to-emerald-600/5", iconColor: "text-emerald-600 dark:text-emerald-400", route: "/health-store" },
                { icon: Users, label: "教练空间", gradient: "from-rose-500/15 to-rose-600/5", iconColor: "text-rose-600 dark:text-rose-400", route: "/coach-space" },
              ].map((block) => (
                <Card
                  key={block.label}
                  className="border-border/40 cursor-pointer hover:shadow-md active:scale-[0.97] transition-all"
                  onClick={() => navigate(block.route)}
                >
                  <CardContent className={`p-4 flex flex-col items-center text-center gap-2.5 bg-gradient-to-br ${block.gradient} rounded-2xl`}>
                    <div className="w-11 h-11 rounded-xl bg-background/80 flex items-center justify-center shadow-sm">
                      <block.icon className={`w-5 h-5 ${block.iconColor}`} />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{block.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ======== 4. 设置 ======== */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Settings className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">设置</h2>
          </div>
          <Card className="border-border/40 bg-card/80">
            <CardContent className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {SETTINGS_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleSettingsClick(item.label)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl hover:bg-accent/50 active:scale-[0.97] transition-all text-foreground ${
                      item.label === "退出登录" ? "text-destructive" : ""
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${
                      item.label === "退出登录" ? "text-destructive" : "text-muted-foreground"
                    }`} />
                    <span className="text-xs text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ======== 5. 关于我们 ======== */}
        <section className="pb-2">
          <Card
            className="border-border/40 bg-gradient-to-r from-primary/5 to-accent/10 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
            onClick={() => navigate("/awakening-system-intro")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">关于我们</p>
                <p className="text-xs text-muted-foreground mt-0.5">了解系统介绍与使用指南</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </section>
      </div>

      <AwakeningBottomNav />
    </div>
  );
};

export default MyPage;
