import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, ShieldCheck, Clock, Gift, ChevronDown, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromoProduct {
  name: string;
  price: number;
  icon: string;
  duration: string;
  highlights: string[];
  tag: string;
}

interface Testimonial {
  name: string;
  avatar: string;
  role: string;
  content: string;
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

const PromoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");

  const [promo, setPromo] = useState<PromoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [buyerCount] = useState(() => 237 + Math.floor(Math.random() * 50));

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
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
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden"
      >
        <div className={`bg-gradient-to-br ${promo.theme.gradient || 'from-orange-500 to-amber-500'} px-4 pt-12 pb-10 text-center`}>
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

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium mb-3">
              🔥 限时特惠 · 买一送一
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{promo.title}</h1>
            <p className="text-white/90 text-sm sm:text-base max-w-md mx-auto">{promo.subtitle}</p>
          </motion.div>

          {/* Price highlight */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="mt-6 inline-flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl px-6 py-3"
          >
            <div className="text-white/70 text-sm line-through">¥{promo.original_price}</div>
            <div className="text-white text-3xl font-black">¥{promo.bundle_price}</div>
            <span className="bg-white text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
              省{discount}%
            </span>
          </motion.div>
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 1440 60" className="w-full -mt-1" preserveAspectRatio="none">
          <path
            d="M0,40 C360,80 720,0 1440,40 L1440,60 L0,60 Z"
            className="fill-orange-50"
          />
        </svg>
      </motion.section>

      {/* Products Section */}
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
              {/* Tag ribbon */}
              <div className="absolute top-3 right-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  idx === 0
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {product.tag}
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

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{product.duration}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {product.highlights.map((h, i) => (
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

        {/* Bundle value callout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200 rounded-xl p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-orange-700">超值组合</span>
          </div>
          <p className="text-sm text-foreground/70">
            买训练营 ¥399，<span className="font-semibold text-orange-600">免费送</span>知乐胶囊一瓶（价值¥399）
          </p>
        </motion.div>
      </section>

      {/* Selling Points */}
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-center text-foreground mb-4">
          <Zap className="w-5 h-5 inline text-orange-500 mr-1" />
          马上看到效果
        </h2>
        <div className="space-y-2.5">
          {promo.selling_points.map((point, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
              className="flex items-center gap-3 bg-card rounded-xl border px-4 py-3"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-foreground">{point}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {promo.testimonials.length > 0 && (
        <section className="px-4 mt-8 max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-center text-foreground mb-4">
            <Heart className="w-5 h-5 inline text-rose-500 mr-1" />
            真实用户反馈
          </h2>
          <div className="space-y-3">
            {promo.testimonials.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.15 }}
                className="bg-card rounded-xl border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">"{t.content}"</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Trust badges */}
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>正品保证</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>安全支付</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>隐私保护</span>
          </div>
        </div>
      </section>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-orange-600">¥{promo.bundle_price}</span>
              <span className="text-sm text-muted-foreground line-through">¥{promo.original_price}</span>
            </div>
            <p className="text-xs text-muted-foreground">已有 {buyerCount} 人购买</p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowPay(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 rounded-full shadow-lg shadow-orange-500/30"
          >
            立即抢购
          </Button>
        </div>
      </div>

      {/* Pay Dialog */}
      <UnifiedPayDialog
        open={showPay}
        onOpenChange={setShowPay}
        packageInfo={packageInfo}
        onSuccess={() => {
          setShowPay(false);
        }}
      />
    </div>
  );
};

export default PromoPage;
