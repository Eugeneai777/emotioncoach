import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ChevronRight, CheckCircle, Package, Rocket, Truck, Target, CircleCheck, ArrowRight, Pill, Award, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import zhileProductNew from "@/assets/zhile-product-new.jpg";

import { SynergyRedeemDialog } from "@/components/promo/SynergyRedeemDialog";
import { ShareDialogBase } from "@/components/ui/share-dialog-base";
import { useShareDialog } from "@/hooks/useShareDialog";
import ZhileCoachShareCard from "@/components/promo/ZhileCoachShareCard";

import coachBetty from "@/assets/coach-betty.jpg";
import coachXiaoyi from "@/assets/coach-xiaoyi.png";
import coachAmy from "@/assets/coach-amy.jpg";

/* ========== Floating particles ========== */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/20 animate-float"
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
  { emoji: "😶", label: "压力大睡不好", desc: "白天扛着业绩压力，晚上翻来覆去睡不着，身体在报警", color: "#dc2626" },
  { emoji: "🤐", label: "有苦说不出", desc: "老婆觉得你冷漠，兄弟觉得你矫情，找不到一个能真正懂你的人", color: "#9333ea" },
  { emoji: "💊", label: "越努力越累", desc: "健身、喝酒、刷手机，试了各种解压方式，但第二天还是一样疲惫", color: "#2563eb" },
];

/* ========== Value comparison ========== */
const valueComparison = [
  { before: "不知道自己为什么焦虑", after: "找到你失眠、暴躁、没劲的真正根源" },
  { before: "试了很多方法没用", after: "一套适合你当前阶段的身心调理方案" },
  { before: "不知道下一步该怎么做", after: "清晰的90天能量恢复路线图" },
];

/* ========== Coaches ========== */
const coaches = [
  {
    name: "贝蒂", role: "教练",
    title: "绽放者联盟教练",
    certs: ["国家二级教师", "心理咨询师", "天赋测评&分析师"],
    image: coachBetty,
  },
  {
    name: "晓一", role: "教练",
    title: "绽放者联盟生命教练",
    certs: ["特教音乐疗愈师", "情绪管理专家"],
    image: coachXiaoyi,
  },
  {
    name: "Amy", role: "教练",
    title: "绽放联盟教练 · 中国社科院研究生",
    certs: ["生命绽放教练", "心理咨询师", "家庭教育指导师"],
    image: coachAmy,
  },
];

/* ========== Product specs ========== */
const specs = [
  { label: "每瓶", value: "84粒" },
  { label: "每日用量", value: "3次" },
  { label: "持续天数", value: "28天" },
  { label: "核心成分", value: "16味草本" },
];

