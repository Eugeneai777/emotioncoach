import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Pill, Shield, Clock, TrendingUp, Moon, Heart, Briefcase, Sprout, Sun, Users, BookOpen, Sparkles, ChevronRight, Star, Activity, CheckCircle, Package, Rocket, Truck, MessageCircle, Award, Leaf, CircleCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import zhileProductNew from "@/assets/zhile-product-new.jpg";
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

/* ========== Floating particles (warm) ========== */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
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
  { icon: Activity, label: "情绪内耗", desc: "焦虑、烦躁、压抑、易怒，明明很累却无人理解，长期情绪内耗", color: "#dc2626" },
  { icon: Heart, label: "关系紧张", desc: "夫妻沟通困难、亲密关系冷淡；亲子有代沟，不知道怎么有效沟通", color: "#e11d48" },
  { icon: Briefcase, label: "职场高压", desc: "工作压力大、内卷严重、精力不足、效率下降，担心职业发展瓶颈", color: "#9333ea" },
  { icon: Moon, label: "身心失调", desc: "失眠、多梦、易醒、注意力差、身体紧绷、长期疲劳，健康亮起黄灯", color: "#2563eb" },
  { icon: Sprout, label: "成长受阻", desc: "想学习改变，但课程太复杂、太鸡汤，缺乏专业陪伴，单纯情绪疏导无法解决身体根源", color: "#059669" },
];

/* ========== 6 Core Highlights ========== */
const coreHighlights = [
  { icon: MessageCircle, title: "AI情绪教练", subtitle: "24小时个性化陪伴", desc: "专业冥想音频 + 自动捕捉情绪 + 引导式对话 + 个人成长简报", color: "#7c3aed" },
  { icon: Award, title: "资深教练团队", subtitle: "专业护航", desc: "生命教练、心理咨询师等多元专家，平均10年+经验，擅长情绪疏导与关系修复", color: "#d97706" },
  { icon: Clock, title: "轻量打卡", subtitle: "每日15-25分钟", desc: "碎片时间即可完成，清晰打卡日历，系统自动推荐匹配个人状态的专属课程", color: "#059669" },
  { icon: Users, title: "同频成长社区", subtitle: "安全不尴尬", desc: "专属成长社区，无评判放心倾诉，智能推荐同频伙伴，告别孤独", color: "#2563eb" },
  { icon: Leaf, title: "知乐胶囊", subtitle: "草本调理根源", desc: "香港HKC-18181认证，16味草本，不含褪黑素/激素，无依赖，补心补肝益气安神", color: "#0d9488" },
  { icon: Sparkles, title: "体系化闭环", subtitle: "从知道到做到", desc: "冥想→情绪觉察→AI对话→课程学习→社区分享→草本调理→成长报告", color: "#e11d48" },
];

/* ========== Daily Loop ========== */
const dailyLoop = [
  { step: 1, icon: Sun, title: "冥想放松", desc: "专业导师录制，10-17分钟专业冥想引导，深度缓解身体紧绷、平复焦虑情绪", color: "#7c3aed" },
  { step: 2, icon: MessageCircle, title: "AI情绪教练对话", desc: "引导记录想法、识别情绪、拆解压力，给出个性化调节建议", color: "#2563eb" },
  { step: 3, icon: BookOpen, title: "每日反思", desc: "简单书写沉淀当天收获，强化改变，形成长期成长习惯", color: "#059669" },
  { step: 4, icon: Sparkles, title: "智能课程推荐", desc: "根据当天状态自动推送情绪管理、夫妻沟通、亲子教育等实用课程", color: "#d97706" },
  { step: 5, icon: Leaf, title: "知乐胶囊调理", desc: "结合当日情绪与睡眠状态，个性化服用建议，加速身心改善", color: "#0d9488" },
];

