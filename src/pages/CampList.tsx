import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CampTemplateCard } from "@/components/camp/CampTemplateCard";
import { CampCardSkeleton } from "@/components/camp/CampCardSkeleton";
import { CampEmptyState } from "@/components/camp/CampEmptyState";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import type { CampTemplate } from "@/types/trainingCamp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { useCampPurchase } from "@/hooks/useCampPurchase";
import { BookOpen, HeartHandshake, Target, Sparkles } from "lucide-react";

const campCategories = [
  {
    id: 'youjin',
    name: '有劲训练营',
    emoji: '💪',
    description: '培养每日成长习惯，积累点滴进步',
    intro: '通过系统化训练，帮助你建立稳定的情绪管理能力和积极的生活习惯。每天只需15-30分钟，AI教练全程陪伴，按自己的节奏成长。',
    features: [
      { icon: '📝', label: '每日打卡', desc: '结构化任务引导' },
      { icon: '🤖', label: 'AI教练', desc: '随时对话支持' },
      { icon: '📊', label: '成长档案', desc: '可视化进步轨迹' },
    ],
  },
  {
    id: 'bloom',
    name: '绽放训练营',
    emoji: '🦋',
    description: '系统性生命成长课程，深度自我转化',
    intro: '由专业人类教练1对1陪伴，包含情感疗愈、身份重建、生命力绽放三大模块，适合希望实现深层改变的你。',
    features: [
      { icon: '👩‍🏫', label: '真人教练', desc: '1对1专业陪伴' },
      { icon: '🎥', label: '视频课程', desc: '体系化学习内容' },
      { icon: '🌱', label: '深度转化', desc: '从根源实现改变' },
    ],
  }
];

