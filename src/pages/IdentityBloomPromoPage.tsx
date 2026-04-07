import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Pill, Shield, Clock, TrendingUp, Heart, Briefcase, Sprout, Sun, Users, BookOpen, Sparkles, ChevronRight, Star, Activity, CheckCircle, Package, Rocket, Truck, MessageCircle, Award, Leaf, CircleCheck, Share2, Target, Compass, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import zhile4BoxCover from "@/assets/zhile-4box-cover.jpg";
import wecomCoachQr from "@/assets/wecom-coach-qr.jpg";
import SynergyShareCard from "@/components/promo/SynergyShareCard";
import { SynergyRedeemDialog } from "@/components/promo/SynergyRedeemDialog";

import coachDaixi from "@/assets/coach-daixi.jpg";
import coachXiaoyi from "@/assets/coach-xiaoyi.png";
import coachAmy from "@/assets/coach-amy.jpg";
import coachMumian from "@/assets/coach-mumian.jpg";
import coachXiaojianxiong from "@/assets/coach-xiaojianxiong.jpg";
import coachBetty from "@/assets/coach-betty.jpg";
import { ShareDialogBase } from "@/components/ui/share-dialog-base";
import { useShareDialog } from "@/hooks/useShareDialog";

/* ========== Floating particles (indigo) ========== */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-indigo-300/20 animate-float"
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
  { icon: Compass, label: "身份迷失", desc: "活得像别人的影子，找不到真正的自己，不知道自己想要什么", color: "#4f46e5" },
  { icon: Shield, label: "不敢拒绝", desc: "总在看别人脸色，不敢表达真实想法，习惯性讨好和妥协", color: "#7c3aed" },
  { icon: Activity, label: "反复打回原形", desc: "想改变却陷入旧模式，越努力越挫败，缺乏系统方法", color: "#9333ea" },
  { icon: Heart, label: "底气不足", desc: "总觉得自己不够好，怎么努力都没有安全感和价值感", color: "#6366f1" },
  { icon: Flame, label: "身心告警", desc: "压力山大，身体和情绪都在报警，精力持续下降", color: "#dc2626" },
  { icon: Target, label: "迷茫没方向", desc: "事业到了瓶颈期，不知道下一步该怎么走，缺乏突破的勇气", color: "#2563eb" },
];

/* ========== 4 Stages Timeline ========== */
const stages = [
  {
    stage: 1, title: "我知道我是谁", color: "#4f46e5",
    lessons: ["不知道自己是谁，怎么活得精彩", "知道自己是谁，是改变的内核", "在自己的故事里发光", "谁能告诉我，我到底是谁"],
  },
  {
    stage: 2, title: "自主生命，自主成长", color: "#059669",
    lessons: ["重构城墙，是对自己的尊荣", "唤醒内在力量感", "系统清理生命空间", "散落和隐藏的回归"],
  },
  {
    stage: 3, title: "突破迷雾，走出困境", color: "#d97706",
    lessons: ["识别限制性信念", "打破思维惯性", "建立新的行为模式", "从受害者到创造者"],
  },
  {
    stage: 4, title: "转化困境，绽放生命", color: "#e11d48",
    lessons: ["将伤痛转化为力量", "活出真实的自己", "建立深度连接", "成为自己生命的主人"],
  },
];

/* ========== 6 Core Highlights ========== */
const coreHighlights = [
  { icon: Award, title: "资深教练团队", subtitle: "专业护航", desc: "生命教练、心理咨询师等多元专家，平均10年+经验，擅长身份重建与潜能激发", color: "#d97706" },
  { icon: BookOpen, title: "16节音频课", subtitle: "4阶段系统学习", desc: "从认识自己到绽放生命，每阶段4节课+4次教练课，循序渐进", color: "#7c3aed" },
  { icon: Users, title: "同频成长社区", subtitle: "安全不评判", desc: "专属成长社区，无评判放心倾诉，与同频伙伴深度共创", color: "#2563eb" },
  { icon: Leaf, title: "知乐胶囊（4瓶）", subtitle: "草本调理根源", desc: "香港HKC-18181认证，16味草本，补心补肝益气安神，从身体根源支持蜕变", color: "#0d9488" },
  { icon: Sparkles, title: "体系化闭环", subtitle: "从知道到做到", desc: "音频课→教练辅导→社区共创→草本调理→成长报告", color: "#e11d48" },
];

