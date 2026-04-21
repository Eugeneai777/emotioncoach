import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { ShieldCheck, Lock, MessageCircle, Quote, Users, Wind, Bot, ArrowUpRight, Pill, Truck } from "lucide-react";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { usePackageByKey } from "@/hooks/usePackages";
import { useWechatOpenId } from "@/hooks/useWechatOpenId";
import { useAuth } from "@/hooks/useAuth";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";

/**
 * 中年男性 ¥399 体验营 售前页
 * 路由：/promo/midlife-men-399
 * 复用 camp-emotion_stress_7 (¥399 / 7 天)
 * 与 /promo/midlife-men-3980 形成 399 → 3980 转化闭环
 */

const PACKAGE_KEY = "camp-emotion_stress_7";
const RETURN_URL = "/promo/midlife-men-399";

// 与 3980 页一致的设计 token，色温稍亮（多用暖金）
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
  const handleUpsell = () => navigate("/promo/midlife-men-3980");

  return (
    <div className="min-h-screen w-full" style={{ background: C.bg, color: C.text }}>
      <Helmet>
        <title>38–55 男人私下试听体验营 ¥399 | 有劲 ✕ 施强健康</title>
        <meta
          name="description"
          content="一杯酒钱，先和同龄人坐下来聊一次。海沃塔团队教练 + 每日冥想 + AI 男士教练，7 天私下试听。学费可全额抵扣 ¥3980 闭门修复计划。"
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
          <h1 className="text-[28px] leading-[1.4] font-bold mb-4" style={{ ...serif, color: C.text }}>
            40 岁以后那点
            <br />
            「难言之隐」
            <br />
            <span style={{ color: C.gold }}>愿意花一杯酒钱</span>
            <br />
            先和同龄人聊一次吗？
          </h1>
          <p className="text-[14px] leading-[1.85] mb-6" style={{ color: C.textMute }}>
            中年男性「私下试听」体验营
            <br />
            38–55 岁 · 7 天 · 一次没人知道的内部对话
          </p>
          <div
            className="inline-flex items-center gap-2 text-[12px] px-4 py-2 rounded-full"
            style={{ border: `1px solid ${C.divider}`, color: C.goldSoft }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            施强健康 ✕ 有劲AI · 仅限本期 · ¥{price}
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
              "想找人聊，但身边一个能开口的都没有。",
            ].map((line, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-[1.75]" style={{ color: C.text }}>
                <Quote className="w-4 h-4 mt-1.5 shrink-0" style={{ color: C.gold }} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ============ 03 体验营定位 ============ */}
        <Section index={3} eyebrow="¥399 体验营要做的只有一件事" title="我们不教知识，我们陪你「敢面对」">
          <div className="space-y-4 text-[15px] leading-[1.85]" style={{ color: C.text }}>
            <p style={{ color: C.textMute }}>
              很多中年男人不是不知道问题，
              <br />
              是不敢承认问题、不知道找谁问、不知道下一步往哪走。
            </p>
            <p>
              让你在 7 天里，第一次坐进一个
              <span style={{ color: C.gold }}>「全是同龄男人」</span>
              的小房间，
              <br />
              把咽了很久的那句话，<span style={{ color: C.gold }}>安全地说出口</span>。
            </p>
            <p style={{ color: C.textMute }}>
              身体的事 —— 先有人懂你，再谈怎么解决。
            </p>
          </div>
        </Section>

        {/* ============ 04 7 天交付路径 ============ */}
        <Section index={4} eyebrow="7 天交付 · 海沃塔团队教练制" title="不是听课，是被听见">
          <div className="space-y-4">
            {[
              {
                Icon: Users,
                tag: "2 场 · 海沃塔团队对话",
                title: "同龄 6–8 人小组 · 每场 75 分钟",
                desc: "在教练带领下，和同龄男人 1 对 1 配对深度对话。不是被讲话，是被听见。",
              },
              {
                Icon: Wind,
                tag: "7 天 · 每日「男人静心」冥想",
                title: "真人录制 · 每段 10 分钟",
                desc: "睡前 / 通勤随时听。把绷紧的身体，先松开一寸。",
              },
              {
                Icon: Bot,
                tag: "7 天 · AI 男士专属教练",
                title: "24h 陪伴 · 不必脸红",
                desc: "深夜也能问。不留对话记录，仅你与教练可见。",
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
                <p className="text-[13px] leading-[1.75]" style={{ color: C.textMute }}>
                  {card.desc}
                </p>
              </div>
            ))}

            {/* 第 4 张：知乐胶囊（实物交付） */}
            <div
              className="p-5 rounded-xl relative"
              style={{ background: C.bgCard, border: `1px solid ${C.divider}` }}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4" style={{ color: C.gold }} />
                  <p className="text-[11px] tracking-[0.2em]" style={{ color: C.gold }}>
                    1 瓶 · 知乐胶囊（30 粒装）
                  </p>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    background: `${C.wine}4D`,
                    color: C.gold,
                    border: `1px solid ${C.gold}66`,
                  }}
                >
                  已含在 ¥399 体验营内
                </span>
              </div>
              <h3 className="text-[16px] font-semibold mb-1" style={{ ...serif, color: C.text }}>
                7 天体验装 · 随营寄出
              </h3>
              <p className="text-[13px] leading-[1.75] mb-3" style={{ color: C.textMute }}>
                白天稳住情绪、晚上沉得住睡眠的「身体兜底」。
              </p>
              <ul className="space-y-2 text-[13px] leading-[1.7]" style={{ color: "rgba(236,231,220,0.82)" }}>
                <li>🌿 GABA + L-茶氨酸：缓解工作日「绷着的那根弦」</li>
                <li>🌙 酸枣仁 + 镁：帮 40+ 男士拿回深度睡眠</li>
                <li>💊 0 褪黑素 / 不依赖：起床清醒、不昏沉</li>
              </ul>
            </div>

            <div
              className="flex items-start gap-2 px-4 py-3 rounded-lg"
              style={{ background: "rgba(212,180,129,0.06)", border: `1px dashed ${C.divider}` }}
            >
              <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: C.goldSoft }} />
              <p className="text-[11.5px] leading-[1.65]" style={{ color: C.goldSoft }}>
                实物由「有劲生活馆」统一发货 · 顺丰包邮 · 下单后 48h 内寄出
              </p>
            </div>

            <p className="text-[12px] text-center pt-2" style={{ color: C.goldSoft }}>
              全程匿名 · 不留观看痕迹 · 不进朋友圈
            </p>
          </div>
        </Section>

        {/* ============ 05 ¥399 权益清单 ============ */}
        <Section index={5} eyebrow="¥399 你拿到的，不只是 7 天" title="一杯酒钱，换一次安全地「被同类听见」">
          <div
            className="p-5 rounded-xl space-y-3.5"
            style={{ background: C.bgCard, border: `1.5px solid ${C.gold}` }}
          >
            {[
              "2 场海沃塔团队教练直播对话（小组制 · 同龄同状态）",
              "7 天每日男人静心引导冥想（真人录音 · 私密回放）",
              "AI 男士专属教练 7 天无限对话",
              "1 瓶知乐胶囊（7 天体验装 · 顺丰包邮到家）",
              "中年男人专属社群 7 天体验席位（实名审核）",
              "1 份《男人 40 自检手册》电子版（PDF · 私密下载）",
              "1 次顾问 1v1 文字咨询（15 分钟 · 不留记录）",
            ].map((line, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span
                  className="mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold"
                  style={{ background: C.gold, color: C.bgSoft }}
                >
                  ✓
                </span>
                <span className="text-[14px] leading-[1.75]">{line}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ============ 06 同龄人证言 ============ */}
        <Section index={6} eyebrow="先走一步的他们，说了这些" title="同龄人，不是鸡汤">
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
                quote: "体验营 7 天结束我直接报了 3980 那期 —— 因为我知道这件事值得正经处理一次。",
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

        {/* ============ 07 隐私承诺 ============ */}
        <Section index={7} eyebrow="我们承诺的，不只是内容" title="5 条不可妥协的隐私承诺">
          <div className="space-y-3">
            {[
              { t: "海沃塔小组实名审核", d: "仅限同龄男性 · 全程不录像不外传" },
              { t: "课程链接仅本人可看", d: "不可分享转发，链接绑定账号" },
              { t: "1v1 沟通仅你与教练可见", d: "平台不留对话记录" },
              { t: "7 天无理由全额退款", d: "不满意，原路退回，无需理由" },
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

        {/* ============ 08 升舱钩子 → 3980 ============ */}
        <Section index={8} eyebrow="如果 7 天后你想「正经处理」这件事" title="¥399 学费，可全额抵扣 ¥3980 闭门修复计划">
          <div
            className="p-5 rounded-xl space-y-4"
            style={{
              background: `linear-gradient(160deg, ${C.bgCard} 0%, #2a2520 100%)`,
              border: `1.5px solid ${C.gold}`,
            }}
          >
            <p className="text-[14px] leading-[1.85]" style={{ color: C.text }}>
              ¥399 体验营结束后，每一位完赛的学员，
              <br />
              将获得一次
              <span style={{ color: C.gold }}>「中年男性闭门修复计划」(¥3980)</span>
              的内部席位评估。
            </p>
            <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: C.divider }}>
              {[
                "¥399 学费 全额抵扣 闭门修复计划",
                "优先锁定本期 200 个限定席位",
                "由总教练 1 对 1 路径定制（不公开报名）",
              ].map((line, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span style={{ color: C.gold, fontSize: 13 }}>✓</span>
                  <span className="text-[13.5px] leading-[1.7]">{line}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 space-y-1 text-[12px]" style={{ color: C.textMute }}>
              <p>—— 体验营，是入场券</p>
              <p style={{ color: C.gold }}>—— 闭门修复计划，才是真正的修复</p>
            </div>
            <button
              onClick={handleUpsell}
              className="w-full mt-2 py-2.5 rounded-lg text-[12.5px] flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
              style={{ border: `1px solid ${C.divider}`, color: C.goldSoft }}
            >
              先看看 ¥3980 闭门修复计划
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
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
              本期联合首发 · LIMITED
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
                原价 ¥598
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
              含全部交付 · 学费可全额抵扣 ¥3980 闭门修复
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
              立即开通体验营 →
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
              先和顾问聊 5 分钟（免费 · 匿名）
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
            ¥{price} · 立即开通 7 天体验营
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
                name: "中年男性 7 天私下试听体验营",
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
