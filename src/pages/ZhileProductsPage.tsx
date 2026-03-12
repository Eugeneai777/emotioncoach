import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Pill, ShoppingCart, LogIn, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import zhileCapsules from "@/assets/zhile-capsules.jpeg";
import { CheckoutForm, type CheckoutInfo } from "@/components/store/CheckoutForm";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWechatOpenId } from "@/hooks/useWechatOpenId";

interface OrderShippingInfo {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
}

interface Order {
  id: string;
  order_no: string;
  user_id: string;
  amount: number;
  status: string;
  shipping_status: string;
  shipping_info: OrderShippingInfo;
}

interface AudienceType {
  id: string;
  emoji: string;
  label: string;
  subtitle: string;
  gradient: string;
}

interface ProductCard {
  title: string;
  description: string;
  route: string;
  tag: string;
  tagColor: string;
  emoji: string;
  isCapsule?: boolean;
  price?: number;
  originalPrice?: number;
}

const audiences: AudienceType[] = [
  { id: "mama", emoji: "👩‍👧", label: "宝妈", subtitle: "带娃不焦虑", gradient: "from-rose-400 to-pink-500" },
  { id: "workplace", emoji: "💼", label: "职场", subtitle: "压力·倦怠", gradient: "from-blue-400 to-indigo-500" },
  { id: "couple", emoji: "💑", label: "夫妻", subtitle: "亲密关系", gradient: "from-purple-400 to-violet-500" },
  { id: "youth", emoji: "🎓", label: "青少年", subtitle: "学业·情绪", gradient: "from-amber-400 to-orange-500" },
  { id: "midlife", emoji: "🧭", label: "中年", subtitle: "转型·觉醒", gradient: "from-amber-500 to-yellow-600" },
  { id: "senior", emoji: "🌿", label: "长辈", subtitle: "健康·陪伴", gradient: "from-emerald-400 to-teal-500" },
];

const CAPSULE_PRODUCT: ProductCard = {
  title: "知乐胶囊",
  description: "",
  route: "",
  tag: "推荐",
  tagColor: "bg-cyan-500/20 text-cyan-400",
  emoji: "💊",
  isCapsule: true,
  price: 0.01,
  originalPrice: 299,
};

function makeCapsule(desc: string): ProductCard {
  return { ...CAPSULE_PRODUCT, description: desc };
}

const productsByAudience: Record<string, ProductCard[]> = {
  mama: [
    makeCapsule("天然植物配方，缓解焦虑、改善睡眠"),
    { title: "宝妈AI助手", description: "专属情绪陪伴，育儿压力疏导", route: "/mama", tag: "免费体验", tagColor: "bg-green-500/20 text-green-400", emoji: "🤱" },
    { title: "情绪健康测评", description: "3分钟了解你的情绪状态", route: "/emotion-health", tag: "免费", tagColor: "bg-green-500/20 text-green-400", emoji: "📊" },
  ],
  workplace: [
    { title: "心智×身体 协同抗压套餐", description: "训练营 + 知乐胶囊，双引擎协同", route: "/promo/synergy", tag: "限时特惠", tagColor: "bg-amber-500/20 text-amber-400", emoji: "🔥" },
    makeCapsule("职场高压人群必备，提升抗压力"),
    { title: "情绪健康测评", description: "了解你的职场倦怠指数", route: "/emotion-health", tag: "免费", tagColor: "bg-green-500/20 text-green-400", emoji: "📊" },
  ],
  couple: [
    makeCapsule("情绪稳定是亲密关系的基石"),
    { title: "婚姻关系页", description: "亲密关系沟通技巧与情感修复", route: "/marriage", tag: "查看", tagColor: "bg-violet-500/20 text-violet-400", emoji: "💑" },
    { title: "情绪健康测评", description: "了解双方的情绪互动模式", route: "/emotion-health", tag: "免费", tagColor: "bg-green-500/20 text-green-400", emoji: "📊" },
  ],
  youth: [
    { title: "情绪健康测评", description: "了解青少年情绪与压力状态", route: "/emotion-health", tag: "免费", tagColor: "bg-green-500/20 text-green-400", emoji: "📊" },
    makeCapsule("安全温和配方，适合青少年使用"),
    { title: "协同抗压套餐", description: "学业压力大？身心双管齐下", route: "/promo/synergy", tag: "套餐", tagColor: "bg-amber-500/20 text-amber-400", emoji: "🔥" },
  ],
  midlife: [
    makeCapsule("中年转型期的身心能量补给"),
    { title: "中年觉醒页", description: "人生下半场，重新定义意义", route: "/laoge", tag: "查看", tagColor: "bg-yellow-500/20 text-yellow-400", emoji: "🧭" },
    { title: "协同抗压套餐", description: "训练营 + 胶囊，全方位支持", route: "/promo/synergy", tag: "套餐", tagColor: "bg-amber-500/20 text-amber-400", emoji: "🔥" },
  ],
  senior: [
    makeCapsule("改善睡眠质量，提升日常活力"),
    { title: "陪伴聊天", description: "AI智能陪聊，排解孤独感", route: "/elder-care/chat", tag: "免费体验", tagColor: "bg-green-500/20 text-green-400", emoji: "💬" },
    { title: "每日安全守护", description: "子女远程关怀，每日确认安好", route: "/alive-check", tag: "免费", tagColor: "bg-green-500/20 text-green-400", emoji: "💗" },
  ],
};