/* ========== Daily Loop ========== */
const dailyLoop = [
  { step: 1, icon: Sun, title: "音频课学习", desc: "每天一节身份觉醒音频课，10-15分钟深度学习，系统重建自我认知", color: "#4f46e5" },
  { step: 2, icon: Award, title: "专业教练辅导", desc: "资深教练小组辅导，针对性解决身份认同与关系问题", color: "#d97706" },
  { step: 3, icon: BookOpen, title: "反思与沉淀", desc: "书写当天收获，强化新认知，形成持续成长的正向循环", color: "#059669" },
  { step: 4, icon: Leaf, title: "知乐胶囊调理", desc: "草本配方从身体层面支持情绪稳定与精力恢复，内外兼修", color: "#0d9488" },
];

/* ========== Delivery Tiers ========== */
const deliveryCore = [
  { icon: "🎧", title: "16节专业音频课", detail: "4阶段系统课程，从「我是谁」到「绽放生命」", accent: "indigo" },
  { icon: "💊", title: "知乐胶囊·4瓶", detail: "天然植物配方，从身体根源调理情绪与精力", accent: "indigo" },
];
const deliveryHighlights = [
  { icon: "🎯", title: "资深教练小组辅导", detail: "量身定制身份重建方案", tag: "稀缺" },
];
const deliveryBonuses = [
  { icon: "🔄", title: "免费复训" },
  { icon: "🏘️", title: "成长社群" },
];

/* ========== Faculty ========== */
const leadCoach = {
  name: "黛汐",
  role: "总教练",
  image: coachDaixi,
  certifications: ["生命教练", "认证国际脑点执行师", "PNCC心流教练", "高级心理咨询师"],
  motto: "你不仅仅是你以为的样子",
  desc: "擅长创伤修复、人格整合、潜能激发",
};

const coachTeam = [
  {
    name: "晓一", role: "教练",
    title: "绽放者联盟生命教练",
    certifications: ["特教音乐疗愈师", "青少年足球教练", "德国TJ发型设计深圳总监"],
    specialties: ["婚姻家庭", "个人成长", "情绪管理", "人际沟通"],
    motto: "人不是被教导的，而是被启示的",
    image: coachXiaoyi,
  },
  {
    name: "肖剑雄", role: "教练",
    title: "绽放者联盟发展运营合伙人",
    certifications: ["心理教练"],
    specialties: ["婚姻关系", "亲子关系", "职业焦虑", "生命成长"],
    motto: "倾听、陪伴、觉察，升维",
    image: coachXiaojianxiong,
  },
  {
    name: "Amy", role: "教练",
    title: "绽放联盟教练 · 中国社科院经济学研究生",
    certifications: ["生命绽放教练", "心理咨询师", "家庭教育指导师"],
    specialties: ["情感困惑", "亲子关系", "身心疗愈"],
    motto: "全情陪伴，滋养生命",
    image: coachAmy,
  },
  {
    name: "木棉", role: "教练",
    title: "企业人力资源管理顾问",
    certifications: ["心理咨询师", "格森自然疗法教练", "补水自然疗法教练", "芳香治疗师"],
    specialties: ["身心互动整体疗愈", "身心灵排毒", "细胞激活"],
    motto: "流水不争先，争的是滔滔不绝",
    image: coachMumian,
  },
  {
    name: "贝蒂", role: "教练",
    title: "绽放者联盟教练",
    certifications: ["国家二级教师", "心理咨询师", "天赋测评&分析师"],
    specialties: ["个人生命重建", "亲密关系", "亲子关系"],
    motto: "陪伴你，看见自己的美好",
    image: coachBetty,
  },
];

const supportRoles = [
  { role: "知乐胶囊专业支持", desc: "产品资质、服用指导、品质保障", icon: "💊" },
];

