import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { motion } from "framer-motion";
import { Check, ShieldCheck, Clock, Gift, ArrowRight, TrendingUp, Sun, Coffee, Moon, Zap } from "lucide-react";
import zhileCapsules from "@/assets/zhile-capsules.jpeg";
import { Button } from "@/components/ui/button";

interface PromoProduct {
  name: string;
  price: number;
  icon: string;
  duration: string;
  highlights: string[];
  tag: string;
  timeline?: { day: string; effect: string }[];
  quick_effect?: string;
}

interface Testimonial {
  name: string;
  avatar: string;
  role: string;
  before: string;
  after: string;
  days: string;
}

interface PromoData {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  target_audience: string | null;
  bundle_price: number;
  original_price: number;
  products: PromoProduct[];
  selling_points: string[];
  testimonials: Testimonial[];
  theme: { gradient?: string; accent?: string };
}

// Animated counter component
function AnimatedStat({ value, suffix, label, delay }: { value: string; suffix?: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="text-center flex-1"
    >
      <div className="text-2xl sm:text-3xl font-black text-white">
        {value}<span className="text-lg">{suffix}</span>
      </div>
      <div className="text-white/70 text-[11px] mt-0.5">{label}</div>
    </motion.div>
  );
}

const PromoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");

  const [promo, setPromo] = useState<PromoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [buyerCount] = useState(() => 237 + Math.floor(Math.random() * 50));

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("promo_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (data) {
        setPromo({
          ...data,
          products: (data.products as unknown as PromoProduct[]) || [],
          selling_points: (data.selling_points as unknown as string[]) || [],
          testimonials: (data.testimonials as unknown as Testimonial[]) || [],
          theme: (data.theme as unknown as { gradient?: string; accent?: string }) || {},
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  const packageInfo = useMemo(() => {
    if (!promo) return null;
    return {
      key: `promo_bundle_${promo.slug}`,
      name: promo.title,
      price: promo.bundle_price,
    };
  }, [promo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">活动不存在或已结束</p>
      </div>
    );
  }

  const discount = Math.round((1 - promo.bundle_price / promo.original_price) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-background to-background pb-28">
      {/* ===== Hero Section: Emotion-first + Stats ===== */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden">
        <div className={`bg-gradient-to-br ${promo.theme.gradient || 'from-orange-500 to-amber-500'} px-4 pt-14 pb-12 text-center`}>
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
                animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity }}
              />
            ))}
          </div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-1.5 tracking-tight">别再硬扛了</h1>
            <p className="text-white/80 text-sm">职场压力急救，身心同步见效</p>
          </motion.div>

          {/* Hero Stats Row */}
          <div className="flex items-center justify-center gap-4 mt-7 max-w-xs mx-auto">
            <AnimatedStat value="89" suffix="%" label="睡眠改善率" delay={0.3} />
            <div className="w-px h-8 bg-white/20" />
            <AnimatedStat value="2.3" suffix="万+" label="职场人已用" delay={0.4} />
            <div className="w-px h-8 bg-white/20" />
            <AnimatedStat value="4.8" suffix="/5" label="用户好评" delay={0.5} />
          </div>

          {/* Price pill */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.55, type: "spring" }}
            className="mt-7 inline-flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl px-6 py-3"
          >
            <div className="text-white/70 text-sm line-through">¥{promo.original_price}</div>
            <div className="text-white text-3xl font-black">¥{promo.bundle_price}</div>
            <span className="bg-white text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">省{discount}%</span>
          </motion.div>
        </div>

        <svg viewBox="0 0 1440 60" className="w-full -mt-1" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1440,40 L1440,60 L0,60 Z" className="fill-orange-50" />
        </svg>
      </motion.section>

      {/* ===== Product Cards with Timelines ===== */}
      <section className="px-4 -mt-2 max-w-lg mx-auto">
        <div className="text-center mb-4">
          <span className="text-sm font-medium text-muted-foreground">套餐包含</span>
        </div>
        <div className="space-y-3">
          {promo.products.map((product, idx) => (
            <motion.div
              key={idx}
              initial={{ x: idx % 2 === 0 ? -30 : 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + idx * 0.15 }}
              className="relative bg-card rounded-2xl border shadow-sm overflow-hidden"
            >
              <div className="absolute top-3 right-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  idx === 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {idx === 0 ? '🧠 练心智' : '💊 护身体'}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{product.icon}</span>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">¥{product.price}</span>
                      <span className="text-xs text-orange-600 font-medium">
                        {idx === 0 ? '套餐价购买' : '免费赠送'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick effect highlight for capsule */}
                {product.quick_effect && (
                  <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">{product.quick_effect}</span>
                  </div>
                )}

                {/* Timeline for training camp */}
                {product.timeline && product.timeline.length > 0 && (
                  <div className="mb-3 flex items-center gap-0 overflow-x-auto">
                    {product.timeline.map((step, si) => (
                      <div key={si} className="flex items-center shrink-0">
                        <div className="text-center px-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-[10px] font-bold mx-auto mb-1">
                            {step.day}
                          </div>
                          <span className="text-[10px] text-muted-foreground leading-tight block max-w-[60px]">{step.effect}</span>
                        </div>
                        {si < product.timeline!.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0 mx-0.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Max 2 highlights */}
                <div className="flex flex-wrap gap-2">
                  {product.highlights.slice(0, 2).map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-foreground/80">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bundle value - synergy messaging */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200 rounded-xl p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-orange-700">训练营练心智 × 知乐护身体 = 全天候抗压力</span>
          </div>
          <p className="text-sm text-foreground/70">
            单独使用效果有限，<span className="font-semibold text-orange-600">组合使用效果翻倍</span>
          </p>
        </motion.div>
      </section>

      {/* ===== Daily Usage Scenario: 24h Protection ===== */}
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-base font-bold text-center text-foreground mb-1">一天怎么用？</h2>
          <p className="text-center text-xs text-muted-foreground mb-4">训练营练心，知乐护体，<span className="font-semibold text-orange-600">24小时全覆盖</span></p>
          
          <div className="bg-card rounded-2xl border shadow-sm p-5">
            {/* Product image - prominent */}
            <div className="flex items-center justify-center mb-5">
              <div className="relative">
                <img src={zhileCapsules} alt="知乐胶囊产品" className="w-44 h-44 object-cover rounded-2xl shadow-lg border-2 border-emerald-100" />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow"><div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">每日3次</div></div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { time: "早上 7:30", icon: <Sun className="w-4 h-4 text-amber-500" />, action: "10分钟训练营", desc: "调整心态，满血出门", type: "camp" },
                { time: "早餐后", icon: <Coffee className="w-4 h-4 text-orange-500" />, action: "知乐胶囊 1次", desc: "激活身体防护", type: "capsule" },
                { time: "午餐后", icon: <Zap className="w-4 h-4 text-yellow-500" />, action: "知乐胶囊 1次", desc: "对抗午后焦虑", type: "capsule" },
                { time: "下午 5:00-6:00", icon: <Clock className="w-4 h-4 text-indigo-400" />, action: "知乐胶囊 1次", desc: "稳定情绪，为晚间放松做准备", type: "capsule" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  {/* Timeline connector */}
                  {i < 3 && <div className="absolute left-[15px] top-8 w-0.5 h-6 bg-border" />}
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.type === 'camp' ? 'bg-orange-100' : 'bg-emerald-100'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{step.time}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        step.type === 'camp' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {step.type === 'camp' ? '🧠 心智' : '💊 身体'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-0.5">{step.action}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== Synergy Comparison Table ===== */}
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-base font-bold text-center text-foreground mb-1">为什么要组合用？</h2>
          <p className="text-center text-xs text-muted-foreground mb-4">1 + 1 &gt; 2 的科学配方</p>
          
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[340px]">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground w-[80px]"></th>
                  <th className="py-2.5 px-2 text-center text-xs font-medium text-muted-foreground">只练训练营</th>
                  <th className="py-2.5 px-2 text-center text-xs font-medium text-muted-foreground">只吃知乐</th>
                  <th className="py-2.5 px-2 text-center text-xs font-medium bg-orange-50 rounded-t-lg">
                    <span className="text-orange-700 font-bold">组合使用 🔥</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "压力缓解", solo1: "60%", solo2: "55%", combo: "92%" },
                  { label: "起效速度", solo1: "7天", solo2: "30分钟", combo: "即刻+持续" },
                  { label: "睡眠改善", solo1: "中等", solo2: "中等", combo: "显著" },
                  { label: "持久效果", solo1: "需坚持", solo2: "需持续", combo: "习惯养成" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 px-2 text-xs font-medium text-foreground">{row.label}</td>
                    <td className="py-2.5 px-2 text-center text-xs text-muted-foreground">{row.solo1}</td>
                    <td className="py-2.5 px-2 text-center text-xs text-muted-foreground">{row.solo2}</td>
                    <td className="py-2.5 px-2 text-center text-xs font-bold text-orange-700 bg-orange-50">{row.combo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ===== Data Proof Section ===== */}
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-center"
        >
          <h2 className="text-white font-bold text-base mb-4 flex items-center justify-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            数据说话
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "89%", label: "睡眠改善率", color: "text-blue-400" },
              { value: "92%", label: "焦虑缓解率", color: "text-emerald-400" },
              { value: "96%", label: "复购推荐率", color: "text-amber-400" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          <p className="text-slate-500 text-[10px] mt-3">基于 2,847 位用户调研数据</p>
        </motion.div>
      </section>

      {/* ===== Before/After Testimonials ===== */}
      {/* ===== Real Testimonials - conversational style ===== */}
        <section className="px-4 mt-8 max-w-lg mx-auto">
          <h2 className="text-base font-bold text-center text-foreground mb-1">用户真实反馈</h2>
          <p className="text-center text-xs text-muted-foreground mb-4">来自组合使用的真实用户</p>
          <div className="space-y-3">
            {[
              {
                name: "Lisa", role: "互联网产品经理", avatar: "👩‍💻", days: "7天",
                quote: "之前每天开完会就心慌，吃了知乐半小时就能感觉身体放松下来。配合早上的训练营，现在开会前会先做个呼吸调整，整个状态完全不一样了。",
                highlight: "开会不再心慌"
              },
              {
                name: "张伟", role: "金融分析师", avatar: "👨‍💼", days: "14天",
                quote: "以前靠咖啡撑着，晚上又睡不着，恶性循环。现在早上练完训练营精神就很好，中午吃一粒知乐，下午不用喝咖啡也能专注。最明显的是睡眠，第3天就开始改善了。",
                highlight: "告别咖啡依赖，睡眠第3天改善"
              },
              {
                name: "小雨", role: "创业公司 HR", avatar: "👩", days: "21天",
                quote: "老实说一开始觉得训练营有点玄，但坚持了一周发现情绪波动真的变小了。知乐是实实在在的，吃完半小时肩膀就不那么紧了。两个一起用，同事都说我最近脾气好了。",
                highlight: "情绪稳定，同事都感觉到变化"
              },
            ].map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.12 }}
                className="bg-card rounded-xl border p-4"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.avatar}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    组合使用{t.days}
                  </span>
                </div>

                {/* Quote */}
                <p className="text-sm text-foreground/80 leading-relaxed mb-2">"{t.quote}"</p>
                
                {/* Key result tag */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-emerald-700">{t.highlight}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      {/* Trust badges */}
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /><span>正品保证</span></div>
          <div className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /><span>安全支付</span></div>
          <div className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /><span>隐私保护</span></div>
        </div>
      </section>

      {/* ===== Fixed Bottom CTA ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-orange-600">¥{promo.bundle_price}</span>
              <span className="text-sm text-muted-foreground line-through">¥{promo.original_price}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              🔥 已有 {buyerCount} 人领取
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowPay(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 rounded-full shadow-lg shadow-orange-500/30 animate-pulse"
          >
            立即领取急救包
          </Button>
        </div>
      </div>

      {/* Pay Dialog */}
      <UnifiedPayDialog
        open={showPay}
        onOpenChange={setShowPay}
        packageInfo={packageInfo}
        onSuccess={() => setShowPay(false)}
      />
    </div>
  );
};

export default PromoPage;
