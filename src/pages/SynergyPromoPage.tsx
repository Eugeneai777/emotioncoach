import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Brain, Pill, Shield, Clock, TrendingUp, Moon, Sun, Coffee, Zap, ChevronRight, Star, Activity, CheckCircle, Package, Rocket, Truck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { CheckoutForm, type CheckoutInfo } from "@/components/store/CheckoutForm";
import { QuickRegisterStep } from "@/components/onboarding/QuickRegisterStep";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import zhileCapsules from "@/assets/zhile-capsules.jpeg";

/* ========== Animated Progress Bar ========== */
function AnimatedBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-700/60 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : {}}
          transition={{ duration: 1.2, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ========== Floating particles ========== */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-blue-400/30 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ========== Section wrapper ========== */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className={`px-4 sm:px-6 py-10 sm:py-14 ${className}`}
    >
      {children}
    </motion.section>
  );
}

/* ========== Pain Points ========== */
const painPoints = [
  { icon: Activity, stat: "78%", label: "职场人有会议恐惧", desc: "心跳加速、手心出汗、脑子一片空白", color: "#f87171" },
  { icon: Moon, stat: "65%", label: "因工作压力失眠", desc: "躺下就开始复盘、越想越焦虑", color: "#a78bfa" },
  { icon: Coffee, stat: "83%", label: "下午效率暴跌", desc: "午后犯困、注意力涣散、靠咖啡续命", color: "#fbbf24" },
];

/* ========== Synergy Data ========== */
const synergyData = [
  { label: "压力缓解效果", mind: 60, body: 55, combo: 92 },
  { label: "起效速度", mind: 45, body: 70, combo: 88 },
  { label: "睡眠质量改善", mind: 55, body: 65, combo: 90 },
  { label: "情绪稳定度", mind: 65, body: 50, combo: 93 },
  { label: "工作效率提升", mind: 58, body: 48, combo: 85 },
];

/* ========== Timeline ========== */
const timeline = [
  { time: "7:00", label: "晨间训练", type: "mind" as const, desc: "5分钟正念冥想" },
  { time: "8:00", label: "早餐后服用", type: "body" as const, desc: "知乐胶囊 × 1粒" },
  { time: "10:00", label: "会前准备", type: "mind" as const, desc: "2分钟呼吸调节" },
  { time: "12:30", label: "午餐后服用", type: "body" as const, desc: "知乐胶囊 × 1粒" },
  { time: "15:00", label: "午后重启", type: "mind" as const, desc: "认知重塑练习" },
  { time: "19:00", label: "晚餐后服用", type: "body" as const, desc: "知乐胶囊 × 1粒" },
  { time: "22:00", label: "睡前放松", type: "mind" as const, desc: "身体扫描冥想" },
];

/* ========== Testimonials ========== */
const testimonials = [
  { name: "张女士", role: "互联网产品经理", avatar: "👩‍💼", metric: "焦虑评分", before: "8.2", after: "3.1", duration: "21天", quote: "开会不再手抖了，甚至主动要求做汇报" },
  { name: "李先生", role: "金融分析师", avatar: "👨‍💻", metric: "睡眠时长", before: "5h", after: "7.5h", duration: "14天", quote: "终于不用靠安眠药入睡了" },
  { name: "王女士", role: "创业公司CEO", avatar: "👩‍🦰", metric: "压力指数", before: "9.0", after: "4.2", duration: "30天", quote: "决策更冷静，团队都说我变了个人" },
];

/* ========== Product specs ========== */
const specs = [
  { label: "每瓶", value: "90粒" },
  { label: "每日用量", value: "3粒" },
  { label: "持续天数", value: "30天" },
  { label: "核心成分", value: "GABA + 茶氨酸" },
];

