import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Sun, Bell, Smile, Users, Shield, Eye, BookOpen, Share2, CheckCircle, Calendar, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const painPoints = [
  { emoji: "💬", text: "一个人在家，常常想说话却没人听" },
  { emoji: "💊", text: "有些小事总怕忘，吃药、喝水、休息都需要提醒" },
  { emoji: "📱", text: "子女工作忙，不在身边，常常牵挂爸妈状态" },
  { emoji: "😣", text: "手机功能太复杂，真正适合长辈的却很少" },
];

const features = [
  {
    icon: MessageCircle,
    title: "陪我聊聊天",
    desc: "无聊时聊几句，烦闷时说一说，像有人在身边陪着你",
    btn: "开始聊天",
    color: "hsl(25 90% 95%)",
    iconColor: "hsl(25 80% 55%)",
    route: "/elder-care/chat",
  },
  {
    icon: Sun,
    title: "每日暖心问候",
    desc: "每天一句问候，让生活更有陪伴感",
    btn: "查看今日问候",
    color: "hsl(45 90% 94%)",
    iconColor: "hsl(45 80% 45%)",
    route: "/elder-care/greeting",
  },
  {
    icon: Bell,
    title: "重要提醒",
    desc: "吃药、喝水、散步、休息，不容易忘",
    btn: "设置提醒",
    color: "hsl(150 40% 94%)",
    iconColor: "hsl(150 50% 40%)",
    route: "/elder-care/reminders",
  },
  {
    icon: Smile,
    title: "今天感觉怎么样",
    desc: "轻轻一点，记录今天的心情和状态",
    btn: "记录今天",
    color: "hsl(210 60% 95%)",
    iconColor: "hsl(210 60% 50%)",
    route: "/elder-care/mood",
  },
];

const trustPoints = [
  { emoji: "🔤", title: "字大、按钮大、页面简单" },
  { emoji: "👆", title: "不需要学复杂操作" },
  { emoji: "🤗", title: "内容温和，像家人一样说话" },
];

/* ===== 产品转化模块 ===== */
const productCards = [
  {
    emoji: "✅",
    title: "每日平安打卡",
    desc: "长辈每天轻点一下，子女就能收到平安通知。超过设定时间没打卡，系统自动提醒家人。",
    btn: "开启平安打卡",
    route: "/alive-check",
    color: "hsl(150 40% 93%)",
    iconColor: "hsl(150 50% 40%)",
    tag: "免费",
  },
  {
    emoji: "🧘",
    title: "7天情绪舒缓营",
    desc: "专为长辈设计的情绪管理训练营。每天15分钟，学会放松和调节情绪。",
    btn: "了解详情",
    route: "/camp-list",
    color: "hsl(270 35% 94%)",
    iconColor: "hsl(270 40% 50%)",
    tag: "推荐",
  },
  {
    emoji: "📊",
    title: "情绪健康测评",
    desc: "3分钟了解长辈的情绪健康状况，获得个性化建议。",
    btn: "开始测评",
    route: "/emotion-health",
    color: "hsl(210 50% 94%)",
    iconColor: "hsl(210 55% 50%)",
    tag: "免费",
  },
];

const ElderCarePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/elder-care`;
    const refCode = localStorage.getItem("share_ref_code");
    const url = refCode ? `${shareUrl}?ref=${refCode}` : shareUrl;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "有劲陪长辈 — 给爸妈一个更安心的陪伴入口",
          text: "会聊天、会问候、会提醒、会关怀，简单到长辈一看就懂",
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "链接已复制 ✅", description: "发送给家人即可" });
    }
  };

  const handleComingSoon = (label: string) => {
    toast({
      title: `「${label}」即将开放`,
      description: "我们正在努力准备中，敬请期待 🌿",
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(30 60% 98%)" }}>
      {/* ===== 1. Hero 首屏 ===== */}
      <section
        className="px-5 pt-12 pb-10 text-center"
        style={{
          background: "linear-gradient(180deg, hsl(30 70% 95%) 0%, hsl(30 60% 98%) 100%)",
        }}
      >
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="text-5xl mb-4 block">🌿</span>
        </motion.div>
        <motion.h1
          className="text-2xl sm:text-3xl font-bold leading-snug mb-3"
          style={{ color: "hsl(25 40% 30%)" }}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          给长辈一个更安心的
          <br />
          陪伴入口
        </motion.h1>
        <motion.p
          className="text-base sm:text-lg leading-relaxed mb-8"
          style={{ color: "hsl(25 30% 45%)" }}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
        >
          会聊天、会问候、会提醒、会关怀
          <br />
          简单到长辈一看就懂，一点就能用
        </motion.p>
        <motion.div
          className="flex flex-col gap-3 max-w-xs mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <Button
            className="w-full text-lg font-semibold rounded-2xl shadow-md"
            style={{
              backgroundColor: "hsl(25 75% 55%)",
              color: "white",
              minHeight: 56,
            }}
            onClick={() => navigate("/elder-care/chat")}
          >
            🧓 我是长辈，马上开始
          </Button>
          <Button
            variant="outline"
            className="w-full text-lg font-semibold rounded-2xl"
            style={{
              borderColor: "hsl(25 60% 70%)",
              color: "hsl(25 60% 40%)",
              minHeight: 56,
            }}
            onClick={handleShare}
          >
            💝 分享给爸妈
          </Button>
        </motion.div>
        <motion.p
          className="mt-4 text-sm"
          style={{ color: "hsl(25 20% 60%)" }}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
        >
          「有劲陪长辈」— 让陪伴更简单
        </motion.p>
      </section>

      {/* ===== 2. 痛点区 ===== */}
      <section className="px-5 py-10">
        <motion.h2
          className="text-xl font-bold text-center mb-2 leading-snug"
          style={{ color: "hsl(25 40% 30%)" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          很多长辈需要的
          <br />
          不是复杂功能
        </motion.h2>
        <motion.p
          className="text-base text-center mb-6"
          style={{ color: "hsl(25 25% 50%)" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
        >
          而是有人陪、有人记得、有人关心
        </motion.p>
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          {painPoints.map((p, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ backgroundColor: "hsl(30 50% 96%)" }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 2}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{p.emoji}</span>
              <p className="text-base leading-relaxed" style={{ color: "hsl(25 35% 35%)" }}>
                {p.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== 3. 核心功能区 ===== */}
      <section className="px-5 py-10" style={{ backgroundColor: "hsl(30 40% 97%)" }}>
        <motion.h2
          className="text-xl font-bold text-center mb-6"
          style={{ color: "hsl(25 40% 30%)" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          🌸 简单好用的陪伴功能
        </motion.h2>
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="rounded-2xl p-5 shadow-sm"
              style={{ backgroundColor: f.color }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "white" }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.iconColor }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: "hsl(25 40% 25%)" }}>
                  {f.title}
                </h3>
              </div>
              <p className="text-base leading-relaxed mb-4" style={{ color: "hsl(25 30% 40%)" }}>
                {f.desc}
              </p>
              <Button
                className="w-full text-base font-semibold rounded-xl"
                style={{
                  backgroundColor: "white",
                  color: f.iconColor,
                  minHeight: 48,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
                onClick={() => navigate(f.route)}
              >
                {f.btn}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== 4. 产品转化区（新增） ===== */}
      <section className="px-5 py-10">
        <motion.h2
          className="text-xl font-bold text-center mb-2"
          style={{ color: "hsl(25 40% 30%)" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          🌟 更多关怀方式
        </motion.h2>
        <motion.p
          className="text-base text-center mb-6"
          style={{ color: "hsl(25 25% 50%)" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
        >
          为长辈的身心健康多做一点
        </motion.p>
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          {productCards.map((p, i) => (
            <motion.div
              key={i}
              className="rounded-2xl p-5 shadow-sm relative overflow-hidden"
              style={{ backgroundColor: p.color }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 2}
            >
              {/* Tag */}
              <span
                className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: p.tag === "免费" ? "hsl(150 50% 40%)" : "hsl(25 75% 55%)",
                  color: "white",
                }}
              >
                {p.tag}
              </span>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{p.emoji}</span>
                <h3 className="text-lg font-bold" style={{ color: "hsl(25 40% 25%)" }}>
                  {p.title}
                </h3>
              </div>
              <p className="text-base leading-relaxed mb-4" style={{ color: "hsl(25 30% 40%)" }}>
                {p.desc}
              </p>
              <Button
                className="w-full text-base font-semibold rounded-xl"
                style={{
                  backgroundColor: "white",
                  color: p.iconColor,
                  minHeight: 48,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
                onClick={() => navigate(p.route)}
              >
                {p.btn}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== 5. 记忆陪伴区 ===== */}
      <section className="px-5 py-10" style={{ backgroundColor: "hsl(30 40% 97%)" }}>
        <motion.div
          className="max-w-md mx-auto rounded-2xl p-6 text-center"
          style={{ backgroundColor: "hsl(45 60% 95%)" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(35 60% 50%)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "hsl(25 40% 30%)" }}>
            陪长辈聊聊过去
            <br />
            也是一种温柔照顾
          </h2>
          <p className="text-base leading-relaxed mb-4" style={{ color: "hsl(25 30% 45%)" }}>
            可以和长辈一起聊年轻时的故事、难忘的人、珍贵的回忆，让陪伴不只是功能，也是情感连接。
          </p>
          <Button
            className="text-base font-semibold rounded-xl px-6"
            style={{
              backgroundColor: "hsl(35 60% 50%)",
              color: "white",
              minHeight: 48,
            }}
            onClick={() => navigate("/elder-care/chat")}
          >
            开始回忆之旅
          </Button>
        </motion.div>
      </section>

      {/* ===== 6. 子女关怀区 ===== */}
      <section
        className="px-5 py-10"
        style={{
          background: "linear-gradient(180deg, hsl(150 35% 95%) 0%, hsl(30 60% 98%) 100%)",
        }}
      >
        <motion.div
          className="max-w-md mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(150 45% 40%)" }} />
          <h2 className="text-xl font-bold mb-3" style={{ color: "hsl(25 40% 30%)" }}>
            给爸妈的不只是一个工具
            <br />
            更是一份安心
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: "hsl(25 30% 45%)" }}>
            不管你在不在身边，都希望爸妈有人陪、有提醒、有回应。
            <br />
            <br />
            这个入口不复杂，不需要学很多，却能让陪伴多一点，让牵挂少一点。
          </p>
          <div className="flex flex-col gap-3">
            <Button
              className="text-lg font-semibold rounded-2xl shadow-md px-8"
              style={{
                backgroundColor: "hsl(150 45% 42%)",
                color: "white",
                minHeight: 56,
              }}
              onClick={() => navigate("/alive-check")}
            >
              ✅ 开启平安打卡
            </Button>
            <Button
              variant="outline"
              className="text-base font-semibold rounded-2xl px-8 gap-2"
              style={{
                borderColor: "hsl(150 40% 60%)",
                color: "hsl(150 45% 35%)",
                minHeight: 48,
              }}
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              分享给家人
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ===== 7. 信任感区 ===== */}
      <section className="px-5 py-10">
        <motion.h2
          className="text-xl font-bold text-center mb-6"
          style={{ color: "hsl(25 40% 30%)" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          为什么长辈更容易接受？
        </motion.h2>
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          {trustPoints.map((t, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{ backgroundColor: "hsl(210 40% 96%)" }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
            >
              <span className="text-3xl">{t.emoji}</span>
              <span className="text-base font-medium" style={{ color: "hsl(25 35% 30%)" }}>
                {t.title}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== 8. 底部 CTA ===== */}
      <section
        className="px-5 py-12 text-center"
        style={{
          background: "linear-gradient(180deg, hsl(30 60% 98%) 0%, hsl(30 70% 95%) 100%)",
        }}
      >
        <motion.div
          className="max-w-xs mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <Heart className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(25 75% 55%)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "hsl(25 40% 30%)" }}>
            现在就给长辈
            <br />
            一个更简单的关怀入口
          </h2>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              className="w-full text-lg font-semibold rounded-2xl shadow-md"
              style={{
                backgroundColor: "hsl(25 75% 55%)",
                color: "white",
                minHeight: 56,
              }}
              onClick={() => navigate("/elder-care/chat")}
            >
              立即体验
            </Button>
            <Button
              variant="outline"
              className="w-full text-lg font-semibold rounded-2xl gap-2"
              style={{
                borderColor: "hsl(25 60% 70%)",
                color: "hsl(25 60% 40%)",
                minHeight: 56,
              }}
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              分享给家人
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default ElderCarePage;
