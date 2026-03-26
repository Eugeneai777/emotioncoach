import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Trophy, Pill, Shield, Clock, TrendingUp, Moon, Sun, Coffee, Zap, ChevronRight, Star, Activity, CheckCircle, Package, Rocket, Truck, DollarSign, Target, BarChart3, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WechatPayDialog } from "@/components/WechatPayDialog";
import { AlipayPayDialog } from "@/components/AlipayPayDialog";
import { isWeChatBrowser, isWeChatMiniProgram } from "@/utils/platform";
import { CheckoutForm, type CheckoutInfo } from "@/components/store/CheckoutForm";
import { QuickRegisterStep } from "@/components/onboarding/QuickRegisterStep";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { setPostAuthRedirect, clearPostAuthRedirect } from "@/lib/postAuthRedirect";
import zhileCapsules from "@/assets/zhile-capsules.jpeg";
import wecomCoachQr from "@/assets/wecom-coach-qr.jpg";

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

/* ========== Floating particles (gold) ========== */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-amber-400/30 animate-float"
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

/* ========== Pain Points (中年男性) ========== */
const painPoints = [
  { icon: DollarSign, stat: "72%", label: "中年男性有隐性财务焦虑", desc: "表面稳重，内心对未来充满不确定感", color: "#f59e0b" },
  { icon: Target, stat: "68%", label: "长期高压导致决策质量下降", desc: "越忙越乱，越乱越焦虑，陷入恶性循环", color: "#ef4444" },
  { icon: Moon, stat: "81%", label: "睡前反复算账停不下来", desc: "躺下就想钱的事，失眠→疲劳→判断力更差", color: "#a78bfa" },
];

/* ========== Synergy Data (财富主题) ========== */
const synergyData = [
  { label: "财务决策力", mind: 62, body: 50, combo: 91 },
  { label: "焦虑缓解效果", mind: 58, body: 60, combo: 93 },
  { label: "睡眠质量改善", mind: 52, body: 65, combo: 90 },
  { label: "行动执行力", mind: 60, body: 45, combo: 88 },
  { label: "长期规划清晰度", mind: 65, body: 40, combo: 87 },
];

/* ========== Timeline (财富训练+知乐胶囊) ========== */
const timeline = [
  { time: "7:00", label: "晨间财富冥想", type: "mind" as const, desc: "5分钟财富意识觉醒冥想" },
  { time: "8:00", label: "早餐后服用", type: "body" as const, desc: "知乐胶囊 × 1次" },
  { time: "10:00", label: "财商认知练习", type: "mind" as const, desc: "卡点识别 + 认知重塑" },
  { time: "12:30", label: "午餐后服用", type: "body" as const, desc: "知乐胶囊 × 1次" },
  { time: "15:00", label: "午后决策训练", type: "mind" as const, desc: "压力决策模拟练习" },
  { time: "17:00", label: "下午服用", type: "body" as const, desc: "知乐胶囊 × 1次（建议17-18点）" },
  { time: "22:00", label: "财富日记复盘", type: "mind" as const, desc: "当日财务觉察 + 放松入睡" },
];

/* ========== Testimonials (中年男性) ========== */
const testimonials = [
  { name: "赵先生", role: "制造业企业主", avatar: "👨‍💼", metric: "决策信心", before: "3.2", after: "8.5", duration: "21天", quote: "以前拿项目犹豫不决，现在思路清晰多了，团队都说我变果断了" },
  { name: "陈先生", role: "外企中层管理", avatar: "👨‍💻", metric: "焦虑评分", before: "8.8", after: "3.6", duration: "14天", quote: "睡前不再反复算账了，终于能安心入睡，白天精力充沛" },
  { name: "周先生", role: "自由投资人", avatar: "🧔", metric: "睡眠时长", before: "4.5h", after: "7h", duration: "30天", quote: "心态稳了，不追涨杀跌了，收益反而比以前好" },
];

/* ========== Product specs ========== */
const specs = [
  { label: "每瓶", value: "84粒" },
  { label: "每日用量", value: "3次" },
  { label: "持续天数", value: "28天" },
  { label: "核心成分", value: "16味草本" },
];

