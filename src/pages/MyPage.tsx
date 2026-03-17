import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Package, GraduationCap, Settings, ChevronRight, 
  Info, Bell, Lock, HelpCircle, LogOut, Truck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";

// ---- 静态占位数据 ----
const MOCK_ORDERS = [
  { id: "ORD20260301", name: "知乐胶囊 × 2", status: "已发货", trackingNo: "SF1234567890", date: "2026-03-10" },
  { id: "ORD20260215", name: "365会员", status: "已完成", trackingNo: null, date: "2026-02-15" },
];

const MOCK_COURSES_LEARNED = [
  { id: "1", title: "情绪觉察入门", progress: 100 },
  { id: "2", title: "呼吸冥想基础", progress: 100 },
];

const MOCK_COURSES_UNLEARNED = [
  { id: "3", title: "身份认同探索", progress: 0 },
  { id: "4", title: "财富信念重塑", progress: 30 },
];

const SETTINGS_ITEMS = [
  { icon: Bell, label: "通知设置" },
  { icon: Lock, label: "隐私与安全" },
  { icon: HelpCircle, label: "帮助与反馈" },
  { icon: LogOut, label: "退出登录" },
];

const MyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-28">
      {/* 页面标题 */}
      <div className="pt-12 pb-4 px-5">
        <h1 className="text-2xl font-bold text-foreground">我的</h1>
      </div>

      <div className="px-4 space-y-4">
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
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 shrink-0">
              365会员
            </Badge>
          </CardContent>
        </Card>

        {/* ======== 2. 订单信息 ======== */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">订单信息</h2>
          </div>
          <div className="space-y-2">
            {MOCK_ORDERS.map((order) => (
              <Card key={order.id} className="border-border/40 bg-card/80">
                <CardContent className="p-4 space-y-2">
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
                  {/* 物流单号专属位置 */}
                  {order.trackingNo && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
                      <Truck className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-xs text-muted-foreground">
                        物流单号：<span className="text-foreground font-medium">{order.trackingNo}</span>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ======== 3. 我的课程 ======== */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">我的课程</h2>
          </div>
          <Card className="border-border/40 bg-card/80">
            <CardContent className="p-3">
              <Tabs defaultValue="learned">
                <TabsList className="w-full">
                  <TabsTrigger value="learned" className="flex-1">已学</TabsTrigger>
                  <TabsTrigger value="unlearned" className="flex-1">未学</TabsTrigger>
                </TabsList>
                <TabsContent value="learned">
                  <div className="space-y-2 mt-2">
                    {MOCK_COURSES_LEARNED.map((c) => (
                      <div key={c.id} className="flex items-center justify-between py-2 px-1">
                        <span className="text-sm text-foreground">{c.title}</span>
                        <Badge variant="secondary" className="text-xs">已完成</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="unlearned">
                  <div className="space-y-2 mt-2">
                    {MOCK_COURSES_UNLEARNED.map((c) => (
                      <div key={c.id} className="flex items-center justify-between py-2 px-1">
                        <span className="text-sm text-foreground">{c.title}</span>
                        <span className="text-xs text-muted-foreground">{c.progress}%</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* ======== 4. 设置 ======== */}
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Settings className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">设置</h2>
          </div>
          <Card className="border-border/40 bg-card/80">
            <CardContent className="p-0 divide-y divide-border/30">
              {SETTINGS_ITEMS.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-foreground hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* ======== 5. 关于我们（原"介绍"内容迁移至此） ======== */}
        <section className="pt-2">
          <Accordion type="single" collapsible>
            <AccordionItem value="about" className="border-border/30">
              <AccordionTrigger className="px-1 text-sm text-muted-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>关于我们</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 px-1">
                  <button
                    onClick={() => navigate("/awakening-system-intro")}
                    className="w-full flex items-center justify-between py-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <span>系统介绍</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    有劲AI — 您的智能情绪健康伙伴，致力于通过 AI 技术帮助每个人实现情绪自由与人生觉醒。
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>

      {/* 底部导航栏 */}
      <AwakeningBottomNav />
    </div>
  );
};

export default MyPage;