const CampList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter'); // 'active' | 'completed' | null
  const { user } = useAuth();
  const { data: stressCampPurchase } = useCampPurchase('emotion_stress_7');
  const { data: bloomCampPurchase } = useCampPurchase('emotion_bloom');
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('youjin');
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<CampTemplate | null>(null);

  // Query user's training camps when filter is active/completed/my
  const { data: userCamps, isLoading: isLoadingUserCamps } = useQuery({
    queryKey: ['user-training-camps', filterParam, user?.id],
    queryFn: async () => {
      if (!user || !filterParam) return null;
      
      if (filterParam === 'my') {
        // "我的训练营" mode: merge purchases + active/completed camps
        const [purchasesRes, campsRes] = await Promise.all([
          supabase
            .from('user_camp_purchases')
            .select('*')
            .eq('user_id', user.id)
            .eq('payment_status', 'completed')
            .order('purchased_at', { ascending: false }),
          supabase
            .from('training_camps')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['active', 'completed'])
            .order('updated_at', { ascending: false }),
        ]);
        if (purchasesRes.error) throw purchasesRes.error;
        if (campsRes.error) throw campsRes.error;
        
        const camps = campsRes.data || [];
        const purchases = purchasesRes.data || [];
        
        // Build merged list with status
        const result: any[] = [];
        const usedCampTypes = new Set<string>();
        
        // First add active camps (highest priority)
        camps.filter(c => c.status === 'active').forEach(camp => {
          usedCampTypes.add(camp.camp_type);
          result.push({
            ...camp,
            _myStatus: 'active',
            _statusLabel: `进行中 · Day ${camp.current_day}/${camp.duration_days}`,
          });
        });
        
        // Then completed camps
        camps.filter(c => c.status === 'completed').forEach(camp => {
          if (!usedCampTypes.has(camp.camp_type)) {
            usedCampTypes.add(camp.camp_type);
          }
          result.push({
            ...camp,
            _myStatus: 'completed',
            _statusLabel: `已完成 · 打卡${camp.completed_days}天`,
          });
        });
        
        // Then purchased but not started (no matching training_camps record)
        // Deduplicate purchases by camp_type (keep earliest)
        const seenCampTypes = new Set<string>();
        const dedupedPurchases = purchases.filter(p => {
          if (seenCampTypes.has(p.camp_type)) return false;
          seenCampTypes.add(p.camp_type);
          return true;
        });
        dedupedPurchases.forEach(purchase => {
          const campType = purchase.camp_type;
          // Check if there's already a camp for this type
          const hasCamp = camps.some(c => c.camp_type === campType);
          if (!hasCamp) {
            result.push({
              id: purchase.id,
              camp_type: campType,
              camp_name: purchase.camp_name,
              duration_days: 0,
              current_day: 0,
              completed_days: 0,
              status: 'purchased',
              _myStatus: 'purchased',
              _statusLabel: '已购 · 未开营',
              _purchaseId: purchase.id,
              created_at: purchase.purchased_at,
            });
          }
        });
        
        return result;
      }
      
      // Original active/completed filter
      const { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', filterParam === 'active' ? 'active' : 'completed')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!filterParam
  });

  const { isPaymentCallback } = usePaymentCallback({
    onSuccess: () => {
      toast.success("购买成功！", { description: "即将开启你的训练营之旅" });
      setPayDialogOpen(false);
      // Invalidate purchase queries so cards update
      queryClient.invalidateQueries({ queryKey: ['camp-card-purchase'] });
    },
    showToast: false,
    showConfetti: true,
    autoRedirect: false,
  });

  useEffect(() => {
    if (isPaymentCallback) setPayDialogOpen(false);
  }, [isPaymentCallback]);

  const handlePurchase = (camp: CampTemplate) => {
    if (!user) {
      toast.error("请先登录", { description: "登录后即可购买训练营" });
      navigate('/auth');
      return;
    }
    setSelectedCamp(camp);
    setPayDialogOpen(true);
  };

  const { data: campTemplates, isLoading } = useQuery({
    queryKey: ['camp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as unknown as CampTemplate[];
    }
  });

  const filteredCamps = useMemo(() => {
    return campTemplates?.filter(camp => (camp.category || 'youjin') === activeCategory) || [];
  }, [campTemplates, activeCategory]);

  const currentCategory = campCategories.find(cat => cat.id === activeCategory)!;

  // If filter mode, show user's camps
  if (filterParam) {
    const filterTitle = filterParam === 'my' ? '我的训练营' : filterParam === 'active' ? '待学课程' : '已学课程';
    const emptyEmoji = filterParam === 'my' ? '🏕️' : filterParam === 'active' ? '📚' : '🎓';
    const emptyText = filterParam === 'my' ? '还没有训练营，去看看吧' : filterParam === 'active' ? '暂无进行中的课程' : '暂无已完成的课程';
    const isFilterLoading = isLoadingUserCamps;

    const handleMyCampClick = (camp: any) => {
      if (camp._myStatus === 'purchased') {
        // Purchased but not started → go to camp intro to start
        navigate(`/camp-intro/${camp.camp_type}`);
      } else if (camp._myStatus === 'active') {
        navigate(`/camp-checkin/${camp.id}`);
      } else if (camp._myStatus === 'completed') {
        navigate(`/camp-checkin/${camp.id}`);
      } else {
        navigate(`/camp-checkin/${camp.id}`);
      }
    };

    const getStatusBadge = (camp: any) => {
      if (camp._myStatus === 'active') {
        return <Badge className="bg-primary/15 text-primary border-primary/20">进行中</Badge>;
      }
      if (camp._myStatus === 'completed') {
        return <Badge variant="secondary">已完成</Badge>;
      }
      if (camp._myStatus === 'purchased') {
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20">待开营</Badge>;
      }
      return <Badge variant={camp.status === 'active' ? 'default' : 'secondary'}>
        {camp.status === 'active' ? '进行中' : '已完成'}
      </Badge>;
    };
    
    return (
      <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
        <PageHeader title={filterTitle} showBack />
        <main className="container max-w-2xl mx-auto px-4 py-6">
          {isFilterLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <CampCardSkeleton key={i} />)}
            </div>
          ) : !userCamps || userCamps.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">{emptyEmoji}</p>
              <p className="text-muted-foreground">{emptyText}</p>
              <Button variant="outline" onClick={() => navigate('/camps')}>
                浏览训练营
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userCamps.map((camp: any) => (
                <Card 
                  key={camp.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow border-border/40"
                  onClick={() => filterParam === 'my' ? handleMyCampClick(camp) : navigate(`/camp-checkin/${camp.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{camp.camp_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {camp._statusLabel || `第 ${camp.current_day}/${camp.duration_days} 天 · 已打卡 ${camp.completed_days} 天`}
                      </p>
                    </div>
                    {getStatusBadge(camp)}
                  </div>
                </Card>
              ))}

              {/* "浏览更多训练营" button for my filter */}
              {filterParam === 'my' && (
                <div className="pt-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/camps')}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    浏览更多训练营
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
        <PageHeader title="训练营" showBack />
        <main className="container max-w-2xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <CampCardSkeleton key={i} />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
        <PageHeader title="训练营" showBack />

        <main className="container max-w-2xl mx-auto px-4 pb-8">
          {/* Hero 简介 */}
          <section className="py-5 space-y-2">
            <h1 className="text-xl font-bold text-foreground">选择适合你的成长路径</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              科学设计的训练体系，专业教练全程陪伴，帮助你在情绪管理、亲子关系、自我成长等方面实现真正改变。
            </p>
          </section>

          {/* 为什么选择训练营 */}
          <section className="grid grid-cols-3 gap-2 mb-5">
            <Card className="p-3 text-center border-border/40 bg-card/50">
              <Target className="w-5 h-5 mx-auto mb-1.5 text-primary" />
              <div className="text-xs font-medium text-foreground">目标明确</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">每日清晰任务</div>
            </Card>
            <Card className="p-3 text-center border-border/40 bg-card/50">
              <HeartHandshake className="w-5 h-5 mx-auto mb-1.5 text-primary" />
              <div className="text-xs font-medium text-foreground">教练陪伴</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">不再孤军奋战</div>
            </Card>
            <Card className="p-3 text-center border-border/40 bg-card/50">
              <BookOpen className="w-5 h-5 mx-auto mb-1.5 text-primary" />
              <div className="text-xs font-medium text-foreground">科学体系</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">循序渐进课程</div>
            </Card>
          </section>

          {/* Category Tabs */}
          <div className="flex gap-2 pb-3 sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-2">
            {campCategories.map(category => {
              const isActive = activeCategory === category.id;
              const count = campTemplates?.filter(c => (c.category || 'youjin') === category.id).length || 0;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                  <Badge variant="secondary" className={cn(
                    "text-[10px] px-1.5 py-0 h-4 min-w-0",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : ""
                  )}>
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Category Intro Card */}
          <Card className="p-4 mb-4 border-border/40 bg-muted/30">
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              {currentCategory.intro}
            </p>
            <div className="flex gap-3">
              {currentCategory.features.map((f, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-lg">{f.icon}</span>
                  <div className="text-xs font-medium text-foreground mt-1">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Camp Cards */}
          {filteredCamps.length > 0 ? (
            <div className="space-y-4">
              {filteredCamps.map((camp, index) => (
                <CampTemplateCard
                  key={camp.id}
                  camp={camp}
                  index={index}
                  enrolledCount={0}
                  onClick={() => {
                    if (camp.camp_type === 'parent_emotion_21') {
                      navigate('/parent-camp');
                    } else if (camp.camp_type === 'emotion_stress_7') {
                      if (stressCampPurchase) {
                        navigate('/camp-checkin');
                      } else {
                        navigate('/promo/synergy');
                      }
                    } else if (camp.camp_type === 'emotion_bloom') {
                      if (bloomCampPurchase) {
                        navigate('/camp-checkin');
                      } else {
                        navigate('/camp-intro/emotion_bloom');
                      }
                    } else if (camp.camp_type === 'identity_bloom') {
                      if (bloomCampPurchase) {
                        navigate('/camp-checkin');
                      } else {
                        navigate('/camp-intro/identity_bloom');
                      }
                    } else {
                      navigate(`/camp-template/${camp.id}`);
                    }
                  }}
                  onPurchase={handlePurchase}
                />
              ))}
            </div>
          ) : (
            <CampEmptyState
              categoryName={currentCategory.name}
              onExploreOther={() => {
                const otherCategory = campCategories.find(c => c.id !== activeCategory);
                if (otherCategory) setActiveCategory(otherCategory.id);
              }}
            />
          )}
        </main>
      </div>

      <UnifiedPayDialog
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        packageInfo={selectedCamp ? {
          key: `camp-${selectedCamp.camp_type}`,
          name: selectedCamp.camp_name,
          price: selectedCamp.price || 0,
        } : null}
        onSuccess={async () => {
          // 1. Insert purchase record
          if (user && selectedCamp) {
            try {
              await supabase.from('user_camp_purchases').insert({
                user_id: user.id,
                camp_type: selectedCamp.camp_type,
                camp_name: selectedCamp.camp_name,
                purchase_price: selectedCamp.price || 0,
                payment_method: 'wechat',
                payment_status: 'completed',
                transaction_id: `CAMP-LIST-${Date.now()}`,
                purchased_at: new Date().toISOString(),
              });
            } catch (e) {
              console.error('Insert camp purchase error (may already exist):', e);
            }
          }
          // 2. Close dialog
          setPayDialogOpen(false);
          // 3. Invalidate purchase queries so card updates
          queryClient.invalidateQueries({ queryKey: ['camp-card-purchase'] });
          // 4. Navigate to camp intro for start date selection
          if (selectedCamp) {
            toast.success("购买成功！", { description: "请选择开始日期" });
            navigate(`/camp-intro/${selectedCamp.camp_type}`);
          }
        }}
      />
    </>
  );
};

export default CampList;
