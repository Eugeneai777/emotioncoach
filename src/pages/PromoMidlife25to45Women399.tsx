import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { ShieldCheck, Lock, MessageCircle, Quote, Users, Wind, BookOpen, Truck, Heart, Clock, Gem, Calendar } from "lucide-react";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { usePackageByKey } from "@/hooks/usePackages";
import { useWechatOpenId } from "@/hooks/useWechatOpenId";
import { useAuth } from "@/hooks/useAuth";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import zhileCapsules from "@/assets/zhile-capsules.jpeg";
import coachDaixi from "@/assets/coach-daixi.jpg";
import coachXiaoyi from "@/assets/coach-xiaoyi.png";
import coachAmy from "@/assets/coach-amy.jpg";
import coachMumian from "@/assets/coach-mumian.jpg";
import coachXiaojianxiong from "@/assets/coach-xiaojianxiong.jpg";
import coachBetty from "@/assets/coach-betty.jpg";
import wecomCoachQr from "@/assets/wecom-coach-qr.jpg";

/**
 * 25-45 岁女性 ¥399 喘息计划 售前页
 * 路由：/promo/midlife-women-399
 * 复用 camp-emotion_stress_7 (¥399 / 7 天)
 * 与男版差异：女性视觉（暖米 + 玫瑰豆沙）+ 场景化共鸣文案 + 同性安全感叙事
 */

const PACKAGE_KEY = "camp-emotion_stress_7";
const RETURN_URL = "/promo/midlife-women-399";
const TOTAL_SECTIONS = 9;

// 女性教练优先排序 · 肖剑雄保留但下沉
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
  index,
  total = TOTAL_SECTIONS,
  eyebrow,
  title,
  children,
}: {
  index: number;
  total?: number;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
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
        <span className="text-xs tracking-[0.2em] font-mono" style={{ color: C.primary }}>
          {num}
        </span>
        <div className="flex-1 h-px" style={{ background: C.divider }} />
      </div>
      {eyebrow && (
        <p className="text-xs tracking-widest mb-2" style={{ color: C.accent }}>
          {eyebrow}
        </p>
      )}
      <h2
        className="text-[22px] mb-5"
        style={{ ...serif, color: C.text, lineHeight: 1.5, fontWeight: 600 }}
      >
        {title}
      </h2>
      <div style={{ color: C.text }}>{children}</div>
    </motion.section>
  );
}