/* ========== Main Page ========== */
export default function ZhileCoachPromoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [pendingRedeemCode, setPendingRedeemCode] = useState<string | null>(null);
  const shareDialog = useShareDialog();

  useEffect(() => {
    const checkPurchase = async () => {
      if (!user) return;
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .in('package_key', ['zhile_coach_389', 'camp-emotion_stress_7', 'synergy_bundle'])
          .eq('status', 'paid')
          .limit(1);

        if (orderData && orderData.length > 0) {
          setAlreadyPurchased(true);
          return;
        }

        const { data: campData } = await supabase
          .from('user_camp_purchases')
          .select('id')
          .eq('user_id', user.id)
          .in('camp_type', ['emotion_stress_7', 'synergy_bundle'])
          .eq('payment_status', 'completed')
          .limit(1);

        if (campData && campData.length > 0) {
          setAlreadyPurchased(true);
        }
      } catch (e) {
        console.error('Check purchase error:', e);
      }
    };
    checkPurchase();
  }, [user]);

  useEffect(() => {
    if (user && pendingRedeemCode) {
      setPendingRedeemCode(null);
      setShowRedeemDialog(true);
    }
  }, [user, pendingRedeemCode]);

  const handleRedeemNeedLogin = (code: string) => {
    setPendingRedeemCode(code);
    localStorage.setItem('pending_redeem_code', code);
    setPostAuthRedirect('/promo/zhile-coach');
    navigate('/auth');
    setShowRedeemDialog(false);
  };

  const autoCreateAndEnterCamp = async (overrideUserId?: string) => {
    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) {
      navigate('/camp-intro/emotion_stress_7');
      return;
    }
    try {
      const { data: existingCamp } = await supabase
        .from('training_camps')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('camp_type', 'emotion_stress_7')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (existingCamp) {
        navigate(`/camp-checkin/${existingCamp.id}`);
        return;
      }

      const { data: template } = await supabase
        .from('camp_templates')
        .select('duration_days')
        .eq('camp_type', 'emotion_stress_7')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const durationDays = template?.duration_days || 7;
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + (durationDays - 1) * 86400000).toISOString().split('T')[0];

      const { data: newCamp, error: createError } = await supabase
        .from('training_camps')
        .insert({
          user_id: targetUserId,
          camp_type: 'emotion_stress_7',
          camp_name: '7天有劲训练营',
          duration_days: durationDays,
          start_date: startDate,
          end_date: endDate,
          current_day: 1,
          completed_days: 0,
          check_in_dates: [],
          status: 'active',
        })
        .select('id')
        .single();

      if (createError || !newCamp) {
        navigate('/camp-intro/emotion_stress_7');
        return;
      }

      await supabase
        .from('profiles')
        .update({ preferred_coach: 'emotion' })
        .eq('id', targetUserId);

      navigate(`/camp-checkin/${newCamp.id}`);
    } catch {
      navigate('/camp-intro/emotion_stress_7');
    }
  };

  const handleRedeemSuccess = () => {
    setAlreadyPurchased(true);
    autoCreateAndEnterCamp();
  };

  const handleEnterCamp = () => autoCreateAndEnterCamp();
  const handleViewLogistics = () => navigate('/settings?tab=account&view=orders');

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50/30 to-white text-slate-800 overflow-x-hidden">

      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700">
        <Particles />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs mb-6">
            <Shield className="w-3.5 h-3.5" />
            知乐 × 有劲 联合推出
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-3 tracking-tight text-white">
            30分钟<br />解开你3个月的<br />情绪内耗
          </h1>

          <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-6 max-w-md mx-auto">
            1V1教练深度咨询 + 知乐草本胶囊<br />
            一次专业诊断，胜过三个月自我摸索
          </p>

          {/* Price anchor */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm mb-8">
            <div className="text-left">
              <p className="text-white/60 text-xs line-through">原价 ¥899</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">¥399</span>
                <span className="text-xs text-amber-200">限量体验价</span>
              </div>
            </div>
          </div>

          {alreadyPurchased ? (
            <>
              <Button
                onClick={handleEnterCamp}
                className="h-12 px-8 text-base font-bold rounded-full bg-white text-orange-600 hover:bg-white/90 shadow-lg shadow-black/10 border-0"
              >
                进入训练营
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-white/60 text-xs mt-3">✅ 已购买 · 训练营已开通</p>
            </>
          ) : (
            <>
              <Button
                onClick={() => setShowRedeemDialog(true)}
                className="h-12 px-8 text-base font-bold rounded-full bg-white text-orange-600 hover:bg-white/90 shadow-lg shadow-black/10 border-0"
              >
                输入兑换码激活
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-white/60 text-xs mt-3">请先在有赞商城下单获取兑换码</p>
            </>
          )}
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-orange-50 to-transparent" />
      </section>

      {/* ===== PURCHASED QUICK ACCESS ===== */}
      {alreadyPurchased && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 mx-auto max-w-2xl px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700">已购买</p>
                <p className="text-xs text-slate-500">可随时进入训练营</p>
              </div>
            </div>
            <Button
              onClick={handleEnterCamp}
              size="sm"
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white border-0 text-xs h-8"
            >
              <Rocket className="w-3.5 h-3.5 mr-1" />
              进入训练营
            </Button>
          </div>
        </motion.div>
      )}

      {/* ===== PAIN POINTS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">你是不是这样？</h2>
        <p className="text-slate-500 text-sm text-center mb-8">如果你中了任何一条，这次咨询就是为你准备的</p>
        <div className="grid gap-3 max-w-lg mx-auto">
          {painPoints.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-white shadow-sm border border-amber-100/50"
            >
              <span className="text-2xl shrink-0">{p.emoji}</span>
              <div>
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.label}</span>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== CORE VALUE — 30min 1V1 ===== */}
      <Section className="bg-amber-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">你将获得</h2>
        <p className="text-slate-500 text-sm text-center mb-8">一次专业诊断 + 一瓶草本调理</p>

        <div className="max-w-lg mx-auto space-y-4">
          {/* Card 1: 1V1 Consultation - HERO card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300/60 shadow-md"
          >
            <div className="absolute -top-3 left-4 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-sm">
              核心卖点
            </div>

            <div className="flex items-center gap-3 mb-4 mt-1">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">30分钟1V1教练深度咨询</h3>
                <p className="text-xs text-orange-600 font-medium">不是聊天，是专业诊断</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {[
                { num: "①", text: "个人情绪卡点精准诊断", sub: "找到你焦虑、失眠、内耗的真正根源" },
                { num: "②", text: "定制化解决方案", sub: "根据你的具体情况，给出可落地的行动建议" },
                { num: "③", text: "后续成长路径规划", sub: "不只解决当下问题，规划长期身心成长方向" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/80 border border-orange-200/40">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{item.num}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{item.text}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100/60 border border-amber-200/40">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[11px] text-amber-700 font-medium">由资深生命教练亲自执行，非AI替代 · 平均10年+经验</p>
            </div>
          </motion.div>

          {/* Card 2: Zhile Capsule */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-4 sm:p-5 rounded-2xl bg-white shadow-sm border border-teal-200/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Pill className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">知乐胶囊 1瓶</h3>
                <p className="text-xs text-teal-600">从身体根源调理情绪与睡眠</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["香港HKC认证", "16味草本", "不含激素", "无依赖"].map((tag, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/50">{tag}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ===== VALUE COMPARISON ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">30分钟能解决什么？</h2>
        <p className="text-slate-500 text-sm text-center mb-8">一次咨询，胜过三个月自我摸索</p>
        <div className="max-w-lg mx-auto space-y-3">
          {valueComparison.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-amber-100/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-400 mb-0.5">😔 你现在</p>
                <p className="text-sm text-slate-600">{item.before}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-emerald-500 mb-0.5">✨ 30分钟后</p>
                <p className="text-sm font-semibold text-slate-800">{item.after}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== COACH TEAM (Compact) ===== */}
      <Section className="bg-amber-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">你的专属教练团队</h2>
        <p className="text-slate-500 text-sm text-center mb-8">资深生命教练 · 平均10年+经验</p>
        <div className="max-w-lg mx-auto space-y-3">
          {coaches.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-white shadow-sm border border-amber-100/50"
            >
              <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden border-2 border-amber-200/50 shadow-sm">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 font-medium">{c.role}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-1.5">{c.title}</p>
                <div className="flex flex-wrap gap-1">
                  {c.certs.map((cert, ci) => (
                    <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60">{cert}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== CAPSULE DETAILS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">知乐胶囊 · 草本身心调理</h2>
        <p className="text-slate-500 text-sm text-center mb-6">从身体根源调理情绪与睡眠</p>
        <div className="max-w-lg mx-auto space-y-4">
          <div className="rounded-2xl overflow-hidden border border-amber-200/50 shadow-sm bg-white">
            <img src={zhileProductNew} alt="知乐胶囊产品实拍" className="w-full object-cover" loading="lazy" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {specs.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-white shadow-sm border border-amber-100/50">
                <p className="text-base font-bold text-orange-600 leading-tight">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/50 space-y-2.5">
            <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              产品资质与安全
            </h4>
            {[
              "香港中成药注册编号 HKC-18181，通过香港卫生署严格审批",
              "16味草本植物萃取（酸枣仁、五味子、党参等），不含褪黑素、激素",
              "无依赖，全年龄段（10岁+）可使用",
              "通过GMP认证 + 急性毒性试验 + 原材料确定性试验",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <CircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200/50">
            <div className="flex items-start gap-2.5">
              <Package className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-700">📦 香港直邮 · 预计4-7个工作日送达</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  收到胶囊后，配合1V1教练咨询方案同步调理，效果更佳。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== BONUS ===== */}
      <Section className="bg-amber-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">你还将获得</h2>
        <p className="text-slate-500 text-sm text-center mb-6">购买即赠学员专属服务</p>
        <div className="max-w-lg mx-auto">
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-amber-100/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">赠品</span>
              <h4 className="text-sm font-bold text-slate-800">📱 学员专属服务群</h4>
            </div>
            <div className="space-y-2">
              {[
                "1V1专属服用指导",
                "情绪管理干货分享",
                "专业冥想内容",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CircleCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ===== PRICE CTA ===== */}
      <section className="px-4 py-12 text-center">
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-slate-500 mb-4 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            已有 <span className="font-bold text-slate-700">200+</span> 学员通过咨询找到情绪卡点
          </p>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 shadow-sm mb-6">
            <p className="text-slate-500 text-sm line-through mb-1">原价 ¥899</p>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-4xl font-black text-orange-600">¥399</span>
              <span className="text-sm text-amber-600">限量体验价</span>
            </div>
            <p className="text-xs text-slate-500 mb-1">含1次30分钟1V1教练咨询 + 1瓶知乐胶囊 + 学员服务群</p>
            <p className="text-[11px] text-amber-600/70">体验后可升级完整身份绽放训练营（¥3980）</p>
          </div>

          {alreadyPurchased ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <Button
                onClick={handleEnterCamp}
                className="w-full h-14 text-lg font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20 border-0"
              >
                <Rocket className="w-5 h-5 mr-2" />
                进入训练营
              </Button>
              <Button
                onClick={handleViewLogistics}
                variant="outline"
                className="w-full h-11 rounded-full border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                <Truck className="w-4 h-4 mr-2" />
                查看订单与物流
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowRedeemDialog(true)}
              className="w-full max-w-xs h-14 text-lg font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20 border-0"
            >
              输入兑换码激活
            </Button>
          )}
        </div>
      </section>

      {/* ===== STICKY BOTTOM BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-white via-white/95 to-transparent pt-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={shareDialog.openDialog}
            className="shrink-0 h-11 w-11 rounded-full border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          {alreadyPurchased ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-emerald-600 font-medium">✅ 已购买</p>
                <p className="text-[10px] text-slate-400 truncate">训练营已开通</p>
              </div>
              <Button
                onClick={handleEnterCamp}
                className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20 border-0 text-sm shrink-0"
              >
                进入训练营
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400 line-through">¥899</span>
                  <span className="text-lg font-black text-orange-600">¥399</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">1V1教练咨询 + 知乐胶囊</p>
              </div>
              <Button
                onClick={() => setShowRedeemDialog(true)}
                className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20 border-0 text-sm shrink-0"
              >
                兑换码激活
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="h-20" />

      {/* 兑换码弹窗 */}
      <SynergyRedeemDialog
        open={showRedeemDialog}
        onOpenChange={setShowRedeemDialog}
        onSuccess={handleRedeemSuccess}
        isLoggedIn={!!user}
        onNeedLogin={handleRedeemNeedLogin}
      />

      {/* 分享海报弹窗 */}
      <ShareDialogBase
        open={shareDialog.isOpen}
        onOpenChange={shareDialog.setIsOpen}
        exportCardRef={shareDialog.exportCardRef}
        cardReady={shareDialog.cardReady}
        title="分享给朋友"
        shareUrl={`${window.location.origin}/promo/zhile-coach?ref=share`}
        fileName="身心诊断体验"
        shareTitle="¥399 身心诊断体验"
        shareText="30分钟1V1深度咨询，找到情绪卡点根源"
        previewCard={
          <div className="transform scale-[0.6] origin-top-left">
            <ZhileCoachShareCard onReady={shareDialog.handleCardReady} />
          </div>
        }
        exportCard={
          <ZhileCoachShareCard
            ref={shareDialog.exportCardRef}
            onReady={shareDialog.handleCardReady}
          />
        }
      />
    </div>
  );
}
