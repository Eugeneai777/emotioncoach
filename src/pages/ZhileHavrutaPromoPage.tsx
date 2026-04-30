import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Pill, Shield, Clock, Heart, Briefcase, Battery, Sprout, Moon, Users, Sparkles, ChevronRight, Star, Activity, CheckCircle, Package, Truck, CircleCheck, Award, Leaf, MessageCircle } from "lucide-react";
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
import { PromoFloatingBackButton } from "@/components/promo/PromoFloatingBackButton";
import zhileCapsules from "@/assets/zhile-capsules.jpeg";

/* ========== Floating particles ========== */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/30 animate-float"
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
  { icon: Activity, label: "情绪内耗", desc: "焦虑、烦躁、压抑、易怒，明明很累却无人理解，长期情绪内耗", color: "#f87171" },
  { icon: Heart, label: "关系紧张", desc: "夫妻沟通困难、亲密关系冷淡；亲子有代沟，不知道怎么有效沟通", color: "#f472b6" },
  { icon: Briefcase, label: "职场高压", desc: "工作压力大、内卷严重、精力不足、效率下降，担心职业发展瓶颈", color: "#a78bfa" },
  { icon: Moon, label: "身心失调", desc: "失眠、多梦、易醒、注意力差、身体紧绷、长期疲劳，健康亮起黄灯", color: "#38bdf8" },
  { icon: Sprout, label: "成长受阻", desc: "想学习改变，但课程太复杂、太鸡汤，缺乏专业陪伴，单纯情绪疏导无法解决身体根源", color: "#4ade80" },
];

/* ========== 双效方案 ========== */
const dualSolution = [
  {
    icon: Leaf, title: "知乐安神胶囊", subtitle: "草本调理 · 补心补肝",
    desc: "香港HKC-18181认证，16味草本植物萃取，不含褪黑素/激素，无依赖。从身体根源调理情绪与睡眠。",
    gradient: "from-cyan-500/20 to-cyan-900/20", border: "border-cyan-500/30", textColor: "text-cyan-300",
  },
  {
    icon: Users, title: "海洛塔团队教练辅导", subtitle: "90分钟 · 腾讯会议",
    desc: "专业教练团队带领，聚焦「职场焦虑与睡眠改善」主题，标准化流程：讲解→分组讨论→分享回应，在高接纳、抱持性的环境中梳理情绪卡点。",
    gradient: "from-amber-500/20 to-amber-900/20", border: "border-amber-500/30", textColor: "text-amber-300",
  },
];

/* ========== 海洛塔亮点 ========== */
const havrutaHighlights = [
  { icon: "⭐", title: "95%+ 好评率", desc: "历次调研数据显示，学员满意度持续保持 95% 以上" },
  { icon: "👨‍🏫", title: "35+ 资深教练团队", desc: "教练平均年龄 35+，拥有丰富的职场与人生经验，擅长沟通引导" },
  { icon: "🤗", title: "高接纳抱持性环境", desc: "非评判的安全空间，轻松有爱，让你放心倾诉，无需伪装" },
  { icon: "📋", title: "标准化交付流程", desc: "讲解→分组讨论→分享回应，确保专业性与体验一致性" },
];

/* ========== 教练团队 ========== */
const coaches = [
  { name: "黛汐老师", role: "总教练", emoji: "🎓", desc: "生命教育专家，擅长引领学员实现共振、觉醒与升维，帮助大家找到卡点根源并突破" },
  { name: "晓一教练", role: "生命教练", emoji: "🧭", desc: "通过回溯梳理童年经历，解决害怕失败、自我否定等深层心理卡点，将潜意识卡点意识化" },
  { name: "Amy教练", role: "生命教练", emoji: "💡", desc: "擅长卡点根源梳理、身份锚定与赋能，帮助学员在关系中保持成熟互动，实现内在稳定" },
  { name: "贝蒂教练", role: "生命教练", emoji: "🌸", desc: "曾穿越原生家庭带来的孤独感与限制性信念，现能陪伴学员穿越生命伤痛，找回内在力量" },
];

