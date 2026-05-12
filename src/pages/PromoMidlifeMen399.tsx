import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { ShieldCheck, Lock, MessageCircle, Quote, Users, Wind, Pill, Truck, EyeOff, Clock, Gem, ClipboardList, Award, Video } from "lucide-react";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { usePackageByKey } from "@/hooks/usePackages";
import { usePackagePurchased } from "@/hooks/usePackagePurchased";
import { useWechatOpenId } from "@/hooks/useWechatOpenId";
import { useAuth } from "@/hooks/useAuth";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import { PromoFloatingBackButton } from "@/components/promo/PromoFloatingBackButton";
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

const COACH_TEAM = [
  { name: "黛汐", role: "总教练", image: coachDaixi, subtitle: "生命教练 / 高级心理咨询师" },
  { name: "肖剑雄", role: "资深教练", image: coachXiaojianxiong, subtitle: "婚姻关系 / 职业焦虑" },
  { name: "晓一", role: "资深教练", image: coachXiaoyi, subtitle: "婚姻家庭 / 情绪管理" },
  { name: "Amy", role: "资深教练", image: coachAmy, subtitle: "情感困惑 / 亲子关系" },
  { name: "木棉", role: "资深教练", image: coachMumian, subtitle: "身心整体疗愈" },
  { name: "贝蒂", role: "资深教练", image: coachBetty, subtitle: "亲密关系 / 生命重建" },
];

/**
 * 中年男性 ¥399 体验营 售前页（v2 · 8 段精简版）
 * 路由：/promo/midlife-men-399
 * 复用 camp-emotion_stress_7 (¥399 / 7 天)
 * 已删除升舱模块，聚焦"低门槛单品"心智
 */

const PACKAGE_KEY = "camp-emotion_stress_7";
const RETURN_URL = "/promo/midlife-men-399";
const TOTAL_SECTIONS = 9;

const C = {
  bg: "#0f0f0f",
  bgSoft: "#1a1a1a",
  bgCard: "#221f1b",
  gold: "#d4b481",
  goldSoft: "#a8895a",
  wine: "#6b2c2c",
  text: "#ece7dc",
  textMute: "#8a8478",
  divider: "rgba(212,180,129,0.28)",
};

const serif = { fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif' };

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
        <span className="text-xs tracking-[0.2em] font-mono" style={{ color: C.gold }}>
          {num}
        </span>
        <div className="flex-1 h-px" style={{ background: C.divider }} />
      </div>
      {eyebrow && (
        <p className="text-xs tracking-widest mb-2" style={{ color: C.goldSoft }}>
          {eyebrow}
        </p>
      )}
      <h2 className="text-[22px] leading-[1.4] font-semibold mb-5" style={{ ...serif, color: C.text }}>
        {title}
      </h2>
      <div style={{ color: C.text }}>{children}</div>
    </motion.section>
  );
}

