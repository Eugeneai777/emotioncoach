import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { Helmet } from "react-helmet";

interface Benefit {
  id: string;
  benefit_name: string;
  benefit_description: string | null;
  benefit_value: number | null;
  benefit_icon: string;
  display_order: number;
}

export default function PartnerBenefits() {
  const navigate = useNavigate();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const { data, error } = await supabase
          .from('partner_benefits')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;
        setBenefits(data || []);
      } catch (error) {
        console.error('Error fetching benefits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, []);

  const totalValue = benefits.reduce((sum, b) => sum + (b.benefit_value || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Helmet>
        <title>合伙人专属权益 - 有劲AI</title>
        <meta name="description" content="绽放合伙人专属权益详情" />
        <meta property="og:title" content="有劲AI合伙人权益" />
        <meta property="og:description" content={`总价值¥${totalValue.toLocaleString()}的专属权益`} />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/partner/benefits" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/partner")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回合伙人中心
          </Button>
          
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              绽放合伙人专属权益
            </h1>
            <p className="text-lg text-muted-foreground">
              总价值 <span className="text-2xl font-bold text-primary">¥{totalValue.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {benefits.map((benefit, index) => (
            <Card 
              key={benefit.id}
              className="transition-all hover:shadow-lg hover:scale-105"
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{benefit.benefit_icon}</div>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg">{benefit.benefit_name}</CardTitle>
                    {benefit.benefit_value && benefit.benefit_value > 0 && (
                      <CardDescription className="text-primary font-semibold">
                        价值 ¥{benefit.benefit_value.toLocaleString()}
                      </CardDescription>
                    )}
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              </CardHeader>
              {benefit.benefit_description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {benefit.benefit_description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="py-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">还不是合伙人？</h3>
            <p className="text-muted-foreground">
              立即加入，开启您的情绪觉醒事业之旅
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/packages")}
              className="gap-2"
            >
              查看合伙人套餐
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