/* ========== 学员见证 ========== */
const testimonials = [
  { name: "苏菲", role: "资深用户", emoji: "🌿", quote: "通过向内探索练习，重新与自我建立连接，不仅找回了自己，更与过去那个矛盾内耗的自己达成了和解。如今能享受与自己美好相处的时光。" },
  { name: "张艳", role: "资深用户", emoji: "🌻", quote: "加入系统时正处人生最低潮。在群体伙伴的爱与接纳中，每一种生命状态都被允许、被包裹。现在每天都过得开心和幸福。" },
  { name: "李明", role: "已购用户", emoji: "😴", quote: "吃了两周知乐胶囊，最明显的变化是入睡变快了，半夜醒来的次数也少了。配合海洛塔辅导梳理了工作焦虑，现在睡眠质量提升了很多。" },
  { name: "陈颖", role: "已购用户", emoji: "💼", quote: "做中层管理压力很大，团队教练帮我看到了自己一直在用'扛'的方式面对问题。90分钟的辅导比我自己想了半年还有用，思路一下就通了。" },
  { name: "王涛", role: "已购用户", emoji: "🏠", quote: "买的时候其实是冲着胶囊来的，没想到海洛塔辅导才是最大的收获。教练帮我理清了和家人之间的沟通模式，现在家庭氛围好了很多。" },
  { name: "林小雨", role: "已购用户", emoji: "🦋", quote: "第一次参加团队教练辅导有点紧张，但教练非常温暖专业。结束后突然意识到很多情绪反应都有根源，开始学会觉察自己，不再盲目内耗了。" },
];

/* ========== Product specs ========== */
const specs = [
  { label: "每瓶", value: "84粒" },
  { label: "每日用量", value: "3次" },
  { label: "核心成分", value: "16味草本" },
  { label: "认证", value: "HKC-18181" },
];