/* ========== Delivery Tiers (三层交付金字塔) ========== */
const deliveryCore = [
  { icon: "🧠", title: "AI情绪教练系统", detail: "24小时全天候陪伴，随时倾诉、精准疏导", accent: "amber" },
  { icon: "🧘", title: "7天专业冥想音频", detail: "真人录制，每天10-17分钟，深度放松身心", accent: "amber" },
  { icon: "💊", title: "知乐胶囊·草本调理", detail: "天然植物配方，从根源调理情绪与睡眠", accent: "amber" },
];
const deliveryHighlights = [
  { icon: "🎯", title: "1V1教练专属辅导", detail: "资深教练一对一，量身定制成长方案", tag: "稀缺" },
  { icon: "💡", title: "海沃塔团队研讨", detail: "犹太精英学习法，同频伙伴深度共创", tag: "特色" },
];
const deliveryBonuses = [
  { icon: "📚", title: "每日精选课程" },
  { icon: "🏘️", title: "成长社群" },
  { icon: "📊", title: "7天成长报告" },
];

/* ========== Faculty — Lead Coach ========== */
const leadCoach = {
  name: "黛汐",
  role: "总教练",
  image: coachDaixi,
  certifications: ["生命教练", "认证国际脑点执行师", "PNCC心流教练", "高级心理咨询师"],
  motto: "你不仅仅是你以为的样子",
  desc: "擅长创伤修复、人格整合、潜能激发",
};

/* ========== Faculty — Coach Team ========== */
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

/* ========== Faculty — Support Roles ========== */
const supportRoles = [
  { role: "AI情绪教练系统", desc: "24小时在线，个性化引导，自动生成成长报告", icon: "🤖" },
  { role: "知乐胶囊专业支持", desc: "产品资质、服用指导、品质保障", icon: "💊" },
];