/* ========== Testimonials ========== */
const testimonials = [
  { quote: "告别了一味迎合家人和朋友的日子，终于敢做真实的自己，现在每天都过得很舒展，内心的安宁和幸福，是以前从未体会过的。" },
  { quote: "疗愈了原生家庭的创伤，不再自我否定，慢慢接纳了不完美的自己，每一次突破自己的舒适区，都收获满满的成就感，这种感觉太踏实了。" },
  { quote: "以前总在模仿别人的生活，拼尽全力却一点都不快乐，学完课程后放下迎合，专注做自己喜欢的事，虽然慢，但每一步都有收获，幸福感和成就感都藏在点滴里。" },
  { quote: "不再压抑自己的想法，学会了勇敢表达，现在不管是工作还是生活，都能跟着本心走，不仅收获了同事和朋友的认可，更收获了自我认同的成就感，每天都很开心。" },
  { quote: "打破了自我内耗的怪圈，活成了自己喜欢的样子，不用再为别人的眼光而焦虑，内心的幸福感油然而生，这种从心而发的满足，比任何外在的认可都重要。" },
  { quote: "在课程中找到真实的自己，锚定了自己的人生方向，现在在专属的赛道上慢慢努力，每一次小小的进步，都让我充满成就感，这种为自己而活的感觉，真的太美好了。" },
];

/* ========== Product specs ========== */
const specs = [
  { label: "每瓶", value: "84粒" },
  { label: "每日用量", value: "3次" },
  { label: "持续天数", value: "28天" },
  { label: "核心成分", value: "16味草本" },
];

