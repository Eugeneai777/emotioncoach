import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { ShieldCheck, Lock, MessageCircle, ChevronRight, Quote } from "lucide-react";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { usePackageByKey } from "@/hooks/usePackages";
import { useWechatOpenId } from "@/hooks/useWechatOpenId";
import { useAuth } from "@/hooks/useAuth";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import { PromoFloatingBackButton } from "@/components/promo/PromoFloatingBackButton";

/**
 * 中年男性 3980 闭门修复计划 售前页
 * 路由：/promo/midlife-men-3980
 * 复用 identity_bloom (¥3980) 套餐
 */

const PACKAGE_KEY = "identity_bloom";
const RETURN_URL = "/promo/midlife-men-3980";

// ============ 设计 Token（深色高级质感）============
// 炭黑 #1a1a1a / 暖金 #c9a876 / 暗酒红 #6b2c2c
const C = {
  bg: "#0f0f0f",
  bgSoft: "#1a1a1a",
  bgCard: "#1f1d1b",
  gold: "#c9a876",
  goldSoft: "#a8895a",
  wine: "#6b2c2c",
  text: "#e8e3d8",
  textMute: "#8a8478",
  divider: "rgba(201,168,118,0.25)",
};

const serif = { fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif' };

function Section({
  index,
  total = 9,
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
        <span
          className="text-xs tracking-[0.2em] font-mono"
          style={{ color: C.gold }}
        >
          {num}
        </span>
        <div className="flex-1 h-px" style={{ background: C.divider }} />
      </div>
      {eyebrow && (
        <p className="text-xs tracking-widest mb-2" style={{ color: C.goldSoft }}>
          {eyebrow}
        </p>
      )}
      <h2
        className="text-[22px] leading-[1.4] font-semibold mb-5"
        style={{ ...serif, color: C.text }}
      >
        {title}
      </h2>
      <div style={{ color: C.text }}>{children}</div>
    </motion.section>
  );
}

export default function PromoMidlifeMen3980() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPay, setShowPay] = useState(false);
  const [resumedOpenId, setResumedOpenId] = useState<string | undefined>();
  const openId = useWechatOpenId();
  const { data: pkg } = usePackageByKey(PACKAGE_KEY);
  const price = pkg?.price ?? 3980;

  usePaymentCallback({
    onSuccess: () => {
      navigate("/camp-intro/identity_bloom");
    },
  });

  // 标记 openId 引用以避免 lint 警告（保留以备未来支付恢复扩展）
  void resumedOpenId;
  void setResumedOpenId;

  const handlePrimaryCTA = () => {
    if (!user) {
      setPostAuthRedirect(RETURN_URL);
      navigate(`/auth?redirect=${encodeURIComponent(RETURN_URL)}`);
      return;
    }
    setShowPay(true);
  };

  const handleConsult = () => {
    navigate("/customer-support");
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: C.bg, color: C.text }}
    >
      <PromoFloatingBackButton />
      <Helmet>
        <title>38–55 男人闭门修复计划 | 有劲 ✕ 施强健康</title>
        <meta
          name="description"
          content="一份只给 38–55 岁男人看的私密修复计划：身体重启 · 心理重建 · 关系修复。闭门席位有限。"
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
          <p
            className="text-xs tracking-[0.4em] mb-5"
            style={{ color: C.gold }}
          >
            FOR&nbsp;MEN&nbsp;38–55
          </p>
          <h1
            className="text-[30px] leading-[1.35] font-bold mb-4"
            style={{ ...serif, color: C.text }}
          >
            一个 45 岁男人，
            <br />
            最不敢说出口的事
          </h1>
          <p
            className="text-[15px] leading-[1.8] mb-6"
            style={{ color: C.textMute }}
          >
            不是事业，不是房贷，
            <br />
            是身体不再听话，是夜里翻身的沉默。
          </p>
          <div
            className="inline-flex items-center gap-2 text-[12px] px-4 py-2 rounded-full"
            style={{ border: `1px solid ${C.divider}`, color: C.goldSoft }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            施强健康 ✕ 有劲AI · 中年男性闭门席位
          </div>
          <div
            className="absolute inset-x-0 bottom-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }}
          />
        </header>

        {/* ============ 02 痛点共鸣 ============ */}
        <Section index={2} eyebrow="你咽下去过的 5 句话" title="不是矫情，是这一代男人的集体沉默">
          <ul className="space-y-4">
            {[
              "「最近太累了」——其实是不想让她失望。",
              "「年纪到了都这样」——其实心里慌得很。",
              "「下次再说吧」——已经躲了半年。",
              "「我没事」——夜里两点还睁着眼。",
              "「等忙完这阵」——这阵已经三年了。",
            ].map((line, i) => (
              <li
                key={i}
                className="flex gap-3 text-[15px] leading-[1.75]"
                style={{ color: C.text }}
              >
                <Quote
                  className="w-4 h-4 mt-1.5 shrink-0"
                  style={{ color: C.gold }}
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ============ 03 风险升维 ============ */}
        <Section index={3} eyebrow="一个被低估的代价" title="身体退一步，关系会退十步">
          <div className="space-y-3">
            {[
              { from: "身体退 1 步", to: "自信退 3 步" },
              { from: "自信退 3 步", to: "情绪退 5 步" },
              { from: "情绪退 5 步", to: "亲密退 8 步" },
              { from: "亲密退 8 步", to: "关系退 10 步" },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-lg"
                style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}
              >
                <span style={{ ...serif, color: C.text, fontSize: 15 }}>{s.from}</span>
                <ChevronRight className="w-4 h-4" style={{ color: C.gold }} />
                <span
                  style={{ ...serif, color: C.gold, fontSize: 15, fontWeight: 600 }}
                >
                  {s.to}
                </span>
              </div>
            ))}
            <p
              className="text-[13px] leading-[1.8] pt-2"
              style={{ color: C.textMute }}
            >
              真正崩塌的从来不是身体本身，
              <br />
              而是「我还行不行」这件事，没人帮你重建。
            </p>
          </div>
        </Section>

        {/* ============ 04 隐秘修复计划 三步闭环 ============ */}
        <Section index={4} eyebrow="隐秘修复计划" title="一份只给中年男人看的 3 步闭环">
          <div className="space-y-4">
            {[
              {
                no: "STEP 01",
                title: "身体重启",
                desc: "睡眠、精力、激素节律的私密评估与重建路径，不靠保健品堆砌。",
              },
              {
                no: "STEP 02",
                title: "心理重建",
                desc: "把「我是不是不行了」翻译成可拆解的命题，重新看见自己作为男人的力量。",
              },
              {
                no: "STEP 03",
                title: "关系修复",
                desc: "重新学会在伴侣面前不逞强、不沉默，让她在你身边再一次安心。",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.divider}`,
                }}
              >
                <p
                  className="text-[11px] tracking-[0.25em] mb-2"
                  style={{ color: C.gold }}
                >
                  {step.no}
                </p>
                <h3
                  className="text-[18px] font-semibold mb-2"
                  style={{ ...serif, color: C.text }}
                >
                  {step.title}
                </h3>
                <p className="text-[14px] leading-[1.75]" style={{ color: C.textMute }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 05 6 大闭门专题 ============ */}
        <Section index={5} eyebrow="6 大闭门专题" title="不教你养生，只解决你不敢问医生的事">
          <div className="grid grid-cols-2 gap-3">
            {[
              { n: "01", t: "夜里那件事", d: "硬度、频率、心理压力的男性私密议题" },
              { n: "02", t: "压力与激素", d: "睾酮、皮质醇与中年塌方的真相" },
              { n: "03", t: "腰腹与精力", d: "代谢崩盘背后的隐性生活方式" },
              { n: "04", t: "睡眠与修复", d: "中年男人 4 点醒的神经机制" },
              { n: "05", t: "面子与自尊", d: "在伴侣 / 同事面前的微表情管理" },
              { n: "06", t: "亲密对话", d: "如何不再用「忙」掩盖一切" },
            ].map((c) => (
              <div
                key={c.n}
                className="p-4 rounded-lg"
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.divider}`,
                }}
              >
                <p
                  className="text-[11px] mb-2 tracking-widest"
                  style={{ color: C.gold }}
                >
                  {c.n}
                </p>
                <h4
                  className="text-[14px] font-semibold mb-1.5"
                  style={{ ...serif, color: C.text }}
                >
                  {c.t}
                </h4>
                <p className="text-[12px] leading-[1.6]" style={{ color: C.textMute }}>
                  {c.d}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 06 交付清单 ============ */}
        <Section index={6} eyebrow="3980 你拿到的不是一门课" title="一份完整的「中年男性私人修复包」">
          <div
            className="p-5 rounded-xl space-y-3.5"
            style={{
              background: C.bgCard,
              border: `1.5px solid ${C.gold}`,
            }}
          >
            {[
              "1 次资深教练 1v1 闭门访谈（私密、不进社群）",
              "16 节男性专属音频课（夜间通勤可听）",
              "6 大闭门专题深度讲解 + 实操脚本",
              "12 周私人小队微信群（同龄人，不混龄、不混性别）",
              "知乐胶囊 4 瓶草本调理（HKC 认证）",
              "结业「身体 ✕ 心理 ✕ 关系」三维成长报告",
            ].map((line, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span
                  className="mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold"
                  style={{
                    background: C.gold,
                    color: C.bgSoft,
                  }}
                >
                  ✓
                </span>
                <span className="text-[14px] leading-[1.75]">{line}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 07 同龄人证言 ============ */}
        <Section index={7} eyebrow="他们走过这条路" title="同龄人，不是鸡汤">
          <div className="space-y-4">
            {[
              {
                name: "陈先生 · 47 岁 · 制造业管理",
                quote:
                  "第一次有人跟我聊「夜里那件事」不是用药卖品，而是认真问我「你最近睡得好吗」。",
              },
              {
                name: "王先生 · 52 岁 · 投资人",
                quote:
                  "我以为是身体问题，第三周才发现，是我已经 8 年没真正跟太太说过软话。",
              },
              {
                name: "刘先生 · 41 岁 · 自由职业",
                quote:
                  "不再用「我没事」骗自己。现在我每天会留 15 分钟，只问自己一句：今天累在哪。",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{
                  background: C.bgCard,
                  borderLeft: `2px solid ${C.gold}`,
                }}
              >
                <p
                  className="text-[14px] leading-[1.85] mb-3 italic"
                  style={{ color: C.text }}
                >
                  「{t.quote}」
                </p>
                <p className="text-[12px]" style={{ color: C.goldSoft }}>
                  — {t.name}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 08 隐私与承诺 ============ */}
        <Section index={8} eyebrow="我们知道你最在意什么" title="4 条不可妥协的承诺">
          <div className="space-y-3">
            {[
              { t: "全程匿名昵称制", d: "不强制实名，不进大社群" },
              { t: "1v1 教练保密协议", d: "你说的每一句话，仅限你与教练" },
              { t: "无任何广告与外推", d: "不向你推销任何外部产品" },
              { t: "7 日全额退款", d: "前 7 天不满意，原路退回，无需理由" },
            ].map((p, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Lock
                  className="w-4 h-4 mt-1 shrink-0"
                  style={{ color: C.gold }}
                />
                <div>
                  <p
                    className="text-[14px] font-semibold mb-0.5"
                    style={{ color: C.text }}
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

        {/* ============ 09 价格 + CTA ============ */}
        <section className="px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs tracking-[0.2em] font-mono"
              style={{ color: C.gold }}
            >
              09 / 09
            </span>
            <div className="flex-1 h-px" style={{ background: C.divider }} />
          </div>

          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: `linear-gradient(160deg, ${C.wine} 0%, #3a1717 100%)`,
              border: `1.5px solid ${C.gold}`,
            }}
          >
            <p
              className="text-[12px] tracking-[0.3em] mb-3"
              style={{ color: C.gold }}
            >
              闭门席位 · LIMITED
            </p>
            <h2
              className="text-[22px] mb-4 font-semibold"
              style={{ ...serif, color: C.text }}
            >
              中年男人的隐秘修复计划
            </h2>
            <div className="flex items-baseline justify-center gap-1.5 mb-2">
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
            <p className="text-[12px]" style={{ color: "rgba(232,227,216,0.7)" }}>
              一次性 · 含全部交付 · 不再加价
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handlePrimaryCTA}
              className="w-full py-4 rounded-xl text-[16px] font-semibold transition active:scale-[0.98]"
              style={{
                background: C.gold,
                color: C.bgSoft,
                boxShadow: "0 8px 24px rgba(201,168,118,0.25)",
              }}
            >
              锁定我的席位 →
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
              先和顾问 1 对 1 聊聊
            </button>
          </div>

          <p
            className="text-[11px] text-center mt-6 leading-[1.8]"
            style={{ color: C.textMute }}
          >
            付款即视为同意《购买须知》与《隐私承诺》
            <br />
            施强健康 ✕ 有劲AI 联合出品
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
              boxShadow: "0 -2px 16px rgba(0,0,0,0.5), 0 8px 24px rgba(201,168,118,0.2)",
            }}
          >
            ¥{price} · 锁定我的闭门席位
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
                name: "中年男性闭门修复计划",
                price: price,
              }
            : null
        }
        onSuccess={() => {
          setShowPay(false);
          navigate("/camp-intro/identity_bloom");
        }}
        returnUrl={RETURN_URL}
        openId={resumedOpenId || openId}
      />
    </div>
  );
}
