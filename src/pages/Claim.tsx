import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Gift, AlertCircle, Sparkles, Info, Share2, MessageCircle, BarChart3, ClipboardList, Skull, BookOpen, Siren, Home } from "lucide-react";
import { toast } from "sonner";

type ClaimStatus = 'loading-preview' | 'preview' | 'claiming' | 'success' | 'error' | 'no-partner' | 'self-claim' | 'already-claimed';

interface PreviewItem {
  item_key: string;
  name: string;
  value: string;
  icon: string;
  description: string;
  color_theme: string;
  category: string;
}

const ENTRY_MAPPINGS: { keyword: string; label: string; path: string; icon: React.ReactNode }[] = [
  { keyword: '尝鲜会员', label: '和AI教练聊聊', path: '/coach/awakening', icon: <MessageCircle className="w-4 h-4" /> },
  { keyword: '情绪健康测评', label: '开始情绪健康测评', path: '/emotion-health', icon: <BarChart3 className="w-4 h-4" /> },
  { keyword: 'SCL-90', label: '开始SCL-90测评', path: '/scl90', icon: <ClipboardList className="w-4 h-4" /> },
  { keyword: '财富卡点', label: '开始财富卡点测评', path: '/wealth-block', icon: <BarChart3 className="w-4 h-4" /> },
  { keyword: '安全守护', label: '开启每日打卡', path: '/alive-check', icon: <Skull className="w-4 h-4" /> },
  { keyword: '觉察日记', label: '写觉察日记', path: '/awakening', icon: <BookOpen className="w-4 h-4" /> },
  { keyword: '情绪SOS', label: '试试情绪SOS', path: '/emotion-button', icon: <Siren className="w-4 h-4" /> },
];

