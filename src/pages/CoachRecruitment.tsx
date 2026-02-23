import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import {
  Award,
  Users,
  Sliders,
  CalendarCheck,
  FileText,
  ShieldCheck,
  Settings,
  Send,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const benefits = [
  {
    icon: Award,
    title: "专业背书",
    desc: "获得平台认证标识，提升个人品牌可信度，让用户更放心选择你。",
  },
  {
    icon: Users,
    title: "精准获客",
    desc: "平台持续导入高意向用户流量，智能匹配算法帮你找到最合适的客户。",
  },
  {
    icon: Sliders,
    title: "灵活自主",
    desc: "自定义服务项目、时长和定价策略，按照你的节奏开展教练工作。",
  },
  {
    icon: CalendarCheck,
    title: "工具支持",
    desc: "在线预约、日程管理、客户管理一站式工具，让你专注于教练本身。",
  },
];

const steps = [
  { icon: FileText, label: "填写基本信息", desc: "姓名、擅长领域、个人简介" },
  { icon: ShieldCheck, label: "上传资质证书", desc: "专业认证、培训经历" },
  { icon: Settings, label: "设置服务项目", desc: "服务内容、时长、定价" },
  { icon: Send, label: "提交审核", desc: "平台审核后即可上线" },
];

const faqItems = [
  {
    q: "入驻需要什么条件？",
    a: "我们欢迎持有相关领域认证（如 ICF、心理咨询师证书等）或拥有丰富实践经验的教练申请入驻。即使没有正式证书，如果你在某个领域有突出的专业能力和服务经验，也欢迎提交申请，我们会综合评估。",
  },
  {
    q: "审核需要多长时间？",
    a: "提交申请后，我们会在 3-5 个工作日内完成审核。审核通过后你会收到通知，即可开始在平台上接单服务。",
  },
  {
    q: "如何设置服务和收费？",
    a: "入驻后你可以在教练后台自由设置服务项目（如一对一咨询、团体辅导等）、每次服务时长和价格。平台提供定价参考建议，但最终由你决定。",
  },
  {
    q: "平台如何收费？",
    a: "平台按订单金额收取一定比例的服务费。具体费率会在入驻审核通过后详细说明。前期入驻的教练可享受优惠费率。",
  },
];

export default function CoachRecruitment() {
  const navigate = useNavigate();
  const goApply = () => navigate("/become-coach");

  return (
    <div className="min-h-screen bg-background">
      <DynamicOGMeta
        pageKey="coachRecruitment"
        overrides={{
          title: "成为有劲认证教练 — 加入我们",
          ogTitle: "成为有劲认证教练",
          description: "加入有劲平台，获得专业背书、精准获客、灵活定价，开启你的教练事业新篇章。",
        }}
      />

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-lg"
        >
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            教练招募中
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            加入有劲，成为认证教练
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            有劲是一个 AI 驱动的生活教练平台，连接专业教练与有成长需求的用户。我们为你提供流量、工具和品牌背书，让你专注于热爱的教练事业。
          </p>
          <Button size="lg" className="mt-6 gap-2" onClick={goApply}>
            立即申请入驻
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* ===== 入驻优势 ===== */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold text-foreground"
          >
            入驻优势
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full border-border/60">
                  <CardContent className="flex gap-3 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <b.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{b.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 申请流程 ===== */}
      <section className="bg-muted/40 px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-2xl font-bold text-foreground"
          >
            申请流程
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 rounded-2xl bg-background border border-border/60 p-5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{s.label}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 text-center text-2xl font-bold text-foreground"
          >
            常见问题
          </motion.h2>
          <Card className="border-border/60 overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="border-b border-border/40 last:border-0">
                  <AccordionTrigger className="px-5 py-4 text-sm text-left text-foreground hover:no-underline hover:bg-muted/40">
                    <span className="pr-2">{item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </section>

      {/* ===== 底部 CTA ===== */}
      <section className="px-4 pb-20 pt-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-lg rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8"
        >
          <h2 className="text-xl font-bold text-foreground">准备好了吗？</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            加入有劲教练团队，开启你的线上教练之旅
          </p>
          <Button size="lg" className="mt-5 gap-2" onClick={goApply}>
            立即申请入驻
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