export default function PromoMidlife25to45Women399() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPay, setShowPay] = useState(false);
  const openId = useWechatOpenId();
  const { data: pkg } = usePackageByKey(PACKAGE_KEY);
  const price = pkg?.price ?? 399;

  usePaymentCallback({
    onSuccess: () => {
      navigate("/camp-intro/emotion_stress_7");
    },
  });

  const handlePrimaryCTA = () => {
    if (!user) {
      setPostAuthRedirect(RETURN_URL);
      navigate(`/auth?redirect=${encodeURIComponent(RETURN_URL)}`);
      return;
    }
    setShowPay(true);
  };

  const handleConsult = () => navigate("/customer-support");

  return (
    <div className="min-h-screen w-full" style={{ background: C.bg, color: C.text }}>
      <Helmet>
        <title>25–45 岁，请为自己留 7 天 ｜ ¥399 喘息计划</title>
        <meta
          name="description"
          content="25–45 岁女性的 7 天喘息计划。7 天打卡训练营 + 每日真人冥想 + 每日课程推荐 + 海沃塔团队教练辅导。一支口红的钱，让自己被好好照顾一次。"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Helmet>

      <div className="mx-auto max-w-[480px]" style={{ background: C.bgSoft }}>
        {/* ============ 01 HERO ============ */}
        <header className="px-6 pt-12 pb-10 text-center relative overflow-hidden">
          {/* 玫瑰渐变光晕 */}
          <div
            className="absolute inset-x-0 top-0 h-[280px] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${C.primarySoft}55 0%, transparent 70%)`,
            }}
          />
          <p
            className="text-xs tracking-[0.4em] mb-5 relative"
            style={{ color: C.primary }}
          >
            FOR&nbsp;HER&nbsp;25–45&nbsp;·&nbsp;7&nbsp;DAYS
          </p>
          <h1
            className="text-[30px] mb-5 relative"
            style={{ ...serif, color: C.text, lineHeight: 1.5, fontWeight: 600 }}
          >
            这一次，
            <br />
            <span style={{ color: C.primary, fontWeight: 700 }}>我也想被</span>
            <br />
            <span style={{ color: C.primary, fontWeight: 700 }}>好好照顾一次。</span>
          </h1>
          <p
            className="text-[14px] mb-6 relative"
            style={{ color: C.textMute, lineHeight: 1.85 }}
          >
            25–45 岁女性的 7 天喘息计划
            <br />
            没有功课，只有被听见
          </p>
          <div
            className="inline-flex items-center gap-2 text-[12px] px-4 py-2 rounded-full relative"
            style={{
              border: `1px solid ${C.divider}`,
              color: C.accent,
              background: "rgba(255,255,255,0.6)",
            }}
          >
            <Heart className="w-3.5 h-3.5" />
            施强健康 ✕ 有劲AI · 本期专属体验价 ¥{price}
          </div>
        </header>

        {/* ============ 02 痛点共鸣 ============ */}
        <Section
          index={2}
          eyebrow="如果有一句让你心里一颤"
          title="那这 ¥399，可能就是你今年留给自己的一次喘息"
        >
          <ul className="space-y-5">
            {[
              "白天像打仗，回家还要陪写作业、做家务，明明累到不行，却翻来覆去睡不着。",
              "我是项目负责人、是妈妈、是女儿，唯独不是我自己。最近常常在想——我到底是谁。",
              "身体一直在喊累，可工作、孩子都等着我，只能自己硬扛着。",
            ].map((line, i) => (
              <li
                key={i}
                className="p-4 rounded-xl flex gap-3 text-[15px]"
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.divider}`,
                  color: C.text,
                  lineHeight: 1.85,
                }}
              >
                <Quote className="w-4 h-4 mt-1.5 shrink-0" style={{ color: C.primary }} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ============ 03 7 天权益 ============ */}
        <Section index={3} eyebrow="7 天你会拿到什么" title="4 件事 · 按一个女人最在意的顺序">
          <div className="space-y-4">
            {[
              {
                Icon: Calendar,
                tag: "权益 01 · 7 天打卡训练营",
                title: "陪你把这 7 天走完",
                desc: "每日打卡节奏，跟着 7 天解压训练营走一遍，把身体和情绪重新调回稳定的轨道。不打鸡血，只陪你按节奏完成。",
              },
              {
                Icon: Wind,
                tag: "权益 02 · 每日真人 10 分钟静心冥想",
                title: "深夜也能稳稳入睡",
                desc: "真人录制 10 分钟静心音频，哄睡 / 通勤 / 午休随时听。专为高压女性设计的呼吸与放松引导，0 副作用、不依赖。",
              },
              {
                Icon: BookOpen,
                tag: "权益 03 · 每日课程推荐 / 学习内容",
                title: "每天 15 分钟，听一段值得听的",
                desc: "围绕情绪、关系、自我照顾的精选课程内容，每日按你的状态推送。碎片化学习，不焦虑不内卷。",
              },
              {
                Icon: Users,
                tag: "权益 04 · 海沃塔团队教练辅导",
                title: "一群人，比一个人走得更远",
                desc: "由女性教练带场的海沃塔团队教练辅导：社群陪伴 + 团队带练 + 同龄姐妹 1 对 1 配对深度对话。不是被建议，是被听见。",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <card.Icon className="w-4 h-4" style={{ color: C.primary }} />
                  <p className="text-[11px] tracking-[0.2em]" style={{ color: C.primary }}>
                    {card.tag}
                  </p>
                </div>
                <h3
                  className="text-[16px] mb-2"
                  style={{ ...serif, color: C.text, fontWeight: 600 }}
                >
                  {card.title}
                </h3>
                <p className="text-[13px]" style={{ color: C.textMute, lineHeight: 1.85 }}>
                  {card.desc}
                </p>

                {i === 0 && (
                  <div
                    className="mt-4 flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: `${C.primarySoft}22`,
                      border: `1px solid ${C.divider}`,
                    }}
                  >
                    <img
                      src={coachDaixi}
                      alt="总教练 黛汐"
                      className="w-14 h-14 rounded-full object-cover shrink-0"
                      style={{ border: `2px solid ${C.primarySoft}` }}
                    />
                    <div className="min-w-0">
                      <p
                        className="text-[13px]"
                        style={{ ...serif, color: C.text, fontWeight: 600 }}
                      >
                        总教练 · 黛汐
                      </p>
                      <p
                        className="text-[11.5px] mt-0.5"
                        style={{ color: C.textMute, lineHeight: 1.5 }}
                      >
                        生命教练 / 国际脑点执行师 / PNCC 心流教练 / 高级心理咨询师
                      </p>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        </Section>

{/* removed: physical shipping notice (no physical product in delivery now) */}

        {/* ============ 04 3 大优势 ============ */}
        <Section index={4} eyebrow="为什么是这 ¥399" title="选择我们的 3 个理由">
          <div className="space-y-4">
            {[
              {
                Icon: Heart,
                title: "被理解，不被说教",
                points: [
                  "教练只听不评判 · 不打鸡血",
                  "全程不卖课 · 不推销课程",
                  "不会有人告诉你「你应该…」",
                ],
              },
              {
                Icon: Clock,
                title: "碎片化 · 无负担",
                points: [
                  "每天 15 分钟，孩子睡了就能做",
                  "海沃塔错过支持回放 · 不焦虑",
                  "不打卡 · 不排名 · 不内卷",
                ],
              },
              {
                Icon: Gem,
                title: "高性价比体验",
                points: [
                  "教练 + AI + 实物胶囊 + 私密社群",
                  "一支口红的钱，拿到 ¥3,980 闭门计划同款核心",
                ],
              },
            ].map((adv, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `${C.primarySoft}33`,
                      border: `1px solid ${C.divider}`,
                    }}
                  >
                    <adv.Icon className="w-4 h-4" style={{ color: C.primary }} />
                  </div>
                  <h3
                    className="text-[16px]"
                    style={{ ...serif, color: C.text, fontWeight: 600 }}
                  >
                    优势 {i + 1} · {adv.title}
                  </h3>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {adv.points.map((p, j) => (
                    <li
                      key={j}
                      className="text-[13px] flex gap-2"
                      style={{ color: C.textMute, lineHeight: 1.85 }}
                    >
                      <span style={{ color: C.primary }}>·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 05 教练团 ============ */}
        <Section index={5} eyebrow="带场的不是 AI · 是真人女性教练" title="6 位资深教练 · 全程姐妹陪伴">
          <p
            className="text-[12.5px] -mt-2 mb-4 px-3 py-2 rounded-lg inline-block"
            style={{
              background: `${C.primarySoft}22`,
              color: C.primary,
              border: `1px solid ${C.divider}`,
            }}
          >
            ♀ 5 位女性教练 · 全程同性陪伴
          </p>
          <div className="grid grid-cols-3 gap-3">
            {COACH_TEAM.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-xl text-center"
                style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}
              >
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                  style={{ border: `2px solid ${C.primarySoft}` }}
                />
                <p
                  className="text-[13px]"
                  style={{ ...serif, color: C.text, fontWeight: 600 }}
                >
                  {c.name}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: C.primary }}>
                  {c.role}
                </p>
                <p
                  className="text-[10px] mt-1"
                  style={{ color: C.textMute, lineHeight: 1.5 }}
                >
                  {c.subtitle}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mt-5 flex items-center gap-3 p-4 rounded-xl"
            style={{ background: `${C.primarySoft}1c`, border: `1px solid ${C.divider}` }}
          >
            <div
              className="p-1.5 rounded-lg shrink-0"
              style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}
            >
              <img src={wecomCoachQr} alt="助教企微二维码" className="w-20 h-20 object-contain" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[13px] mb-1"
                style={{ ...serif, color: C.text, fontWeight: 600 }}
              >
                付款后专属助教 1 对 1 对接
              </p>
              <p
                className="text-[11.5px]"
                style={{ color: C.textMute, lineHeight: 1.65 }}
              >
                扫码加入私密企微 · 48h 内安排入营事项 · 全程匿名
              </p>
            </div>
          </div>
        </Section>

        {/* ============ 06 信任保障 ============ */}
        <Section index={6} eyebrow="我们懂你的在意" title="3 条不可妥协的承诺">
          <div
            className="flex items-center justify-around gap-2 mb-5 p-3 rounded-xl"
            style={{ background: `${C.primarySoft}1c`, border: `1px solid ${C.divider}` }}
          >
            <div className="text-center flex-1">
              <p
                className="text-[15px]"
                style={{ ...serif, color: C.primary, fontWeight: 700 }}
              >
                22 年
              </p>
              <p className="text-[10.5px] mt-0.5" style={{ color: C.textMute }}>
                施强健康背书
              </p>
            </div>
            <div className="w-px h-8" style={{ background: C.divider }} />
            <div className="text-center flex-1">
              <p
                className="text-[15px]"
                style={{ ...serif, color: C.primary, fontWeight: 700 }}
              >
                0
              </p>
              <p className="text-[10.5px] mt-0.5" style={{ color: C.textMute }}>
                朋友圈曝光
              </p>
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
                  <p
                    className="text-[14px] mb-0.5"
                    style={{ color: C.text, fontWeight: 600 }}
                  >
                    {p.t}
                  </p>
                  <p className="text-[12px]" style={{ color: C.textMute }}>
                    {p.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 07 同龄证言 ============ */}
        <Section index={7} eyebrow="先走一步的姐妹，说了这些" title="同龄人，不是鸡汤">
          <div className="space-y-4">
            {[
              {
                name: "张女士 · 38 岁 · 二孩妈妈",
                quote: "这是这两年第一次，有人问我「你今天怎么样」。",
              },
              {
                name: "林女士 · 33 岁 · 项目经理",
                quote: "海沃塔那场之后，我哭了 20 分钟，然后睡了 8 小时。",
              },
              {
                name: "周女士 · 42 岁 · 设计总监",
                quote: "不是变强，是允许自己歇一会。原来这件事，也可以。",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{ background: C.bgCard, borderLeft: `3px solid ${C.primary}` }}
              >
                <p
                  className="text-[14px] mb-3 italic"
                  style={{ color: C.text, lineHeight: 1.85 }}
                >
                  「{t.quote}」
                </p>
                <p className="text-[12px]" style={{ color: C.accent }}>
                  — {t.name}（化名 · 已获授权）
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 08 FAQ ============ */}
        <Section index={8} eyebrow="解决最后顾虑" title="你可能想问的 4 个问题">
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}
          >
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "课程线上还是线下？时间怎么安排？",
                  a: "全程线上。海沃塔团队对话固定 1 场（晚上 8 点开播，约 75 分钟），错过支持回放。每日静心和 AI 教练 24h 随时用，每天约 15 分钟，不耽误工作和带娃。",
                },
                {
                  q: "AI 教练随时能聊吗？真人教练会一对一回应吗？",
                  a: "AI 女性教练 24h 在线，深夜也能聊，不留浏览记录。海沃塔场内由女性总教练带场。报名后专属助教会加你单独沟通入营事项，全程不打官腔、不卖课。",
                },
                {
                  q: "孩子哭闹 / 加班错过怎么办？",
                  a: "完全不用焦虑。海沃塔团队对话支持完整回放；每日静心音频和 AI 女性教练 24h 在线，娃睡了再做也来得及。没有打卡排名，只跟着自己的节奏走。",
                },
                {
                  q: "家人会知道吗？我先生 / 婆婆会看到吗？",
                  a: "不会。全程匿名昵称，社群实名审核仅平台后台可见。课程链接绑定你的账号，不可转发。物流外包装无任何敏感字样，由「有劲生活馆」名义寄出，家人看了也只会以为是一瓶普通保健品。",
                },
              ].map((item, i, arr) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className={i === arr.length - 1 ? "border-b-0" : ""}
                  style={{ borderColor: C.divider }}
                >
                  <AccordionTrigger
                    className="px-4 py-4 text-left text-[14px] hover:no-underline"
                    style={{ color: C.text }}
                  >
                    <span className="pr-2 flex-1">
                      Q{i + 1} · {item.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent
                    className="px-4 pb-4 text-[13px]"
                    style={{ color: C.textMute, lineHeight: 1.85 }}
                  >
                    {item.a}
                  </AccordionContent>
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
            <span className="text-xs tracking-[0.2em] font-mono" style={{ color: C.primary }}>
              09 / 09
            </span>
            <div className="flex-1 h-px" style={{ background: C.divider }} />
          </div>

          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: `linear-gradient(160deg, ${C.bgCard} 0%, ${C.primarySoft}55 100%)`,
              border: `1.5px solid ${C.primary}`,
            }}
          >
            <p className="text-[12px] tracking-[0.3em] mb-3" style={{ color: C.primary }}>
              本期专属体验价 · LIMITED
            </p>
            <h2
              className="text-[20px] mb-4"
              style={{ ...serif, color: C.text, lineHeight: 1.5, fontWeight: 600 }}
            >
              先用 ¥{price}，
              <br />
              给自己留一次喘息
            </h2>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span
                className="text-[14px] line-through"
                style={{ color: C.textMute, opacity: 0.7 }}
              >
                原价 ¥688
              </span>
            </div>
            <div className="flex items-baseline justify-center gap-1.5 mb-3">
              <span style={{ color: C.primary, fontSize: 18, ...serif, fontWeight: 600 }}>¥</span>
              <span
                style={{
                  ...serif,
                  color: C.primary,
                  fontSize: 56,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {price}
              </span>
            </div>
            <p className="text-[12px]" style={{ color: C.accent, lineHeight: 1.7 }}>
              限量体验名额 · 满员即恢复原价 ¥688
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handlePrimaryCTA}
              className="w-full py-4 rounded-xl text-[16px] font-semibold transition active:scale-[0.98]"
              style={{
                background: C.primary,
                color: "#ffffff",
                boxShadow: `0 8px 24px ${C.primary}40`,
              }}
            >
              立即加入 7 天喘息计划 →
            </button>
            <button
              onClick={handleConsult}
              className="w-full py-3.5 rounded-xl text-[14px] transition active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: "transparent",
                color: C.text,
                border: `1px solid ${C.divider}`,
              }}
            >
              <MessageCircle className="w-4 h-4" />
              先匿名咨询，了解详情
            </button>
          </div>

          <p
            className="text-[11.5px] text-center mt-6"
            style={{ color: C.textMute, lineHeight: 1.95 }}
          >
            付款即视为同意《购买须知》与《隐私承诺》
            <br />
            你为孩子、为家人、为客户花了那么多
            <br />
            这一次，请留 ¥{price} 和 7 天给自己。
          </p>
        </section>

        {/* 底部留白 */}
        <div className="h-24" />
      </div>

      {/* ============ Sticky 底部 CTA ============ */}
      <div
        className="fixed bottom-0 inset-x-0 z-40"
        style={{
          background: `linear-gradient(180deg, transparent, ${C.bg} 30%)`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="mx-auto max-w-[480px] px-4 pt-6 pb-3">
          <button
            onClick={handlePrimaryCTA}
            className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition active:scale-[0.98]"
            style={{
              background: C.primary,
              color: "#ffffff",
              boxShadow: `0 -2px 16px rgba(0,0,0,0.08), 0 8px 24px ${C.primary}38`,
            }}
          >
            ¥{price} · 立即加入 7 天喘息计划
          </button>
        </div>
      </div>

      <UnifiedPayDialog
        open={showPay}
        onOpenChange={setShowPay}
        packageInfo={
          pkg
            ? {
                key: PACKAGE_KEY,
                name: "25–45 岁女性 7 天喘息计划",
                price: price,
              }
            : null
        }
        onSuccess={() => {
          setShowPay(false);
          navigate("/camp-intro/emotion_stress_7");
        }}
        returnUrl={RETURN_URL}
        openId={openId}
      />
    </div>
  );
}
