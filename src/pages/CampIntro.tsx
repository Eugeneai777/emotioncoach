import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDays, format } from "date-fns";
import { EmotionBloomIntroSections } from "@/components/camp/EmotionBloomIntroSections";
import { IdentityBloomIntroSections } from "@/components/camp/IdentityBloomIntroSections";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import PageHeader from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight,
  Sparkles, 
  TrendingDown,
  Brain,
  Moon,
  Zap,
  Check,
  Users,
  BarChart3,
  Video,
  Heart,
  MessageCircle,
  Shield,
  Award,
  Clock
} from "lucide-react";
import type { CampTemplate } from "@/types/trainingCamp";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { CampDualTrackSection } from "@/components/camp/CampDualTrackSection";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { useCampPurchase } from "@/hooks/useCampPurchase";
import { toast } from "sonner";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";

const iconMap: Record<string, any> = {
  TrendingDown, Brain, Moon, Zap, Heart, MessageCircle, Shield, Award, Users, Video, BarChart3
};

const CampIntro = () => {
  const navigate = useNavigate();
  const { campType } = useParams<{ campType: string }>();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const { user } = useAuth();
  const [resumedOpenId, setResumedOpenId] = useState<string | undefined>();
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // ─── 微信 OAuth 支付回跳后自动打开支付弹窗 ───
  const payResumeHandledRef = useRef(false);
  useEffect(() => {
    if (payResumeHandledRef.current) return;

    const url = new URL(window.location.href);
    const isPayResume =
      sessionStorage.getItem(`camp_intro_pay_resume_${campType}`) === '1' ||
      url.searchParams.get('payment_resume') === '1';

    if (!isPayResume) return;

    payResumeHandledRef.current = true;
    console.log('[CampIntro] Payment resume detected, will auto-open pay dialog');

    // 缓存 openId
    const paymentOpenId = url.searchParams.get('payment_openid');
    if (paymentOpenId) {
      sessionStorage.setItem('wechat_payment_openid', paymentOpenId);
      localStorage.setItem('cached_payment_openid_gzh', paymentOpenId);
      sessionStorage.setItem('cached_payment_openid_gzh', paymentOpenId);
      setResumedOpenId(paymentOpenId);
    }

    // 处理 token_hash 自动登录
    const tokenHash = url.searchParams.get('payment_token_hash');

    // 清理 URL 参数
    url.searchParams.delete('payment_resume');
    url.searchParams.delete('payment_openid');
    url.searchParams.delete('payment_token_hash');
    url.searchParams.delete('payment_auth_error');
    url.searchParams.delete('is_new_user');
    window.history.replaceState({}, '', url.toString());

    // 清除 sessionStorage 标记
    sessionStorage.removeItem(`camp_intro_pay_resume_${campType}`);
    sessionStorage.removeItem('pay_auth_in_progress');

    if (tokenHash) {
      console.log('[CampIntro] Auto-login with tokenHash before opening pay dialog');
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
        .then(({ error }) => {
          if (error) console.warn('[CampIntro] Auto-login failed:', error.message);
          else console.log('[CampIntro] Auto-login successful');
        })
        .catch((e) => console.warn('[CampIntro] Auto-login exception:', e))
        .finally(() => setShowPayDialog(true));
    } else {
      // 延迟一下等 auth 状态同步
      setTimeout(() => setShowPayDialog(true), 300);
    }
  }, [campType]);

  // 检查用户是否已购买该付费训练营
  const { data: purchaseRecord, refetch: refetchPurchase } = useCampPurchase(campType || '');

  // 处理支付宝H5支付回调（用户从支付宝返回后触发）
  usePaymentCallback({
    onSuccess: async (orderNo, packageKey) => {
      if (user && campType) {
        // 检查是否已有购买记录，避免重复插入
        const { data: existing } = await supabase
          .from('user_camp_purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('camp_type', campType)
          .eq('payment_status', 'completed')
          .maybeSingle();

        if (!existing) {
          await supabase.from('user_camp_purchases').insert({
            user_id: user.id,
            camp_type: campType,
            camp_name: campTemplate?.camp_name || campType,
            purchase_price: campTemplate?.price || 0,
            payment_status: 'completed'
          });
        }
        refetchPurchase();
      }
      setShowStartDialog(true);
    },
    showToast: true,
    showConfetti: true,
  });
  
  // 额外检查 orders 表（synergy_bundle 购买记录在 orders 表中）
  const { data: orderPurchase, isLoading: orderLoading } = useQuery({
    queryKey: ['camp-order-purchase', campType, user?.id],
    queryFn: async () => {
      if (!user || !campType) return null;
      // emotion_journal_21 可能通过 synergy_bundle 购买
      const packageKeys = ['emotion_journal_21', 'emotion_stress_7'].includes(campType!)
        ? ['synergy_bundle', `camp-${campType}`]
        : campType === 'wealth_block_7'
        ? ['wealth_synergy_bundle', `camp-${campType}`]
        : [`camp-${campType}`];
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .in('package_key', packageKeys)
        .eq('status', 'paid')
        .limit(1);
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user && !!campType
  });
  
  // 以 orders 表（财务事实来源）为准，避免 user_camp_purchases 中残留记录导致误判
  const hasPurchased = !!orderPurchase || paymentCompleted;

  const { data: campTemplate, isLoading } = useQuery({
    queryKey: ['camp-template', campType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('camp_type', campType)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('训练营不存在');
      return data as unknown as CampTemplate;
    },
    enabled: !!campType
  });

  // 查询用户是否已有该类型的活跃训练营
  const { data: existingCamp } = useQuery({
    queryKey: ['existing-camp', campType, user?.id],
    queryFn: async () => {
      if (!user || !campType) return null;
      // Also check synergy_bundle camp type for emotion_journal_21
      const campTypes = campType === 'emotion_journal_21' 
        ? ['emotion_journal_21', 'synergy_bundle'] 
        : [campType];
      const { data } = await supabase
        .from('training_camps')
        .select('id, camp_name, current_day')
        .eq('user_id', user.id)
        .in('camp_type', campTypes)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!campType
  });

  const hasJoinedCamp = !!existingCamp;

  const startEmotionStressCampAndEnter = async (resolvedUserId = user?.id) => {
    if (!resolvedUserId || !campTemplate || campType !== 'emotion_stress_7') return false;

    const { data: activeCamp } = await supabase
      .from('training_camps')
      .select('id')
      .eq('user_id', resolvedUserId)
      .eq('camp_type', 'emotion_stress_7')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeCamp?.id) {
      navigate(`/camp-checkin/${activeCamp.id}`);
      return true;
    }

    const today = new Date();
    const endDate = addDays(today, campTemplate.duration_days - 1);
    const { data: insertedCamps, error } = await supabase
      .from('training_camps')
      .insert({
        user_id: resolvedUserId,
        camp_name: campTemplate.camp_name,
        camp_type: 'emotion_stress_7',
        duration_days: campTemplate.duration_days,
        start_date: format(today, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        current_day: 0,
        completed_days: 0,
        check_in_dates: [],
        status: 'active',
      })
      .select('id');

    if (error) {
      if (error.code === '23505') {
        const { data: existingAfterConflict } = await supabase
          .from('training_camps')
          .select('id')
          .eq('user_id', resolvedUserId)
          .eq('camp_type', 'emotion_stress_7')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existingAfterConflict?.id) {
          navigate(`/camp-checkin/${existingAfterConflict.id}`);
          return true;
        }
      }
      throw error;
    }

    await supabase.from('profiles').update({ preferred_coach: 'emotion' }).eq('id', resolvedUserId);

    if (insertedCamps?.[0]?.id) {
      toast.success("训练营已开启，开始训练吧！");
      navigate(`/camp-checkin/${insertedCamps[0].id}`);
      return true;
    }

    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!campTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">训练营不存在</p>
          <Button onClick={() => navigate("/camps")}>返回训练营列表</Button>
        </div>
      </div>
    );
  }

  const isParentCamp = campType?.includes('parent') || campType?.includes('teen');

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-purple-50 via-pink-50 to-white pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
      <DynamicOGMeta pageKey="campIntro" />
      <PageHeader title={campTemplate?.camp_name || "训练营介绍"} showBack />

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          {!['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) && (
            <div className="inline-block">
              <Badge className={`bg-gradient-to-r ${campTemplate.gradient} text-white border-0 px-4 py-1 text-sm`}>
                {campTemplate.icon} {campTemplate.duration_days}天养成计划
              </Badge>
            </div>
          )}
          <div className="space-y-4">
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${campTemplate.gradient} bg-clip-text text-transparent leading-tight`}>
              {campTemplate.camp_name}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {campTemplate.description}
            </p>
          </div>
          
          {/* 价格展示 - 仅付费训练营显示 */}
          {campTemplate.price && campTemplate.price > 0 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              {campTemplate.original_price && campTemplate.original_price > campTemplate.price && (
                <span className="text-lg text-muted-foreground line-through">
                  ¥{campTemplate.original_price}
                </span>
              )}
              <span className="text-3xl font-bold text-purple-600">
                ¥{campTemplate.price}
              </span>
              {campTemplate.price_note && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  {campTemplate.price_note}
                </Badge>
              )}
            </div>
          )}
        </section>

        {/* Emotion Bloom 专属丰富内容 */}
        {campType === 'emotion_bloom' && <EmotionBloomIntroSections />}
        {campType === 'identity_bloom' && <IdentityBloomIntroSections />}

        {/* Stages */}
        {campTemplate.stages && campTemplate.stages.length > 0 && !['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) && (
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">课程阶段</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                循序渐进，系统化成长路径
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campTemplate.stages.map((stage: any, index: number) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 bg-white/80 border-purple-100">
                  <CardHeader>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${campTemplate.gradient} text-white text-sm font-medium mb-3 w-fit`}>
                      第{stage.stage}阶
                    </div>
                    <CardTitle className="text-2xl mb-4">{stage.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stage.lessons && stage.lessons.length > 0 ? (
                      <ul className="space-y-3">
                        {stage.lessons.map((lesson: string, lessonIndex: number) => (
                          <li key={lessonIndex} className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${campTemplate.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                              {lessonIndex + 1}
                            </div>
                            <span className="text-sm leading-relaxed">{lesson}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <CardDescription className="text-base">{stage.description}</CardDescription>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Dual Track Mode - Only for parent camps */}
        {campTemplate.camp_type.includes('parent') && (
          <CampDualTrackSection campType={campTemplate.camp_type} />
        )}

        {/* Learning Formats */}
        {campTemplate.learning_formats && campTemplate.learning_formats.length > 0 && !['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) && (
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">上课形式</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                多样化学习体验，全方位成长支持
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campTemplate.learning_formats.map((format: any, index: number) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 bg-white/80 border-purple-100">
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="text-4xl">{format.icon}</div>
                      <CardTitle className="text-xl">{format.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{format.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        {campTemplate.benefits && campTemplate.benefits.length > 0 && !['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) && (
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">你将获得</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) 
                  ? '实实在在的成长' 
                  : `${campTemplate.duration_days}天后，实实在在的成长`
                }
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campTemplate.benefits.map((benefit: string, index: number) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 bg-white/80 border-purple-100">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${campTemplate.gradient} text-white group-hover:scale-110 transition-transform duration-300`}>
                        <Check className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{benefit}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Target Audience */}
        {campTemplate.target_audience && campTemplate.target_audience.length > 0 && !['emotion_bloom', 'identity_bloom'].includes(campTemplate.camp_type) && (
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">适合加入的人</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                如果你有以下困扰或期待，这个训练营就是为你设计的
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
              {campTemplate.target_audience.map((audience: string, index: number) => (
                <Card 
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 bg-white/80 border-purple-100"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm leading-relaxed">{audience}</p>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Prerequisites */}
        {campTemplate.prerequisites && campTemplate.prerequisites.required_camp && (
          <section className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 max-w-2xl mx-auto">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-lg">
                  <Users className="w-5 h-5" />
                  <span>报名条件</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-800 dark:text-amber-300 text-sm">
                  {campTemplate.prerequisites.message}
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-purple-100 z-20">
        <div className="container max-w-lg mx-auto space-y-2">
          {/* 三力测评入口 - 仅 parent_emotion_21 训练营显示 */}
          {campType === 'parent_emotion_21' && !hasJoinedCamp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/parent-ability-assessment')}
              className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Sparkles className="w-4 h-4 mr-1" />先测一测我的三力水平
            </Button>
          )}
          <Button 
            size="lg" 
            onClick={() => {
              if (hasJoinedCamp && existingCamp) {
                navigate(`/camp-checkin/${existingCamp.id}`);
              } else if (campType === 'emotion_stress_7' && hasPurchased) {
                startEmotionStressCampAndEnter().catch((error) => {
                  console.error('Start emotion stress camp error:', error);
                  toast.error('开启训练营失败，请稍后重试');
                });
              } else if (campTemplate.price && campTemplate.price > 0 && !hasPurchased) {
                // 付费训练营且未购买：先检查登录
                if (!user) {
                  // 保存支付恢复标记，登录后自动弹出支付
                  sessionStorage.setItem(`camp_intro_pay_resume_${campType}`, '1');
                  const currentPath = window.location.pathname + window.location.search;
                  setPostAuthRedirect(currentPath);
                  navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
                  return;
                }
                setShowPayDialog(true);
              } else {
                // 免费训练营或已购买：检查登录
                if (!user) {
                  const currentPath = window.location.pathname + window.location.search;
                  setPostAuthRedirect(currentPath);
                  navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
                  return;
                }
                setShowStartDialog(true);
              }
            }}
            className={`w-full gap-2 bg-gradient-to-r ${campTemplate.gradient} hover:opacity-90 text-white shadow-lg text-lg py-6`}
          >
            {orderLoading
              ? '加载中...'
              : hasJoinedCamp 
              ? '继续训练' 
              : hasPurchased
              ? '开始训练'
              : (campTemplate.price && campTemplate.price > 0)
              ? `立即购买 ¥${campTemplate.price}` 
              : '立即加入训练营'}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <StartCampDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        campTemplate={campTemplate}
        onSuccess={(campId) => navigate(`/camp-checkin/${campId}`)}
        isPurchased={hasPurchased}
      />

      {/* 付费弹窗 */}
      <UnifiedPayDialog
        openId={resumedOpenId}
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={{
          key: `camp-${campType}`,
          name: campTemplate.camp_name,
          price: campTemplate.price || 0
        }}
        onSuccess={async () => {
          setPaymentCompleted(true);
          const { data: latestAuth } = await supabase.auth.getUser();
          const resolvedUserId = user?.id || latestAuth.user?.id;
          // 记录购买到 user_camp_purchases（容错处理，避免插入失败阻断后续流程）
          if (resolvedUserId) {
            try {
              await supabase.from('user_camp_purchases').insert({
                user_id: resolvedUserId,
                camp_type: campType,
                camp_name: campTemplate.camp_name,
                purchase_price: campTemplate.price || 0,
                payment_status: 'completed'
              });
            } catch (e) {
              console.error('Insert camp purchase error:', e);
            }
          }
          setShowPayDialog(false);
          refetchPurchase();
          if (campType === 'emotion_stress_7') {
            try {
              await startEmotionStressCampAndEnter(resolvedUserId);
            } catch (error) {
              console.error('Auto-start emotion stress camp after payment error:', error);
              toast.error('开启训练营失败，请稍后重试');
            }
            return;
          }
          toast.success("购买成功！请选择开始日期");
          setShowStartDialog(true);
        }}
      />
    </div>
  );
};

export default CampIntro;