const capsulePackageInfo = {
  key: "zhile_capsule",
  name: "知乐胶囊",
  price: 0.01,
  quota: 0,
};

export default function ZhileProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const wechatOpenId = useWechatOpenId();
  const [selected, setSelected] = useState<string | null>(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);

  const products = selected ? productsByAudience[selected] ?? [] : [];

  const handleProductClick = (p: ProductCard) => {
    if (p.isCapsule) {
      setCheckoutOpen(true);
    } else {
      navigate(p.route);
    }
  };

  const handleCheckoutConfirm = (info: CheckoutInfo) => {
    setCheckoutInfo(info);
    setCheckoutOpen(false);
    setPayOpen(true);
  };

  const handlePaySuccess = async () => {
    if (checkoutInfo) {
      try {
        // 1. 先尝试从 localStorage 获取游客订单号
        let orderNo = localStorage.getItem('pending_claim_order');
        
        // 2. 已登录用户：查询最新已支付订单作为兜底
        if (!orderNo) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: latestOrder } = await supabase
              .from('orders')
              .select('order_no')
              .eq('user_id', user.id)
              .eq('package_key', 'zhile_capsule')
              .eq('status', 'paid')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (latestOrder?.order_no) orderNo = latestOrder.order_no;
          }
        }

        if (orderNo) {
          await supabase.functions.invoke('update-order-shipping', {
            body: {
              orderNo,
              shippingInfo: {
                buyerName: checkoutInfo.buyerName,
                buyerPhone: checkoutInfo.buyerPhone,
                buyerAddress: checkoutInfo.buyerAddress,
              },
            },
          });
        }
      } catch (e) {
        console.error('Save shipping info error:', e);
      }
    }

    setPayOpen(false);
    toast.success("购买成功！胶囊将尽快为您发货 📦");
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 pb-12">
      {/* 顶部登录按钮 */}
      <div className="absolute top-4 right-4 z-20">
        {user ? (
          <button
            onClick={() => navigate('/settings?tab=account')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            我的
          </button>
        ) : (
          <button
            onClick={() => navigate(`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            登录 / 注册
          </button>
        )}
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden px-4 pt-14 pb-8 text-center"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #172554 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-blue-400/20"
              style={{ left: `${10 + i * 11}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [-6, 6, -6], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4 + i * 0.4, repeat: Infinity }}
            />
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs mb-4">
            <Pill className="w-3.5 h-3.5" />
            知乐产品中心
          </div>

          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              找到适合你的方案
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">选择你的人群 · 获取专属产品推荐</p>

          <div className="mt-5 flex justify-center">
            <img
              src={zhileCapsules}
              alt="知乐胶囊"
              className="w-24 h-24 object-cover rounded-2xl border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10"
            />
          </div>
        </motion.div>
      </section>

      {/* 身心深度修复计划 */}
      <div className="px-4 sm:px-6 max-w-2xl mx-auto mt-6">
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-800/80 to-slate-900/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-violet-500/20 bg-violet-500/5">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              🔬 身心深度修复计划
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">训练营 + 知乐胶囊 · 双引擎协同 · 从根源解决问题</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3">
            {[
              {
                emoji: "🧠",
                title: "协同抗压套餐",
                desc: "21天情绪解压训练营 + 知乐胶囊",
                route: "/promo/synergy",
                gradient: "from-blue-500/20 to-indigo-500/20",
                border: "border-blue-500/20",
              },
              {
                emoji: "💰",
                title: "身心觉醒套餐",
                desc: "7天财富觉醒训练营 + 知乐胶囊",
                route: "/promo/wealth-synergy",
                gradient: "from-amber-500/20 to-yellow-500/20",
                border: "border-amber-500/20",
              },
            ].map((item) => (
              <motion.button
                key={item.route}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(item.route)}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl bg-gradient-to-br ${item.gradient} border ${item.border} hover:brightness-125 transition-all text-center`}
              >
                <span className="text-2xl">{item.emoji}</span>
                <h3 className="text-xs font-bold text-slate-200">{item.title}</h3>
                <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">限时特惠</span>
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  查看详情 <ArrowRight className="w-3 h-3" />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Audience selector */}
      <div className="px-4 sm:px-6 max-w-2xl mx-auto mt-6">
        <h2 className="text-xs font-semibold text-slate-400 mb-3 tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          你是哪类人群？
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {audiences.map((a) => {
            const isActive = selected === a.id;
            return (
              <motion.button
                key={a.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setSelected(isActive ? null : a.id)}
                className={`flex flex-col items-center gap-1 rounded-xl py-3 px-2 border transition-all ${
                  isActive
                    ? "border-cyan-500/50 bg-cyan-500/10 shadow-md shadow-cyan-500/10"
                    : "border-slate-700/40 bg-slate-800/60 hover:border-slate-600/60"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-sm`}>
                  <span className="text-lg">{a.emoji}</span>
                </div>
                <span className="text-xs font-semibold text-slate-200">{a.label}</span>
                <span className="text-[10px] text-slate-500">{a.subtitle}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Product recommendations */}
      <AnimatePresence mode="wait">
        {selected && products.length > 0 && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="px-4 sm:px-6 max-w-2xl mx-auto mt-6"
          >
            <h2 className="text-xs font-semibold text-slate-400 mb-3 tracking-wide">
              🎯 为你推荐
            </h2>
            <div className="space-y-2.5">
              {products.map((p, i) => (
                <motion.button
                  key={p.title + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleProductClick(p)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/80 transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xl">{p.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-200 truncate">{p.title}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${p.tagColor}`}>
                        {p.tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{p.description}</p>
                      {p.isCapsule && p.price != null && (
                        <span className="text-xs font-bold text-amber-400 shrink-0">
                          ¥{p.price}
                          {p.originalPrice && (
                            <span className="text-[10px] text-slate-600 line-through ml-1">¥{p.originalPrice}</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {p.isCapsule ? (
                    <ShoppingCart className="w-4 h-4 text-cyan-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="text-center mt-10 px-4">
        <p className="text-xs text-slate-600">💊 知乐 · 让每一天都有好状态</p>
      </div>

      {/* Checkout Form - with cross-border ID card requirement */}
      <CheckoutForm
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName="知乐胶囊"
        price={capsulePackageInfo.price}
        onConfirm={handleCheckoutConfirm}
        shippingNote="香港直邮，预计 4-7 个工作日送达"
        needIdCard={true}
      />

      {/* Payment Dialog */}
      <UnifiedPayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        packageInfo={capsulePackageInfo}
        onSuccess={handlePaySuccess}
        openId={wechatOpenId}
      />
    </div>
  );
}