/* ========== Testimonials ========== */
const testimonials = [
  { name: "陈先生", role: "外企部门总监·42岁", avatar: "👨‍💼", metric: "焦虑评分", before: "8.5", after: "3.0", duration: "21天", quote: "开会终于不心慌了，和老婆的沟通也缓和了很多" },
  { name: "刘先生", role: "民营企业主·38岁", avatar: "👨‍💻", metric: "睡眠时长", before: "4.5h", after: "7h", duration: "14天", quote: "知乐胶囊+冥想，睡眠改善太明显了，白天精力充沛" },
  { name: "赵先生", role: "工程项目经理·45岁", avatar: "👨", metric: "压力指数", before: "9.2", after: "4.0", duration: "30天", quote: "儿子说爸爸不再乱发脾气了，这句话值千金" },
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
      className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-b from-amber-50 to-white"
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
            <p className="text-slate-500 text-sm">你的三重陪伴成长之旅即将开始</p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-amber-200/60 shadow-sm">
              <Package className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">知乐胶囊已安排发货</p>
                <p className="text-xs text-slate-400">香港直邮，预计 4-7 个工作日送达</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">💡 建议收到胶囊后再开启训练营</p>
                <p className="text-xs text-slate-500">AI教练 + 专业教练 + 知乐胶囊同步进行，效果更佳。您也可以先进入训练营熟悉内容。</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-amber-200/60 shadow-sm">
              <Brain className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">7天有劲训练营已开通</p>
                <p className="text-xs text-slate-400">可随时进入训练营开始学习</p>
              </div>
            </div>
          </div>

          {/* 企微教练引导卡片 */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 text-center space-y-3">
            <p className="text-sm font-semibold text-emerald-700">👨‍🏫 添加助教微信，加入学员互助群</p>
            <p className="text-xs text-slate-500">获得真人教练 1v1 指导 · 参加线上冥想直播 · 学员社群互助交流</p>
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
              className="w-full h-12 text-base font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/25 border-0"
            >
              <Rocket className="w-5 h-5 mr-2" />
              进入有劲训练营
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
export default function SynergyPromoPage() {
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
          .in('package_key', ['synergy_bundle', 'camp-emotion_stress_7'])
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
          .in('camp_type', ['emotion_stress_7', 'synergy_bundle'])
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

  // Auto-redeem after login if code was cached
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
        console.error('[SynergyPromo] Auto-create camp failed:', createError);
        navigate('/camp-intro/emotion_stress_7');
        return;
      }

      await supabase
        .from('profiles')
        .update({ preferred_coach: 'emotion' })
        .eq('id', targetUserId);

      navigate(`/camp-checkin/${newCamp.id}`);
    } catch (err) {
      console.error('[SynergyPromo] Auto-enter camp error:', err);
      navigate('/camp-intro/emotion_stress_7');
    }
  };

  const handleEnterCamp = async () => {
    await autoCreateAndEnterCamp();
  };

  const handleViewLogistics = () => {
    navigate('/settings?tab=account&view=orders');
  };


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
            专为高压人群设计
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 tracking-tight text-white">
            7天有劲训练营
          </h1>

          <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            情绪解压 · 关系修复 · 身心调理<br />
            AI教练 + 专业教练 + 知乐胶囊，三重陪伴一站式解决
          </p>

          {/* Triple Engine Formula */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            {[
              { Icon: Brain, label: "AI教练" },
              { Icon: Award, label: "专业教练" },
              { Icon: Pill, label: "知乐胶囊" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-3 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm">
                <item.Icon className="w-7 h-7 text-white" />
                <span className="text-[10px] sm:text-xs text-white/90 font-medium">{item.label}</span>
              </div>
            ))}
            <span className="text-xl font-bold text-white/50">=</span>
            <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm">
              <Shield className="w-7 h-7 text-white" />
              <span className="text-[10px] sm:text-xs text-white font-medium">全面蜕变</span>
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
                输入兑换码开启训练营
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-white/60 text-xs mt-3">请先在有赞商城下单获取兑换码</p>
            </>
          )}
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-orange-50 to-transparent" />
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
                className="rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white border-0 text-xs h-8"
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
        <p className="text-slate-500 text-sm text-center mb-8"><p className="text-slate-500 text-sm text-center mb-8">高压生活中的五大隐形压力源</p></p>
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
      </Section>

      {/* ===== 6 CORE HIGHLIGHTS ===== */}
      <Section className="bg-amber-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">六大核心亮点</h2>
        <p className="text-slate-500 text-sm text-center mb-8">一站式解决，从"知道"到"做到"</p>
        <div className="grid gap-3 max-w-lg mx-auto">
          {coreHighlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-2xl bg-white shadow-sm border border-amber-100/50"
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
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">每日闭环流程</h2>
        <p className="text-slate-500 text-sm text-center mb-8">每天15-25分钟，碎片时间即可完成</p>
        <div className="max-w-lg mx-auto relative">
          {/* Vertical connector */}
          <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-amber-300/60 via-orange-300/40 to-amber-200/30" />

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
      <Section className="bg-amber-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">你将获得</h2>
        <p className="text-slate-500 text-sm text-center mb-6">核心交付 · 专属权益 · 附加福利</p>

        <div className="max-w-lg mx-auto space-y-5">
          {/* — 核心交付 — */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-base">🔥</span>
              <span className="text-xs font-bold text-amber-700 tracking-wide">核心交付 · 每天都用</span>
            </div>
            <div className="space-y-2.5">
              {deliveryCore.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white border-l-[3px] border-amber-400 shadow-sm"
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
                  <span className="absolute -top-2 -right-1 px-1.5 py-0.5 text-[9px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-sm">{item.tag}</span>
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

      {/* ===== FACULTY — Coach Section (Poster Style) ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">师资与支持力量</h2>
        <p className="text-slate-500 text-sm text-center mb-8">多元背景专家团队，全程陪伴</p>
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Lead Coach — centered poster style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full overflow-hidden border-3 border-amber-400/50 shadow-lg">
                <img src={leadCoach.image} alt={leadCoach.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg sm:text-xl font-bold text-slate-800">{leadCoach.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-300/50 font-medium">{leadCoach.role}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">绽放者联盟创始人&总教练</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {leadCoach.certifications.map((c, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/60">{c}</span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">
                  <span className="text-amber-700 font-medium">擅长：</span>{leadCoach.desc.replace('擅长', '')}
                </p>
                <p className="text-[11px] text-amber-600/80 italic">「{leadCoach.motto}」</p>
              </div>
            </div>
          </motion.div>

          {/* Coach Team — single column full cards */}
          <div className="space-y-3">
            {coachTeam.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-4 rounded-xl bg-white shadow-sm border border-amber-100/50"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full overflow-hidden border-2 border-amber-200/50 shadow-sm">
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 font-medium">{c.role}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5">{c.title}</p>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {c.certifications.map((cert, ci) => (
                        <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60">{cert}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {c.specialties.map((s, si) => (
                        <span key={si} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/40">{s}</span>
                      ))}
                    </div>
                    <p className="text-[11px] text-amber-600/80 italic">「{c.motto}」</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Support roles — compact warm */}
          <div className="grid grid-cols-2 gap-3">
            {supportRoles.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200/40"
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
      <Section className="bg-amber-50/40">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">知乐胶囊 · 草本身心调理</h2>
        <p className="text-slate-500 text-sm text-center mb-6">情绪疏导 + 身体调理，内外兼修</p>
        <div className="max-w-lg mx-auto space-y-4">
          {/* Product Image */}
          <div className="rounded-2xl overflow-hidden border border-amber-200/50 shadow-sm bg-white">
            <img src={zhileProductNew} alt="知乐胶囊产品实拍" className="w-full object-cover" loading="lazy" />
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {specs.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-white shadow-sm border border-amber-100/50">
                <p className="text-base font-bold text-orange-600 leading-tight">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Certification highlights */}
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

          {/* Usage & matching */}
          <div className="p-4 rounded-xl bg-white shadow-sm border border-amber-100/50 space-y-2.5">
            <h4 className="text-sm font-bold text-amber-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              精准匹配身心调理需求
            </h4>
            {[
              "直击「情绪内耗+睡眠差+身体疲惫」核心痛点，与训练营高度互补",
              "补心补肝、益气安神，从身体根源调理情绪与睡眠",
              "服用方便（一次4粒，一日3次），不占用额外时间",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <CircleCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* Shipping note */}
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200/50">
            <div className="flex items-start gap-2.5">
              <Package className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-700">📦 香港直邮 · 预计4-7个工作日送达</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  建议收到知乐胶囊后再开启训练营，AI教练+专业教练+草本调理同步进行，效果更佳。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== TESTIMONIALS ===== */}
      <Section>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-slate-800">真实改变，数据说话</h2>
        <p className="text-slate-500 text-sm text-center mb-8"><p className="text-slate-500 text-sm text-center mb-8">来自真实用户的反馈</p></p>
        <div className="max-w-lg mx-auto space-y-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="p-5 rounded-2xl bg-white shadow-sm border border-amber-100/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{t.avatar}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role} · 使用{t.duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 mb-3">
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
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== SLOGAN ===== */}
      <Section className="bg-amber-50/40">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium italic">
            "7天AI+专业教练+知乐胶囊三重陪伴，<br className="hidden sm:block" /><br className="hidden sm:block" />
            帮你搞定情绪、修复关系、卸下身心压力，<br className="hidden sm:block" />
            做更轻松、更稳定、更有力量的自己。"
          </p>
        </div>
      </Section>

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
                  className="w-full h-14 text-lg font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20 border-0"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  进入情绪成长训练营
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
                className="w-full max-w-xs h-14 text-lg font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20 border-0"
              >
                输入兑换码开启训练营
              </Button>
            </>
          )}
          {/* 分享按钮 */}
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
            className="shrink-0 h-11 w-11 rounded-full border-orange-200 text-orange-600 hover:bg-orange-50"
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
                className="h-11 px-6 font-bold rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20 border-0 text-sm shrink-0"
              >
                进入训练营
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">7天有劲训练营</p>
                <p className="text-[10px] text-slate-400 truncate">AI教练 + 专业教练 + 知乐胶囊</p>
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

      {/* Bottom spacer for sticky bar */}
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
        shareUrl={`${window.location.origin}/promo/synergy`}
        fileName="7天有劲训练营"
        shareTitle="7天有劲训练营"
        shareText="7天身心解压·关系修复训练方案"
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