/* ========== Success Panel ========== */
function SuccessPanel({ onEnterCamp, onViewLogistics }: { onEnterCamp: () => void; onViewLogistics: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-b from-indigo-50 to-white"
    >
      <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">🎉 购买成功！</h2>
            <p className="text-slate-500 text-sm">你的身份绽放之旅即将开始</p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-indigo-200/60 shadow-sm">
              <Package className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">知乐胶囊（4瓶）已安排发货</p>
                <p className="text-xs text-slate-400">香港直邮，预计 4-7 个工作日送达</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200/60">
              <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-800">💡 建议收到胶囊后再开启训练营</p>
                <p className="text-xs text-slate-500">专业教练 + 知乐胶囊同步进行，效果更佳。您也可以先进入训练营熟悉内容。</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-indigo-200/60 shadow-sm">
              <Brain className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">身份绽放训练营已开通</p>
                <p className="text-xs text-slate-400">可随时进入训练营开始学习</p>
              </div>
            </div>
          </div>

          {/* 企微教练引导卡片 */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 text-center space-y-3">
            <p className="text-sm font-semibold text-emerald-700">👨‍🏫 添加助教微信，加入学员互助群</p>
            <p className="text-xs text-slate-500">获得真人教练 1v1 指导 · 参加线上研讨 · 学员社群互助交流</p>
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <img src={wecomCoachQr} alt="助教企微二维码" className="w-48 h-48 object-contain" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">长按识别二维码添加</p>
          </div>

          <div className="space-y-3 pt-2 pb-[env(safe-area-inset-bottom)]">
            <Button
              onClick={onEnterCamp}
              className="w-full h-12 text-base font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 border-0"
            >
              <Rocket className="w-5 h-5 mr-2" />
              进入身份绽放训练营
            </Button>
            <Button
              onClick={onViewLogistics}
              variant="outline"
              className="w-full h-10 text-sm rounded-full border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <Truck className="w-4 h-4 mr-2" />
              查看订单与物流
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ========== Main Page ========== */
export default function IdentityBloomPromoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [_purchaseChecked, setPurchaseChecked] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [pendingRedeemCode, setPendingRedeemCode] = useState<string | null>(null);
  const shareDialog = useShareDialog();

  useEffect(() => {
    const checkPurchase = async () => {
      if (!user) {
        setPurchaseChecked(true);
        return;
      }
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .in('package_key', ['identity_bloom'])
          .eq('status', 'paid')
          .limit(1);

        if (orderData && orderData.length > 0) {
          setAlreadyPurchased(true);
          setPurchaseChecked(true);
          return;
        }

        const { data: campData } = await supabase
          .from('user_camp_purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('camp_type', 'identity_bloom')
          .eq('payment_status', 'completed')
          .limit(1);

        if (campData && campData.length > 0) {
          setAlreadyPurchased(true);
        }
      } catch (e) {
        console.error('Check purchase error:', e);
      }
      setPurchaseChecked(true);
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
    setPostAuthRedirect(window.location.pathname + window.location.search);
    setShowRedeemDialog(false);
    navigate('/auth');
  };

  const handleRedeemSuccess = () => {
    setAlreadyPurchased(true);
    handleEnterCamp();
  };

  const autoCreateAndEnterCamp = async (overrideUserId?: string) => {
    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) {
      navigate('/camp-intro/identity_bloom');
      return;
    }

    try {
      const { data: existingCamp } = await supabase
        .from('training_camps')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('camp_type', 'identity_bloom')
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
        .eq('camp_type', 'identity_bloom')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const durationDays = template?.duration_days || 28;
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + (durationDays - 1) * 86400000).toISOString().split('T')[0];

      const { data: newCamp, error: createError } = await supabase
        .from('training_camps')
        .insert({
          user_id: targetUserId,
          camp_type: 'identity_bloom',
          camp_name: '身份绽放训练营',
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
        console.error('[IdentityBloomPromo] Auto-create camp failed:', createError);
        navigate('/camp-intro/identity_bloom');
        return;
      }

      await supabase
        .from('profiles')
        .update({ preferred_coach: 'identity' })
        .eq('id', targetUserId);

      navigate(`/camp-checkin/${newCamp.id}`);
    } catch (err) {
      console.error('[IdentityBloomPromo] Auto-enter camp error:', err);
      navigate('/camp-intro/identity_bloom');
    }
  };

  const handleEnterCamp = async () => {
    await autoCreateAndEnterCamp();
  };

  const handleViewLogistics = () => {
    navigate('/settings?tab=account&view=orders');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-violet-50/30 to-white text-slate-800 overflow-x-hidden">

      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-600 to-indigo-800">
        <Particles />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs mb-6">
            <Shield className="w-3.5 h-3.5" />
            找回真实的自己 · 活出生命的力量
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 tracking-tight text-white">
            身份绽放训练营
          </h1>

          <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-6 max-w-md mx-auto">
            身份重建 · 潜能激发 · 身心蜕变<br />
            专业教练 + 知乐胶囊，双重陪伴系统蜕变
          </p>

          {/* Price Display */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
            <span className="text-white/60 text-sm line-through">原价 ¥5280</span>
            <span className="text-2xl font-black text-white">¥3980</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">省¥1300</span>
          </div>

          {/* Triple Engine Formula */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            {[
              { Icon: Award, label: "专业教练" },
              { Icon: Pill, label: "知乐胶囊×4" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-3 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm">
                <item.Icon className="w-7 h-7 text-white" />
                <span className="text-[10px] sm:text-xs text-white/90 font-medium">{item.label}</span>
              </div>
            ))}
            <span className="text-xl font-bold text-white/50">=</span>
            <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm">
              <Sparkles className="w-7 h-7 text-white" />
              <span className="text-[10px] sm:text-xs text-white font-medium">身份绽放</span>
            </div>
          </div>

          {alreadyPurchased ? (
            <>
              <Button
                onClick={handleEnterCamp}
                className="h-12 px-8 text-base font-bold rounded-full bg-white text-indigo-600 hover:bg-white/90 shadow-lg shadow-black/10 border-0"
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
                className="h-12 px-8 text-base font-bold rounded-full bg-white text-indigo-600 hover:bg-white/90 shadow-lg shadow-black/10 border-0"
              >
                立即报名，开启蜕变
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-white/60 text-xs mt-3">请先在有赞商城下单获取兑换码</p>
            </>
          )}
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-50 to-transparent" />
      </section>

      {/* ===== QUICK ACCESS FOR PURCHASED USERS ===== */}
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
                <p className="text-sm font-semibold text-emerald-700">已购买此套餐</p>
                <p className="text-xs text-slate-500">可随时进入训练营学习</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleViewLogistics}
                variant="outline"
                size="sm"
                className="rounded-full border-slate-300 text-slate-600 hover:bg-slate-50 text-xs h-8"
              >
                <Truck className="w-3.5 h-3.5 mr-1" />
                订单
              </Button>
              <Button
                onClick={handleEnterCamp}
                size="sm"
                className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 text-xs h-8"
              >
                <Rocket className="w-3.5 h-3.5 mr-1" />
                进入训练营
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== PAIN POINTS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">你是否正在经历？</h2>
        <p className="text-slate-500 text-sm text-center mb-8">身份迷失带来的六大困境</p>
        <div className="grid gap-3 max-w-lg mx-auto">
          {painPoints.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-white shadow-sm border border-indigo-100/50"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p.color}10` }}>
                <p.icon className="w-5 h-5" style={{ color: p.color }} />
              </div>
              <div>
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.label}</span>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-indigo-600 font-medium mt-6"
        >
          💜 这不是你的错，而是身份认知的迷雾。改变，从认识自己开始。
        </motion.p>
      </Section>

      {/* ===== 4-STAGE TIMELINE ===== */}
      <Section className="bg-indigo-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">四阶段系统蜕变</h2>
        <p className="text-slate-500 text-sm text-center mb-8">16节音频课 + 16次教练课，循序渐进</p>
        <div className="max-w-lg mx-auto space-y-4">
          {stages.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-2xl bg-white shadow-sm border border-indigo-100/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: s.color }}>
                  {s.stage}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{s.title}</h3>
                  <p className="text-[10px] text-slate-400">4节音频课 + 4次教练课</p>
                </div>
              </div>
              <div className="space-y-1.5 pl-[52px]">
                {s.lessons.map((l, li) => (
                  <div key={li} className="flex items-start gap-2">
                    <CircleCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: s.color }} />
                    <p className="text-xs text-slate-600 leading-relaxed">{l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== 6 CORE HIGHLIGHTS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">六大核心亮点</h2>
        <p className="text-slate-500 text-sm text-center mb-8">一站式解决，从"迷失"到"绽放"</p>
        <div className="grid gap-3 max-w-lg mx-auto">
          {coreHighlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-2xl bg-white shadow-sm border border-indigo-100/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${h.color}10` }}>
                  <h.icon className="w-5 h-5" style={{ color: h.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{h.title}</h3>
                  <p className="text-xs text-slate-500">{h.subtitle}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-[52px]">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== DAILY LOOP ===== */}
      <Section className="bg-indigo-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">每日学习流程</h2>
        <p className="text-slate-500 text-sm text-center mb-8">系统化闭环，每天都在进步</p>
        <div className="max-w-lg mx-auto relative">
          <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-300/60 via-violet-300/40 to-indigo-200/30" />
          <div className="space-y-0">
            {dailyLoop.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 py-3 relative"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-2 bg-white shadow-sm"
                  style={{ borderColor: `${d.color}40` }}
                >
                  <d.icon className="w-5 h-5" style={{ color: d.color }} />
                </div>
                <div className="pt-1 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: d.color }}>
                      {d.step}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{d.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{d.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== 你将获得 — 三层交付金字塔 ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">你将获得</h2>
        <p className="text-slate-500 text-sm text-center mb-6">核心交付 · 专属权益 · 附加福利</p>

        <div className="max-w-lg mx-auto space-y-5">
          {/* — 核心交付 — */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-base">🔥</span>
              <span className="text-xs font-bold text-indigo-700 tracking-wide">核心交付 · 每天都用</span>
            </div>
            <div className="space-y-2.5">
              {deliveryCore.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white border-l-[3px] border-indigo-400 shadow-sm"
                >
                  <span className="text-2xl mt-0.5 shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* — 专属亮点 — */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-base">⭐</span>
              <span className="text-xs font-bold text-violet-700 tracking-wide">专属亮点 · 高价值稀缺</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {deliveryHighlights.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-3.5 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/60 shadow-sm"
                >
                  <span className="absolute -top-2 -right-1 px-1.5 py-0.5 text-[9px] font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-sm">{item.tag}</span>
                  <span className="text-2xl block mb-1.5">{item.icon}</span>
                  <h4 className="text-sm font-bold text-slate-800 mb-0.5">{item.title}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* — 附加权益 — */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">🎁</span>
              <span className="text-xs font-bold text-slate-500 tracking-wide">附加权益</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {deliveryBonuses.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 bg-white/80 border border-slate-200/60 rounded-full shadow-sm">
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ===== FACULTY ===== */}
      <Section className="bg-indigo-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">师资与支持力量</h2>
        <p className="text-slate-500 text-sm text-center mb-8">多元背景专家团队，全程陪伴</p>
        <div className="max-w-lg mx-auto space-y-6">
          {/* Lead Coach */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/60 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full overflow-hidden border-3 border-indigo-400/50 shadow-lg">
                <img src={leadCoach.image} alt={leadCoach.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg sm:text-xl font-bold text-slate-800">{leadCoach.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 border border-indigo-300/50 font-medium">{leadCoach.role}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">绽放者联盟创始人&总教练</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {leadCoach.certifications.map((c, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/60">{c}</span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">
                  <span className="text-indigo-700 font-medium">擅长：</span>{leadCoach.desc.replace('擅长', '')}
                </p>
                <p className="text-[11px] text-indigo-600/80 italic">「{leadCoach.motto}」</p>
              </div>
            </div>
          </motion.div>

          {/* Coach Team */}
          <div className="space-y-3">
            {coachTeam.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-4 rounded-xl bg-white shadow-sm border border-indigo-100/50"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full overflow-hidden border-2 border-indigo-200/50 shadow-sm">
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50 font-medium">{c.role}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5">{c.title}</p>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {c.certifications.map((cert, ci) => (
                        <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60">{cert}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {c.specialties.map((s, si) => (
                        <span key={si} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/40">{s}</span>
                      ))}
                    </div>
                    <p className="text-[11px] text-indigo-600/80 italic">「{c.motto}」</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Support roles */}
          <div className="grid grid-cols-2 gap-3">
            {supportRoles.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/40"
              >
                <span className="text-xl shrink-0">{s.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">{s.role}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== CAPSULE DETAILS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">知乐胶囊 · 草本身心调理</h2>
        <p className="text-slate-500 text-sm text-center mb-2">本训练营包含 <span className="font-bold text-indigo-600">4瓶</span> 知乐胶囊</p>
        <p className="text-slate-400 text-xs text-center mb-6">身份蜕变 + 身体调理，内外兼修</p>
        <div className="max-w-lg mx-auto space-y-4">
          <div className="rounded-2xl overflow-hidden border border-indigo-200/50 shadow-sm bg-white">
            <img src={zhileProductNew} alt="知乐胶囊产品实拍" className="w-full object-cover" loading="lazy" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {specs.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-white shadow-sm border border-indigo-100/50">
                <p className="text-base font-bold text-indigo-600 leading-tight">{s.value}</p>
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
              "无依赖，全年龄段（10岁+）可使用，哺乳期也适用",
              "通过GMP认证 + 急性毒性试验 + 原材料确定性试验",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <CircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-white shadow-sm border border-indigo-100/50 space-y-2.5">
            <h4 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              精准匹配身心蜕变需求
            </h4>
            {[
              "直击「精力不足+睡眠差+情绪波动」核心痛点，与训练营高度互补",
              "补心补肝、益气安神，从身体根源支持身份蜕变过程",
              "服用方便（一次4粒，一日3次），不占用额外时间",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <CircleCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200/50">
            <div className="flex items-start gap-2.5">
              <Package className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-indigo-700">📦 香港直邮 · 预计4-7个工作日送达</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  建议收到知乐胶囊后再开启训练营，AI教练+专业教练+草本调理同步进行，效果更佳。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== TESTIMONIALS ===== */}
      <Section className="bg-indigo-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">真实改变，数据说话</h2>
        <p className="text-slate-500 text-sm text-center mb-8">来自真实用户的反馈</p>
        <div className="max-w-lg mx-auto space-y-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="p-5 rounded-2xl bg-white shadow-sm border border-indigo-100/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{t.avatar}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role} · 使用{t.duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/60 mb-3">
                <div className="text-center">
                  <p className="text-xs text-slate-500">{t.metric}</p>
                  <p className="text-lg font-bold text-red-500">{t.before}</p>
                  <p className="text-[10px] text-slate-400">使用前</p>
                </div>
                <div className="flex-1 flex justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">{t.metric}</p>
                  <p className="text-lg font-bold text-emerald-500">{t.after}</p>
                  <p className="text-[10px] text-slate-400">使用后</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 italic">"{t.quote}"</p>
              <div className="flex gap-0.5 mt-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== VALUE RECAP & SLOGAN ===== */}
      <Section>
        <div className="max-w-lg mx-auto text-center space-y-6">
          {/* Value summary */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/60">
            <h3 className="text-lg font-bold text-slate-800 mb-4">¥3980 你将获得</h3>
            <div className="grid grid-cols-2 gap-2 text-left mb-4">
              {[
                { icon: "🎧", text: "16节音频课" },
                { icon: "👨‍🏫", text: "16次教练课" },
                { icon: "🤖", text: "AI身份教练" },
                { icon: "💊", text: "知乐胶囊×4瓶" },
                { icon: "💡", text: "海沃塔研讨" },
                { icon: "🏘️", text: "成长社群" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/80">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-medium text-slate-700">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-slate-400 text-sm line-through">原价 ¥5280</span>
              <span className="text-2xl font-black text-indigo-600">¥3980</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">省¥1300</span>
            </div>
          </div>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium italic">
            "从迷失到绽放，从不敢到勇敢，<br />
            AI教练+专业教练+知乐胶囊三重陪伴，<br />
            帮你找回真实的自己，活出生命的力量。"
          </p>
        </div>
      </Section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="px-4 py-12 text-center">
        <div className="max-w-lg mx-auto">
          {alreadyPurchased ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-sm mb-6">
                <CheckCircle className="w-4 h-4" />
                您已购买此套餐
              </div>
              <div className="space-y-3 max-w-xs mx-auto">
                <Button
                  onClick={handleEnterCamp}
                  className="w-full h-14 text-lg font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 border-0"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  进入身份绽放训练营
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
            </>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-4">在有赞商城下单后，使用兑换码激活训练营</p>
              <Button
                onClick={() => setShowRedeemDialog(true)}
                className="w-full max-w-xs h-14 text-lg font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 border-0"
              >
                立即下单，锁定席位
              </Button>
            </>
          )}
          <button
            onClick={shareDialog.openDialog}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            分享给朋友
          </button>
        </div>
      </section>

      {/* ===== STICKY BOTTOM BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-white via-white/95 to-transparent pt-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={shareDialog.openDialog}
            className="shrink-0 h-11 w-11 rounded-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          {alreadyPurchased ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-emerald-600 font-medium">✅ 已购买</p>
                <p className="text-[10px] text-slate-400 truncate">训练营已开通 · 知乐胶囊配送中</p>
              </div>
              <Button
                onClick={handleEnterCamp}
                className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 border-0 text-sm shrink-0"
              >
                进入训练营
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">身份绽放训练营</p>
                <p className="text-[10px] text-slate-400 truncate">¥3980 · AI教练+专业教练+知乐胶囊×4</p>
              </div>
              <Button
                onClick={() => setShowRedeemDialog(true)}
                className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 border-0 text-sm shrink-0"
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
        shareUrl={`${window.location.origin}/promo/identity-bloom`}
        fileName="身份绽放训练营"
        shareTitle="身份绽放训练营"
        shareText="找回真实的自己·活出生命的力量"
        previewCard={
          <div className="transform scale-[0.6] origin-top-left">
            <SynergyShareCard onReady={shareDialog.handleCardReady} />
          </div>
        }
        exportCard={
          <SynergyShareCard
            ref={shareDialog.exportCardRef}
            onReady={shareDialog.handleCardReady}
          />
        }
      />
    </div>
  );
}
