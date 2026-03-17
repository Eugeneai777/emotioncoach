import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Package, ChevronRight, ChevronDown,
  Info, Bell, Lock, HelpCircle, LogOut, Truck,
  ClipboardCheck, Flame, BookOpen, Settings, Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";

// ---- 静态占位数据 ----
const MOCK_ORDERS = [
  { id: "ORD20260301", name: "知乐胶囊 × 2", status: "已发货", trackingNo: "SF1234567890", date: "2026-03-10" },
  { id: "ORD20260215", name: "365会员", status: "已完成", trackingNo: null, date: "2026-02-15" },
  { id: "ORD20260110", name: "情绪训练营", status: "已完成", trackingNo: null, date: "2026-01-10" },
];

const LEARNING_MODULES = [
  {
    key: "assessment",
    icon: ClipboardCheck,
    label: "测评",
    count: "2项已完成",
    gradient: "from-violet-500/15 to-violet-600/5",
    iconColor: "text-violet-600 dark:text-violet-400",
    route: "/assessment-picker",
  },
  {
    key: "camp",
    icon: Flame,
    label: "训练营",
    count: "1个进行中",
    gradient: "from-amber-500/15 to-amber-600/5",
    iconColor: "text-amber-600 dark:text-amber-400",
    route: "/camps",
  },
  {
    key: "course",
    icon: BookOpen,
    label: "课程",
    count: "4门已学",
    gradient: "from-emerald-500/15 to-emerald-600/5",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    route: "/video-courses",
  },
];

const SETTINGS_ITEMS = [
  { icon: Bell, label: "通知设置" },
  { icon: Lock, label: "隐私安全" },
  { icon: HelpCircle, label: "帮助反馈" },
  { icon: LogOut, label: "退出登录" },
];

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAllOrders, setShowAllOrders] = useState(false);

  const visibleOrders = showAllOrders ? MOCK_ORDERS : MOCK_ORDERS.slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-28">
      {/* 页面标题 */}
      <div className="pt-12 pb-4 px-5">
        <h1 className="text-2xl font-bold text-foreground">我的</h1>
      </div>

      <div className="px-4 space-y-5">
        {/* ======== 1. 账号信息 ======== */}
        <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground truncate">用户昵称</p>
              <p className="text-sm text-muted-foreground">138****8888</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
              365会员
            </Badge>
          </CardContent>
        </Card>

        {/* ======== 2. 订单信息 ======== */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">订单信息</h2>
            </div>
            <span className="text-xs text-muted-foreground">{MOCK_ORDERS.length}笔订单</span>
          </div>
          <Card className="border-border/40 bg-card/80">
            <CardContent className="p-0 divide-y divide-border/30">
              {visibleOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{order.name}</span>
                    <Badge
                      variant={order.status === "已发货" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>订单号：{order.id}</span>
                    <span>{order.date}</span>
                  </div>
                  {order.trackingNo && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
                      <Truck className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-xs text-muted-foreground">
                        物流单号：<span className="text-foreground font-medium select-all">{order.trackingNo}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          {MOCK_ORDERS.length > 2 && (
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
                  <span className="text-[11px] text-muted-foreground leading-tight">{mod.count}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ======== 4. 设置 ======== */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Settings className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">设置</h2>
          </div>
          <Card className="border-border/40 bg-card/80">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {SETTINGS_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-xl hover:bg-accent/50 active:scale-[0.97] transition-all text-sm text-foreground"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{item.label}</span>
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
