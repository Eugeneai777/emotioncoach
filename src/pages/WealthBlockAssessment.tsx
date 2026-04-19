import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { usePageOG } from "@/hooks/usePageOG";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RotateCcw, History, TrendingUp, Share2, Sparkles, ChevronRight, Home, Mic } from "lucide-react";
import { AssessmentVoiceCoach } from "@/components/wealth-block/AssessmentVoiceCoach";
import { AIInsightData } from "@/components/wealth-block/AIInsightCard";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WealthBlockQuestions } from "@/components/wealth-block/WealthBlockQuestions";
import { WealthBlockResult } from "@/components/wealth-block/WealthBlockResult";
import { WealthBlockHistory, HistoryRecord } from "@/components/wealth-block/WealthBlockHistory";
import { WealthBlockTrend } from "@/components/wealth-block/WealthBlockTrend";
import { AssessmentComparison } from "@/components/wealth-block/AssessmentComparison";
import { AssessmentIntroCard } from "@/components/wealth-block/AssessmentIntroCard";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { AssessmentResult, blockInfo, patternInfo, FollowUpAnswer, calculateResult, calculateHealthScore } from "@/components/wealth-block/wealthBlockData";
import { DeepFollowUpAnswer } from "@/components/wealth-block/DeepFollowUpDialog";
import { useWealthCampAnalytics } from "@/hooks/useWealthCampAnalytics";
import WealthInviteCardDialog from "@/components/wealth-camp/WealthInviteCardDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { isWeChatMiniProgram } from "@/utils/platform";
import { useAssessmentPurchase } from "@/hooks/useAssessmentPurchase";

const MP_PENDING_PAYMENT_STORAGE_KEY = 'wealth_assessment_mp_pending_payment';
const MP_PENDING_PAYMENT_DISMISSED_KEY = 'wealth_assessment_mp_pending_payment_dismissed';