/* ========== Success Panel (wealth themed) ========== */
function SuccessPanel({ onEnterCamp, onViewLogistics }: { onEnterCamp: () => void; onViewLogistics: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0f0a]/95 px-4"
    >
      <div className="max-w-sm w-full text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-2">🎉 购买成功！</h2>
          <p className="text-slate-400 text-sm">你的财富觉醒之旅即将开始</p>
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
              <p className="text-xs text-slate-400">财商训练 + 知乐胶囊同步进行，效果更佳。您也可以先进入训练营熟悉内容。</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-200">7天财富觉醒训练营已开通</p>
              <p className="text-xs text-slate-500">可随时进入训练营开始学习</p>
            </div>
          </div>
        </div>

        {/* 企微教练引导卡片 */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-900/40 to-yellow-900/30 border border-amber-500/30 text-center space-y-3">
          <p className="text-sm font-semibold text-amber-300">👨‍🏫 添加主教练微信，加入学员互助群</p>
          <p className="text-xs text-slate-400">获得真人教练 1v1 指导 · 参加线上冥想直播 · 学员社群互助交流</p>
          <div className="flex justify-center">
            <div className="p-2 bg-white rounded-lg shadow-md">
              <img src={wecomCoachQr} alt="主教练企微二维码" className="w-36 h-36 object-contain" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">长按识别二维码添加</p>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={onEnterCamp}
            className="w-full h-12 text-base font-bold rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg shadow-amber-500/25 border-0"
          >
            <Rocket className="w-5 h-5 mr-2" />
            进入财富觉醒训练营
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
export default function WealthSynergyPromoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // 环境检测：移动端非微信浏览器使用支付宝，微信环境使用微信支付
  const shouldUseAlipay = useMemo(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isWechat = isWeChatBrowser();
    const isMiniProgram = isWeChatMiniProgram();
    return isMobile && !isWechat && !isMiniProgram;
  }, []);

  const [step, setStep] = useState<'browse' | 'checkout' | 'payment' | 'register' | 'success'>('browse');
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
  const [orderNo, setOrderNo] = useState('');
  const [paymentOpenId, setPaymentOpenId] = useState<string | undefined>();
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [purchaseChecked, setPurchaseChecked] = useState(false);

  // 🆕 payment_resume: 微信 OAuth 重定向回跳后恢复支付弹窗（参考产品中心逻辑）
  const paymentResumeHandledRef = useRef(false);
  const paymentResume = searchParams.get('payment_resume') === '1';
  const urlPaymentOpenId = searchParams.get('payment_openid');
  const paymentAuthError = searchParams.get('payment_auth_error') === '1';

  const packageInfo = {
    key: "wealth_synergy_bundle",
    name: "财商觉醒 × 身心蓄力 全方位套餐",
    price: 0.01,
    quota: 1,
  };

  // ✅ 页面级支付回调：处理 H5 支付返回后的状态恢复
  usePaymentCallback({
    onSuccess: (callbackOrderNo, packageKey) => {
      if (packageKey === 'wealth_synergy_bundle' || !packageKey) {
        setOrderNo(callbackOrderNo);
        setAlreadyPurchased(true);
        if (user) {
          handleEnterCamp();
        } else {
          // 🆕 确保游客订单号和跳转路径已设置（Alipay H5 回跳场景）
          localStorage.setItem('pending_claim_order', callbackOrderNo);
          setPostAuthRedirect('/camp-intro/wealth_block_7');
          setStep('register');
        }
      }
    },
    showToast: true,
    showConfetti: true,
    priority: 'page',
  });

  // 🆕 微信 OAuth 回跳后恢复支付弹窗（参考产品中心逻辑）
  useEffect(() => {
    if (paymentResumeHandledRef.current) return;

    if (paymentAuthError) {
      paymentResumeHandledRef.current = true;
      toast.error("微信授权失败", { description: "请重新尝试支付" });
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_resume');
      url.searchParams.delete('payment_auth_error');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    if (paymentResume) {
      paymentResumeHandledRef.current = true;
      console.log('[WealthSynergyPromo] Payment resume detected, restoring payment dialog');

      // 使用 URL 中的 payment_openid
      if (urlPaymentOpenId) {
        setPaymentOpenId(urlPaymentOpenId);
      }

      // 尝试恢复收货信息
      try {
        const cachedShipping = localStorage.getItem('synergy_shipping_info');
        if (cachedShipping) {
          setCheckoutInfo(JSON.parse(cachedShipping));
        }
      } catch (e) {
        console.error('[WealthSynergyPromo] Failed to restore shipping info:', e);
      }

      // 直接进入支付步骤
      setStep('payment');

      // 清理 URL 参数
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_resume');
      url.searchParams.delete('payment_openid');
      url.searchParams.delete('payment_auth_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [paymentResume, paymentAuthError, urlPaymentOpenId]);

  useEffect(() => {
    const checkPurchase = async () => {
      if (!user) { setPurchaseChecked(true); return; }
      try {
        // 1. 检查 orders 表
        const { data: orderData } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .in('package_key', ['wealth_synergy_bundle', 'camp-wealth_block_7'])
          .eq('status', 'paid')
          .limit(1);
        if (orderData && orderData.length > 0) {
          setAlreadyPurchased(true);
          setPurchaseChecked(true);
          return;
        }
        // 2. 检查 user_camp_purchases 表
        const { data: campData } = await supabase
          .from('user_camp_purchases')
          .select('id')
          .eq('user_id', user.id)
          .in('camp_type', ['wealth_block_7', 'wealth_synergy_bundle'])
          .eq('payment_status', 'completed')
          .limit(1);
        if (campData && campData.length > 0) setAlreadyPurchased(true);
      } catch (e) { console.error('Check purchase error:', e); }
      setPurchaseChecked(true);
    };
    checkPurchase();
  }, [user]);

  // 微信支付 openId 预加载：进入 checkout 时提前获取，避免支付时延迟
  useEffect(() => {
    if (step !== 'checkout' && step !== 'payment') return;
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    const isMiniProg = isWeChatMiniProgram();
    if (!isWechat || isMiniProg || paymentOpenId) return;

    // 1. 检查 sessionStorage 缓存（统一使用 cached_wechat_openid）
    const cached = sessionStorage.getItem('cached_wechat_openid');
    if (cached) { setPaymentOpenId(cached); return; }

    // 2. 已登录用户查数据库
    if (user) {
      supabase.from('wechat_user_mappings')
        .select('openid')
        .eq('system_user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.openid) {
            setPaymentOpenId(data.openid);
            sessionStorage.setItem('cached_wechat_openid', data.openid);
          }
        });
    }
  }, [step, user, paymentOpenId]);

  const handleBuyClick = () => setStep('checkout');

  const handleCheckoutConfirm = (info: CheckoutInfo) => {
    setCheckoutInfo(info);
    localStorage.setItem('synergy_shipping_info', JSON.stringify(info));
    setStep('payment');
  };

  const handlePaySuccess = async () => {
    if (checkoutInfo) {
      try {
        let foundOrderNo = localStorage.getItem('pending_claim_order') || '';
        
        if (!foundOrderNo) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { data: latestOrder } = await supabase
              .from('orders')
              .select('order_no')
              .eq('user_id', currentUser.id)
              .eq('package_key', 'wealth_synergy_bundle')
              .eq('status', 'paid')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (latestOrder?.order_no) foundOrderNo = latestOrder.order_no;
          }
        }

        // ✅ 修复：将 orderNo 写入状态，供 QuickRegisterStep 使用
        if (foundOrderNo) {
          setOrderNo(foundOrderNo);
          await supabase.functions.invoke('update-order-shipping', {
            body: {
              orderNo: foundOrderNo,
              shippingInfo: {
                buyerName: checkoutInfo.buyerName,
                buyerPhone: checkoutInfo.buyerPhone,
                buyerAddress: checkoutInfo.buyerAddress,
                idCardName: checkoutInfo.idCardName,
                idCardNumber: checkoutInfo.idCardNumber,
              },
            },
          });
        }
      } catch (e) { console.error('Save shipping info error:', e); }
    }
    if (user) {
      // 已登录用户：支付成功后直接进入训练营
      handleEnterCamp();
    } else {
      // 设置登录/注册后的跳转目标，防止被 OAuth 回调或首页重定向覆盖
      setPostAuthRedirect('/camp-intro/wealth_block_7');
      setStep('register');
    }
  };

  // 注册成功后直接跳转到训练营介绍页
  const handleRegisterSuccess = (userId: string) => {
    clearPostAuthRedirect();
    navigate('/camp-intro/wealth_block_7');
  };

  const handleEnterCamp = async () => {
    if (user) {
      const { data: activeCamp } = await supabase
        .from('training_camps')
        .select('id')
        .eq('user_id', user.id)
        .in('camp_type', ['wealth_block_7', 'wealth_synergy_bundle'])
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeCamp) { navigate(`/camp-checkin/${activeCamp.id}`); return; }
    }
    navigate('/camp-intro/wealth_block_7');
  };

  const handleViewLogistics = () => navigate('/settings?tab=account');

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0f0a]">
        <SuccessPanel onEnterCamp={handleEnterCamp} onViewLogistics={handleViewLogistics} />
      </div>
    );
  }

  // Register dialog (rendered as overlay, not full-screen replacement)

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-slate-100 overflow-x-hidden">

      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a1a0e 0%, #1a1508 40%, #1a1210 100%)" }}>
        <Particles />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-6">
            <Shield className="w-3.5 h-3.5" />
            科学实证 · 财商+身体双引擎方案
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              炼财商 × 护根基
            </span>
            <br />
            <span className="text-white text-2xl sm:text-3xl md:text-4xl">= 全方位蓄力</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            赚得多但守不住？焦虑却找不到出路？<br />
            财商觉醒 + 身心调节，重建你的财富掌控力。
          </p>

          {/* Formula visual */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-900/20 border border-amber-500/30">
              <Trophy className="w-8 h-8 text-amber-400" />
              <span className="text-xs text-amber-300 font-medium">训练营</span>
            </div>
            <span className="text-2xl font-bold text-slate-500">×</span>
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b from-cyan-500/20 to-cyan-900/20 border border-cyan-500/30">
              <Pill className="w-8 h-8 text-cyan-400" />
              <span className="text-xs text-cyan-300 font-medium">知乐胶囊</span>
            </div>
            <span className="text-2xl font-bold text-slate-500">=</span>
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30">
              <Shield className="w-8 h-8 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">全面蓄力</span>
            </div>
          </div>

          {alreadyPurchased ? (
            <>
              <Button
                onClick={handleEnterCamp}
                className="h-12 px-8 text-base font-bold rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg shadow-amber-500/25 border-0"
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
                className="h-12 px-8 text-base font-bold rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 border-0"
              >
                立即解锁套餐 ¥0.01
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-slate-500 text-xs mt-3">原价 ¥899 · 限时优惠</p>
            </>
          )}
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0f0a] to-transparent" />
      </section>

      {/* ===== PAIN POINTS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">你是否正在经历？</h2>
        <p className="text-slate-400 text-sm text-center mb-8">中年男性的三大隐形困境</p>
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
        <p className="text-slate-400 text-sm text-center mb-8">财商觉醒 + 身体修复，缺一不可</p>
        <div className="max-w-lg mx-auto space-y-4">
          {/* Wealth Training */}
          <div className="relative p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-300">🏆 7天财富觉醒训练营</h3>
                <p className="text-xs text-slate-400">7天深度突破财富卡点</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {["财富卡点诊断", "认知重塑", "行动突破"].map((t, i) => (
                <div key={i} className="py-2 px-1 rounded-lg bg-amber-500/10 text-xs text-amber-300">{t}</div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">✦ 测-学-练闭环，7天重建财富思维</p>
            <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2">
              <p className="text-xs text-slate-400 font-medium">🏅 教练团队</p>
              {[
                { icon: "🛡", text: "ICF/EMCC 国际认证，平均执教 8 年+" },
                { icon: "🧠", text: "海沃塔对话体系，深度沟通与自信重塑" },
                { icon: "📊", text: "已服务 2000+ 学员，93% 反馈显著提升" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs">{c.icon}</span>
                  <span className="text-xs text-slate-400">{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plus */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">+</div>
          </div>

          {/* Body - Zhile Capsule (identical to original) */}
          <div className="relative p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Pill className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-cyan-300">💊 知乐胶囊</h3>
                <p className="text-xs text-slate-400">每日3次 · 28天调理周期</p>
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

          {/* Capsule Product Image */}
          <div className="mt-6 rounded-2xl overflow-hidden border border-cyan-500/20">
            <img src={zhileCapsules} alt="知乐胶囊产品实拍" className="w-full object-cover" loading="lazy" />
          </div>

          {/* Product specs */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {specs.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <p className="text-base font-bold text-cyan-400 leading-tight">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">香港HKC认证 · 安全无依赖</p>

          <div className="mt-3 p-4 rounded-xl bg-amber-900/20 border border-amber-500/20">
            <div className="flex items-start gap-2.5">
              <Package className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-300">📦 香港直邮 · 预计4-7个工作日送达</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  建议收到知乐胶囊后再开启训练营，财商训练与身体修复同步进行，效果更佳。
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
                <AnimatedBar label="仅训练营" value={d.mind} color="#f59e0b" delay={i * 0.1} />
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
        <p className="text-slate-400 text-sm text-center mb-8">财商训练 + 身体修复，无缝协同</p>
        <div className="max-w-lg mx-auto relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 via-cyan-500/50 to-amber-500/50" />
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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                    isMind
                      ? "bg-amber-950 border-amber-500/60"
                      : "bg-cyan-950 border-cyan-500/60"
                  }`}>
                    {isMind ? <Trophy className="w-5 h-5 text-amber-400" /> : <Pill className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-mono font-bold ${isMind ? "text-amber-400" : "text-cyan-400"}`}>{t.time}</span>
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
                  className="w-full h-14 text-lg font-bold rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg shadow-amber-500/25 border-0"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  进入财富觉醒训练营
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
              <p className="text-xs text-slate-500 mb-6">财富觉醒营 + 知乐胶囊 28天套餐</p>
              <Button
                onClick={handleBuyClick}
                className="w-full max-w-xs h-14 text-lg font-bold rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 border-0"
              >
                立即开启财富蓄力
              </Button>
              <p className="text-xs text-slate-600 mt-3">支持微信支付 · 支付宝</p>
            </>
          )}
        </div>
      </section>

      {/* ===== STICKY BOTTOM BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-[#0a0f0a] via-[#0a0f0a]/95 to-transparent pt-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {alreadyPurchased ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-emerald-400 font-medium">✅ 已购买</p>
                <p className="text-[10px] text-slate-500 truncate">训练营已开通 · 知乐胶囊配送中</p>
              </div>
              <Button
                onClick={handleEnterCamp}
                className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg shadow-amber-500/25 border-0 text-sm shrink-0"
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
                <p className="text-[10px] text-slate-500 truncate">财富觉醒营 + 知乐胶囊 28天</p>
              </div>
              <Button
                onClick={handleBuyClick}
                className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 border-0 text-sm shrink-0"
              >
                立即购买
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="h-20" />

      <CheckoutForm
        open={step === 'checkout'}
        onOpenChange={(open) => { if (!open) setStep('browse'); }}
        productName={packageInfo.name}
        price={packageInfo.price}
        onConfirm={handleCheckoutConfirm}
        shippingNote="香港直邮，预计 4-7 个工作日送达"
        needIdCard={true}
      />

      {/* 微信支付对话框（微信浏览器/小程序/桌面端） */}
      <WechatPayDialog
        open={step === 'payment' && !shouldUseAlipay}
        onOpenChange={(open) => { if (!open) setStep('browse'); }}
        packageInfo={packageInfo}
        onSuccess={handlePaySuccess}
        openId={isWeChatMiniProgram() ? undefined : paymentOpenId}
        shippingInfo={checkoutInfo ? {
          buyerName: checkoutInfo.buyerName,
          buyerPhone: checkoutInfo.buyerPhone,
          buyerAddress: checkoutInfo.buyerAddress,
          idCardName: checkoutInfo.idCardName,
          idCardNumber: checkoutInfo.idCardNumber,
        } : undefined}
      />

      {/* 登录注册弹窗（支付成功后游客引导） */}
      <Dialog open={step === 'register'} onOpenChange={(open) => { if (!open) setStep('browse'); }}>
        <DialogContent size="sm" className="bg-slate-900 border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-center text-white">请登录或注册以激活您的权益</DialogTitle>
            <DialogDescription className="text-center text-slate-400">
              注册后可管理训练营进度和订单
            </DialogDescription>
          </DialogHeader>
          <QuickRegisterStep orderNo={orderNo} paymentOpenId={paymentOpenId} onSuccess={handleRegisterSuccess} />
        </DialogContent>
      </Dialog>

      {/* 支付宝对话框（移动端非微信浏览器） */}
      <AlipayPayDialog
        open={step === 'payment' && shouldUseAlipay}
        onOpenChange={(open) => { if (!open) setStep('browse'); }}
        packageInfo={packageInfo}
        onSuccess={handlePaySuccess}
        shippingInfo={checkoutInfo ? {
          buyerName: checkoutInfo.buyerName,
          buyerPhone: checkoutInfo.buyerPhone,
          buyerAddress: checkoutInfo.buyerAddress,
          idCardName: checkoutInfo.idCardName,
          idCardNumber: checkoutInfo.idCardNumber,
        } : undefined}
      />
    </div>
  );
}