/* ========== Main Page ========== */
/* ========== Success Panel (inline, dark themed) ========== */
function SuccessPanel({ onEnterCamp, onViewLogistics }: { onEnterCamp: () => void; onViewLogistics: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0e1a]/95 px-4"
    >
      <div className="max-w-sm w-full text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-2">🎉 购买成功！</h2>
          <p className="text-slate-400 text-sm">你的全天候抗压之旅即将开始</p>
        </div>

        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <Package className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-200">知乐胶囊已安排发货</p>
              <p className="text-xs text-slate-500">香港直邮，预计 4-7 个工作日送达</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-900/30 border border-amber-500/30">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-200">💡 建议收到胶囊后再开启训练营</p>
              <p className="text-xs text-slate-400">心智训练 + 知乐胶囊同步进行，效果更佳。您也可以先进入训练营熟悉内容。</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <Brain className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-200">21天情绪日记训练营已开通</p>
              <p className="text-xs text-slate-500">可随时进入训练营开始学习</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={onEnterCamp}
            className="w-full h-12 text-base font-bold rounded-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 border-0"
          >
            <Rocket className="w-5 h-5 mr-2" />
            进入情绪日记训练营
          </Button>
          <Button
            onClick={onViewLogistics}
            variant="outline"
            className="w-full h-10 text-sm rounded-full border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Truck className="w-4 h-4 mr-2" />
            查看订单与物流
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ========== Main Page ========== */
export default function SynergyPromoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Multi-step flow: browse → checkout → payment → register → success
  const [step, setStep] = useState<'browse' | 'checkout' | 'payment' | 'register' | 'success'>('browse');
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
  const [orderNo, setOrderNo] = useState('');
  const [paymentOpenId, setPaymentOpenId] = useState<string | undefined>();
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [purchaseChecked, setPurchaseChecked] = useState(false);

  const packageInfo = {
    key: "synergy_bundle",
    name: "心智×身体 全天候抗压套餐",
    price: 0.01,
    quota: 1,
  };

  // 检查用户是否已购买过 synergy_bundle
  useEffect(() => {
    const checkPurchase = async () => {
      if (!user) {
        setPurchaseChecked(true);
        return;
      }
      try {
        const { data } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .eq('package_key', 'synergy_bundle')
          .eq('status', 'paid')
          .limit(1);
        if (data && data.length > 0) {
          setAlreadyPurchased(true);
        }
      } catch (e) {
        console.error('Check purchase error:', e);
      }
      setPurchaseChecked(true);
    };
    checkPurchase();
  }, [user]);

  // Step 1: User clicks buy → open checkout form
  const handleBuyClick = () => {
    setStep('checkout');
  };

  // Step 2: Checkout info collected → open payment
  const handleCheckoutConfirm = (info: CheckoutInfo) => {
    setCheckoutInfo(info);
    setStep('payment');
  };

  // Step 3: Payment success → save shipping info & check auth
  const handlePaySuccess = async () => {
    // Save shipping info to the most recent order
    if (checkoutInfo) {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          // Find the most recent paid order for this package
          const { data: recentOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('package_key', packageInfo.key)
            .eq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentOrder) {
            await supabase
              .from('orders')
              .update({
                buyer_name: checkoutInfo.buyerName,
                buyer_phone: checkoutInfo.buyerPhone,
                buyer_address: checkoutInfo.buyerAddress,
                shipping_status: 'pending',
              })
              .eq('id', recentOrder.id);
          }
        }
      } catch (e) {
        console.error('Save shipping info error:', e);
      }
      // Also store in localStorage as fallback for guest checkout
      localStorage.setItem('synergy_shipping_info', JSON.stringify(checkoutInfo));
    }

    if (user) {
      // Already logged in → skip register, go to success
      setStep('success');
    } else {
      setStep('register');
    }
  };

  // Step 4: Registration success
  const handleRegisterSuccess = (userId: string) => {
    setStep('success');
  };

  // Step 5: Enter camp - smart redirect
  const handleEnterCamp = async () => {
    if (user) {
      // Check for active training camp first
      const { data: activeCamp } = await supabase
        .from('training_camps')
        .select('id')
        .eq('user_id', user.id)
        .in('camp_type', ['emotion_journal_21', 'synergy_bundle'])
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (activeCamp) {
        navigate(`/camp-checkin/${activeCamp.id}`);
        return;
      }
    }
    navigate('/camp-intro/emotion_journal_21');
  };

  const handleViewLogistics = () => {
    navigate('/settings?tab=account');
  };

  // Show success panel overlay
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0e1a]">
        <SuccessPanel onEnterCamp={handleEnterCamp} onViewLogistics={handleViewLogistics} />
      </div>
    );
  }

  // Show register step as full-screen overlay
  if (step === 'register') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-slate-900 rounded-2xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-bold text-white text-center mb-4">完成注册</h2>
          <p className="text-sm text-slate-400 text-center mb-6">注册后可管理训练营进度和订单</p>
          <QuickRegisterStep
            orderNo={orderNo}
            paymentOpenId={paymentOpenId}
            onSuccess={handleRegisterSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 overflow-x-hidden">

      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #172554 100%)" }}>
        <Particles />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs mb-6">
            <Shield className="w-3.5 h-3.5" />
            科学实证 · 双引擎抗压方案
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              练心智 × 护身体
            </span>
            <br />
            <span className="text-white text-2xl sm:text-3xl md:text-4xl">= 24h 全天候抗压</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            单独使用效果有限，组合使用效果翻倍。<br />
            心理训练 + 生理调节，全方位守护你的职场战斗力。
          </p>

          {/* Formula visual */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b from-violet-500/20 to-violet-900/20 border border-violet-500/30">
              <Brain className="w-8 h-8 text-violet-400" />
              <span className="text-xs text-violet-300 font-medium">训练营</span>
            </div>
            <span className="text-2xl font-bold text-slate-500">×</span>
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b from-cyan-500/20 to-cyan-900/20 border border-cyan-500/30">
              <Pill className="w-8 h-8 text-cyan-400" />
              <span className="text-xs text-cyan-300 font-medium">知乐胶囊</span>
            </div>
            <span className="text-2xl font-bold text-slate-500">=</span>
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-900/20 border border-amber-500/30">
              <Shield className="w-8 h-8 text-amber-400" />
              <span className="text-xs text-amber-300 font-medium">全天抗压</span>
            </div>
          </div>

          {alreadyPurchased ? (
            <>
              <Button
                onClick={handleEnterCamp}
                className="h-12 px-8 text-base font-bold rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 border-0"
              >
                进入训练营
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-emerald-400/60 text-xs mt-3">✅ 已购买 · 训练营已开通</p>
            </>
          ) : (
            <>
              <Button
                onClick={handleBuyClick}
                className="h-12 px-8 text-base font-bold rounded-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25 border-0"
              >
                立即解锁套餐 ¥0.01
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-slate-500 text-xs mt-3">原价 ¥899 · 限时优惠</p>
            </>
          )}
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
      </section>

      {/* ===== PAIN POINTS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">你是否正在经历？</h2>
        <p className="text-slate-400 text-sm text-center mb-8">职场压力的三大隐形杀手</p>
        <div className="grid gap-4 max-w-lg mx-auto">
          {painPoints.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p.color}15` }}>
                <p.icon className="w-6 h-6" style={{ color: p.color }} />
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-black" style={{ color: p.color }}>{p.stat}</span>
                  <span className="text-sm text-slate-300">{p.label}</span>
                </div>
                <p className="text-xs text-slate-500">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== DUAL ENGINE ===== */}
      <Section className="bg-slate-900/50">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">双引擎解决方案</h2>
        <p className="text-slate-400 text-sm text-center mb-8">心理 + 生理，缺一不可</p>
        <div className="max-w-lg mx-auto space-y-4">
          {/* Mind */}
          <div className="relative p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-bold text-violet-300">🧘 7天情绪解压训练营</h3>
                <p className="text-xs text-slate-400">7天深度进阶冥想体系</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {["认知重塑", "情绪调节", "习惯养成"].map((t, i) => (
                <div key={i} className="py-2 px-1 rounded-lg bg-violet-500/10 text-xs text-violet-300">{t}</div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">✦ 从根源改变压力应对模式，效果持久</p>
          </div>

          {/* Plus */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">+</div>
          </div>

          {/* Body */}
          <div className="relative p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Pill className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-cyan-300">💊 知乐胶囊</h3>
                <p className="text-xs text-slate-400">每日3粒 · 30天调理周期</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {["即时缓解", "神经修复", "睡眠改善"].map((t, i) => (
                <div key={i} className="py-2 px-1 rounded-lg bg-cyan-500/10 text-xs text-cyan-300">{t}</div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">✦ 从生理层面快速降低应激反应</p>
            <p className="text-xs text-amber-400/80 mt-2">📦 香港直邮，预计下单后 4-7 个工作日送达</p>
          </div>

          {/* Capsule Product Image - right after dual engine */}
          <div className="mt-6 rounded-2xl overflow-hidden border border-cyan-500/20">
            <img src={zhileCapsules} alt="知乐胶囊产品实拍" className="w-full object-cover" loading="lazy" />
          </div>

          {/* Product specs - inline */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {specs.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <p className="text-lg font-bold text-cyan-400">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">国家食药监认证 · 安全无依赖</p>

          <div className="mt-3 p-4 rounded-xl bg-amber-900/20 border border-amber-500/20">
            <div className="flex items-start gap-2.5">
              <Package className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-300">📦 香港直邮 · 预计4-7个工作日送达</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  建议收到知乐胶囊后再开启训练营，心智训练与身体修复同步进行，效果更佳。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== SYNERGY DATA DASHBOARD ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">协同效果数据</h2>
        <p className="text-slate-400 text-sm text-center mb-8">1 + 1 &gt; 2 的科学验证</p>
        <div className="max-w-lg mx-auto space-y-6">
          {synergyData.map((d, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/40">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">{d.label}</h4>
              <div className="space-y-2.5">
                <AnimatedBar label="仅训练营" value={d.mind} color="#a78bfa" delay={i * 0.1} />
                <AnimatedBar label="仅知乐胶囊" value={d.body} color="#22d3ee" delay={i * 0.1 + 0.15} />
                <AnimatedBar label="组合使用" value={d.combo} color="#fbbf24" delay={i * 0.1 + 0.3} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">* 数据来源于30天跟踪研究，样本量N=200</p>
      </Section>

      {/* ===== 24H TIMELINE ===== */}
      <Section className="bg-slate-900/50">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">24小时全天守护</h2>
        <p className="text-slate-400 text-sm text-center mb-8">从早到晚，无缝保护</p>
        <div className="max-w-lg mx-auto relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500/50 via-cyan-500/50 to-violet-500/50" />

          <div className="space-y-0">
            {timeline.map((t, i) => {
              const isMind = t.type === "mind";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-4 py-3 relative"
                >
                  {/* Node */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                    isMind
                      ? "bg-violet-950 border-violet-500/60"
                      : "bg-cyan-950 border-cyan-500/60"
                  }`}>
                    {isMind ? <Brain className="w-5 h-5 text-violet-400" /> : <Pill className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-mono font-bold ${isMind ? "text-violet-400" : "text-cyan-400"}`}>{t.time}</span>
                      <span className="text-sm font-semibold text-slate-200">{t.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{t.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>


      {/* ===== TESTIMONIALS ===== */}
      <Section className="bg-slate-900/50">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">真实改变，数据说话</h2>
        <p className="text-slate-400 text-sm text-center mb-8">来自真实用户的反馈</p>
        <div className="max-w-lg mx-auto space-y-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/40"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{t.avatar}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role} · 使用{t.duration}</p>
                </div>
              </div>

              {/* Data card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 mb-3">
                <div className="text-center">
                  <p className="text-xs text-slate-500">{t.metric}</p>
                  <p className="text-lg font-bold text-red-400">{t.before}</p>
                  <p className="text-[10px] text-slate-600">使用前</p>
                </div>
                <div className="flex-1 flex justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">{t.metric}</p>
                  <p className="text-lg font-bold text-emerald-400">{t.after}</p>
                  <p className="text-[10px] text-slate-600">使用后</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 italic">"{t.quote}"</p>
              <div className="flex gap-0.5 mt-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== FINAL CTA ===== */}
      <section className="px-4 py-12 text-center">
        <div className="max-w-lg mx-auto">
          {alreadyPurchased ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm mb-6">
                <CheckCircle className="w-4 h-4" />
                您已购买此套餐
              </div>
              <div className="space-y-3 max-w-xs mx-auto">
                <Button
                  onClick={handleEnterCamp}
                  className="w-full h-14 text-lg font-bold rounded-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 border-0"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  进入情绪日记训练营
                </Button>
                <Button
                  onClick={handleViewLogistics}
                  variant="outline"
                  className="w-full h-11 rounded-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  查看订单与物流
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-2">限时特惠</p>
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">¥0.01</span>
                <span className="text-slate-500 line-through text-sm">¥899</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">训练营 + 知乐胶囊 30天套餐</p>
              <Button
                onClick={handleBuyClick}
                className="w-full max-w-xs h-14 text-lg font-bold rounded-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25 border-0"
              >
                立即开启全天候守护
              </Button>
              <p className="text-xs text-slate-600 mt-3">支持微信支付 · 支付宝</p>
            </>
          )}
        </div>
      </section>

      {/* ===== STICKY BOTTOM BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/95 to-transparent pt-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {alreadyPurchased ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-emerald-400 font-medium">✅ 已购买</p>
                <p className="text-[10px] text-slate-500 truncate">训练营已开通 · 知乐胶囊配送中</p>
              </div>
              <Button
                onClick={handleEnterCamp}
                className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 border-0 text-sm shrink-0"
              >
                进入训练营
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-amber-400">¥0.01</span>
                  <span className="text-xs text-slate-500 line-through">¥899</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">心智训练营 + 知乐胶囊 30天</p>
              </div>
              <Button
                onClick={handleBuyClick}
                className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25 border-0 text-sm shrink-0"
              >
                立即购买
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bottom spacer for sticky bar */}
      <div className="h-20" />

      {/* Checkout form dialog */}
      <CheckoutForm
        open={step === 'checkout'}
        onOpenChange={(open) => { if (!open) setStep('browse'); }}
        productName={packageInfo.name}
        price={packageInfo.price}
        onConfirm={handleCheckoutConfirm}
      />

      {/* Pay dialog */}
      <UnifiedPayDialog
        open={step === 'payment'}
        onOpenChange={(open) => { if (!open) setStep('browse'); }}
        packageInfo={packageInfo}
        onSuccess={handlePaySuccess}
      />
    </div>
  );
}