export default function WealthBlockAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const isMiniProgram = isWeChatMiniProgram();
  
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "assessment");
  const [showIntro, setShowIntro] = useState(true);
  const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [currentFollowUpInsights, setCurrentFollowUpInsights] = useState<FollowUpAnswer[] | undefined>(undefined);
  const [currentDeepFollowUpAnswers, setCurrentDeepFollowUpAnswers] = useState<DeepFollowUpAnswer[] | undefined>(undefined);
  const [showResult, setShowResult] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);
  const [previousAssessmentId, setPreviousAssessmentId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsightData | null>(null);
  
  // 支付相关状态
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [payDialogInstanceKey, setPayDialogInstanceKey] = useState(0);
  // 正在跳转微信授权中
  const [isRedirectingForAuth, setIsRedirectingForAuth] = useState(false);
  
  // 历史记录
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { trackAssessmentTocamp, trackEvent } = useWealthCampAnalytics();
  
  // 检查用户是否已购买测评
  const { data: purchaseRecord, isLoading: isPurchaseLoading } = useAssessmentPurchase();
  const hasPurchased = !!purchaseRecord;

  // 检查用户是否已是绽放合伙人
  const { data: bloomPartnerRecord } = useQuery({
    queryKey: ['bloom-partner-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .eq('partner_type', 'bloom')
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });
  const isBloomPartner = !!bloomPartnerRecord;

  // 监听登录状态变化，登录后检查购买状态
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[WealthBlock] User signed in, checking purchase status');
          
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('package_key', 'wealth_block_assessment')
            .eq('status', 'paid')
            .limit(1)
            .maybeSingle();
          
          if (existingOrder) {
            toast.success('欢迎回来！正在恢复测评...');
            setShowIntro(false);
          }
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  // 登录回跳后自动拉付费弹窗（未付费用户从 /auth 回到本页时无缝续付费）
  useEffect(() => {
    if (authLoading || isPurchaseLoading) return;
    if (!user) return;
    const pending = sessionStorage.getItem('wealth_block_pending_pay');
    if (pending !== '1') return;
    sessionStorage.removeItem('wealth_block_pending_pay');
    if (hasPurchased || isBloomPartner) {
      setShowIntro(false);
      return;
    }
    console.log('[WealthBlock] Resume after login → opening pay dialog');
    openWealthPayDialog();
  }, [user, authLoading, isPurchaseLoading, hasPurchased, isBloomPartner]);

  // 检测是否为微信浏览器（非小程序）
  const isWeChatBrowserEnv = typeof window !== 'undefined' && 
    /MicroMessenger/i.test(navigator.userAgent) && 
    !/miniProgram/i.test(navigator.userAgent) &&
    !window.__wxjs_environment;

  // 小程序入口页：把 mp_openid / mp_unionid 缓存下来，供后续页面（如产品中心）支付复用
  useEffect(() => {
    if (!isWeChatMiniProgram()) return;

    const mpOpenId = searchParams.get('mp_openid') || undefined;
    const mpUnionId = searchParams.get('mp_unionid') || undefined;

    if (mpOpenId) {
      sessionStorage.setItem('wechat_mp_openid', mpOpenId);
    }
    if (mpUnionId) {
      sessionStorage.setItem('wechat_mp_unionid', mpUnionId);
    }
  }, [searchParams]);

  // 监听支付回调（H5支付返回后自动处理）
  usePaymentCallback({
    onSuccess: (orderNo) => {
      // 支付成功后直接进入测评（避免重复打开支付弹窗导致卡住/循环）
      console.log('[WealthBlock] Payment callback success, order:', orderNo);
      setShowPayDialog(false);
      setShowIntro(false);
    },
    autoRedirect: false, // 不自动跳转，由本页面处理
  });

  // 监听小程序支付失败回调
  useEffect(() => {
    const paymentFail = searchParams.get('payment_fail');
    const orderNo = searchParams.get('order');

    if (paymentFail === '1') {
      console.log('[WealthBlock] Payment failed callback detected, order:', orderNo);

      // 清除 URL 参数
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment_fail');
      newUrl.searchParams.delete('order');
      window.history.replaceState({}, '', newUrl.toString());

      // 小程序回跳后直接重建并重开支付弹窗，由弹窗内部从缓存恢复“重新支付”状态
      setPayDialogInstanceKey((prev) => prev + 1);
      setShowPayDialog(true);
      toast.info('支付已取消，可重新支付');
    }
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || isPurchaseLoading || hasPurchased || isBloomPartner || !isMiniProgram) return;

    const maybeResumeMiniProgramPayment = () => {
      try {
        const dismissedPackageKey = sessionStorage.getItem(MP_PENDING_PAYMENT_DISMISSED_KEY);
        if (dismissedPackageKey === 'wealth_block_assessment') return;

        const raw = sessionStorage.getItem(MP_PENDING_PAYMENT_STORAGE_KEY);
        if (!raw) return;

        const cached = JSON.parse(raw) as {
          packageKey?: string;
          orderNo?: string;
          updatedAt?: number;
        };

        if (cached.packageKey !== 'wealth_block_assessment' || !cached.orderNo) return;

        const isExpired = !cached.updatedAt || Date.now() - cached.updatedAt > 30 * 60 * 1000;
        if (isExpired) {
          sessionStorage.removeItem(MP_PENDING_PAYMENT_STORAGE_KEY);
          return;
        }

        setPayDialogInstanceKey((prev) => prev + 1);
        setShowPayDialog(true);
      } catch {
        sessionStorage.removeItem(MP_PENDING_PAYMENT_STORAGE_KEY);
      }
    };

    maybeResumeMiniProgramPayment();
    window.addEventListener('pageshow', maybeResumeMiniProgramPayment);
    window.addEventListener('focus', maybeResumeMiniProgramPayment);

    return () => {
      window.removeEventListener('pageshow', maybeResumeMiniProgramPayment);
      window.removeEventListener('focus', maybeResumeMiniProgramPayment);
    };
  }, [authLoading, isPurchaseLoading, hasPurchased, isBloomPartner, isMiniProgram]);

  // 微信浏览器未登录时，点击支付前先触发静默授权（自动登录/注册）
  const triggerWeChatSilentAuth = async () => {
    console.log('[WealthBlock] Triggering WeChat silent auth for login/register');
    setIsRedirectingForAuth(true);

    try {
      // 构建回跳 URL：授权回来后自动再打开支付弹窗
      const resumeUrl = new URL(window.location.href);
      resumeUrl.searchParams.set('assessment_pay_resume', '1');

      const { data, error } = await supabase.functions.invoke('wechat-pay-auth', {
        body: {
          redirectUri: resumeUrl.toString(),
          flow: 'wealth_assessment',
        },
      });

      if (error || !data?.authUrl) {
        console.error('[WealthBlock] Failed to get silent auth URL:', error || data);
        setIsRedirectingForAuth(false);
        // 授权失败，直接打开支付弹窗（用扫码兜底）
        openWealthPayDialog();
        return;
      }

      console.log('[WealthBlock] Redirecting to silent auth...');
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('[WealthBlock] Silent auth error:', err);
      setIsRedirectingForAuth(false);
      openWealthPayDialog();
    }
  };

  const openWealthPayDialog = () => {
    // 每次点击都强制创建全新实例，确保不会复用上一次取消支付后的旧状态
    sessionStorage.removeItem(MP_PENDING_PAYMENT_DISMISSED_KEY);
    setPayDialogInstanceKey((prev) => prev + 1);
    setShowPayDialog(true);
  };

  // 处理支付按钮点击
  const handlePayClick = () => {
    console.log('[WealthBlock] handlePayClick called, user:', user?.id, 'isWeChatBrowser:', isWeChatBrowserEnv);
    
    // 微信浏览器内且未登录：先触发静默授权（自动登录/注册）
    if (isWeChatBrowserEnv && !user) {
      triggerWeChatSilentAuth();
      return;
    }
    
    // 已登录或非微信环境：直接打开支付弹窗
    openWealthPayDialog();
  };

  // 微信内静默授权返回后：自动登录 + 重新打开"测评支付弹窗"
  useEffect(() => {
    const handleWeChatPayAuthReturn = async () => {
      const url = new URL(window.location.href);
      const shouldResume = url.searchParams.get('assessment_pay_resume') === '1';
      const paymentOpenId = url.searchParams.get('payment_openid');
      const paymentTokenHash = url.searchParams.get('payment_token_hash');
      const paymentAuthError = url.searchParams.has('payment_auth_error');
      const payFlow = url.searchParams.get('pay_flow');

      // 只处理测评页的支付回调（或通用支付回调）
      if (!shouldResume) return;

      console.log('[WealthBlock] Processing payment auth return:', {
        paymentOpenId: !!paymentOpenId,
        paymentTokenHash: !!paymentTokenHash,
        paymentAuthError,
        payFlow,
      });

      // 清理 URL 参数，避免重复触发
      url.searchParams.delete('assessment_pay_resume');
      url.searchParams.delete('payment_openid');
      url.searchParams.delete('payment_token_hash');
      url.searchParams.delete('payment_auth_error');
      url.searchParams.delete('pay_flow');
      url.searchParams.delete('is_new_user');
      window.history.replaceState({}, '', url.toString());

      // 如果有 openId，缓存到 sessionStorage（供支付弹窗使用）
      if (paymentOpenId) {
        sessionStorage.setItem('wechat_payment_openid', paymentOpenId);
        // 🔧 同时写入 WechatPayDialog 使用的缓存 key，避免 key 不匹配导致循环授权
        localStorage.setItem('cached_payment_openid_gzh', paymentOpenId);
        sessionStorage.setItem('cached_payment_openid_gzh', paymentOpenId);
      }

      // 如果授权失败，清理防抖标记以允许重试
      if (paymentAuthError) {
        sessionStorage.removeItem('pay_auth_in_progress');
      }

      // 如果有 tokenHash，先自动登录，等待登录状态更新后再打开弹窗
      if (paymentTokenHash) {
        console.log('[WealthBlock] Attempting auto-login with tokenHash...');
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: paymentTokenHash,
            type: 'magiclink',
          });
          
          if (error) {
            console.error('[WealthBlock] Auto-login failed:', error);
            // 登录失败也继续打开弹窗（用扫码支付兜底）
            if (!hasPurchased) {
              openWealthPayDialog();
            } else {
              console.log('[WealthBlock] Already purchased, skipping pay dialog');
              setShowIntro(false);
            }
          } else if (data.session?.user) {
            // verifyOtp 返回了 session，说明登录已成功
            // 短暂延迟让 React 状态同步，然后立即打开弹窗
            console.log('[WealthBlock] Auto-login success, user:', data.session.user.id);
            // 🆕 登录后检查是否已购买
            setTimeout(async () => {
              const { data: existingOrder } = await supabase
                .from('orders')
                .select('id')
                .eq('user_id', data.session!.user.id)
                .eq('package_key', 'wealth_block_assessment')
                .eq('status', 'paid')
                .limit(1)
                .maybeSingle();

              if (existingOrder) {
                console.log('[WealthBlock] User already purchased after login, skipping pay dialog');
                setShowIntro(false);
              } else {
                openWealthPayDialog();
              }
            }, 100);
          } else {
            // 没有 session，等待 auth 状态更新
            console.log('[WealthBlock] Waiting for auth state update...');
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                console.log('[WealthBlock] Auth state updated, checking purchase status');
                // 🆕 登录后检查是否已购买
                supabase
                  .from('orders')
                  .select('id')
                  .eq('user_id', session.user.id)
                  .eq('package_key', 'wealth_block_assessment')
                  .eq('status', 'paid')
                  .limit(1)
                  .maybeSingle()
                  .then(({ data: existingOrder }) => {
                    if (existingOrder) {
                      console.log('[WealthBlock] User already purchased, skipping pay dialog');
                      setShowIntro(false);
                    } else {
                      openWealthPayDialog();
                    }
                  });
                subscription.unsubscribe();
              }
            });
            // 超时保护：1秒后无论如何都打开弹窗（如果还没购买）
            setTimeout(() => {
              subscription.unsubscribe();
              if (!hasPurchased) {
                openWealthPayDialog();
              }
            }, 1000);
          }
        } catch (err) {
          console.error('[WealthBlock] Auto-login exception:', err);
          if (!hasPurchased) {
            openWealthPayDialog();
          }
        }
      } else {
        // 🆕 没有 tokenHash，但可能用户已经通过其他方式登录了
        // 先检查当前登录状态和购买状态
        console.log('[WealthBlock] No tokenHash, checking current session...');
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          console.log('[WealthBlock] Found existing session:', currentSession.user.id);
          
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', currentSession.user.id)
            .eq('package_key', 'wealth_block_assessment')
            .eq('status', 'paid')
            .limit(1)
            .maybeSingle();
          
          if (existingOrder) {
            console.log('[WealthBlock] User already purchased (no tokenHash path), skipping pay dialog');
            setShowIntro(false);
            return;
          }
        }
        
        // 如果没登录或未购买，打开支付弹窗
        if (hasPurchased) {
          console.log('[WealthBlock] Already purchased (via hook), skipping pay dialog');
          setShowIntro(false);
        } else {
          openWealthPayDialog();
        }
      }
    };

    handleWeChatPayAuthReturn();
  }, []);

  // 页面访问埋点 + 加载历史记录
  // 注意：扫码追踪已由全局 GlobalRefTracker 统一处理
  useEffect(() => {
    // 埋点：测评页面访问
    trackEvent('assessment_page_viewed');
    
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("wealth_block_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistoryRecords(data as HistoryRecord[]);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleComplete = async (
    result: AssessmentResult, 
    answers: Record<number, number>, 
    followUpInsights?: FollowUpAnswer[],
    deepFollowUpAnswers?: DeepFollowUpAnswer[]
  ) => {
    setCurrentResult(result);
    setCurrentAnswers(answers);
    setCurrentFollowUpInsights(followUpInsights);
    setCurrentDeepFollowUpAnswers(deepFollowUpAnswers);
    setShowResult(true);
    setIsSaved(false);
    
    // 埋点：测评完成
    trackAssessmentTocamp('assessment_completed', {
      dominant_block: result.dominantBlock,
      dominant_poor: result.dominantPoor,
      health_score: Math.round(
        ((5 - result.behaviorScore) / 4 * 33) +
        ((5 - result.emotionScore) / 4 * 33) +
        ((5 - result.beliefScore) / 4 * 34)
      ),
      has_deep_followup: !!deepFollowUpAnswers && deepFollowUpAnswers.length > 0,
    }).then(() => {
      console.log('✅ Assessment completion tracked');
    }).catch((err) => {
      console.error('❌ Failed to track assessment completion:', err);
    });

    // 🆕 自动保存测评结果（用户无需手动点击保存按钮）
    if (user) {
      try {
        console.log('[WealthBlock] Auto-saving assessment result...');
        
        // 获取最近一次测评用于版本链接
        const { data: latestAssessment } = await supabase
          .from("wealth_block_assessments")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const prevId = latestAssessment?.id || null;
        const newVersion = (historyRecords.length || 0) + 1;

        const { data: savedRecord, error } = await supabase
          .from("wealth_block_assessments")
          .insert({
            user_id: user.id,
            answers: answers,
            behavior_score: result.behaviorScore,
            emotion_score: result.emotionScore,
            belief_score: result.beliefScore,
            mouth_score: result.mouthScore,
            hand_score: result.handScore,
            eye_score: result.eyeScore,
            heart_score: result.heartScore,
            dominant_block: result.dominantBlock,
            dominant_poor: result.dominantPoor,
            reaction_pattern: result.reactionPattern,
            version: newVersion,
            previous_assessment_id: prevId,
          })
          .select()
          .single();

        if (error) {
          console.error('[WealthBlock] Auto-save failed:', error);
        } else if (savedRecord) {
          console.log('✅ 测评结果已自动保存:', savedRecord.id);
          setIsSaved(true);
          setSavedAssessmentId(savedRecord.id);
          setPreviousAssessmentId(prevId);
          
          // 同步用户财富画像
          const healthScore = Math.round(
            ((5 - result.behaviorScore) / 4 * 33) +
            ((5 - result.emotionScore) / 4 * 33) +
            ((5 - result.beliefScore) / 4 * 34)
          );

          supabase.functions.invoke('sync-wealth-profile', {
            body: {
              user_id: user.id,
              assessment_result: {
                assessment_id: savedRecord.id,
                health_score: healthScore,
                reaction_pattern: result.reactionPattern,
                dominant_level: result.dominantBlock,
                top_poor: result.dominantPoor,
                top_emotion: result.dominantEmotionBlock || 'anxiety',
                top_belief: result.dominantBeliefBlock || 'lack',
              }
            }
          }).then(({ error: profileError }) => {
            if (profileError) {
              console.error('❌ 用户画像同步失败:', profileError);
            } else {
              console.log('✅ 用户财富画像同步成功');
            }
          });
          
          // 刷新历史记录
          loadHistory();
        }
      } catch (e) {
        console.error('[WealthBlock] Auto-save exception:', e);
        // 自动保存失败时静默处理，用户仍可手动保存
      }
    }
  };

  const handleSave = async () => {
    if (!user || !currentResult) {
      toast.error("请先登录后再保存");
      return;
    }

    setIsSaving(true);
    try {
      // Get most recent assessment for linking
      const { data: latestAssessment } = await supabase
        .from("wealth_block_assessments")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const prevId = latestAssessment?.id || null;
      setPreviousAssessmentId(prevId);

      // Calculate version number
      const newVersion = historyRecords.length + 1;

      // Save assessment result with version tracking
      const { data: savedRecord, error } = await supabase
        .from("wealth_block_assessments")
        .insert({
          user_id: user.id,
          answers: currentAnswers,
          behavior_score: currentResult.behaviorScore,
          emotion_score: currentResult.emotionScore,
          belief_score: currentResult.beliefScore,
          mouth_score: currentResult.mouthScore,
          hand_score: currentResult.handScore,
          eye_score: currentResult.eyeScore,
          heart_score: currentResult.heartScore,
          dominant_block: currentResult.dominantBlock,
          dominant_poor: currentResult.dominantPoor,
          reaction_pattern: currentResult.reactionPattern,
          version: newVersion,
          previous_assessment_id: prevId,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSavedAssessmentId(savedRecord?.id || null);

      // Sync user wealth profile for personalized coaching
      try {
        const healthScore = Math.round(
          ((5 - currentResult.behaviorScore) / 4 * 33) +
          ((5 - currentResult.emotionScore) / 4 * 33) +
          ((5 - currentResult.beliefScore) / 4 * 34)
        );

        console.log('🔄 开始同步用户财富画像...', { 
          user_id: user.id, 
          assessment_id: savedRecord?.id,
          health_score: healthScore,
          reaction_pattern: currentResult.reactionPattern 
        });

        const { data: profileData, error: profileError } = await supabase.functions.invoke('sync-wealth-profile', {
          body: {
            user_id: user.id,
            assessment_result: {
              assessment_id: savedRecord?.id,
              health_score: healthScore,
              reaction_pattern: currentResult.reactionPattern,
              dominant_level: currentResult.dominantBlock,
              top_poor: currentResult.dominantPoor,
              top_emotion: currentResult.dominantEmotionBlock || 'anxiety',
              top_belief: currentResult.dominantBeliefBlock || 'lack',
            }
          }
        });
        
        if (profileError) {
          console.error('❌ 用户画像同步失败:', profileError);
        } else {
          console.log('✅ 用户财富画像同步成功:', profileData);
          
          // 更新用户偏好教练为财富教练
          const { error: prefError } = await supabase
            .from('profiles')
            .update({ preferred_coach: 'wealth' })
            .eq('id', user.id);
          
          if (prefError) {
            console.error('❌ 更新用户偏好教练失败:', prefError);
          } else {
            console.log('✅ 用户偏好教练已更新为 wealth');
          }
        }
      } catch (profileError) {
        console.error('❌ 调用 sync-wealth-profile 异常:', profileError);
        // Don't fail the save if profile sync fails
      }
      
      setIsSaved(true);
      toast.success("测评结果已保存");
      loadHistory();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    setCurrentResult(null);
    setCurrentAnswers({});
    setCurrentFollowUpInsights(undefined);
    setCurrentDeepFollowUpAnswers(undefined);
    setShowResult(false);
    setIsSaved(false);
    setSavedAssessmentId(null);
    setPreviousAssessmentId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("wealth_block_assessments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setHistoryRecords(prev => prev.filter(r => r.id !== id));
      toast.success("记录已删除");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("删除失败");
    }
  };

  const handleViewDetail = (record: HistoryRecord) => {
    // 从 answers 重新计算完整结果（包含情绪/信念细分项）
    const answers = record.answers as Record<number, number>;
    if (answers && Object.keys(answers).length > 0) {
      const computed = calculateResult(answers);
      setCurrentResult(computed);
    } else {
      // 兜底：如果没有 answers，使用旧逻辑
      const result: AssessmentResult = {
        behaviorScore: record.behavior_score,
        emotionScore: record.emotion_score,
        beliefScore: record.belief_score,
        mouthScore: record.mouth_score || 0,
        handScore: record.hand_score || 0,
        eyeScore: record.eye_score || 0,
        heartScore: record.heart_score || 0,
        anxietyScore: 0,
        scarcityScore: 0,
        comparisonScore: 0,
        shameScore: 0,
        guiltScore: 0,
        lackScore: 0,
        linearScore: 0,
        stigmaScore: 0,
        unworthyScore: 0,
        relationshipScore: 0,
        dominantBlock: record.dominant_block,
        dominantPoor: record.dominant_poor || 'mouth',
        dominantEmotionBlock: 'anxiety',
        dominantBeliefBlock: 'lack',
        reactionPattern: record.reaction_pattern,
      };
      setCurrentResult(result);
    }
    setShowResult(true);
    setIsSaved(true);
    setActiveTab("assessment");
  };

  // 使用动态 OG 配置
  const { ogConfig } = usePageOG("wealthBlock");

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-amber-50 via-orange-50/30 to-white" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* SEO & 微信分享 Meta Tags - 动态从数据库读取 */}
      <DynamicOGMeta pageKey="wealthBlock" />

      {/* 导航栏 - 使用统一的PageHeader组件 */}
      <PageHeader 
        title=""
        backTo="/coach/wealth_coach_4_questions"
        className="bg-gradient-to-r from-amber-50/95 via-orange-50/95 to-amber-50/95 border-b border-amber-200/50"
        rightActions={
          <div className="flex items-center gap-1">
            {/* 财富教练入口按钮 */}
            <Button
              variant="ghost"
              onClick={() => navigate("/coach/wealth_coach_4_questions")}
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-full 
                         bg-gradient-to-r from-amber-400 to-orange-400 
                         hover:from-amber-500 hover:to-orange-500 
                         text-white shadow-md hover:shadow-lg 
                         transition-all duration-200 hover:scale-[1.02]
                         flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">财富教练</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            
            <WealthInviteCardDialog
              defaultTab={currentResult ? "value" : "promo"}
              assessmentScore={currentResult ? 100 - calculateHealthScore(
                currentResult.behaviorScore + currentResult.emotionScore + currentResult.beliefScore
              ) : undefined}
              reactionPattern={currentResult?.reactionPattern}
              trigger={
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              }
            />
          </div>
        }
      />

      {/* 主内容 */}
      <main className="container max-w-sm sm:max-w-lg mx-auto px-3 sm:px-4 pt-2 sm:pt-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          <TabsContent value="assessment" className="mt-0">
            <motion.div
              initial={{ opacity: 0.01, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            >
            {/* 正在跳转微信授权中 */}
            {isRedirectingForAuth && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground">正在跳转微信授权...</p>
              </div>
            )}
            
            {/* 登录状态加载中 */}
            {!isRedirectingForAuth && (authLoading || isPurchaseLoading) && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                <p className="text-muted-foreground text-sm">正在加载...</p>
              </div>
            )}
            
            {!isRedirectingForAuth && !authLoading && !isPurchaseLoading && showIntro && !showResult ? (
                <AssessmentIntroCard
                  isLoggedIn={!!user}
                  hasPurchased={hasPurchased}
                  isBloomPartner={isBloomPartner}
                  isLoading={false}
                  onStart={() => {
                    // 🔒 付费墙守门：未登录跳登录、未付费拉支付、绽放合伙人/已付费才放行
                    if (!user) {
                      sessionStorage.setItem('wealth_block_pending_pay', '1');
                      toast.info("请先登录");
                      navigate("/auth?redirect=/wealth-block");
                      return;
                    }
                    if (!hasPurchased && !isBloomPartner) {
                      console.log('[WealthBlock] Not purchased, opening pay dialog');
                      handlePayClick();
                      return;
                    }
                    // 埋点：开始测评
                    trackEvent('assessment_started');
                    console.log('[WealthBlock] User clicked start, hiding intro');
                    setShowIntro(false);
                  }}
                  onLogin={() => navigate("/auth?redirect=/wealth-block")}
                  onPay={handlePayClick}
                />
              ) : showResult && currentResult ? (
                <div className="space-y-6">
                  {/* Assessment Comparison - show after save if has previous */}
                  {isSaved && savedAssessmentId && previousAssessmentId && (
                    <AssessmentComparison
                      currentAssessmentId={savedAssessmentId}
                      previousAssessmentId={previousAssessmentId}
                    />
                  )}
                  
                  <WealthBlockResult
                    result={currentResult}
                    followUpInsights={currentFollowUpInsights}
                    deepFollowUpAnswers={currentDeepFollowUpAnswers}
                    onRetake={handleRetake}
                    onSave={user ? handleSave : undefined}
                    isSaving={isSaving}
                    isSaved={isSaved}
                    onAiInsightReady={setAiInsight}
                  />
                </div>
              ) : (
                <WealthBlockQuestions onComplete={handleComplete} onExit={() => setShowIntro(true)} />
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <motion.div
              initial={{ opacity: 0.01, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            >
              {!user ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="font-semibold mb-2">登录后查看历史记录</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    登录后可以保存测评结果并查看历史趋势
                  </p>
                  <Button onClick={() => navigate("/auth?redirect=/wealth-block")}>
                    去登录
                  </Button>
                </div>
              ) : (
                <>
                  {/* 趋势分析 */}
                  <WealthBlockTrend records={historyRecords} />
                  
                  {/* 历史记录列表 */}
                  <WealthBlockHistory
                    records={historyRecords}
                    isLoading={isLoadingHistory}
                    onDelete={handleDelete}
                    onViewDetail={handleViewDetail}
                  />
                </>
              )}
            </motion.div>
          </TabsContent>
          {/* 底部固定一体化导航栏 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-t border-gray-100 shadow-[0_-2px_20px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)] overflow-visible">
            <div className="container max-w-sm sm:max-w-lg mx-auto px-1 relative overflow-visible">
              {/* 隐藏的 TabsList 保持 Radix Tabs 状态同步 */}
              <TabsList className="hidden">
                <TabsTrigger value="assessment">开始测评</TabsTrigger>
                <TabsTrigger value="history">历史记录</TabsTrigger>
              </TabsList>

              {/* 自定义3栏导航 */}
              <div className="flex items-end justify-around pt-0.5 pb-1">
                {/* 左侧 - 开始测评 */}
                <button
                  onClick={() => { setActiveTab("assessment"); setShowResult(false); setCurrentResult(null); setShowIntro(true); window.scrollTo(0, 0); }}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 min-w-[72px]
                    ${activeTab === "assessment" 
                      ? "text-rose-600" 
                      : "text-gray-400 hover:text-gray-600"}`}
                >
                  <RotateCcw className={`w-[18px] h-[18px] transition-all duration-200 ${activeTab === "assessment" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
                  <span className={`text-[10px] leading-tight tracking-wide ${activeTab === "assessment" ? "font-bold" : "font-medium"}`}>重新测评</span>
                </button>

                {/* 中间 - 凸出的教练解说 FAB（仅结果页显示） */}
                {showResult && currentResult && (
                  <div className="relative -top-5 flex flex-col items-center">
                    <AssessmentVoiceCoach
                      result={currentResult}
                      aiInsight={aiInsight}
                      healthScore={Math.round(
                        ((5 - currentResult.behaviorScore) / 4 * 33) +
                        ((5 - currentResult.emotionScore) / 4 * 33) +
                        ((5 - currentResult.beliefScore) / 4 * 34)
                      )}
                    />
                  </div>
                )}

                {/* 右侧 - 历史记录 */}
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 min-w-[72px] relative
                    ${activeTab === "history" 
                      ? "text-rose-600" 
                      : "text-gray-400 hover:text-gray-600"}`}
                >
                  <History className={`w-[18px] h-[18px] transition-all duration-200 ${activeTab === "history" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
                  <span className={`text-[10px] leading-tight tracking-wide ${activeTab === "history" ? "font-bold" : "font-medium"}`}>历史记录</span>
                </button>
              </div>
            </div>
          </div>
        </Tabs>
      </main>

      {/* 支付对话框 */}
      <AssessmentPayDialog
        key={payDialogInstanceKey}
        open={showPayDialog}
        onOpenChange={(open) => {
          console.log('[WealthBlock] PayDialog onOpenChange:', open);
          if (open) {
            sessionStorage.removeItem(MP_PENDING_PAYMENT_DISMISSED_KEY);
          }
          setShowPayDialog(open);
        }}
        userId={user?.id}
        hasPurchased={hasPurchased}
        packageKey="wealth_block_assessment"
        packageName="财富卡点测评"
        onSuccess={(returnedUserId) => {
          // 支付+注册成功，开始测评
          console.log('[WealthBlock] PayDialog onSuccess, userId:', returnedUserId);
          console.log('[WealthBlock] Setting showIntro=false, showPayDialog=false');
          sessionStorage.removeItem(MP_PENDING_PAYMENT_DISMISSED_KEY);
          setShowIntro(false);
          setShowPayDialog(false);
        }}
      />
    </div>
  );
}