export default function Claim() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partnerId = searchParams.get("partner");
  const posterId = searchParams.get("poster");
  const type = searchParams.get("type");
  const ref = searchParams.get("ref");
  
  const [status, setStatus] = useState<ClaimStatus>('loading-preview');
  const [message, setMessage] = useState("");
  const [grantedItems, setGrantedItems] = useState<string[]>([]);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [previewError, setPreviewError] = useState("");

  // Track poster scan on page load
  useEffect(() => {
    if (partnerId && posterId) {
      trackPosterScan();
    }
  }, [partnerId, posterId]);

  const trackPosterScan = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-poster-scan`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poster_id: posterId,
            partner_id: partnerId,
            referrer: document.referrer || null,
          }),
        }
      );
    } catch (e) {
      console.error('Failed to track poster scan:', e);
    }
  };

  // Handle camp invite referral
  const processCampInvite = async (userId: string, inviterUserId: string) => {
    try {
      const { data: existing } = await supabase
        .from('camp_invite_referrals')
        .select('id')
        .eq('referred_user_id', userId)
        .eq('inviter_user_id', inviterUserId)
        .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
        .maybeSingle();

      if (existing) return;
      if (userId === inviterUserId) return;

      await supabase
        .from('camp_invite_referrals')
        .insert({
          inviter_user_id: inviterUserId,
          referred_user_id: userId,
          camp_type: 'wealth_block_7',
          status: 'pending',
        });
    } catch (e) {
      console.error('Error processing camp invite:', e);
    }
  };

  useEffect(() => {
    if (type === 'wealth_camp' && ref) {
      handleCampInvite();
      return;
    }
    if (!partnerId) {
      setStatus('no-partner');
      setMessage("缺少合伙人信息");
      return;
    }
    loadPreview();
  }, [partnerId, type, ref]);

  const handleCampInvite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        localStorage.setItem('camp_invite_ref', ref!);
        navigate('/wealth-camp-intro');
        return;
      }
      await processCampInvite(user.id, ref!);
      navigate('/wealth-camp-intro');
    } catch (error) {
      console.error('Error handling camp invite:', error);
      navigate('/wealth-camp-intro');
    }
  };

  const loadPreview = async () => {
    setStatus('loading-preview');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-partner-preview?partner_id=${partnerId}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || '获取权益信息失败');
        setStatus('error');
        setMessage(data.error || '获取权益信息失败');
        return;
      }
      setPreviewItems(data.items || []);
      setStatus('preview');
    } catch (e) {
      console.error('Load preview error:', e);
      setPreviewError('网络错误，请稍后重试');
      setStatus('error');
      setMessage('网络错误，请稍后重试');
    }
  };

  const handleClaim = async () => {
    // Check auth first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const redirectUrl = `/claim?partner=${partnerId}${posterId ? `&poster=${posterId}` : ''}`;
      navigate(`/auth?register=true&redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    setStatus('claiming');
    try {
      const { data, error } = await supabase.functions.invoke('claim-partner-entry', {
        body: { partner_id: partnerId }
      });

      if (error) throw error;

      if (data.success) {
        setStatus('success');
        setGrantedItems(data.granted_items || []);
        setMessage(data.message || "领取成功！");
        toast.success("🎉 领取成功！");
      } else {
        const msg = data.message || "领取失败";
        if (msg.includes("自己")) {
          setStatus('self-claim');
        } else if (msg.includes("已经领取") || msg.includes("已领取")) {
          setStatus('already-claimed');
        } else {
          setStatus('error');
        }
        setMessage(msg);
      }
    } catch (error: any) {
      console.error("Claim error:", error);
      const msg = error.message || "领取失败，请稍后重试";
      if (msg.includes("自己")) {
        setStatus('self-claim');
      } else if (msg.includes("已经领取") || msg.includes("已领取")) {
        setStatus('already-claimed');
      } else {
        setStatus('error');
      }
      setMessage(msg);
    }
  };

  // Auto-claim if user returns from auth (already logged in and in preview state)
  useEffect(() => {
    if (status === 'preview' && partnerId) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        // Check if user just returned from auth redirect
        const returnedFromAuth = document.referrer.includes('/auth') || sessionStorage.getItem('claim_pending');
        if (user && returnedFromAuth) {
          sessionStorage.removeItem('claim_pending');
          handleClaim();
        }
      });
    }
  }, [status]);

  // Mark pending claim before redirect
  const handleClaimClick = () => {
    sessionStorage.setItem('claim_pending', '1');
    handleClaim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-teal-100">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center gap-3">
            {(status === 'loading-preview' || status === 'claiming') && (
              <>
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                <span className="text-lg text-teal-700">
                  {status === 'claiming' ? '正在领取...' : '加载中...'}
                </span>
              </>
            )}
            {status === 'preview' && (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <span className="text-xl text-teal-700">🎁 有人送你一份成长礼物</span>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <span className="text-xl text-teal-700">🎉 已获得体验套餐！</span>
              </>
            )}
            {status === 'self-claim' && (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Share2 className="w-10 h-10 text-blue-500" />
                </div>
                <span className="text-xl text-blue-700">这是你的推广链接</span>
              </>
            )}
            {status === 'already-claimed' && (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <span className="text-xl text-teal-700">已领取过</span>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <span className="text-xl text-red-600">出错了</span>
              </>
            )}
            {status === 'no-partner' && (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                </div>
                <span className="text-xl text-amber-600">无效链接</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview state - show benefits */}
          {status === 'preview' && (
            <>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">以下权益将免费解锁给你：</p>
                <div className="space-y-2">
                  {previewItems.map((item) => (
                    <div
                      key={item.item_key}
                      className="flex items-start gap-3 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 rounded-xl p-3 text-left"
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{item.name}</span>
                          <span className="text-[10px] text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">{item.value}</span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleClaimClick}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              >
                <Gift className="w-5 h-5 mr-1" />
                免费领取
              </Button>
            </>
          )}

          {/* Success state */}
          {status === 'success' && (() => {
            const defaultItems = [
              '🎫 尝鲜会员 50点AI教练额度',
              '💰 财富卡点测评',
              '💚 情绪健康测评',
              '📋 SCL-90心理测评',
              '🫀 每日安全守护',
              '📔 觉察日记',
              '🆘 情绪SOS按钮',
            ];
            const itemsToShow = grantedItems.length > 0 ? grantedItems : defaultItems;
            return (
              <>
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-center gap-2 text-lg font-bold text-teal-600">
                      <Sparkles className="w-5 h-5" />
                      <span>体验套餐权益</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {itemsToShow.map((item, i) => (
                        <div key={i} className="flex items-center justify-center gap-2">
                          <span className="text-teal-500">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">现在就开始你的情绪梳理之旅吧！</p>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const matchedEntries = ENTRY_MAPPINGS.filter(entry =>
                      itemsToShow.some(item => item.includes(entry.keyword))
                    ).slice(0, 3);

                    if (matchedEntries.length === 0) {
                      return (
                        <Button
                          onClick={() => navigate('/')}
                          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                        >
                          ✨ 开始体验
                        </Button>
                      );
                    }

                    return matchedEntries.map((entry, index) => (
                      <Button
                        key={entry.path}
                        onClick={() => navigate(entry.path)}
                        variant={index === 0 ? "default" : "outline"}
                        className={index === 0
                          ? "w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                          : "w-full"
                        }
                      >
                        {entry.icon}
                        {entry.label}
                      </Button>
                    ));
                  })()}
                  <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                    <Home className="w-4 h-4" />
                    进入首页
                  </Button>
                </div>
              </>
            );
          })()}

          {status === 'self-claim' && (
            <>
              <div className="text-center space-y-3">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                    <Info className="w-5 h-5" />
                    <span className="font-medium">温馨提示</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    这是你自己的推广链接，无法自己领取哦～
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    把链接分享给朋友，他们就能领取你的体验套餐！
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/partner')}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  去合伙人中心分享
                </Button>
                <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                  返回首页
                </Button>
              </div>
            </>
          )}

          {status === 'already-claimed' && (
            <>
              <div className="text-center space-y-3">
                <div className="bg-teal-50 rounded-xl p-4">
                  <p className="text-sm text-teal-700">
                    你已经领取过体验套餐，无需重复领取 🎉
                  </p>
                  <p className="text-sm text-teal-600 mt-2">
                    快去体验AI教练和各种工具吧！
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                >
                  ✨ 开始使用
                </Button>
                <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                  进入首页
                </Button>
              </div>
            </>
          )}
          
          {(status === 'error' || status === 'no-partner') && (
            <>
              <p className="text-center text-muted-foreground">{message}</p>
              <Button onClick={() => navigate('/')} className="w-full" variant="outline">
                返回首页
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
