import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, KeyRound, CheckCircle, Sparkles, ArrowRight, LogIn, Brain, MessageCircle, Share2, Gift, CheckCircle2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCampPurchase } from '@/hooks/useCampPurchase';
import { UnifiedPayDialog } from '@/components/UnifiedPayDialog';
import { StartCampDialog } from '@/components/camp/StartCampDialog';
import PageHeader from '@/components/PageHeader';

const PENDING_CODE_KEY = 'pending_camp_activation_code';

const WealthCampActivate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [pendingCode, setPendingCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);

  // 检查购买状态
  const { data: purchaseRecord, refetch: refetchPurchase } = useCampPurchase('wealth_block_7');
  const hasPurchased = !!purchaseRecord;

  // 检查是否已开营
  const { data: existingCamp } = useQuery({
    queryKey: ['existing-wealth-camp'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('camp_type', 'wealth_block_7')
        .in('status', ['active', 'paused'])
        .maybeSingle();
      return data;
    },
  });
  const hasJoinedCamp = !!existingCamp;

  // After login, check if there's a pending activation
  useEffect(() => {
    if (user && pendingCode) {
      performActivation(pendingCode);
      setPendingCode('');
    }
  }, [user, pendingCode]);

  // Check for pending code from localStorage after login
  useEffect(() => {
    if (user && !authLoading) {
      const savedCode = localStorage.getItem(PENDING_CODE_KEY);
      if (savedCode) {
        localStorage.removeItem(PENDING_CODE_KEY);
        setCode(savedCode);
        setShowCodeInput(true);
        performActivation(savedCode);
      }
    }
  }, [user, authLoading]);

  const handleActivate = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      toast.error('请输入兑换码');
      return;
    }
    if (!user) {
      setPendingCode(trimmedCode);
      setShowLoginPrompt(true);
      return;
    }
    await performActivation(trimmedCode);
  };

  const performActivation = async (activationCode: string) => {
    setIsActivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-camp-activation-code', {
        body: { code: activationCode }
      });
      if (error) {
        console.error('[CampActivate] Error:', error);
        toast.error(error.message || '兑换失败，请重试');
        setIsActivating(false);
        return;
      }
      if (!data.success) {
        toast.error(data.error || '兑换失败');
        if (data.alreadyActivated) {
          setTimeout(() => navigate('/wealth-camp-intro'), 1500);
        }
        setIsActivating(false);
        return;
      }
      setActivationSuccess(true);
      toast.success('兑换成功！');
      refetchPurchase();
      queryClient.invalidateQueries({ queryKey: ['camp-purchase', 'wealth_block_7'] });
      setTimeout(() => {
        setShowStartDialog(true);
        setActivationSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('[CampActivate] Unexpected error:', err);
      toast.error('系统错误，请稍后重试');
      setIsActivating(false);
    }
  };

  const handleGoToLogin = () => {
    if (code.trim()) {
      localStorage.setItem(PENDING_CODE_KEY, code.trim());
    }
    navigate('/auth?redirect=/wealth-camp-activate');
  };

  // 痛点
  const painPoints = [
    '明明知道该行动，却迟迟不动',
    '一想到钱、销售、邀请，就开始抗拒',
    '内心渴望丰盛，但行为始终很保守',
    '忙，却没有真实的积累感',
  ];

  // 每日四件事（简洁版）
  const dailyHighlights = [
    { icon: Brain, title: '财富觉察冥想', desc: '让卡点浮现，5-8分钟', color: 'from-purple-500 to-indigo-500', bg: 'bg-purple-50' },
    { icon: MessageCircle, title: '财富教练对话', desc: 'AI教练1对1陪伴，5分钟', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
    { icon: Share2, title: '打卡与分享', desc: '一句真实的觉察，即是训练', color: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50' },
    { icon: Gift, title: '邀请实验', desc: '照见内在反应的行为练习', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      <PageHeader title="财富觉醒训练营" className="bg-white/80 border-amber-100" />

      <div className="pb-44">
        {/* Hero */}
        <section className="relative px-4 pt-4 pb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-orange-300/10 to-transparent" />
          <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium mb-2">
              <Sparkles className="w-3 h-3" />
              每天15分钟 · 7天突破
            </div>
            <h1 className="text-lg font-bold text-foreground mb-2">财富觉醒训练营</h1>
            <p className="text-sm text-amber-700 font-medium mb-2">
              不是逼你赚钱，而是帮你走出「卡住的位置」
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              很多人不是赚不到钱，而是每天都卡在同一个地方，却从来没有被真正看见。
            </p>
          </div>
        </section>

        {/* 每日四件事 - 简洁卡片 */}
        <section className="px-4 py-6">
          <h2 className="text-base font-bold text-foreground mb-4">每天做哪四件事？</h2>
          <div className="grid grid-cols-2 gap-3">
            {dailyHighlights.map((item, i) => (
              <div key={i} className={`p-3 rounded-2xl ${item.bg} border border-white/50`}>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-0.5">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 痛点共鸣 */}
        <section className="px-4 py-6">
          <h2 className="text-base font-bold text-foreground mb-3">这些状态，你中了几个？</h2>
          <div className="space-y-2.5">
            {painPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/60 backdrop-blur rounded-xl border border-amber-100">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <p className="text-foreground text-sm">{point}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
            <p className="text-foreground text-sm leading-relaxed">
              <span className="font-semibold text-amber-700">这不是能力问题，</span><br />
              而是财富在你身上的流动，被某个地方卡住了。
            </p>
          </div>
        </section>

        {/* 训练营说明 */}
        <section className="px-4 py-6">
          <Card className="border-amber-100 bg-amber-50/50">
            <CardContent className="pt-4 pb-4 space-y-2">
              <h3 className="font-semibold text-foreground text-sm mb-2">训练营包含什么？</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />7天系统化财富觉醒练习</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />AI 财富教练 1对1 对话</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />每日冥想与财富信念重塑</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />社区打卡与成长见证</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />个性化财富卡点突破方案</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* 固定底部 CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-lg border-t border-amber-100 z-20 safe-bottom">
        <div className="max-w-sm mx-auto">
          {hasJoinedCamp ? (
            <Button
              onClick={() => navigate('/wealth-camp-checkin')}
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium"
            >
              继续我的训练营
            </Button>
          ) : hasPurchased ? (
            <Button
              onClick={() => setShowStartDialog(true)}
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium"
            >
              开始训练营
            </Button>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <span className="text-muted-foreground line-through text-xs">¥399</span>
                <span className="text-xl font-bold text-amber-600">¥299</span>
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">限时优惠</span>
              </div>
              <Button
                onClick={() => setShowPayDialog(true)}
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium"
              >
                ¥299 开启财富觉醒训练营
              </Button>

              {/* 兑换码折叠入口 */}
              <Collapsible open={showCodeInput} onOpenChange={setShowCodeInput}>
                <CollapsibleTrigger className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  我有兑换码
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      placeholder="请输入兑换码"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="h-9 text-sm text-center tracking-widest font-mono border-amber-300"
                      maxLength={20}
                      disabled={isActivating}
                    />
                    <Button
                      size="sm"
                      onClick={handleActivate}
                      disabled={!code.trim() || isActivating}
                      className="h-9 px-4 whitespace-nowrap"
                    >
                      {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : '兑换'}
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </div>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">请先登录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              兑换训练营需要先登录或注册账号
            </p>
            <Button
              onClick={handleGoToLogin}
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <LogIn className="w-4 h-4" />
              前往登录/注册
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              登录后将自动继续兑换流程
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activation Success Toast overlay */}
      {activationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Card className="w-64 text-center border-amber-200 shadow-lg">
            <CardContent className="pt-6 pb-4 space-y-3">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-amber-900">兑换成功！</h3>
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 mx-auto" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pay Dialog */}
      <UnifiedPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={{
          key: 'camp-wealth_block_7',
          name: '财富觉醒训练营',
          price: 299
        }}
        onSuccess={async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('user_camp_purchases').insert({
                user_id: user.id,
                camp_type: 'wealth_block_7',
                camp_name: '财富觉醒训练营',
                purchase_price: 299,
                payment_status: 'paid'
              });
            }
          } catch (err) {
            console.error('❌ Failed to record purchase:', err);
          }
          setShowPayDialog(false);
          toast.success('购买成功！请选择开始日期');
          refetchPurchase();
          queryClient.invalidateQueries({ queryKey: ['camp-purchase', 'wealth_block_7'] });
          setShowStartDialog(true);
        }}
      />

      {/* Start Camp Dialog */}
      <StartCampDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        campTemplate={{
          camp_type: 'wealth_block_7',
          camp_name: '财富觉醒训练营',
          duration_days: 7,
          icon: '💰',
          price: 299,
          original_price: 399,
          price_note: '限时优惠',
        }}
        onSuccess={(campId) => {
          navigate('/wealth-camp-checkin');
        }}
      />
    </div>
  );
};

export default WealthCampActivate;
