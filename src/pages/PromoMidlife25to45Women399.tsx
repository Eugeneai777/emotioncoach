import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import {
  Lock, MessageCircle, Quote, Users, Pill, Heart, Clock, Gem,
  ClipboardList, Award, Video, EyeOff, Truck, Package, Rocket, CheckCircle, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import { PromoFloatingBackButton } from "@/components/promo/PromoFloatingBackButton";
import { SynergyRedeemDialog } from "@/components/promo/SynergyRedeemDialog";
import { trackEvent } from "@/lib/behaviorTracker";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import coachDaixi from "@/assets/coach-daixi.jpg";
import coachXiaoyi from "@/assets/coach-xiaoyi.png";
import coachAmy from "@/assets/coach-amy.jpg";
import coachMumian from "@/assets/coach-mumian.jpg";
import coachXiaojianxiong from "@/assets/coach-xiaojianxiong.jpg";
import coachBetty from "@/assets/coach-betty.jpg";
import wecomCoachQr from "@/assets/wecom-coach-qr.jpg";
import zhileCapsules from "@/assets/zhile-capsules.jpeg";

/**
 * 35+ 女性 ¥399 「7 天身心舒展营」售前页
 * 路由：/promo/midlife-women-399
 * 业务逻辑对齐 /promo/synergy（男版）：未登录→登录、未购→兑换码、已购→自动建营进入打卡
 */

const RETURN_URL = "/promo/midlife-women-399";
const PRICE = 399;
const ORIGINAL_PRICE = 688;
const TOTAL_SECTIONS = 9;

// 女性版有赞 SKU 链接
const WOMEN_YOUZAN_URL =
  "https://tuicashier.youzan.com/pay/wscgoods_order?banner_id=uc.129613790~recService.1~3~feGjbidV&alg=common_by_shop.recall_filter%2Cesmm_1013.1.classify%2C0.0.0.0.0.0.0.0.0.0_3cee4ac0d9ca4726b974ec14e33c3713&reft=1779336612102&spm=uc.129613790&alias=3nfyjsg6yhbbdas";

// 女性教练优先排序
const COACH_TEAM = [
  { name: "黛汐", role: "总教练", image: coachDaixi, subtitle: "生命教练 / 高级心理咨询师" },
  { name: "晓一", role: "资深教练", image: coachXiaoyi, subtitle: "婚姻家庭 / 情绪管理" },
  { name: "Amy", role: "资深教练", image: coachAmy, subtitle: "情感困惑 / 亲子关系" },
  { name: "木棉", role: "资深教练", image: coachMumian, subtitle: "身心整体疗愈" },
  { name: "贝蒂", role: "资深教练", image: coachBetty, subtitle: "亲密关系 / 生命重建" },
  { name: "肖剑雄", role: "资深教练", image: coachXiaojianxiong, subtitle: "婚姻关系 / 职业焦虑" },
];

const C = {
  bg: "#fdfaf6",
  bgSoft: "#f7f0e8",
  bgCard: "#ffffff",
  primary: "#c97b8a",
  primarySoft: "#e8b4bc",
  accent: "#8b6f47",
  text: "#3d2e2a",
  textMute: "#8a7a73",
  divider: "rgba(201,123,138,0.22)",
};

const serif = { fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif', fontWeight: 500 };

function Section({
  index, total = TOTAL_SECTIONS, eyebrow, title, children,
}: {
  index: number; total?: number; eyebrow?: string; title: string; children: React.ReactNode;
}) {
  const num = `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="px-6 py-10"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs tracking-[0.2em] font-mono" style={{ color: C.primary }}>{num}</span>
        <div className="flex-1 h-px" style={{ background: C.divider }} />
      </div>
      {eyebrow && (
        <p className="text-xs tracking-widest mb-2" style={{ color: C.accent }}>{eyebrow}</p>
      )}
      <h2 className="text-[22px] mb-5" style={{ ...serif, color: C.text, lineHeight: 1.5, fontWeight: 600 }}>
        {title}
      </h2>
      <div style={{ color: C.text }}>{children}</div>
    </motion.section>
  );
}

/* ========== 已购成功面板（玫瑰版） ========== */
function SuccessPanel({ onEnterCamp, onViewLogistics }: { onEnterCamp: () => void; onViewLogistics: () => void; }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{ background: C.bg }}
    >
      <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.primarySoft})`,
              boxShadow: `0 8px 24px ${C.primary}40`,
            }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: "#fff" }} />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ ...serif, color: C.text }}>🎉 加入成功</h2>
            <p className="text-sm" style={{ color: C.textMute }}>你的 7 天身心舒展营即将开始</p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}>
              <Package className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.primary }} />
              <div>
                <p className="text-sm font-medium" style={{ color: C.text }}>知乐胶囊已安排发货</p>
                <p className="text-xs" style={{ color: C.textMute }}>顺丰匿名包装，预计 4-7 个工作日送达</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${C.primarySoft}1c`, border: `1px solid ${C.divider}` }}>
              <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.primary }} />
              <div>
                <p className="text-sm font-medium" style={{ color: C.primary }}>💡 建议收到胶囊后再正式开启</p>
                <p className="text-xs mt-1" style={{ color: C.textMute }}>AI 教练 + 真人教练 + 草本调理同步进行，效果更佳。也可以先进入熟悉内容。</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}>
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.primary }} />
              <div>
                <p className="text-sm font-medium" style={{ color: C.text }}>7 天身心舒展营已开通</p>
                <p className="text-xs" style={{ color: C.textMute }}>可随时进入开始学习</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl text-center space-y-3" style={{ background: `${C.primarySoft}22`, border: `1px solid ${C.primary}` }}>
            <p className="text-sm font-semibold" style={{ ...serif, color: C.primary }}>👩‍🏫 添加助教企微，加入女性学员群</p>
            <p className="text-xs" style={{ color: C.textMute }}>真人女教练 1v1 指导 · 线上冥想直播 · 学员私密互助</p>
            <div className="flex justify-center">
              <div className="p-3 rounded-xl" style={{ background: "#fff" }}>
                <img src={wecomCoachQr} alt="助教企微二维码" className="w-48 h-48 object-contain" />
              </div>
            </div>
            <p className="text-[10px]" style={{ color: C.accent }}>长按识别二维码添加</p>
          </div>

          <div className="space-y-3 pt-2 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={onEnterCamp}
              className="w-full h-12 rounded-full text-base font-bold flex items-center justify-center gap-2 transition active:scale-[0.98]"
              style={{ background: C.primary, color: "#fff", boxShadow: `0 8px 24px ${C.primary}40` }}
            >
              <Rocket className="w-5 h-5" />
              进入 7 天身心舒展营
            </button>
            <button
              onClick={onViewLogistics}
              className="w-full h-10 rounded-full text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
              style={{ background: "transparent", color: C.text, border: `1px solid ${C.divider}` }}
            >
              <Truck className="w-4 h-4" />
              查看订单与物流
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PromoMidlife25to45Women399() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [purchaseChecked, setPurchaseChecked] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [showSuccessPanel, setShowSuccessPanel] = useState(false);
  const [pendingRedeemCode, setPendingRedeemCode] = useState<string | null>(null);

  // 已购检测：orders + user_camp_purchases 双查（对齐男版）
  useEffect(() => {
    const checkPurchase = async () => {
      if (!user) { setPurchaseChecked(true); return; }
      try {
        const { data: orderData } = await supabase
          .from("orders").select("id").eq("user_id", user.id)
          .in("package_key", ["synergy_bundle", "camp-emotion_stress_7"])
          .eq("status", "paid").limit(1);
        if (orderData && orderData.length > 0) {
          setAlreadyPurchased(true); setPurchaseChecked(true); return;
        }
        const { data: campData } = await supabase
          .from("user_camp_purchases").select("id").eq("user_id", user.id)
          .in("camp_type", ["emotion_stress_7", "synergy_bundle"])
          .eq("payment_status", "completed").limit(1);
        if (campData && campData.length > 0) setAlreadyPurchased(true);
      } catch (e) { console.error("Check purchase error:", e); }
      setPurchaseChecked(true);
    };
    checkPurchase();
  }, [user]);

  // 登录后自动续兑
  useEffect(() => {
    if (user && pendingRedeemCode) {
      setPendingRedeemCode(null);
      setShowRedeemDialog(true);
    }
  }, [user, pendingRedeemCode]);

  const handleRedeemNeedLogin = (code: string) => {
    setPendingRedeemCode(code);
    localStorage.setItem("pending_redeem_code", code);
    setPostAuthRedirect(window.location.pathname + window.location.search);
    navigate("/auth");
    setShowRedeemDialog(false);
  };

  const handleRedeemSuccess = () => {
    setAlreadyPurchased(true);
    setShowSuccessPanel(true);
  };

  const autoCreateAndEnterCamp = async () => {
    if (!user?.id) { navigate("/promo/midlife-women-399"); return; }
    try {
      const { data: existingCamp } = await supabase
        .from("training_camps").select("id")
        .eq("user_id", user.id).eq("camp_type", "emotion_stress_7")
        .eq("status", "active").limit(1).maybeSingle();
      if (existingCamp) { navigate(`/camp-checkin/${existingCamp.id}`); return; }

      const { data: template } = await supabase
        .from("camp_templates").select("duration_days")
        .eq("camp_type", "emotion_stress_7").eq("is_active", true)
        .limit(1).maybeSingle();
      const durationDays = template?.duration_days || 7;
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = new Date(today.getTime() + (durationDays - 1) * 86400000).toISOString().split("T")[0];

      const { data: newCamp, error: createError } = await supabase
        .from("training_camps").insert({
          user_id: user.id, camp_type: "emotion_stress_7",
          camp_name: "7 天身心舒展营",
          duration_days: durationDays, start_date: startDate, end_date: endDate,
          current_day: 1, completed_days: 0, check_in_dates: [], status: "active",
        }).select("id").single();
      if (createError || !newCamp) { console.error("Auto-create failed:", createError); return; }

      await supabase.from("profiles").update({ preferred_coach: "emotion" }).eq("id", user.id);
      navigate(`/camp-checkin/${newCamp.id}`);
    } catch (err) { console.error("Auto-enter camp error:", err); }
  };

  const handleEnterCamp = () => { autoCreateAndEnterCamp(); };
  const handleViewLogistics = () => navigate("/settings?tab=account&view=orders");

  const handlePrimaryCTA = () => {
    trackEvent("women_synergy_cta_click", { already_purchased: alreadyPurchased });
    if (!user) {
      setPostAuthRedirect(RETURN_URL);
      navigate(`/auth?redirect=${encodeURIComponent(RETURN_URL)}`);
      return;
    }
    if (alreadyPurchased) { handleEnterCamp(); return; }
    setShowRedeemDialog(true);
  };

  const handleConsult = () => navigate("/customer-support");

  if (showSuccessPanel) {
    return <SuccessPanel onEnterCamp={handleEnterCamp} onViewLogistics={handleViewLogistics} />;
  }

  return (
    <div className="min-h-screen w-full" style={{ background: C.bg, color: C.text }}>
      <PromoFloatingBackButton />
      <Helmet>
        <title>7 天身心舒展营 · 35+ 女性的身心舒展计划 ｜ 含知乐胶囊</title>
        <meta
          name="description"
          content="35+ 女性的 7 天身心舒展计划。资深女教练 1V1 + 知乐胶囊实物 + AI 教练 + 私密女性社群。施强健康 ✕ 有劲AI 联合出品。"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Helmet>

      <div className="mx-auto max-w-[480px]" style={{ background: C.bgSoft }}>
        {/* ============ 01 HERO ============ */}
        <header className="px-6 pt-12 pb-10 text-center relative overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-[280px] pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${C.primarySoft}55 0%, transparent 70%)` }}
          />
          <p className="text-xs tracking-[0.4em] mb-5 relative" style={{ color: C.primary }}>
            FOR&nbsp;HER&nbsp;35+&nbsp;·&nbsp;7&nbsp;DAYS
          </p>
          <h1 className="text-[32px] mb-3 relative" style={{ ...serif, color: C.primary, lineHeight: 1.3, fontWeight: 700 }}>
            7 天身心舒展营
          </h1>
          <h2 className="text-[20px] mb-4 relative" style={{ ...serif, color: C.text, lineHeight: 1.5, fontWeight: 600 }}>
            35+ 女性的身心舒展计划<br />
            <span style={{ color: C.primary }}>没人会知道你来过</span>
          </h2>
          <div
            className="inline-flex items-center gap-2 text-[12px] px-4 py-2 rounded-full mb-6 relative"
            style={{ border: `1px solid ${C.divider}`, color: C.accent, background: "rgba(255,255,255,0.6)" }}
          >
            <Heart className="w-3.5 h-3.5" />
            施强健康 ✕ 有劲AI · 含知乐胶囊实物
          </div>

          <button
            onClick={handlePrimaryCTA}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition active:scale-[0.98] relative"
            style={{ background: C.primary, color: "#fff", boxShadow: `0 8px 24px ${C.primary}40` }}
          >
            {alreadyPurchased ? "进入 7 天身心舒展营 · 已开通" : "立即加入身心舒展营 →"}
          </button>
        </header>

        {/* ============ 02 痛点共鸣 ============ */}
        <Section index={2} eyebrow="如果有一句让你心里一颤" title="那这 ¥399，可能就是你今年留给自己的一次喘息">
          <ul className="space-y-5">
            {[
              "白天像打仗，回家还要陪写作业、做家务，明明累到不行，却翻来覆去睡不着。",
              "我是项目负责人、是妈妈、是女儿，唯独不是我自己。最近常常在想——我到底是谁。",
              "身体一直在喊累，可工作、孩子都等着我，只能自己硬扛着。",
            ].map((line, i) => (
              <li key={i} className="p-4 rounded-xl flex gap-3 text-[15px]"
                  style={{ background: C.bgCard, border: `1px solid ${C.divider}`, color: C.text, lineHeight: 1.85 }}>
                <Quote className="w-4 h-4 mt-1.5 shrink-0" style={{ color: C.primary }} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ============ 03 4 项权益（对齐男版） ============ */}
        <Section index={3} eyebrow="7 天你会拿到什么" title="4 件事 · 按一个 35+ 女人最在意的顺序">
          <div className="space-y-4">
            {[
              {
                Icon: ClipboardList,
                tag: "核心权益 01 · 一次「她状态」梳理 + 资深女教练 30 分钟 1V1",
                title: "腾讯会议 1 对 1 · 事后把录屏 + AI 纪要发到你手机，温故而知新",
                desc:
                  "把这一年身体、情绪、关系、自我，到底哪一格在掉电——一项一项摆出来。\n\n测完 48 小时内，资深女教练用腾讯会议跟你 1 对 1 坐 30 分钟。不是老师讲给你听，是教练用一组一组的问题陪你慢慢看：哪一项你早就感觉到了、哪一项被忽略很久、哪一项你想先动——你说，她听，她再问。\n\n会议结束后，把录屏 + AI 自动整理纪要发到你手机里，存着可以温故而知新——只发你本人，不进社群、不留平台后台。",
              },
              {
                Icon: Pill,
                tag: "核心权益 02 · 1 瓶知乐胶囊 · 顺丰匿名到家",
                title: "GABA + L-茶氨酸 + 酸枣仁 + 镁 · 给那根一直绷着的弦留点缓冲",
                desc:
                  "不是药，是给你这根一直绷着的弦留点缓冲。白天稳情绪，夜里沉得下睡眠。0 褪黑素，不依赖。\n\n顺丰匿名包装，外箱不写「情绪」「女性」任何字眼，家里 / 公婆 / 孩子收件都看不出是什么。下单后 48 小时内寄出。",
              },
              {
                Icon: Users,
                tag: "核心权益 03 · 7 天每天 15 分钟 · 孩子睡了就能做",
                title: "AI 女性教练 24 小时在线 · 深夜也接，不留浏览记录",
                desc:
                  "每天 15 分钟左右，三件事，你想从哪件开始都行——\n· 5 分钟真人静心冥想：哄睡 / 通勤 / 午休戴上耳机就行，不用盘腿、不用念词。\n· 和 AI 情绪教练聊几句：四步对话，今天哪根弦最紧、想松哪一格，自己说出来，系统给你一份当天的小简报。\n· 3 分钟自我书写：写下今天那一句自己最想记住的话，可以发到女性学员群、也可以只留给自己。\n\n中间随时想说话，AI 女性教练 24 小时在线，深夜也接，不留浏览记录。",
              },
              {
                Icon: Award,
                tag: "核心权益 04 · 第 8 天 · 资深教练再陪你坐 45 分钟",
                title: "腾讯会议 1V1 · 录屏 + AI 纪要发你手机，存着以后慢慢回看",
                desc:
                  "7 天走完，不是发个证书就散。\n\n资深教练用腾讯会议再跟你 1 对 1 坐 45 分钟。还是教练式对话——结合你这 7 天写下的话 + 第 1 天那份报告，她一组一组地问你：接下来这半年，你最想先动的，到底是哪一件。\n\n会议结束后，录屏 + AI 纪要发到你手机里，存着以后慢慢回看，平台不留底。",
              },
            ].map((card, i) => (
              <div key={i} className="p-5 rounded-xl" style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <card.Icon className="w-4 h-4" style={{ color: C.primary }} />
                  <p className="text-[11px] tracking-[0.15em]" style={{ color: C.primary }}>{card.tag}</p>
                </div>
                <h3 className="text-[16px] mb-2" style={{ ...serif, color: C.text, fontWeight: 600 }}>{card.title}</h3>
                <p className="text-[13px] whitespace-pre-line" style={{ color: C.textMute, lineHeight: 1.85 }}>{card.desc}</p>

                {i === 0 && (
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-lg"
                       style={{ background: `${C.primarySoft}22`, border: `1px solid ${C.divider}` }}>
                    <img src={coachDaixi} alt="总教练 黛汐"
                         className="w-14 h-14 rounded-full object-cover shrink-0"
                         style={{ border: `2px solid ${C.primarySoft}` }} />
                    <div className="min-w-0">
                      <p className="text-[13px]" style={{ ...serif, color: C.text, fontWeight: 600 }}>总教练 · 黛汐</p>
                      <p className="text-[11.5px] mt-0.5" style={{ color: C.textMute, lineHeight: 1.5 }}>
                        生命教练 / 国际脑点执行师 / PNCC 心流教练 / 高级心理咨询师
                      </p>
                    </div>
                  </div>
                )}

                {i === 1 && (
                  <div className="mt-4 rounded-lg overflow-hidden" style={{ border: `1px solid ${C.divider}` }}>
                    <img src={zhileCapsules} alt="知乐胶囊产品实拍" className="w-full object-cover" />
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-start gap-2 px-4 py-3 rounded-lg"
                 style={{ background: `${C.primarySoft}1c`, border: `1px dashed ${C.divider}` }}>
              <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: C.accent }} />
              <p className="text-[11.5px]" style={{ color: C.accent, lineHeight: 1.65 }}>
                实物由「有劲生活馆」统一发货 · 顺丰匿名包邮 · 下单后 48h 内寄出
              </p>
            </div>
          </div>
        </Section>

        {/* ============ 04 3 大优势 ============ */}
        <Section index={4} eyebrow="为什么是这 ¥399" title="选择我们的 3 个理由">
          <div className="space-y-4">
            {[
              {
                Icon: Video, title: "1V1 真人 · 不是群里走过场",
                points: [
                  "资深女教练腾讯会议跟你单独坐 2 次",
                  "前后 75 分钟全是你的时间",
                  "录屏 + AI 纪要事后只发你本人",
                ],
              },
              {
                Icon: EyeOff, title: "把隐私这件事做到位",
                points: [
                  "全程女性社群 · 实名审核仅平台后台可见",
                  "课程链接仅本人可看 · 不可分享转发",
                  "胶囊顺丰匿名包装 · 外箱不写敏感字",
                ],
              },
              {
                Icon: Gem, title: "高性价比体验",
                points: [
                  "胶囊 + 1V1 教练 + AI 陪伴 + 7 天陪走 · 一样不少",
                  "含 1 瓶知乐胶囊（价值 ¥389）",
                  "一支口红的钱，拿到 ¥3,980 闭门计划同款核心",
                ],
              },
            ].map((adv, i) => (
              <div key={i} className="p-5 rounded-xl" style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                       style={{ background: `${C.primarySoft}33`, border: `1px solid ${C.divider}` }}>
                    <adv.Icon className="w-4 h-4" style={{ color: C.primary }} />
                  </div>
                  <h3 className="text-[16px]" style={{ ...serif, color: C.text, fontWeight: 600 }}>
                    优势 {i + 1} · {adv.title}
                  </h3>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {adv.points.map((p, j) => (
                    <li key={j} className="text-[13px] flex gap-2" style={{ color: C.textMute, lineHeight: 1.85 }}>
                      <span style={{ color: C.primary }}>·</span><span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 05 教练团 ============ */}
        <Section index={5} eyebrow="带场的不是 AI · 是真人女性教练" title="6 位资深教练 · 全程姐妹陪伴">
          <p className="text-[12.5px] -mt-2 mb-4 px-3 py-2 rounded-lg inline-block"
             style={{ background: `${C.primarySoft}22`, color: C.primary, border: `1px solid ${C.divider}` }}>
            ♀ 5 位女性教练 · 全程同性陪伴
          </p>
          <div className="grid grid-cols-3 gap-3">
            {COACH_TEAM.map((c, i) => (
              <div key={i} className="p-3 rounded-xl text-center"
                   style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}>
                <img src={c.image} alt={c.name}
                     className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                     style={{ border: `2px solid ${C.primarySoft}` }} />
                <p className="text-[13px]" style={{ ...serif, color: C.text, fontWeight: 600 }}>{c.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: C.primary }}>{c.role}</p>
                <p className="text-[10px] mt-1" style={{ color: C.textMute, lineHeight: 1.5 }}>{c.subtitle}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3 p-4 rounded-xl"
               style={{ background: `${C.primarySoft}1c`, border: `1px solid ${C.divider}` }}>
            <div className="p-1.5 rounded-lg shrink-0" style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}>
              <img src={wecomCoachQr} alt="助教企微二维码" className="w-20 h-20 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] mb-1" style={{ ...serif, color: C.text, fontWeight: 600 }}>付款后专属助教 1 对 1 对接</p>
              <p className="text-[11.5px]" style={{ color: C.textMute, lineHeight: 1.65 }}>
                扫码加入私密企微 · 48h 内安排入营事项 · 全程匿名
              </p>
            </div>
          </div>
        </Section>

        {/* ============ 06 信任保障 ============ */}
        <Section index={6} eyebrow="我们懂你的在意" title="3 条不可妥协的承诺">
          <div className="flex items-center justify-around gap-2 mb-5 p-3 rounded-xl"
               style={{ background: `${C.primarySoft}1c`, border: `1px solid ${C.divider}` }}>
            <div className="text-center flex-1">
              <p className="text-[15px]" style={{ ...serif, color: C.primary, fontWeight: 700 }}>22 年</p>
              <p className="text-[10.5px] mt-0.5" style={{ color: C.textMute }}>施强健康背书</p>
            </div>
            <div className="w-px h-8" style={{ background: C.divider }} />
            <div className="text-center flex-1">
              <p className="text-[15px]" style={{ ...serif, color: C.primary, fontWeight: 700 }}>0</p>
              <p className="text-[10.5px] mt-0.5" style={{ color: C.textMute }}>朋友圈曝光</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { t: "全程女性社群 · 不混入男性", d: "实名审核 · 仅限同龄女性入群" },
              { t: "课程链接仅本人可看", d: "不可分享转发 · 链接绑定账号" },
              { t: "沟通仅你与教练可见", d: "平台不留对话记录" },
            ].map((p, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Lock className="w-4 h-4 mt-1 shrink-0" style={{ color: C.primary }} />
                <div>
                  <p className="text-[14px] mb-0.5" style={{ color: C.text, fontWeight: 600 }}>{p.t}</p>
                  <p className="text-[12px]" style={{ color: C.textMute }}>{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 07 同龄证言 ============ */}
        <Section index={7} eyebrow="先走一步的姐妹，说了这些" title="同龄人，不是鸡汤">
          <div className="space-y-4">
            {[
              { name: "张女士 · 38 岁 · 二孩妈妈", quote: "这是这两年第一次，有人问我「你今天怎么样」。" },
              { name: "林女士 · 33 岁 · 项目经理", quote: "教练那场之后，我哭了 20 分钟，然后睡了 8 小时。" },
              { name: "周女士 · 42 岁 · 设计总监", quote: "不是变强，是允许自己歇一会。原来这件事，也可以。" },
            ].map((t, i) => (
              <div key={i} className="p-5 rounded-xl"
                   style={{ background: C.bgCard, borderLeft: `3px solid ${C.primary}` }}>
                <p className="text-[14px] mb-3 italic" style={{ color: C.text, lineHeight: 1.85 }}>「{t.quote}」</p>
                <p className="text-[12px]" style={{ color: C.accent }}>— {t.name}（化名 · 已获授权）</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 08 FAQ ============ */}
        <Section index={8} eyebrow="解决最后顾虑" title="你可能想问的 5 个问题">
          <div className="rounded-xl overflow-hidden" style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}>
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "课程线上还是线下？时间怎么安排？",
                  a: "全程线上。2 场 1V1 腾讯会议跟你单独约时间（共 75 分钟），结束后录屏 + AI 纪要发你手机。每日静心冥想与 AI 教练对话随时进行，每天约 15 分钟，不耽误工作和带娃。",
                },
                {
                  q: "胶囊怎么发？家人会不会看见？",
                  a: "顺丰匿名包装，外箱不写「情绪」「女性」「健康」任何敏感字眼，家里 / 公婆 / 孩子收件都看不出是什么。下单后 48h 内寄出，物流信息只在你的账号里可见。",
                },
                {
                  q: "1V1 教练是怎么陪我的？",
                  a: "由资深女教练 1 对 1 腾讯会议沟通，结合「她状态」报告一项一项陪你看。不打官腔、不卖课、不评判。结束后录屏 + AI 纪要只发你本人，不进社群。",
                },
                {
                  q: "孩子哭闹 / 加班错过怎么办？",
                  a: "完全不用焦虑。1V1 会议时间提前跟你约；每日冥想音频与 AI 教练长期可用，娃睡了再做也来得及。没有打卡排名，只跟着自己的节奏走。",
                },
                {
                  q: "家人会知道吗？我先生 / 婆婆会看到吗？",
                  a: "不会。全程匿名昵称，社群实名审核仅平台后台可见。课程与录屏链接绑定你的账号，不可转发。沟通仅你与教练可见，不会出现在朋友圈与家人视野。",
                },
              ].map((item, i, arr) => (
                <AccordionItem key={i} value={`faq-${i}`}
                               className={i === arr.length - 1 ? "border-b-0" : ""}
                               style={{ borderColor: C.divider }}>
                  <AccordionTrigger className="px-4 py-4 text-left text-[14px] hover:no-underline" style={{ color: C.text }}>
                    <span className="pr-2 flex-1">Q{i + 1} · {item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-[13px]"
                                    style={{ color: C.textMute, lineHeight: 1.85 }}>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <p className="text-[11.5px] text-center mt-4" style={{ color: C.accent }}>
            还有其他疑问？点底部「先匿名咨询」与顾问 1v1 沟通
          </p>
        </Section>

        {/* ============ 09 价格 + CTA ============ */}
        <section className="px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs tracking-[0.2em] font-mono" style={{ color: C.primary }}>09 / 09</span>
            <div className="flex-1 h-px" style={{ background: C.divider }} />
          </div>

          <div className="rounded-2xl p-6 text-center"
               style={{
                 background: `linear-gradient(160deg, ${C.bgCard} 0%, ${C.primarySoft}55 100%)`,
                 border: `1.5px solid ${C.primary}`,
               }}>
            <p className="text-[12px] tracking-[0.3em] mb-3" style={{ color: C.primary }}>
              本期专属体验价 · LIMITED
            </p>
            <h2 className="text-[20px] mb-4" style={{ ...serif, color: C.text, lineHeight: 1.5, fontWeight: 600 }}>
              先用 ¥{PRICE}，<br />给自己留一次身心舒展
            </h2>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-[14px] line-through" style={{ color: C.textMute, opacity: 0.7 }}>原价 ¥{ORIGINAL_PRICE}</span>
            </div>
            <div className="flex items-baseline justify-center gap-1.5 mb-3">
              <span style={{ color: C.primary, fontSize: 18, ...serif, fontWeight: 600 }}>¥</span>
              <span style={{ ...serif, color: C.primary, fontSize: 56, fontWeight: 700, lineHeight: 1 }}>{PRICE}</span>
            </div>
            <p className="text-[12px]" style={{ color: C.accent, lineHeight: 1.7 }}>
              含知乐胶囊 1 瓶（顺丰匿名包邮）· 满员即恢复原价 ¥{ORIGINAL_PRICE}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handlePrimaryCTA}
              className="w-full py-4 rounded-xl text-[16px] font-semibold transition active:scale-[0.98]"
              style={{ background: C.primary, color: "#fff", boxShadow: `0 8px 24px ${C.primary}40` }}
            >
              {alreadyPurchased ? "进入 7 天身心舒展营 · 已开通" : "立即加入身心舒展营 →"}
            </button>
            <button
              onClick={handleConsult}
              className="w-full py-3.5 rounded-xl text-[14px] transition active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: "transparent", color: C.text, border: `1px solid ${C.divider}` }}
            >
              <MessageCircle className="w-4 h-4" />
              先匿名咨询，了解详情
            </button>
          </div>

          <p className="text-[11.5px] text-center mt-6" style={{ color: C.textMute, lineHeight: 1.95 }}>
            付款即视为同意《购买须知》与《隐私承诺》<br />
            你为孩子、为家人、为客户花了那么多<br />
            这一次，请留 ¥{PRICE} 和 7 天给自己。
          </p>
        </section>

        <div className="h-24" />
      </div>

      {/* ============ Sticky 底部 CTA ============ */}
      <div className="fixed bottom-0 inset-x-0 z-40"
           style={{ background: `linear-gradient(180deg, transparent, ${C.bg} 30%)`, paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto max-w-[480px] px-4 pt-6 pb-3">
          <button
            onClick={handlePrimaryCTA}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition active:scale-[0.98]"
            style={{
              background: C.primary, color: "#fff",
              boxShadow: `0 -2px 16px rgba(0,0,0,0.08), 0 8px 24px ${C.primary}38`,
            }}
          >
            {!purchaseChecked
              ? "正在确认开通状态..."
              : alreadyPurchased
                ? "已购买，进入身心舒展营"
                : `¥${PRICE} · 立即加入 · 含知乐胶囊`}
          </button>
        </div>
      </div>

      {/* 兑换码弹窗（女性版有赞链接） */}
      <SynergyRedeemDialog
        open={showRedeemDialog}
        onOpenChange={setShowRedeemDialog}
        onSuccess={handleRedeemSuccess}
        isLoggedIn={!!user}
        onNeedLogin={handleRedeemNeedLogin}
        youzanUrl={WOMEN_YOUZAN_URL}
      />
    </div>
  );
}