/* ========== Success Panel ========== */
function SuccessPanel({ onViewOrders }: { onViewOrders: () => void }) {
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
          <p className="text-slate-400 text-sm">知乐 × 海洛塔双效解压包已激活</p>
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
            <Users className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-200">海洛塔团队教练辅导 × 1次</p>
              <p className="text-xs text-slate-400">客服将通过企微联系您，安排 90 分钟腾讯会议辅导时间</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-200">请添加企微客服</p>
              <p className="text-xs text-slate-500">客服将拉您进入学员服务群，获取辅导安排与后续支持</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={onViewOrders}
            className="w-full h-12 text-base font-bold rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border-0"
          >
            <Truck className="w-5 h-5 mr-2" />
            查看订单与物流
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ========== Main Page ========== */
export default function ZhileHavrutaPromoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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

  const paymentResumeHandledRef = useRef(false);
  const paymentResume = searchParams.get('payment_resume') === '1';
  const urlPaymentOpenId = searchParams.get('payment_openid');
  const paymentAuthError = searchParams.get('payment_auth_error') === '1';

  const packageInfo = {
    key: "zhile_havruta_bundle",
    name: "知乐·海洛塔双效解压包",
    price: 399,
    quota: 1,
  };

  usePaymentCallback({
    onSuccess: (callbackOrderNo, packageKey) => {
      if (packageKey === 'zhile_havruta_bundle' || !packageKey) {
        setOrderNo(callbackOrderNo);
        setAlreadyPurchased(true);
        if (user) {
          setStep('success');
        } else {
          localStorage.setItem('pending_claim_order', callbackOrderNo);
          setPostAuthRedirect('/promo/zhile-havruta');
          setStep('register');
        }
      }
    },
    showToast: true,
    showConfetti: true,
    priority: 'page',
  });

  // 微信 OAuth 回跳恢复
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
      if (urlPaymentOpenId) setPaymentOpenId(urlPaymentOpenId);
      try {
        const cached = localStorage.getItem('zhile_havruta_shipping_info');
        if (cached) setCheckoutInfo(JSON.parse(cached));
      } catch (e) { console.error('[ZhileHavruta] Failed to restore shipping:', e); }
      setStep('payment');
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_resume');
      url.searchParams.delete('payment_openid');
      url.searchParams.delete('payment_auth_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [paymentResume, paymentAuthError, urlPaymentOpenId]);

  // 已购检测
  useEffect(() => {
    const check = async () => {
      if (!user) { setPurchaseChecked(true); return; }
      try {
        const { data } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .eq('package_key', 'zhile_havruta_bundle')
          .eq('status', 'paid')
          .limit(1);
        if (data && data.length > 0) setAlreadyPurchased(true);
      } catch (e) { console.error('Check purchase error:', e); }
      setPurchaseChecked(true);
    };
    check();
  }, [user]);

  // 微信 openId 预加载
  useEffect(() => {
    if (step !== 'checkout' && step !== 'payment') return;
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    const isMiniProg = isWeChatMiniProgram();
    if (!isWechat || isMiniProg || paymentOpenId) return;
    const cached = sessionStorage.getItem('cached_wechat_openid');
    if (cached) { setPaymentOpenId(cached); return; }
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
    localStorage.setItem('zhile_havruta_shipping_info', JSON.stringify(info));
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
              .eq('package_key', 'zhile_havruta_bundle')
              .eq('status', 'paid')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (latestOrder?.order_no) foundOrderNo = latestOrder.order_no;
          }
        }
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
      setStep('success');
    } else {
      setPostAuthRedirect('/promo/zhile-havruta');
      setStep('register');
    }
  };

  const handleRegisterSuccess = () => {
    clearPostAuthRedirect();
    setStep('success');
  };

  const handleViewOrders = () => navigate('/settings?tab=account&view=orders');

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0e1a]">
        <SuccessPanel onViewOrders={handleViewOrders} />
      </div>
    );
  }

  const shippingData = checkoutInfo ? {
    buyerName: checkoutInfo.buyerName,
    buyerPhone: checkoutInfo.buyerPhone,
    buyerAddress: checkoutInfo.buyerAddress,
    idCardName: checkoutInfo.idCardName,
    idCardNumber: checkoutInfo.idCardNumber,
  } : undefined;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 overflow-x-hidden">
      <PromoFloatingBackButton />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #164e63 40%, #0c4a6e 100%)" }}>
        <Particles />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs mb-6">
            <Shield className="w-3.5 h-3.5" />
            专为35-55岁高压人群设计
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              身体调理 × 情绪梳理
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              双效解压
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            知乐胶囊 + 海洛塔90分钟团队教练辅导<br />
            草本调理根源 + 专业情绪梳理，双引擎协同
          </p>

          {/* Dual Engine */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b from-cyan-500/20 to-cyan-900/20 border border-cyan-500/30">
              <Pill className="w-7 h-7 text-cyan-400" />
              <span className="text-[10px] sm:text-xs text-cyan-300 font-medium">知乐胶囊</span>
            </div>
            <span className="text-xl font-bold text-slate-500">+</span>
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-900/20 border border-amber-500/30">
              <Users className="w-7 h-7 text-amber-400" />
              <span className="text-[10px] sm:text-xs text-amber-300 font-medium">海洛塔辅导</span>
            </div>
            <span className="text-xl font-bold text-slate-500">=</span>
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30">
              <Shield className="w-7 h-7 text-emerald-400" />
              <span className="text-[10px] sm:text-xs text-emerald-300 font-medium">双效解压</span>
            </div>
          </div>

          {alreadyPurchased ? (
            <>
              <Button onClick={handleViewOrders} className="h-12 px-8 text-base font-bold rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 border-0">
                查看订单 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-emerald-400/60 text-xs mt-3">✅ 已购买 · 客服将联系安排辅导</p>
            </>
          ) : (
            <>
              <Button onClick={handleBuyClick} className="h-12 px-8 text-base font-bold rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-500/25 border-0">
                立即购买 ¥399 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-slate-500 text-xs mt-3">知乐胶囊 1瓶 + 海洛塔辅导 1次</p>
            </>
          )}
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
      </section>

      {/* ===== ALREADY PURCHASED STICKY ===== */}
      {alreadyPurchased && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-50 mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-900/40 border border-emerald-500/30 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-200">已购买</p>
                <p className="text-xs text-slate-400">客服将安排辅导</p>
              </div>
            </div>
            <Button onClick={handleViewOrders} size="sm" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 text-xs h-8">
              <Truck className="w-3.5 h-3.5 mr-1" /> 订单
            </Button>
          </div>
        </motion.div>
      )}

      {/* ===== PAIN POINTS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">你是否正在经历？</h2>
        <p className="text-slate-400 text-sm text-center mb-8">五大隐形压力源</p>
        <div className="grid gap-3 max-w-lg mx-auto">
          {painPoints.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p.color}15` }}>
                <p.icon className="w-5 h-5" style={{ color: p.color }} />
              </div>
              <div>
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.label}</span>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== DUAL SOLUTION ===== */}
      <Section className="bg-slate-900/50">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">双效解压方案</h2>
        <p className="text-slate-400 text-sm text-center mb-8">身体 + 情绪，内外兼修</p>
        <div className="max-w-lg mx-auto space-y-4">
          {/* 知乐安神胶囊卡片 */}
          {dualSolution.filter(s => s.title === '知乐安神胶囊').map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className={`p-5 rounded-2xl border bg-gradient-to-br ${s.gradient} ${s.border}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.border} border bg-slate-900/40`}>
                  <s.icon className={`w-6 h-6 ${s.textColor}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${s.textColor}`}>{s.title}</h3>
                  <p className="text-xs text-slate-400">{s.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}

          {/* 知乐胶囊详情（图片+规格+资质）紧跟卡片 */}
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-cyan-500/20">
              <img src={zhileCapsules} alt="知乐胶囊产品实拍" className="w-full object-cover" loading="lazy" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {specs.map((s, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <p className="text-base font-bold text-cyan-400 leading-tight">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-2.5">
              <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                <Shield className="w-4 h-4" /> 产品资质与安全
              </h4>
              {[
                "香港中成药注册编号 HKC-18181，通过香港卫生署严格审批",
                "16味草本植物萃取（酸枣仁、五味子、党参等），不含褪黑素、激素",
                "无依赖，全年龄段（10岁+）可使用，哺乳期也适用",
                "通过GMP认证 + 急性毒性试验 + 原材料确定性试验",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CircleCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 海洛塔辅导卡片 */}
          {dualSolution.filter(s => s.title !== '知乐安神胶囊').map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className={`p-5 rounded-2xl border bg-gradient-to-br ${s.gradient} ${s.border}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.border} border bg-slate-900/40`}>
                  <s.icon className={`w-6 h-6 ${s.textColor}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${s.textColor}`}>{s.title}</h3>
                  <p className="text-xs text-slate-400">{s.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== HAVRUTA HIGHLIGHTS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">海洛塔团队教练 · 核心亮点</h2>
        <p className="text-slate-400 text-sm text-center mb-8">基于深度调研数据，专业可信赖</p>
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {havrutaHighlights.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
              <span className="text-2xl mb-2 block">{h.icon}</span>
              <h4 className="text-sm font-bold text-slate-200 mb-1">{h.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== COACH TEAM ===== */}
      <Section className="bg-slate-900/50">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">教练团队</h2>
        <p className="text-slate-400 text-sm text-center mb-8">资深生命教练，多元背景专家</p>
        <div className="max-w-lg mx-auto space-y-3">
          {coaches.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
              <span className="text-2xl shrink-0">{c.emoji}</span>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-bold text-slate-200">{c.name}</h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{c.role}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== TESTIMONIALS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">商品评价</h2>
        <div className="max-w-lg mx-auto space-y-4">
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/40">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">"{t.quote}"</p>
              <div className="flex gap-0.5 mt-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>


      {/* ===== PURCHASE BENEFITS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">购买即享</h2>
        <p className="text-slate-400 text-sm text-center mb-8">¥399 一次购买，三重权益</p>
        <div className="max-w-lg mx-auto space-y-3">
          {[
            { icon: Pill, title: "知乐安神胶囊 × 1瓶", desc: "84粒/瓶，香港直邮，4-7个工作日送达", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
            { icon: Users, title: "海洛塔团队教练辅导 × 1次", desc: "90分钟腾讯会议，专业教练带领情绪梳理", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
            { icon: MessageCircle, title: "学员服务群", desc: "加入企微专属学员群，获取后续支持与情绪管理干货", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
          ].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`flex items-start gap-3 p-4 rounded-xl border ${b.bg}`}>
              <b.icon className={`w-6 h-6 ${b.color} shrink-0 mt-0.5`} />
              <div>
                <h4 className="text-sm font-bold text-slate-200">{b.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{b.desc}</p>
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
                <CheckCircle className="w-4 h-4" /> 您已购买此套餐
              </div>
              <Button onClick={handleViewOrders} className="w-full max-w-xs h-14 text-lg font-bold rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg border-0">
                <Truck className="w-5 h-5 mr-2" /> 查看订单与物流
              </Button>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-2">限时特价</p>
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">¥399</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">知乐胶囊 1瓶 + 海洛塔辅导 1次 + 学员服务群</p>
              <Button onClick={handleBuyClick} className="w-full max-w-xs h-14 text-lg font-bold rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg border-0">
                立即购买双效解压包
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
                <p className="text-[10px] text-slate-500 truncate">客服将安排海洛塔辅导</p>
              </div>
              <Button onClick={handleViewOrders} className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg border-0 text-sm shrink-0">
                查看订单
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-amber-400">¥399</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">知乐胶囊 + 海洛塔90min辅导</p>
              </div>
              <Button onClick={handleBuyClick} className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg border-0 text-sm shrink-0">
                立即购买
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="h-20" />

      {/* Checkout */}
      <CheckoutForm
        open={step === 'checkout'}
        onOpenChange={(open) => { if (!open) setStep('browse'); }}
        productName={packageInfo.name}
        price={packageInfo.price}
        onConfirm={handleCheckoutConfirm}
        shippingNote="香港直邮，预计 4-7 个工作日送达"
        needIdCard={true}
      />

      {/* 微信支付 */}
      <WechatPayDialog
        open={step === 'payment' && !shouldUseAlipay}
        onOpenChange={(open) => { if (!open) setStep('browse'); }}
        packageInfo={packageInfo}
        onSuccess={handlePaySuccess}
        openId={isWeChatMiniProgram() ? undefined : paymentOpenId}
        shippingInfo={shippingData}
      />

      {/* 注册 */}
      <Dialog open={step === 'register'} onOpenChange={(open) => { if (!open) setStep('browse'); }}>
        <DialogContent size="sm" className="bg-slate-900 border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-center text-white">请登录或注册以激活您的权益</DialogTitle>
            <DialogDescription className="text-center text-slate-400">注册后可查看订单与预约辅导</DialogDescription>
          </DialogHeader>
          <QuickRegisterStep orderNo={orderNo} paymentOpenId={paymentOpenId} onSuccess={handleRegisterSuccess} />
        </DialogContent>
      </Dialog>

      {/* 支付宝 */}
      <AlipayPayDialog
        open={step === 'payment' && shouldUseAlipay}
        onOpenChange={(open) => { if (!open) setStep('browse'); }}
        packageInfo={packageInfo}
        onSuccess={handlePaySuccess}
        shippingInfo={shippingData}
      />
    </div>
  );
}