export default function PromoMidlifeMen399() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPay, setShowPay] = useState(false);
  const openId = useWechatOpenId();
  const { data: pkg } = usePackageByKey(PACKAGE_KEY);
  const { data: hasPurchased, isLoading: checkingPurchase } = usePackagePurchased(PACKAGE_KEY, !!user);
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
    if (hasPurchased) {
      navigate("/camp-intro/emotion_stress_7");
      return;
    }
    setShowPay(true);
  };

  const handleConsult = () => navigate("/customer-support");

  return (
    <div className="min-h-screen w-full" style={{ background: C.bg, color: C.text }}>
      <PromoFloatingBackButton />
      <Helmet>
        <title>40 岁以后，有些事不该一个人扛着 ｜ 7 天私下试听 ¥399</title>
        <meta
          name="description"
          content="38–55 岁男人专属 7 天身心计划。1 次状态体检 + 2 场总教练 1V1 腾讯会议 + 1 瓶知乐胶囊 + 7 天有人陪你走。一杯酒钱，没人会知道你来过。"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Helmet>

      <div className="mx-auto max-w-[480px]" style={{ background: C.bgSoft }}>
        {/* ============ 01 HERO ============ */}
        <header className="px-6 pt-12 pb-8 text-center relative overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }}
          />
          <p className="text-xs tracking-[0.4em] mb-5" style={{ color: C.gold }}>
            FOR&nbsp;MEN&nbsp;38–55&nbsp;·&nbsp;7&nbsp;DAYS
          </p>
          <h1 className="text-[30px] leading-[1.4] font-bold mb-4" style={{ ...serif, color: C.text }}>
            40 岁以后，
            <br />
            <span style={{ color: C.gold }}>有些事</span>
            <br />
            不该一个人扛着。
          </h1>
          <p className="text-[14px] leading-[1.85] mb-6" style={{ color: C.textMute }}>
            38–55 岁男人的 7 天私下试听
            <br />
            没人会知道你来过
          </p>
          <div
            className="inline-flex items-center gap-2 text-[12px] px-4 py-2 rounded-full"
            style={{ border: `1px solid ${C.divider}`, color: C.goldSoft }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            施强健康 ✕ 有劲AI · 本期专属体验价 ¥{price}
          </div>
          <div
            className="absolute inset-x-0 bottom-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }}
          />
        </header>

        {/* ============ 02 痛点共鸣 ============ */}
        <Section index={2} eyebrow="这门体验营，是为这样的男人准备的" title="如果有一条戳中你 —— 这 ¥399 就是入口">
          <ul className="space-y-4">
            {[
              "最近「那方面」有点不对劲，但还不想去医院。",
              "在妻子面前装作没事，心里其实在打鼓。",
              "想搜点信息，又怕浏览记录被看见。",
              "同龄人都很「行」，只有自己越来越沉默。",
              "你不是没人聊，是不想被一群人围观着聊。",
            ].map((line, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-[1.75]" style={{ color: C.text }}>
                <Quote className="w-4 h-4 mt-1.5 shrink-0" style={{ color: C.gold }} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ============ 03 7 天你会拿到什么 · 核心权益 ============ */}
        <Section index={3} eyebrow="7 天你会拿到什么" title="4 件事，按男人最在意的顺序排">
          <div className="space-y-4">
            {[
              {
                Icon: ClipboardList,
                tag: "核心权益 01 · 一次状态体检 + 1V1 教练式对话",
                title: "总教练腾讯会议 30 分钟 · 不是讲给你听，是陪你看见",
                desc:
                  "先把你这一年到底是哪一格在掉电——白天没劲、夜里睡不沉、关键场合发虚、回家就想一个人待着——一项一项摆出来。\n\n测完 48 小时内，总教练用腾讯会议跟你 1 对 1 坐 30 分钟。不是老师把答案讲给你听，是教练用一组一组的问题陪你慢慢看：哪一项你早就感觉到了、哪一项被忽略很久、哪一项你想先动——你说，他听，他再问。\n\n会议全程录下来、AI 自动整理纪要发你手机，过两周想再看一遍随时翻。",
              },
              {
                Icon: Pill,
                tag: "核心权益 02 · 1 瓶知乐胶囊 · 顺丰到家",
                title: "GABA + L-茶氨酸 + 酸枣仁 + 镁 · 给那根弦留点缓冲",
                desc:
                  "不是药，是给你这根一直绷着的弦留点缓冲。白天稳住情绪，晚上沉得下睡眠。0 褪黑素，不依赖。\n\n顺丰匿名包装，外箱不写「情绪」「男士」任何字眼，家里收件人看不出是什么。下单后 48 小时内寄出。",
              },
              {
                Icon: Users,
                tag: "核心权益 03 · 7 天有人陪你走",
                title: "每天 15 分钟 · 三件事 · 你不用一个人扛",
                desc:
                  "每天 15 分钟左右，三件事，你想从哪件开始都行——\n· 5 分钟男人专属静心：戴上耳机就行，不用盘腿、不用念词。\n· 和情绪教练聊几句：四步对话，今天哪根弦最紧、想松哪一格，自己说出来，系统给你一份当天的小简报。\n· 3 分钟反思：写下今天那一句自己最想记住的话，可以发到学员群、也可以只留给自己。\n\n中间随时想说话，AI 男士教练 24 小时在线，深夜也接，不留浏览记录。\n\n三件事做完，系统会给你出一张「当日卡片」——上面是你今天写下的那句话、教练的一句回应。可以存手机，也可以发给一个你信得过的人。一周 7 张连起来，就是你这 7 天真正动过的痕迹。",
              },
              {
                Icon: Award,
                tag: "核心权益 04 · 第 8 天 · 总教练再陪你坐 45 分钟",
                title: "腾讯会议 1V1 · 接下来这半年，先动哪一件",
                desc:
                  "7 天走完，不是发个证书就散。\n\n总教练用腾讯会议再跟你 1 对 1 坐 45 分钟。还是教练式对话——结合你这 7 天写下的话 + 第 1 天那份报告，他一组一组地问你：接下来这半年，你最想先动的，到底是哪一件。\n\n这一场也录下来、AI 出纪要，存你手机里。",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <card.Icon className="w-4 h-4" style={{ color: C.gold }} />
                  <p className="text-[11px] tracking-[0.2em]" style={{ color: C.gold }}>
                    {card.tag}
                  </p>
                </div>
                <h3 className="text-[16px] font-semibold mb-2" style={{ ...serif, color: C.text }}>
                  {card.title}
                </h3>
                <p className="text-[13px] leading-[1.85] whitespace-pre-line" style={{ color: C.textMute }}>
                  {card.desc}
                </p>

                {/* 核心权益 01 · 主教练展示 */}
                {i === 0 && (
                  <div
                    className="mt-4 flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "rgba(212,180,129,0.06)", border: `1px solid ${C.divider}` }}
                  >
                    <img
                      src={coachDaixi}
                      alt="总教练 黛汐"
                      className="w-14 h-14 rounded-full object-cover shrink-0"
                      style={{ border: `1px solid ${C.gold}` }}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold" style={{ ...serif, color: C.text }}>
                        总教练 · 黛汐
                      </p>
                      <p className="text-[11.5px] leading-[1.5] mt-0.5" style={{ color: C.textMute }}>
                        生命教练 / 国际脑点执行师 / PNCC 心流教练 / 高级心理咨询师
                      </p>
                    </div>
                  </div>
                )}

                {/* 核心权益 02 · 知乐胶囊产品大图 */}
                {i === 1 && (
                  <div
                    className="mt-4 rounded-lg overflow-hidden"
                    style={{ border: `1px solid ${C.divider}` }}
                  >
                    <img
                      src={zhileCapsules}
                      alt="知乐胶囊产品实拍"
                      className="w-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}

            <div
              className="flex items-start gap-2 px-4 py-3 rounded-lg"
              style={{ background: "rgba(212,180,129,0.06)", border: `1px dashed ${C.divider}` }}
            >
              <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: C.goldSoft }} />
              <p className="text-[11.5px] leading-[1.65]" style={{ color: C.goldSoft }}>
                实物由「有劲生活馆」统一发货 · 顺丰匿名包邮 · 下单后 48h 内寄出
              </p>
            </div>
          </div>
        </Section>

        {/* ============ 04 选择我们的 3 大核心优势 ============ */}
        <Section index={4} eyebrow="选择我们的 3 大核心优势" title="为什么是这 ¥399，而不是其他">
          <div className="space-y-4">
            {[
              {
                Icon: Video,
                title: "1V1 真人 · 不是群里走过场",
                points: [
                  "总教练腾讯会议跟你单独坐 2 次",
                  "前后 75 分钟全是你的时间",
                  "全程录像 + AI 纪要 · 只发你本人",
                ],
              },
              {
                Icon: EyeOff,
                title: "把隐私这件事做到位",
                points: [
                  "胶囊顺丰匿名包装 · 外箱不写敏感字",
                  "腾讯会议只你和教练 · 不进群、不外传",
                  "AI 男士教练深夜也在 · 不留浏览记录",
                ],
              },
              {
                Icon: Gem,
                title: "¥399 拿到的不是体验装",
                points: [
                  "胶囊 + 测评 + 教练 + 7 天陪走 · 一样不少",
                  "和 ¥3,980 闭门计划同一套核心 · 只是缩到 7 天",
                  "7 天无理由全额退款",
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
                    style={{ background: "rgba(212,180,129,0.12)", border: `1px solid ${C.divider}` }}
                  >
                    <adv.Icon className="w-4 h-4" style={{ color: C.gold }} />
                  </div>
                  <h3 className="text-[16px] font-semibold" style={{ ...serif, color: C.text }}>
                    优势 {i + 1} · {adv.title}
                  </h3>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {adv.points.map((p, j) => (
                    <li key={j} className="text-[13px] leading-[1.75] flex gap-2" style={{ color: C.textMute }}>
                      <span style={{ color: C.gold }}>·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 05 带场教练团 ============ */}
        <Section index={5} eyebrow="带场的不是 AI · 是真人教练" title="6 位资深教练 · 轮值带场">
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
                  style={{ border: `1px solid ${C.gold}` }}
                />
                <p className="text-[13px] font-semibold" style={{ ...serif, color: C.text }}>
                  {c.name}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: C.gold }}>
                  {c.role}
                </p>
                <p className="text-[10px] leading-[1.5] mt-1" style={{ color: C.textMute }}>
                  {c.subtitle}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mt-5 flex items-center gap-3 p-4 rounded-xl"
            style={{ background: "rgba(212,180,129,0.06)", border: `1px solid ${C.divider}` }}
          >
            <div className="p-1.5 rounded-lg shrink-0" style={{ background: C.text }}>
              <img src={wecomCoachQr} alt="助教企微二维码" className="w-20 h-20 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold mb-1" style={{ ...serif, color: C.text }}>
                付款后专属助教 1 对 1 对接
              </p>
              <p className="text-[11.5px] leading-[1.65]" style={{ color: C.textMute }}>
                扫码加入私密企微，48h 内安排入营事项 · 全程匿名
              </p>
            </div>
          </div>
        </Section>

        {/* ============ 06 信任保障 ============ */}
        <Section index={6} eyebrow="我们懂你的在意" title="4 条不可妥协的隐私承诺">
          {/* 顶部承诺徽章带 */}
          <div
            className="flex items-center justify-around gap-2 mb-5 p-3 rounded-xl"
            style={{ background: "rgba(212,180,129,0.06)", border: `1px solid ${C.divider}` }}
          >
            <div className="text-center flex-1">
              <p className="text-[15px] font-bold" style={{ ...serif, color: C.gold }}>22 年</p>
              <p className="text-[10.5px] mt-0.5" style={{ color: C.textMute }}>施强健康背书</p>
            </div>
            <div className="w-px h-8" style={{ background: C.divider }} />
            <div className="text-center flex-1">
              <p className="text-[15px] font-bold" style={{ ...serif, color: C.gold }}>0</p>
              <p className="text-[10.5px] mt-0.5" style={{ color: C.textMute }}>朋友圈曝光</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { t: "海沃塔小组实名审核", d: "仅限同龄男性 · 全程不录像不外传" },
              { t: "课程链接仅本人可看", d: "不可分享转发，链接绑定账号" },
              { t: "沟通仅你与教练可见", d: "平台不留对话记录" },
              { t: "施强健康 22 年背书", d: "男性健康服务专业资质" },
            ].map((p, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Lock className="w-4 h-4 mt-1 shrink-0" style={{ color: C.gold }} />
                <div>
                  <p className="text-[14px] font-semibold mb-0.5" style={{ color: C.text }}>
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

        {/* ============ 07 同龄人证言 ============ */}
        <Section index={7} eyebrow="先走一步的他们，说了这些" title="同龄人，不是鸡汤">
          <div className="space-y-4">
            {[
              {
                name: "王先生 · 47 岁 · 企业主",
                quote: "第一次有人把这件事讲清楚，不羞辱我。",
              },
              {
                name: "陈先生 · 52 岁 · 工程师",
                quote: "海沃塔那场对话之后我才意识到 —— 原来不是身体先好，是先敢面对。",
              },
              {
                name: "李先生 · 41 岁 · 销售总监",
                quote: "每天 15 分钟，不耽误应酬。但 7 天下来，是这两年第一次睡得踏实。",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{ background: C.bgCard, borderLeft: `2px solid ${C.gold}` }}
              >
                <p className="text-[14px] leading-[1.85] mb-3 italic" style={{ color: C.text }}>
                  「{t.quote}」
                </p>
                <p className="text-[12px]" style={{ color: C.goldSoft }}>
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
                  a: "全程线上。海沃塔团队对话固定 1 场（晚上 8 点开播，约 75 分钟），错过支持回放。每日冥想和 AI 教练 24h 随时用，每天约 15 分钟，不耽误工作和应酬。",
                },
                {
                  q: "AI 教练随时能聊吗？真人教练会一对一回应吗？",
                  a: "AI 男士教练 24h 在线，深夜也能问，不留浏览记录。海沃塔场内由真人总教练带场。报名后专属顾问会加你单独沟通入营事项，全流程不打官腔。",
                },
                {
                  q: "报名后怎么开始？需要自己摸索吗？",
                  a: "完全不用。付款后专人 1v1 对接：① 加入私密社群 ② 发送课程链接（绑定账号） ③ 48h 内顺丰寄出知乐胶囊。开营前一天会有提醒，跟着节奏走就行。",
                },
                {
                  q: "我的家人 / 同事会知道吗？",
                  a: "不会。全程匿名昵称，社群实名审核仅平台后台可见。课程链接不可转发，绑定你的账号。物流外包装无任何敏感字样，由「有劲生活馆」名义寄出。",
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
                    <span className="pr-2 flex-1">Q{i + 1} · {item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent
                    className="px-4 pb-4 text-[13px] leading-[1.85]"
                    style={{ color: C.textMute }}
                  >
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <p className="text-[11.5px] text-center mt-4" style={{ color: C.goldSoft }}>
            还有其他疑问？点底部「先匿名咨询」与顾问 1v1 沟通
          </p>
        </Section>

        {/* ============ 09 价格 + CTA ============ */}
        <section className="px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs tracking-[0.2em] font-mono" style={{ color: C.gold }}>
              09 / 09
            </span>
            <div className="flex-1 h-px" style={{ background: C.divider }} />
          </div>

          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: `linear-gradient(160deg, #2a201a 0%, ${C.wine} 100%)`,
              border: `1.5px solid ${C.gold}`,
            }}
          >
            <p className="text-[12px] tracking-[0.3em] mb-3" style={{ color: C.gold }}>
              本期专属体验价 · LIMITED
            </p>
            <h2 className="text-[20px] mb-4 font-semibold leading-[1.5]" style={{ ...serif, color: C.text }}>
              先用 ¥{price}，
              <br />
              给自己一次安静的机会
            </h2>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span
                className="text-[14px] line-through"
                style={{ color: "rgba(232,227,216,0.45)" }}
              >
                原价 ¥688
              </span>
            </div>
            <div className="flex items-baseline justify-center gap-1.5 mb-3">
              <span style={{ color: C.gold, fontSize: 18, ...serif }}>¥</span>
              <span
                style={{
                  ...serif,
                  color: C.gold,
                  fontSize: 56,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {price}
              </span>
            </div>
            <p className="text-[12px] leading-[1.7]" style={{ color: "rgba(232,227,216,0.7)" }}>
              限量体验名额 · 满员即恢复原价 ¥688
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handlePrimaryCTA}
              className="w-full py-4 rounded-xl text-[16px] font-semibold transition active:scale-[0.98]"
              style={{
                background: C.gold,
                color: C.bgSoft,
                boxShadow: "0 8px 24px rgba(212,180,129,0.28)",
              }}
            >
              立即加入身心舒展计划 →
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

          <p className="text-[11px] text-center mt-6 leading-[1.85]" style={{ color: C.textMute }}>
            付款即视为同意《购买须知》与《隐私承诺》
            <br />
            你为客户、为家人花了那么多钱
            <br />
            这一次，请为自己留 ¥{price} 和 7 天。
          </p>
        </section>

        {/* 底部留白，避免被 sticky 挡住 */}
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
              background: C.gold,
              color: C.bgSoft,
              boxShadow: "0 -2px 16px rgba(0,0,0,0.5), 0 8px 24px rgba(212,180,129,0.22)",
            }}
          >
            {checkingPurchase ? "正在确认开通状态..." : hasPurchased ? "已购买，开始训练" : `¥${price} · 立即加入身心舒展计划`}
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
                name: "中年男性 7 天身心舒展计划",
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
